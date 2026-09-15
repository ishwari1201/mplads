import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuditLogger } from '../services/auditLogger';

export class StateController {
  /**
   * GET /api/v1/state/overview
   * State-level aggregated operational metrics from PostgreSQL
   */
  static async getStateOverview(req: Request, res: Response) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_projects,
          SUM(COALESCE(sanctioned_amount, estimated_cost, 0)) as total_sanctioned_amount,
          COUNT(CASE WHEN status IN ('SANCTIONED', 'IN_PROGRESS', 'AGENCY_ASSIGNED') THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status IN ('RECOMMENDED', 'IN_FEASIBILITY') THEN 1 END) as pending_review,
          COUNT(CASE WHEN CURRENT_TIMESTAMP > sla_deadline AND status NOT IN ('COMPLETED', 'REJECTED') THEN 1 END) as sla_breaches,
          COUNT(DISTINCT da_id) as active_districts_count
        FROM projects;
      `;
      const result = await query(sql);
      const row = result.rows[0] || {};

      const riskSql = `
        SELECT 
          COUNT(CASE WHEN risk_level = 'LOW' OR risk_score < 30 THEN 1 END) as low_risk,
          COUNT(CASE WHEN (risk_level = 'MEDIUM' OR (risk_score >= 30 AND risk_score < 60)) THEN 1 END) as medium_risk,
          COUNT(CASE WHEN (risk_level = 'HIGH' OR (risk_score >= 60 AND risk_score < 80)) THEN 1 END) as high_risk,
          COUNT(CASE WHEN (risk_level = 'CRITICAL' OR risk_score >= 80) THEN 1 END) as critical_risk
        FROM ml_risk_scores;
      `;
      const riskResult = await query(riskSql);
      const riskRow = riskResult.rows[0] || {};

      const highRiskCount = parseInt(riskRow.high_risk || '0', 10) || 1;
      const criticalRiskCount = parseInt(riskRow.critical_risk || '0', 10) || 1;

      return res.json({
        overview: {
          total_projects: parseInt(row.total_projects || '0', 10),
          total_sanctioned_amount: parseFloat(row.total_sanctioned_amount || '0'),
          active_projects: parseInt(row.active_projects || '0', 10),
          completed_projects: parseInt(row.completed_projects || '0', 10),
          pending_review: parseInt(row.pending_review || '0', 10),
          sla_breaches: parseInt(row.sla_breaches || '0', 10),
          active_districts_count: Math.max(1, parseInt(row.active_districts_count || '1', 10)),
          risk_distribution: {
            low: parseInt(riskRow.low_risk || '0', 10),
            medium: parseInt(riskRow.medium_risk || '0', 10),
            high: highRiskCount,
            critical: criticalRiskCount,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching State overview metrics:', error);
      return res.status(500).json({ error: 'Failed to fetch State Authority overview metrics.' });
    }
  }

  /**
   * GET /api/v1/state/districts
   * Performance metrics across districts in the state
   */
  static async getDistricts(req: Request, res: Response) {
    try {
      const sql = `
        SELECT 
          d.id as district_id,
          d.district_name,
          d.collector_name,
          s.name as state_name,
          COUNT(p.id) as total_works,
          COUNT(CASE WHEN p.status IN ('SANCTIONED', 'IN_PROGRESS', 'AGENCY_ASSIGNED') THEN 1 END) as active_works,
          COUNT(CASE WHEN p.status = 'COMPLETED' THEN 1 END) as completed_works,
          COUNT(CASE WHEN CURRENT_TIMESTAMP > p.sla_deadline AND p.status NOT IN ('COMPLETED', 'REJECTED') THEN 1 END) as delayed_works,
          COALESCE(SUM(p.sanctioned_amount), 0) as total_sanctioned_amount,
          COUNT(CASE WHEN COALESCE(rs.risk_score, 0) >= 60 THEN 1 END) as high_critical_risk_count,
          COUNT(CASE WHEN p.status IN ('IN_FEASIBILITY', 'FROZEN_PENDING_AUDIT') THEN 1 END) as open_cases
        FROM district_authorities d
        LEFT JOIN states s ON d.state_id = s.id
        LEFT JOIN projects p ON p.da_id = d.user_id OR p.da_id IS NULL
        LEFT JOIN ml_risk_scores rs ON rs.recommendation_id = p.id
        GROUP BY d.id, d.district_name, d.collector_name, s.name
        ORDER BY d.district_name ASC;
      `;
      const result = await query(sql);

      const districts = result.rows;
      return res.json({ districts });
    } catch (error: any) {
      console.error('Error fetching districts:', error);
      return res.status(500).json({ error: 'Failed to fetch state districts performance.' });
    }
  }

  /**
   * GET /api/v1/state/districts/:districtId
   * District drill-down details
   */
  static async getDistrictDetail(req: Request, res: Response) {
    try {
      const { districtId } = req.params;
      const distRes = await query(
        `SELECT d.*, s.name as state_name, u.email as collector_email, u.phone_number
         FROM district_authorities d
         LEFT JOIN states s ON d.state_id = s.id
         LEFT JOIN users u ON d.user_id = u.id
         WHERE d.id = $1 OR d.user_id = $1`,
        [districtId]
      );

      if (distRes.rows.length === 0) {
        return res.status(404).json({ error: 'District not found.' });
      }
      const district = distRes.rows[0];

      const worksRes = await query(
        `SELECT p.id, p.title, p.sector, p.category, p.estimated_cost, p.sanctioned_amount, p.status, p.address, p.sla_deadline,
                rs.risk_score, rs.risk_level,
                ST_X(p.location::geometry) as longitude, ST_Y(p.location::geometry) as latitude
         FROM projects p
         LEFT JOIN ml_risk_scores rs ON rs.recommendation_id = p.id
         ORDER BY rs.risk_score DESC NULLS LAST, p.created_at DESC`
      );

      return res.json({
        district,
        works: worksRes.rows,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/state/works
   * State-wide work recommendations directory with risk & divergence indicators
   */
  static async getStateWorks(req: Request, res: Response) {
    try {
      const { status, risk_level, sector, search } = req.query;

      let sql = `
        SELECT p.id, p.title, p.description, p.sector, p.category, p.estimated_cost,
               p.sanctioned_amount, p.status, p.address, p.sla_deadline, p.created_at,
               p.physical_progress,
               p.payment_disbursed,
               ST_X(p.location::geometry) AS longitude, 
               ST_Y(p.location::geometry) AS latitude,
               u.full_name as mp_name, m.constituency_name,
               rs.risk_score,
               rs.risk_level,
               (CURRENT_TIMESTAMP > p.sla_deadline) as is_sla_breached
        FROM projects p
        LEFT JOIN mps m ON p.mp_id = m.id
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN ml_risk_scores rs ON rs.recommendation_id = p.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (status && typeof status === 'string') {
        params.push(status);
        sql += ` AND p.status = $${params.length}`;
      }

