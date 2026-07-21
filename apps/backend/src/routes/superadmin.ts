import { Router } from 'express';
import { SuperAdminController } from '../controllers/superadmin.controller.js';
import { requireAuth, requireSuperAdmin } from '../middlewares/auth.js';

const router = Router();

// Apply BOTH middlewares to all routes in this file
router.use(requireAuth);
router.use(requireSuperAdmin);

// Analytics & Dashboards
router.get('/stats', SuperAdminController.getPlatformStats);

// Tenant Management
router.get('/tenants', SuperAdminController.listTenants);
router.put('/tenants/:tenantId/status', SuperAdminController.updateTenantStatus);

export default router;