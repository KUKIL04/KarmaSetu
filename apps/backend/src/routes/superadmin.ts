import { Router } from 'express';
import { SuperAdminController } from '../controllers/superadmin.controller.js';
import { requireAuth, requireSuperAdmin } from '../middlewares/auth.js';

const router = Router();

// Apply BOTH middlewares to all routes in this file
router.use(requireAuth);
router.use(requireSuperAdmin);

// Analytics & Dashboards
router.get('/stats', SuperAdminController.getPlatformStats);

// Audits
router.get('/audits', SuperAdminController.getAuditLogs);

// Telemetry
router.get('/telemetry', SuperAdminController.getSystemTelemetry);
router.post('/telemetry/flush', SuperAdminController.flushTelemetry);

// Tenant Management
router.get('/tenants', SuperAdminController.listTenants);
router.get('/tenants/:tenantId', SuperAdminController.getTenant);
router.put('/tenants/:tenantId/status', SuperAdminController.updateTenantStatus);

// User Management
router.get('/users', SuperAdminController.listGlobalUsers);
router.put('/users/:userId/blacklist', SuperAdminController.blacklistUser);

export default router;