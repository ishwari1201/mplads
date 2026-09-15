import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuditLogger } from '../services/auditLogger';

export class PublicController {
  static async getTransparencyMapData(req: Request, res: Response) {
    try {
      const query = `
        SELECT r.id, r.recommendation_no, r.title, r.estimated_cost, r.status, r.location_address,
               s.sector_name, ST_X(r.geo_location) as longitude, ST_Y(r.geo_location) as latitude
        FROM work_recommendations r
        LEFT JOIN work_sectors s ON r.sector_id = s.id
        WHERE r.geo_location IS NOT NULL;
      `;
      const result = await pool.query(query);
      return res.json({ map_points: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async reportFraud(req: Request, res: Response) {
    try {
      const { recommendation_id, reporter_name, reporter_email, issue_type, description, latitude, longitude } = req.body;
      const file = req.file;

      const query = `
        INSERT INTO citizen_fraud_reports 
        (recommendation_id, reporter_name, reporter_email, issue_type, description, proof_image_path, geo_location, status)
        VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), 'PENDING')
        RETURNING *;
      `;

      const values = [
        recommendation_id || null,
        reporter_name || 'Anonymous Citizen',
        reporter_email || null,
        issue_type || 'GHOST_WORK',
        description,
        file ? file.path : null,
        longitude || 72.8258,
        latitude || 18.9067
      ];

      const result = await pool.query(query, values);

      await AuditLogger.log(null, 'SUBMIT_CITIZEN_FRAUD_REPORT', 'citizen_fraud_reports', result.rows[0].id, { issue_type });

      return res.status(201).json({
        message: 'Fraud report submitted to Nodal Authority for review.',
        report: result.rows[0]
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
