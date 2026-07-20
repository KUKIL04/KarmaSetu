import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { uploadLogo } from '../middlewares/upload.js';

const router = Router();

router.post('/logo', uploadLogo.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  return res.json({ 
    success: true, 
    logoUrl: `/uploads/${req.file.filename}` 
  });
});

router.post('/register', TenantController.registerTenant);
router.put('/branding', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => requireAdmin(req, res, next), 
  (req, res, next) => TenantController.updateBranding(req as any, res, next)
);

export default router;