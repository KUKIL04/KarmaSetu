import { Response, NextFunction } from 'express';
import { QueryService } from '../services/query.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { redisClient } from '../db/redis.js';
import { EmailService } from '../services/email.service.js';
import { pool } from '../db/index.js';
import fs from 'fs';
import path from 'path';

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

      const mockInviteLink = `http://localhost:3000/register?token=${rawToken}`;

      // SEND THE INVITE EMAIL
      await EmailService.sendInviteEmail(email, mockInviteLink);

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
      
      // Fetch user email to send notification
      const userRecord = await QueryService.getUserByIdAndTenant(id, tenantId);
      if (userRecord && userRecord.email) {
        // SEND STATUS CHANGE EMAIL
        await EmailService.sendStatusChangeEmail(userRecord.email, status);
      }

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
      
      // We extract roleIds here as well
      const { targetUserId, moduleIds, roleIds } = req.body; 

      if (!tenantId || !adminId) return res.status(400).json({ error: 'Context invalid' });
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      // 1. Assign Modules
      if (Array.isArray(moduleIds)) {
        for (const moduleId of moduleIds) {
          await QueryService.assignUserModule(targetUserId, moduleId, adminId);
        }
      }

      // 2. Assign Roles (Reusing the existing DB logic!)
      if (Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          await QueryService.assignUserRole(targetUserId, roleId, adminId);
        }
      }

      // 3. Set user as Active!
      await QueryService.updateUserStatus(targetUserId, tenantId, 'ACTIVE');

      await QueryService.logEvent(
        tenantId,
        adminId,
        'ACCESS_GRANTED',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { targetUserId, moduleIds, roleIds }
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

  static async getRoleUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const roleId = req.params.roleId as string;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      const users = await QueryService.getRoleUsers(tenantId, roleId);
      return res.json(users);
    } catch (err) {
      next(err);
    }
  }

  // Bulk grant a role to multiple users
  static async grantBulkRoleAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { roleId, userIds } = req.body;

      if (!adminId) return res.status(400).json({ error: 'Context invalid' });
      if (!roleId || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'Role ID and array of User IDs are required' });
      }

      for (const userId of userIds) {
        await QueryService.assignUserRole(userId, roleId, adminId);
      }

      return res.json({ success: true, message: `Role granted to ${userIds.length} personnel.` });
    } catch (err) {
      next(err);
    }
  }

  // Revoke a role from a single user
  static async revokeRoleAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.params.userId as string;
      const roleId = req.params.roleId as string;

      if (!tenantId) return res.status(400).json({ error: 'Context invalid' });

      await QueryService.revokeUserRole(userId, roleId);

      return res.json({ success: true, message: 'Role revoked successfully' });
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

  // Bulk grant module access to multiple users via the Modal
  static async grantBulkModuleAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { moduleId, userIds, accessLevel = 'READ' } = req.body;

      if (!adminId) return res.status(400).json({ error: 'Context invalid' });
      if (!moduleId || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'Module ID and array of User IDs are required' });
      }

      for (const userId of userIds) {
        await QueryService.assignUserModule(userId, moduleId, adminId, accessLevel);
      }

      return res.json({ success: true, message: `Access granted to ${userIds.length} personnel.` });
    } catch (err) {
      next(err);
    }
  }

  // Update a single user's Read/Write access level from the table dropdown
  static async updateModuleAccessLevel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const moduleId = req.params.moduleId as string;
      const userId = req.params.userId as string;
      const { accessLevel } = req.body;

      if (!adminId) return res.status(400).json({ error: 'Context invalid' });
      if (!['READ', 'WRITE'].includes(accessLevel)) {
        return res.status(400).json({ error: 'Invalid access level' });
      }

      await QueryService.assignUserModule(userId, moduleId, adminId, accessLevel);

      return res.json({ success: true, message: 'Access level updated' });
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

      // 1. Revoke the long-lived refresh token in PostgreSQL
      const revokedSession = await QueryService.revokeSession(tenantId, tokenId as string);

      // 2. Blacklist the user in Redis to instantly kill any active Access Tokens
      if (revokedSession && revokedSession.user_id) {
        // Set expiry to 15 minutes (900 seconds) so Redis cleans up automatically
        await redisClient.setEx(`bl:user:${revokedSession.user_id}`, 900, 'revoked');
      }

      return res.json({ success: true, message: 'Session terminated successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- CREDENTIAL CONTROLS ---

  static async triggerPasswordReset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const adminId = req.user?.userId;
      const userId = req.params.userId as string;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      // 1. Fetch the target user's email
      const userRecord = await QueryService.getUserByIdAndTenant(userId, tenantId);
      if (!userRecord || !userRecord.email) {
        return res.status(404).json({ error: 'User not found in directory' });
      }

      // 2. Scramble the password (use a highly secure random hash so they cannot log in)
      const randomScramble = await CryptoService.hashPassword(CryptoService.generateRandomToken());
      await QueryService.updateUserPassword(userRecord.email, randomScramble);

      // 3. Nuke all database sessions for this user
      await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [userId]);

      // 4. Blacklist the user in Redis to instantly kill live Access Tokens
      await redisClient.setEx(`bl:user:${userId}`, 900, 'revoked');

      // 5. Send the notification email (NOT an OTP)
      await EmailService.sendForceResetNotification(userRecord.email);

      // 6. Log the severe security action
      await QueryService.logEvent(
        tenantId,
        adminId || null,
        'ADMIN_FORCED_PASSWORD_RESET',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { targetUserId: userId }
      );
      
      return res.json({ success: true, message: 'Credentials invalidated, sessions killed, and user notified.' });
    } catch (err) {
      next(err);
    }
  }

  static async clearSecurityLockout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const adminId = req.user?.userId;
      const userId = req.params.userId as string;
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      // 1. Delete the user's blacklist/lockout record from Redis
      const redisKey = `bl:user:${userId}`;
      await redisClient.del(redisKey);

      // 2. Fetch the user's email to notify them
      const userRecord = await QueryService.getUserByIdAndTenant(userId, tenantId);
      if (userRecord && userRecord.email) {
        await EmailService.sendLockoutClearedEmail(userRecord.email);
      }

      // 3. Log the security action
      await QueryService.logEvent(
        tenantId,
        adminId || null,
        'SECURITY_LOCKOUT_CLEARED',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { targetUserId: userId }
      );
      
      return res.json({ success: true, message: 'Account lockout cleared and user notified.' });
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

  // 1. STAGING PHASE: Just save the file to disk and return the URL
  static async uploadWorkspaceLogo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Generate the public URL path that React will use for the live preview
      const logoUrl = `/uploads/${req.file.filename}`;

      // Notice: We are NOT touching the database here anymore!
      return res.json({ 
        success: true, 
        message: 'Logo staged for preview',
        logoUrl 
      });
    } catch (err) {
      next(err);
    }
  }

  // 2. COMMIT PHASE: Save all settings and clean up old files
  static async updateTenantSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });
      
      const { name, customDomain, logoUrl, themeColor } = req.body;
      if (!name) return res.status(400).json({ error: 'Company Name is required' });

      // Fetch current settings to check if the logo was actually replaced
      const currentTenant = await QueryService.getTenantSettings(tenantId);

      // If the database has an old logo, and it doesn't match the newly submitted logoUrl...
      if (currentTenant && currentTenant.logo_url && currentTenant.logo_url !== logoUrl) {
        // Obliterate the old image from the hard drive
        if (currentTenant.logo_url.startsWith('/uploads/')) {
          const oldFilePath = path.join(process.cwd(), 'public', currentTenant.logo_url);
          
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }

      // Commit the final state to PostgreSQL
      const updatedSettings = await QueryService.updateTenantSettings(tenantId, {
        name,
        customDomain,
        logoUrl,
        themeColor
      });

      return res.json({ success: true, message: 'Workspace settings committed', settings: updatedSettings });
    } catch (err) {
      next(err);
    }
  }
}