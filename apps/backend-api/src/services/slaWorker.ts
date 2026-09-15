import { query } from '../config/database';
import { AuditLogger } from './auditLogger';

export class SLAWorker {
  /**
   * Scans PostgreSQL database for recommendations exceeding the 75-day statutory SLA.
   */
  static async checkBreachedSLAs(): Promise<{ breachedCount: number; overdueProjects: any[] }> {
    try {
      const sql = `
        SELECT p.id, p.title, p.estimated_cost, p.status, p.sla_deadline, p.created_at,
               u.full_name as mp_name, u.email as mp_email
        FROM projects p
        JOIN mps m ON p.mp_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE p.status IN ('RECOMMENDED', 'IN_FEASIBILITY')
          AND CURRENT_TIMESTAMP > p.sla_deadline;
      `;

      const result = await query(sql);
      const overdueProjects = result.rows;

      for (const project of overdueProjects) {
        // Record Immutable Audit Log for SLA Breach
        await AuditLogger.log(
          null, // System automated action
          'SLA_DEADLINE_BREACH_ALERT',
          'projects',
          project.id,
          {
            title: project.title,
            sla_deadline: project.sla_deadline,
            days_overdue: Math.floor((Date.now() - new Date(project.sla_deadline).getTime()) / (1000 * 60 * 60 * 24)),
          }
        );
      }

      if (overdueProjects.length > 0) {
        console.warn(`[SLA Worker Alert] Flagged ${overdueProjects.length} overdue recommendations exceeding 75-day statutory deadline.`);
      }

      return { breachedCount: overdueProjects.length, overdueProjects };
    } catch (err) {
      console.error('Error running SLA worker audit execution:', err);
      return { breachedCount: 0, overdueProjects: [] };
    }
  }
}
