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
  } catch (err: any) {
    // Intercept known client-side errors and return a 400 status directly
    if (err.message === 'Invalid OTP' || err.message === 'OTP has expired or does not exist') {
      return res.status(400).json({ error: err.message });
    }
    
    // If it's a database/Redis error, pass it to the global 500 error handler
    next(err); 
  }
});

export default router;