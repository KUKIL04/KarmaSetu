import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/invite/:token', AuthController.verifyInviteToken);
router.post('/login', AuthController.login);
router.post('/superadmin/login', AuthController.superAdminLogin);
router.post('/select-workspace', AuthController.selectWorkspace)
router.post('/register', AuthController.registerFromInvite);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// --- Authenticated route to get workspaces for switching ---
router.get('/workspaces', requireAuth, AuthController.getAvailableWorkspaces);

export default router;