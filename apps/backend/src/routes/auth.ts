import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

router.get('/invite/:token', AuthController.verifyInviteToken);
router.post('/login', AuthController.login);
router.post('/register', AuthController.registerFromInvite);
router.post('/reset-password', AuthController.resetPassword);
router.post('/refresh', AuthController.refreshToken);

export default router;