import { pool } from '../config/database';

export class AuditLogger {
  static async log(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    payload?: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, action, entityType, entityId, payload ? JSON.stringify(payload) : null, ipAddress || '127.0.0.1']
      );
    } catch (error) {
      console.error('Failed writing to audit trail:', error);
    }
  }
}
