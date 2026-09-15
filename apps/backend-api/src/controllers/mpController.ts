import { Request, Response } from 'express';
import { query } from '../config/database';
import { MLClientService } from '../services/mlClient';
import { AuditLogger } from '../services/auditLogger';

export class MPController {
  /**
   * Helper to ensure user and MP profile records exist in PostgreSQL
   */
  private static async ensureMpProfile(userId: string) {
    // 1. Ensure user row exists in users table
    await query(
      `INSERT INTO users (id, full_name, email, password_hash, role)
       VALUES ($1, 'Hon. Rajesh Sharma (MP)', 'mp.mumbai@mplads.gov.in', '$2a$10$abcdefghijklmnopqrstuu', 'MP_MLA')
       ON CONFLICT (id) DO NOTHING`,
      [userId]
    );

    // 2. Fetch or create MP profile
    let mpRes = await query(`SELECT * FROM mps WHERE user_id = $1 LIMIT 1`, [userId]);
    if (mpRes.rows.length === 0) {
      const dummyMp = await query(
        `INSERT INTO mps (user_id, party, constituency_name, total_allocation)
         VALUES ($1, 'Independent', 'Mumbai South', 50000000.00)
         ON CONFLICT (user_id) DO UPDATE SET total_allocation = EXCLUDED.total_allocation
         RETURNING *`,
        [userId]
      );
      return dummyMp.rows[0];
    }
    return mpRes.rows[0];
  }

  /**
   * GET /api/mp/dashboard-stats
   */
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId || '11111111-1111-1111-1111-111111111111';
      const mp = await MPController.ensureMpProfile(userId);

      const totalAllocation = Number(mp.total_allocation || 50000000.00);
      const scQuota = totalAllocation * 0.15;
      const stQuota = totalAllocation * 0.075;
      const generalQuota = totalAllocation * 0.775;

      const scSpent = Number(mp.sc_reserved_spent || 0);
      const stSpent = Number(mp.st_reserved_spent || 0);
      const generalSpent = Number(mp.general_spent || 0);
      const totalSpent = scSpent + stSpent + generalSpent;

      const projectStatsResult = await query(
        `SELECT 
           COUNT(*) as total_recommended,
           COUNT(CASE WHEN status IN ('SANCTIONED', 'IN_PROGRESS', 'COMPLETED') THEN 1 END) as approved_count,
           COUNT(CASE WHEN status IN ('RECOMMENDED', 'IN_FEASIBILITY') THEN 1 END) as pending_count,
           COUNT(CASE WHEN status = 'FROZEN_PENDING_AUDIT' THEN 1 END) as high_risk_count
         FROM projects
         WHERE mp_id = $1`,
        [mp.id]
      );

      const stats = projectStatsResult.rows[0] || {
        total_recommended: 0,
        approved_count: 0,
        pending_count: 0,
        high_risk_count: 0,
      };

