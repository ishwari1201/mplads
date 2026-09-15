import { Request, Response } from 'express';
import { pool } from '../config/database';

export class AdminController {
  static async getRiskMatrix(req: Request, res: Response) {
    try {
      const query = `
        SELECT r.id, r.recommendation_no, r.title, r.estimated_cost, r.status,
               s.risk_score, s.risk_level, s.evaluated_at
        FROM ml_risk_scores s
        JOIN work_recommendations r ON s.recommendation_id = r.id
        ORDER BY s.risk_score DESC;
      `;
      const result = await pool.query(query);
      return res.json({ matrix: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getShapExplainerCard(req: Request, res: Response) {
    try {
      const { recommendation_id } = req.params;
      const query = `
        SELECT e.*, s.risk_score, s.risk_level
        FROM shap_explainers e
        JOIN ml_risk_scores s ON e.risk_score_id = s.id
        WHERE s.recommendation_id = $1;
      `;
      const result = await pool.query(query, [recommendation_id]);
      return res.json({
        recommendation_id,
        explainers: result.rows
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getNationalStats(req: Request, res: Response) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_projects,
          SUM(estimated_cost) as total_allocated,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as ongoing_projects
        FROM work_recommendations;
      `;
      const result = await pool.query(statsQuery);
      return res.json({ summary: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
