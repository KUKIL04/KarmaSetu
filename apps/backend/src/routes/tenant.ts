import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.post('/register', TenantController.registerTenant);
router.put('/branding', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => TenantController.updateBranding(req as any, res, next)
);

export default router;