import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Wrap in closures to prevent ESM initialization errors
router.get('/me', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => UserController.getMyProfile(req as any, res, next)
);

router.get('/modules', 
  (req, res, next) => requireAuth(req, res, next), 
  (req, res, next) => UserController.getMyModules(req as any, res, next)
);

export default router;