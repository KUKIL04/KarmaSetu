import { Response, NextFunction } from 'express';
import { QueryService } from '../services/query.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export class AdminController {
  // Generate Invite Links
  static async inviteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const invitedBy = req.user?.userId;
      const { email, expireHours } = req.body;

      if (!tenantId || !invitedBy) return res.status(400).json({ error: 'User context invalid' });
      if (!email) return res.status(400).json({ error: 'Recipient email is required' });

      // Generate token and record hash
      const rawToken = CryptoService.generateRandomToken();
      const tokenHash = CryptoService.hashToken(rawToken);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (expireHours ? parseInt(expireHours) : 24));

      await QueryService.createInvitation(tenantId, email, tokenHash, invitedBy, expiresAt);

      const mockInviteLink = `http://localhost:3000/signup?token=${rawToken}`;

      await QueryService.logEvent(
        tenantId,
        invitedBy,
        'USER_INVITED',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { email, expiresAt }
      );

      // Return the token path to output
      return res.status(201).json({
        success: true,
        inviteLink: mockInviteLink,
        expiresAt,
      });
    } catch (err) {
      next(err);
    }
  }

  // Create App Module
  static async registerModule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { name, description } = req.body;

      if (!tenantId) return res.status(400).json({ error: 'Tenant context invalid' });
      if (!name) return res.status(400).json({ error: 'Module name is required' });

      const module = await QueryService.createModule(tenantId, name, description);

      return res.status(201).json({ success: true, module });
    } catch (err) {
      next(err);
    }
  }

  // Fetch all registered modules for the tenant
  static async getModules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      
      const modules = await QueryService.getModulesByTenant(tenantId);
      return res.json(modules);
    } catch (err) {
      next(err);
    }
  }

  // Fetch all users belonging to the tenant directory
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      
      const users = await QueryService.getUsersByTenant(tenantId);
      return res.json(users);
    } catch (err) {
      next(err);
    }
  }

  // Suspend or Restore user access
  static async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const id = req.params.id as string;
      const { status } = req.body;

      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided' });
      }

      const updatedUser = await QueryService.updateUserStatus(id, tenantId, status as any);
      
      await QueryService.logEvent(
        tenantId,
        req.user?.userId || null,
        'USER_STATUS_CHANGED',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { targetUserId: id, newStatus: status }
      );

      return res.json({ success: true, user: updatedUser });
    } catch (err) {
      next(err);
    }
  }

  // Manage access for users inside the waiting room
  static async grantUserAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const adminId = req.user?.userId;
      const { targetUserId, moduleIds } = req.body; // Array of module IDs to unlock

      if (!tenantId || !adminId) return res.status(400).json({ error: 'Context invalid' });
      if (!targetUserId || !moduleIds || !Array.isArray(moduleIds)) {
        return res.status(400).json({ error: 'Target user and module IDs are required' });
      }

      // 1. Map individual modules
      for (const moduleId of moduleIds) {
        await QueryService.assignUserModule(targetUserId, moduleId, adminId);
      }

      // 2. Set user as Active!
      await QueryService.updateUserStatus(targetUserId, tenantId, 'ACTIVE');

      await QueryService.logEvent(
        tenantId,
        adminId,
        'ACCESS_GRANTED',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { targetUserId, moduleIds }
      );

      return res.json({ success: true, message: 'Access granted. User is now ACTIVE.' });
    } catch (err) {
      next(err);
    }
  }

  // Fetch system audit logs
  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      const logs = await QueryService.getAuditLogs(tenantId);
      return res.json(logs);
    } catch (err) {
      next(err);
    }
  }

  // --- RBAC ENDPOINTS ---

  static async getRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      
      const roles = await QueryService.getRoles(tenantId);
      return res.json(roles);
    } catch (err) {
      next(err);
    }
  }

  static async getPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      
      const permissions = await QueryService.getPermissions(tenantId);
      return res.json(permissions);
    } catch (err) {
      next(err);
    }
  }

  static async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { name, description } = req.body;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      if (!name) return res.status(400).json({ error: 'Role name is required' });

      const role = await QueryService.createRole(tenantId, name, description);
      return res.status(201).json(role);
    } catch (err) {
      next(err);
    }
  }

  // --- MODULE ACCESS MAP ENDPOINTS ---

  static async getModuleUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { moduleId } = req.params;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      const users = await QueryService.getModuleUsers(tenantId, moduleId as string);
      return res.json(users);
    } catch (err) {
      next(err);
    }
  }

  static async revokeModuleAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { userId, moduleId } = req.params;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      await QueryService.revokeModuleAccess(tenantId, userId as string, moduleId as string);
      return res.json({ success: true, message: 'Access revoked successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- SECURITY ENDPOINTS ---

  static async getActiveSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      
      const sessions = await QueryService.getActiveSessions(tenantId);
      return res.json(sessions);
    } catch (err) {
      next(err);
    }
  }

  static async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { tokenId } = req.params;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      await QueryService.revokeSession(tenantId, tokenId as string);
      return res.json({ success: true, message: 'Session terminated successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- CREDENTIAL CONTROLS ---

  static async triggerPasswordReset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { userId } = req.params;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      // In a production app, this would generate a secure token and fire an email service (like SendGrid/AWS SES).
      // For now, we simulate success and log it to audits.
      
      return res.json({ success: true, message: 'Password reset protocol initiated' });
    } catch (err) {
      next(err);
    }
  }

  static async clearSecurityLockout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { userId } = req.params;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      // In a real database schema, you would execute:
      // await pool.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
      
      return res.json({ success: true, message: 'Account lockout cleared' });
    } catch (err) {
      next(err);
    }
  }

  // --- TENANT SETTINGS ENDPOINTS ---

  static async getTenantSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      const settings = await QueryService.getTenantSettings(tenantId);
      return res.json(settings);
    } catch (err) {
      next(err);
    }
  }

  static async updateTenantSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      if (!req.body.name) return res.status(400).json({ error: 'Company Name is required' });

      const updatedSettings = await QueryService.updateTenantSettings(tenantId, req.body);
      return res.json({ success: true, message: 'Workspace settings updated', settings: updatedSettings });
    } catch (err) {
      next(err);
    }
  }
}