import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { pool } from '../db/index.js';

export class SuperAdminController {
  
  // 1. Get Platform Metrics (MAU, Active Tenants, Total API Calls)
  static async getPlatformStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM tenants WHERE status = 'ACTIVE') as active_tenants,
          (SELECT COUNT(*) FROM users) as total_global_users,
          (SELECT COALESCE(SUM(api_request_count), 0) FROM tenant_subscriptions) as total_api_requests
      `);
      
      return res.json(stats.rows[0]);
    } catch (err) {
      next(err);
    }
  }

  // 2. List All Tenants with Billing/Subscription Info
  static async listTenants(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = `
        SELECT t.id, t.company_name, t.custom_domain, t.status, t.created_at,
               ts.plan_tier, ts.mau_count, ts.api_request_count
        FROM tenants t
        LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
        ORDER BY t.created_at DESC;
      `;
      const tenants = await pool.query(query);
      return res.json(tenants.rows);
    } catch (err) {
      next(err);
    }
  }

  // 3. The Kill Switch: Freeze or Activate a Tenant
  static async updateTenantStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const { status } = req.body; // 'ACTIVE' or 'FROZEN'

      if (!['ACTIVE', 'FROZEN'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided.' });
      }

      const query = `
        UPDATE tenants 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING id, company_name, status;
      `;
      const result = await pool.query(query, [status, tenantId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tenant not found.' });
      }

      // Log this highly sensitive action
      await pool.query(`
        INSERT INTO superadmin_audit_logs (actor_id, target_tenant_id, action, ip_address)
        VALUES ($1, $2, $3, $4)
      `, [req.user?.userId, tenantId, `TENANT_${status}`, req.ip]);

      return res.json({ 
        success: true, 
        message: `Tenant ${result.rows[0].company_name} is now ${status}.`,
        tenant: result.rows[0]
      });
    } catch (err) {
      next(err);
    }
  }
}