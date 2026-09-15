import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { ENV } from '../config/env';

export class AuthController {
  /**
   * User Registration Endpoint (POST /api/auth/register)
   */
  static async register(req: Request, res: Response) {
    try {
      const { full_name, email, password, role, constituency_id, party, constituency_name } = req.body;

      if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'Missing required registration fields: full_name, email, password.' });
      }

      const validRoles = ['MP_MLA', 'DISTRICT_AUTHORITY', 'IMPLEMENTING_AGENCY', 'NODAL_OFFICER', 'CITIZEN'];
      const userRole = role && validRoles.includes(role) ? role : 'CITIZEN';

      // Check if email is already registered
      const existingUser = await query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      // Hash password securely with bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert User record
      const insertUserQuery = `
        INSERT INTO users (full_name, email, password_hash, role, constituency_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, full_name, email, role, constituency_id, created_at;
      `;
      const userResult = await query(insertUserQuery, [
        full_name.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        userRole,
        constituency_id || null,
      ]);

      const newUser = userResult.rows[0];

      // If user is MP_MLA, create MP profile record
      if (userRole === 'MP_MLA') {
        const insertMpQuery = `
          INSERT INTO mps (user_id, party, constituency_name, total_allocation)
          VALUES ($1, $2, $3, 50000000.00)
          RETURNING id;
        `;
        await query(insertMpQuery, [
          newUser.id,
          party || 'Independent',
          constituency_name || 'Unassigned Constituency',
        ]);
      }

      // Generate JWT Token
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
          constituency_id: newUser.constituency_id,
        },
        ENV.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        message: 'User account created successfully.',
        token,
        user: {
          id: newUser.id,
          full_name: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          constituency_id: newUser.constituency_id,
        },
      });
    } catch (error: any) {
      console.error('Error during registration:', error);
      return res.status(500).json({ error: 'Internal server error during registration.' });
    }
  }

  /**
   * User Login Endpoint (POST /api/auth/login)
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
      }

      // Query User record by email
      const result = await query(
        `SELECT id, full_name, email, password_hash, role, constituency_id FROM users WHERE email = $1`,
        [email.toLowerCase().trim()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = result.rows[0];

      // Compare password with bcrypt hash
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate JWT Token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          constituency_id: user.constituency_id,
        },
        ENV.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          constituency_id: user.constituency_id,
        },
      });
    } catch (error: any) {
      console.error('Error during login:', error);
      return res.status(500).json({ error: 'Internal server error during authentication.' });
    }
  }
}
