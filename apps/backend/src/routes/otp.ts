import { Router } from 'express';
import { OtpService } from '../services/otp.service.js';

const router = Router();

// Generate and dispatch OTP via EmailService
router.post('/send', async (req, res, next) => {
  try {
    const { target, type } = req.body;
    
    if (!target) {
      return res.status(400).json({ error: 'Target destination is required' });
    }

    // Call our new orchestrator service
    await OtpService.generateAndSend(target, type);

    return res.json({ success: true, message: `OTP dispatched to ${target}` });
  } catch (err) {
    next(err);
  }
});

// Verify the OTP
router.post('/verify', async (req, res, next) => {
  try {
    const { target, type, otp } = req.body;

    if (!target || !otp) {
      return res.status(400).json({ error: 'Target and OTP are required' });
    }

    // Call our new orchestrator service
    await OtpService.verifyOtp(target, type, otp);

    return res.json({ success: true, message: 'Verification successful' });
  } catch (err) {
    next(err); // The service throws errors if invalid/expired, which the global error handler catches
  }
});

export default router;