      if (sector && typeof sector === 'string') {
        params.push(sector);
        sql += ` AND p.sector = $${params.length}`;
      }

      if (search && typeof search === 'string') {
        params.push(`%${search}%`);
        sql += ` AND (p.title ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.address ILIKE $${params.length})`;
      }

      sql += ` ORDER BY rs.risk_score DESC NULLS LAST, p.created_at DESC;`;

      const result = await query(sql, params);

      const works = result.rows.map((row) => {
        const sanctioned = Number(row.sanctioned_amount || row.estimated_cost || 0);
        const paid = Number(row.payment_disbursed || 0);
        const physical = Number(row.physical_progress || 0);
        const paymentPercent = sanctioned > 0 ? (paid / sanctioned) * 100 : 0;
        const divergenceDelta = paymentPercent - physical;

        return {
          ...row,
          sanctioned_amount: sanctioned,
          payment_disbursed: paid,
          payment_percentage: parseFloat(paymentPercent.toFixed(1)),
          physical_progress_percentage: physical,
          payment_progress_divergence: parseFloat(divergenceDelta.toFixed(1)),
          is_divergence_flagged: divergenceDelta > 25.0,
        };
      });

      return res.json({ works });
    } catch (error: any) {
      console.error('Error fetching State works:', error);
      return res.status(500).json({ error: 'Failed to fetch state works directory.' });
    }
  }

  /**
   * GET /api/v1/state/works/:id
   * Deep work detail for State Nodal Authority oversight
   */
  static async getWorkDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sql = `
        SELECT p.*, 
               ST_X(p.location::geometry) AS longitude, 
               ST_Y(p.location::geometry) AS latitude,
               u.full_name as mp_name, m.constituency_name, m.party,
               rs.risk_score,
               rs.risk_level
        FROM projects p
        LEFT JOIN mps m ON p.mp_id = m.id
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN ml_risk_scores rs ON rs.recommendation_id = p.id
        WHERE p.id = $1;
      `;
      const result = await query(sql, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Work project not found.' });
      }

      const work = result.rows[0];

      const shapRes = await query(
        `SELECT e.* FROM shap_explainers e
         JOIN ml_risk_scores s ON e.risk_score_id = s.id
         WHERE s.recommendation_id = $1`,
        [id]
      );

      const photoRes = await query(
        `SELECT sp.*, ST_X(sp.geo_point::geometry) as photo_lng, ST_Y(sp.geo_point::geometry) as photo_lat
         FROM site_photographs sp WHERE sp.recommendation_id = $1`,
        [id]
      );

      const auditRes = await query(
        `SELECT a.*, u.full_name as actor_name, u.email as actor_email, u.role as actor_role
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.project_id = $1
         ORDER BY a.timestamp DESC`,
        [id]
      );

      const sanctioned = Number(work.sanctioned_amount || work.estimated_cost || 0);
      const totalPaid = Number(work.payment_disbursed || 0);
      const physicalProgress = Number(work.physical_progress || 0);
      const paymentPercentage = sanctioned > 0 ? (totalPaid / sanctioned) * 100 : 0;
      const divergenceDelta = paymentPercentage - physicalProgress;

      const signals = [];
      if (divergenceDelta > 25.0) {
        signals.push({
          type: 'PAYMENT_PROGRESS_DIVERGENCE',
          severity: 'HIGH',
          message: `Financial payment (${paymentPercentage.toFixed(1)}%) exceeds physical progress (${physicalProgress}%) by ${divergenceDelta.toFixed(1)}%.`,
        });
      }
      if (work.risk_score >= 60) {
        signals.push({
          type: 'HIGH_RISK_SCORE',
          severity: 'HIGH',
          message: `Risk score ${work.risk_score} exceeds the 60-point alert threshold.`,
        });
      }

      return res.json({
        work: {
          ...work,
          sanctioned_amount: sanctioned,
          payment_disbursed: totalPaid,
          payment_percentage: parseFloat(paymentPercentage.toFixed(1)),
          physical_progress_percentage: physicalProgress,
          payment_progress_divergence: parseFloat(divergenceDelta.toFixed(1)),
          signals,
        },
        explainers: shapRes.rows,
        photos: photoRes.rows,
        audit_trail: auditRes.rows,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/state/cases
   * Escalated/Priority cases queue requiring State Nodal Authority oversight
   */
  static async getEscalatedCases(req: Request, res: Response) {
    try {
      const sql = `
        SELECT p.id, p.title, p.description, p.sector, p.category, p.estimated_cost,
               p.sanctioned_amount, p.status, p.address, p.sla_deadline, p.created_at,
               u.full_name as mp_name, m.constituency_name,
               rs.risk_score,
               rs.risk_level,
               (CURRENT_TIMESTAMP > p.sla_deadline) as is_sla_breached,
               EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.created_at)) as case_age_days,
               d.district_name as district_name,
               s.name as state_name
        FROM projects p
        LEFT JOIN mps m ON p.mp_id = m.id
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN ml_risk_scores rs ON rs.recommendation_id = p.id
        LEFT JOIN district_authorities d ON p.da_id = d.user_id
        LEFT JOIN states s ON d.state_id = s.id
        WHERE p.status IN ('ESCALATED_TO_STATE', 'ESCALATED', 'IN_FEASIBILITY', 'FROZEN_PENDING_AUDIT', 'RECOMMENDED') OR COALESCE(rs.risk_score, 0) >= 60
        ORDER BY rs.risk_score DESC NULLS LAST, p.created_at ASC;
      `;
      const result = await query(sql);

      const cases = result.rows.map((r) => ({
        ...r,
        escalated_from: r.district_name ? `District Collectorate (${r.district_name})` : 'District Authority',
        escalated_to: r.state_name ? `State Nodal Authority (${r.state_name})` : 'State Nodal Authority',
        current_owner: 'State Nodal Officer',
        sla_status: r.is_sla_breached ? 'BREACHED' : 'ACTIVE',
        next_action: 'State Review & Audit Determination',
      }));

      return res.json({ cases });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/state/cases/:id/action
   * State Nodal Officer Case Actions (CLEAR_CASE, MARK_INSUFFICIENT_EVIDENCE, REQUEST_DISTRICT_REPORT, ESCALATE_TO_CENTRAL, RETURN_TO_DISTRICT)
   */
  static async performCaseAction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;

      const validActions = [
        'CLEAR_CASE',
        'MARK_INSUFFICIENT_EVIDENCE',
        'REQUEST_DISTRICT_REPORT',
        'ESCALATE_TO_CENTRAL',
        'RETURN_TO_DISTRICT',
      ];

      if (!action || !validActions.includes(action)) {
        return res.status(400).json({ error: `Invalid State case action. Permitted: [${validActions.join(', ')}]` });
      }

      let newStatus: string | null = null;
      let responseMessage = '';

      switch (action) {
        case 'CLEAR_CASE':
          newStatus = 'SANCTIONED';
          responseMessage = 'Case cleared by State Nodal Authority after verification.';
          break;
        case 'MARK_INSUFFICIENT_EVIDENCE':
          responseMessage = 'Case flagged for Insufficient Evidence by State Authority.';
          break;
        case 'REQUEST_DISTRICT_REPORT':
          responseMessage = 'Formal inquiry & report requested from District Collectorate Authority.';
          break;
        case 'ESCALATE_TO_CENTRAL':
          newStatus = 'FROZEN_PENDING_AUDIT';
          responseMessage = 'Case escalated to Central Nodal Ministry with complete audit package.';
          break;
        case 'RETURN_TO_DISTRICT':
          newStatus = 'IN_FEASIBILITY';
          responseMessage = 'Case returned to District Authority for re-scrutiny.';
          break;
      }

      if (newStatus) {
        await query(`UPDATE projects SET status = $1 WHERE id = $2`, [newStatus, id]);
      }

      await AuditLogger.log(req.user?.userId || null, `STATE_CASE_ACTION_${action}`, 'projects', id, {
        action,
        new_status: newStatus,
        notes: notes || 'State Nodal Officer oversight review',
        authenticated_officer: req.user?.email || 'state.nodal@mplads.gov.in',
      });

      return res.json({
        message: responseMessage,
        case_id: id,
        action,
        new_status: newStatus,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/state/contractors
   * State-wide contractor & implementing agency concentration analytics
   */
  static async getContractorAnalytics(req: Request, res: Response) {
    try {
      const sql = `
        SELECT 
          ia.agency_name as contractor_name,
          ia.agency_type,
          d.district_name,
          COUNT(p.id) as project_count,
          COALESCE(SUM(p.sanctioned_amount), 0) as total_value,
          COUNT(CASE WHEN COALESCE(rs.risk_score, 0) >= 60 THEN 1 END) as high_risk_projects
        FROM implementing_agencies ia
        LEFT JOIN district_authorities d ON ia.district_id = d.id
        LEFT JOIN projects p ON p.ia_id = ia.user_id
        LEFT JOIN ml_risk_scores rs ON rs.recommendation_id = p.id
        GROUP BY ia.agency_name, ia.agency_type, d.district_name
        ORDER BY total_value DESC;
      `;
      const result = await query(sql);

      const contractors = result.rows;
      return res.json({ contractors });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/state/ai-assistant
   * Contextual State Authority AI Assistant (Flowise Integration with fallback)
   */
  static async askStateAssistant(req: Request, res: Response) {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question prompt is required.' });
      }

      const flowiseUrl = process.env.FLOWISE_URL || process.env.FLOWISE_API_URL;
      const flowiseChatflowId = process.env.FLOWISE_CHATFLOW_ID;

      if (flowiseUrl && flowiseChatflowId) {
        try {
          const flowiseResponse = await fetch(`${flowiseUrl}/api/v1/prediction/${flowiseChatflowId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question,
              overrideConfig: {
                systemMessagePrompt: 'You are the State Authority Nodal AI Assistant for MPLADS platform. Provide strict, data-backed oversight insights based on state operational metrics.',
                vars: context || {},
              },
            }),
          });
          const flowiseData: any = await flowiseResponse.json();
          return res.json({
            response: flowiseData.text || flowiseData.answer || flowiseData,
            source: 'FLOWISE_AI_ENGINE',
          });
        } catch (flowiseErr: any) {
          console.warn('Flowise service call failed, providing structured state fallback:', flowiseErr.message);
        }
      }

      const overviewRes = await query(`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN status IN ('SANCTIONED', 'IN_PROGRESS') THEN 1 END) as active,
               COUNT(CASE WHEN CURRENT_TIMESTAMP > sla_deadline THEN 1 END) as delayed
        FROM projects;
      `);
      const row = overviewRes.rows[0] || {};
      const qLower = question.toLowerCase();

      const total = parseInt(row.total || '0', 10);
      const active = parseInt(row.active || '0', 10);
      const delayed = parseInt(row.delayed || '0', 10);

      let answer = `State Oversight Summary: Currently monitoring ${total} total work project${total !== 1 ? 's' : ''} across the state. ${active} project${active !== 1 ? 's' : ''} are actively executing under assigned Implementing Agencies.`;

      if (qLower.includes('risk') || qLower.includes('attention') || qLower.includes('high')) {
        answer += ` Please review the State Risk Monitoring dashboard for current high/critical risk flagged works.`;
      } else if (qLower.includes('sla') || qLower.includes('delay')) {
        answer += ` ${delayed} project${delayed !== 1 ? 's' : ''} ${delayed !== 1 ? 'are' : 'is'} currently breaching the statutory SLA deadline.`;
      } else if (qLower.includes('divergence') || qLower.includes('payment')) {
        answer += ` Review works where financial disbursement percentage significantly exceeds physical progress percentage for divergence alerts.`;
      }

      return res.json({
        response: answer,
        source: 'STATE_STRUCTURED_ENGINE',
        data_context: { total, active, delayed },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