      return res.json({
        mp_id: mp.id,
        constituency_name: mp.constituency_name,
        party: mp.party,
        financials: {
          total_allocation: totalAllocation,
          total_spent: totalSpent,
          unallocated_balance: Math.max(0, totalAllocation - totalSpent),
          quotas: {
            sc: { quota: scQuota, spent: scSpent, balance: Math.max(0, scQuota - scSpent) },
            st: { quota: stQuota, spent: stSpent, balance: Math.max(0, stQuota - stSpent) },
            general: { quota: generalQuota, spent: generalSpent, balance: Math.max(0, generalQuota - generalSpent) },
          },
        },
        counts: {
          total_recommended: parseInt(stats.total_recommended || '0', 10),
          approved_count: parseInt(stats.approved_count || '0', 10),
          pending_count: parseInt(stats.pending_count || '0', 10),
          high_risk_count: parseInt(stats.high_risk_count || '0', 10),
        },
      });
    } catch (error: any) {
      console.error('Error fetching MP dashboard stats:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch MP dashboard statistics.' });
    }
  }

  /**
   * GET /api/mp/recommendations
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.userId || '11111111-1111-1111-1111-111111111111';
      const mp = await MPController.ensureMpProfile(userId);

      const result = await query(
        `SELECT p.id, p.title, p.description, p.sector, p.category, p.estimated_cost, 
                p.sanctioned_amount, p.status, p.address, p.sla_deadline, p.created_at,
                ST_X(p.location::geometry) as longitude, ST_Y(p.location::geometry) as latitude,
                (CURRENT_TIMESTAMP > p.sla_deadline) as is_sla_breached,
                EXTRACT(DAY FROM (p.sla_deadline - CURRENT_TIMESTAMP)) as days_remaining
         FROM projects p
         WHERE p.mp_id = $1
         ORDER BY p.created_at DESC`,
        [mp.id]
      );

      return res.json({ recommendations: result.rows });
    } catch (error: any) {
      console.error('Error fetching MP recommendations:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch recommendations.' });
    }
  }

  /**
   * POST /api/mp/check-duplicate
   */
  static async checkDuplicate(req: Request, res: Response) {
    try {
      const { title, description } = req.body;
      if (!title && !description) {
        return res.json({ similarity_score: 0.0, is_duplicate: false });
      }

      const dupResult = await MLClientService.checkDuplicateText(title || '', description || '');
      return res.json(dupResult);
    } catch (error: any) {
      console.error('Error during live duplicate check:', error);
      return res.json({ similarity_score: 0.0, is_duplicate: false });
    }
  }

  /**
   * POST /api/mp/recommendations
   */
  static async submitRecommendation(req: Request, res: Response) {
    try {
      const userId = req.user?.userId || '11111111-1111-1111-1111-111111111111';
      const { title, description, sector, category, estimated_cost, latitude, longitude, address } = req.body;

      if (!title || !description || !sector || !estimated_cost || !address) {
        return res.status(400).json({ error: 'Missing mandatory fields: title, description, sector, estimated_cost, address.' });
      }

      const cost = parseFloat(estimated_cost);
      if (isNaN(cost) || cost <= 0) {
        return res.status(400).json({ error: 'Estimated cost must be a positive number.' });
      }

      const cat: 'SC' | 'ST' | 'GENERAL' = ['SC', 'ST', 'GENERAL'].includes(category) ? category : 'GENERAL';

      // 1. Ensure MP Profile
      const mp = await MPController.ensureMpProfile(userId);

      const totalAlloc = Number(mp.total_allocation || 50000000.00);
      const scSpent = Number(mp.sc_reserved_spent || 0);
      const stSpent = Number(mp.st_reserved_spent || 0);
      const genSpent = Number(mp.general_spent || 0);
      const totalSpent = scSpent + stSpent + genSpent;

      if (totalSpent + cost > totalAlloc) {
        return res.status(400).json({
          error: `Insufficient annual fund entitlement balance. Available: ₹${(totalAlloc - totalSpent).toLocaleString('en-IN')}, Requested: ₹${cost.toLocaleString('en-IN')}.`,
        });
      }

      if (cat === 'SC') {
        const scQuota = totalAlloc * 0.15;
        if (scSpent + cost > scQuota) {
          return res.status(400).json({
            error: `Exceeds 15% SC Statutory Reserved Quota. SC Balance: ₹${(scQuota - scSpent).toLocaleString('en-IN')}, Requested: ₹${cost.toLocaleString('en-IN')}.`,
          });
        }
      } else if (cat === 'ST') {
        const stQuota = totalAlloc * 0.075;
        if (stSpent + cost > stQuota) {
          return res.status(400).json({
            error: `Exceeds 7.5% ST Statutory Reserved Quota. ST Balance: ₹${(stQuota - stSpent).toLocaleString('en-IN')}, Requested: ₹${cost.toLocaleString('en-IN')}.`,
          });
        }
      }

      // 2. ML Engine Duplicate Check
      const dupCheck = await MLClientService.checkDuplicateText(title, description);

      // 3. Insert Project Record with PostGIS spatial point
      const lat = latitude ? parseFloat(latitude) : 18.9067;
      const lng = longitude ? parseFloat(longitude) : 72.8258;

      const insertQuery = `
        INSERT INTO projects 
        (title, description, sector, category, estimated_cost, status, mp_id, location, address, sla_deadline)
        VALUES ($1, $2, $3, $4, $5, 'RECOMMENDED', $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, CURRENT_TIMESTAMP + INTERVAL '75 days')
        RETURNING id, title, sector, category, estimated_cost, status, address, sla_deadline, created_at,
                  ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude;
      `;

      const projectRes = await query(insertQuery, [
        title.trim(),
        description.trim(),
        sector,
        cat,
        cost,
        mp.id,
        lng,
        lat,
        address.trim(),
      ]);

      const newProject = projectRes.rows[0];

      // 4. Update MP Spent Ledger
      let updateColumn = 'general_spent';
      if (cat === 'SC') updateColumn = 'sc_reserved_spent';
      if (cat === 'ST') updateColumn = 'st_reserved_spent';

      await query(
        `UPDATE mps SET ${updateColumn} = ${updateColumn} + $1 WHERE id = $2`,
        [cost, mp.id]
      );

      // 5. Write Immutable Audit Trail
      await AuditLogger.log(userId || null, 'RECOMMEND_WORK_PROJECT', 'projects', newProject.id, {
        title,
        cost,
        category: cat,
        duplicate_check: dupCheck,
      });

      return res.status(201).json({
        message: 'Work recommendation submitted successfully.',
        project: newProject,
        ai_similarity_analysis: dupCheck,
      });
    } catch (error: any) {
      console.error('Error submitting work recommendation:', error);
      return res.status(500).json({ error: error.message || 'Internal server error while submitting recommendation.' });
    }
  }
}
