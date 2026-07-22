import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { QueryService } from '../services/query.service.js';
import { EmailService } from '../services/email.service.js';
import { pool } from '../db/index.js';
import { redisClient } from '../db/redis.js';

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


      // 2. Fetch live telemetry from Redis
      const [
        globalCalls, 
        globalErrors,
        cryptoLatency,
        emailErrors,
        dbQueryCount,
        dbLastLatency,
        dbSlowQueryCount
      ] = await Promise.all([
        redisClient.get('telemetry:global:api_calls'),
        redisClient.get('telemetry:global:errors'),
        redisClient.get('telemetry:latency:crypto:verify_password'),
        redisClient.get('telemetry:errors:email:send_otp'),
        redisClient.get('telemetry:db:query_count'),
        redisClient.get('telemetry:db:last_query_latency_ms'),
        redisClient.get('telemetry:db:slow_query_count')
      ]);
      
      return res.json({
        ...stats.rows[0],
        telemetry: {
          live_api_calls: parseInt(globalCalls || '0'),
          live_errors: parseInt(globalErrors || '0'),
          auth_latency_ms: parseFloat(cryptoLatency || '0'),
          email_provider_errors: parseInt(emailErrors || '0'),
          db_query_count: parseInt(dbQueryCount || '0'),
          db_last_latency_ms: parseFloat(dbLastLatency || '0'),
          db_slow_query_count: parseInt(dbSlowQueryCount || '0')          
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // 2. List All Tenants with Billing/Subscription Info
  static async listTenants(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = `
        SELECT t.id, t.company_name, t.custom_domain, t.status, t.created_at,
               COALESCE(ts.plan_tier, 'FREE_TIER') as plan_tier,
               (SELECT COUNT(*) FROM workspace_memberships wm WHERE wm.tenant_id = t.id AND wm.status = 'ACTIVE')::int as mau_count,
               COALESCE(ts.api_request_count, 0) as api_request_count
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

  // 3. Fetch a single workspace with live metrics
  static async getTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const query = `
        SELECT t.id, t.company_name, t.custom_domain, t.status, t.created_at,
               COALESCE(ts.plan_tier, 'FREE_TIER') as plan_tier,
               (SELECT COUNT(*) FROM workspace_memberships wm WHERE wm.tenant_id = t.id AND wm.status = 'ACTIVE')::int as mau_count,
               COALESCE(ts.api_request_count, 0) as api_request_count
        FROM tenants t
        LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
        WHERE t.id = $1;
      `;
      const result = await pool.query(query, [tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Workspace not found.' });
      }
      
      return res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }

  // 4. The True Kill Switch
  static async updateTenantStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.params.tenantId as string;
      const { status } = req.body; 

      if (!['ACTIVE', 'FROZEN'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided.' });
      }

      // 1. Update Persistent DB State
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

      // 2. THE LETHAL INJECTION: Update Redis to block/allow traffic instantly
      const redisKey = `tenant:frozen:${tenantId}`;
      if (status === 'FROZEN') {
        // Set an indefinite flag in Redis that this workspace is dead
        await redisClient.set(redisKey, 'true');

        // NUKE ALL REFRESH TOKENS FOR THIS TENANT
        await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE tenant_id = $1', [tenantId]);
      } else {
        // Remove the block
        await redisClient.del(redisKey);
      }

      // 3. Log to Immutable Ledger
      await pool.query(`
        INSERT INTO superadmin_audit_logs (actor_id, target_tenant_id, action, ip_address)
        VALUES ($1, $2, $3, $4)
      `, [req.user?.userId, tenantId, `TENANT_${status}`, req.ip]);

      // 4. Trigger Notifications to all Workspace Admins
      try {
        const admins = await QueryService.getTenantAdmins(tenantId);
        for (const admin of admins) {
          await EmailService.sendTenantStatusNotification(admin.email, result.rows[0].company_name, status);
        }
      } catch (emailErr) {
        console.error('Non-fatal: Failed to notify admins of workspace freeze', emailErr);
      }

      return res.json({ 
        success: true, 
        message: `Tenant ${result.rows[0].company_name} is now ${status}.`,
        tenant: result.rows[0]
      });
    } catch (err) {
      next(err);
    }
  }

  // 4. List All Global Users
  static async listGlobalUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Fetch all users and count how many workspaces they belong to
      const query = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
               COUNT(wm.tenant_id) as workspace_count
        FROM users u
        LEFT JOIN workspace_memberships wm ON u.id = wm.user_id
        WHERE u.is_superadmin = FALSE
        GROUP BY u.id
        ORDER BY u.created_at DESC;
      `;
      const result = await pool.query(query);

      // Enterprise Optimization: Fetch all blacklist statuses from Redis in a single pipeline
      const userIds = result.rows.map(u => `bl:user:${u.id}`);
      let blacklistStatuses: (string | null)[] = [];
      
      if (userIds.length > 0) {
        blacklistStatuses = await redisClient.mGet(userIds);
      }
      
      // Map the Redis data back to the PostgreSQL data
      const enrichedUsers = result.rows.map((user, index) => ({
        ...user,
        is_blacklisted: !!blacklistStatuses[index] // True if key exists
      }));

      return res.json(enrichedUsers);
    } catch (err) {
      next(err);
    }
  }

  // 5. Global Blacklist Toggle
  static async blacklistUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { isBlacklisted } = req.body; 

      if (typeof isBlacklisted !== 'boolean') {
        return res.status(400).json({ error: 'isBlacklisted boolean flag is required' });
      }

      const redisKey = `bl:user:${userId}`;

      if (isBlacklisted) {
        // 1. Write the permanent blockade to Redis
        await redisClient.set(redisKey, 'blacklisted_by_superadmin');
        
        // 2. Terminate all persistent sessions in the database
        await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [userId]);
      } else {
        // 1. Lift the blockade
        await redisClient.del(redisKey);
      }

      // 3. Log to Immutable Ledger
      await pool.query(`
        INSERT INTO superadmin_audit_logs (actor_id, action, ip_address)
        VALUES ($1, $2, $3)
      `, [req.user?.userId, isBlacklisted ? 'GLOBAL_BLACKLIST_APPLIED' : 'GLOBAL_BLACKLIST_LIFTED', req.ip]);

      // 4. NEW: Send Email Notification
      try {
        const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length > 0) {
          const targetEmail = userRes.rows[0].email;
          // Dynamically pass the EmailService method
          await EmailService.sendGlobalBlacklistNotification(targetEmail, isBlacklisted);
        }
      } catch (emailErr) {
        console.error('Non-fatal: Failed to send global blacklist notification', emailErr);
      }

      return res.json({ 
        success: true, 
        message: isBlacklisted ? 'Target neutralized globally.' : 'Access restored.',
        isBlacklisted 
      });
    } catch (err) {
      next(err);
    }
  } 
  
  // 6. Fetch SuperAdmin Audit Ledger
  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = `
        SELECT sal.id, sal.action, sal.ip_address, sal.created_at, sal.target_tenant_id,
               u.email as actor_email, u.first_name, u.last_name
        FROM superadmin_audit_logs sal
        LEFT JOIN users u ON sal.actor_id = u.id
        ORDER BY sal.created_at DESC
        LIMIT 100;
      `;
      const result = await pool.query(query);
      return res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }

  // 7. Get Deep Telemetry (Slow Queries, etc.)
  static async getSystemTelemetry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Fetch the entire slow query buffer from Redis (capped at 50 in our interceptor)
      const slowQueriesRaw = await redisClient.lRange('telemetry:db:slow_queries', 0, -1);
      
      const slowQueries = slowQueriesRaw.map(q => {
        try { return JSON.parse(q); } 
        catch (e) { return null; }
      }).filter(Boolean);

      return res.json({ slowQueries });
    } catch (err) {
      next(err);
    }
  }

  // 8. Flush Telemetry Caches
  static async flushTelemetry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Safely delete ONLY the telemetry tracking keys, leaving user sessions intact
      await redisClient.del('telemetry:db:slow_queries');
      await redisClient.set('telemetry:db:slow_query_count', '0');

      // Log this action to the immutable ledger
      await pool.query(`
        INSERT INTO superadmin_audit_logs (actor_id, action, ip_address)
        VALUES ($1, $2, $3)
      `, [req.user?.userId, 'TELEMETRY_FLUSHED', req.ip || '127.0.0.1']);

      return res.json({ success: true, message: 'Telemetry buffer flushed successfully.' });
    } catch (err) {
      next(err);
    }
  }
}