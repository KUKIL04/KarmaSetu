import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

router.get('/invite/:token', AuthController.verifyInviteToken);
router.post('/login', AuthController.login);
router.post('/register', AuthController.registerFromInvite);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

export default router;