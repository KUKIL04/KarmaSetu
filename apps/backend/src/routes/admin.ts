import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { uploadLogo } from '../middlewares/upload.js';

const router = Router();

router.post('/invite', requireAuth, requireAdmin, AdminController.inviteUser);
router.post('/modules', requireAuth, requireAdmin, AdminController.registerModule);
router.post('/grant-access', requireAuth, requireAdmin, AdminController.grantUserAccess);
router.get('/modules', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => AdminController.getModules(req as any, res, next)
);

router.get('/users', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => AdminController.getUsers(req as any, res, next)
);

router.get('/audits', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.getAuditLogs(req as any, res, next)
);

router.put('/users/:id/status', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => AdminController.updateUserStatus(req as any, res, next)
);

// -- RBAC Routes --
router.get('/roles', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.getRoles(req as any, res, next)
);

router.post('/roles', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.createRole(req as any, res, next)
);

router.get('/roles/:roleId/users', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.getRoleUsers(req as any, res, next)
);

router.post('/roles/bulk-grant', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => AdminController.grantBulkRoleAccess(req as any, res, next)
);

router.delete('/users/:userId/roles/:roleId', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => AdminController.revokeRoleAccess(req as any, res, next)
);

router.get('/permissions', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.getPermissions(req as any, res, next)
);

// -- Module Reverse Access Routes --
router.get('/modules/:moduleId/users', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.getModuleUsers(req as any, res, next)
);

router.delete('/users/:userId/modules/:moduleId', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.revokeModuleAccess(req as any, res, next)
);

// -- Module Bulk & Read/Write Access Routes --
router.post('/modules/bulk-grant', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => AdminController.grantBulkModuleAccess(req as any, res, next)
);

router.put('/modules/:moduleId/users/:userId/access', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => AdminController.updateModuleAccessLevel(req as any, res, next)
);

// -- Security & Session Routes --
router.get('/sessions', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.getActiveSessions(req as any, res, next)
);

router.delete('/sessions/:tokenId', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.revokeSession(req as any, res, next)
);

// -- Credential Control Routes --
router.post('/users/:userId/reset-password', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.triggerPasswordReset(req as any, res, next)
);

router.post('/users/:userId/clear-lockout', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.clearSecurityLockout(req as any, res, next)
);

// -- Workspace Settings Routes --
router.get('/settings', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.getTenantSettings(req as any, res, next)
);

router.put('/settings', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => AdminController.updateTenantSettings(req as any, res, next)
);

router.post('/settings/logo', 
  (req, res, next) => requireAuth(req, res, next),
  uploadLogo.single('logo'), // 'logo' must match the FormData field name from React
  (req, res, next) => AdminController.uploadWorkspaceLogo(req as any, res, next)
);

export default router;