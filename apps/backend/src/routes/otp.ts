import { Router } from 'express';
import { redisClient } from '../db/redis.js';

const router = Router();

// Generate and "send" OTP (print to terminal)
router.post('/send', async (req, res) => {
  const { target, type } = req.body; // target: email or phone number, type: 'EMAIL' | 'PHONE'
  
  if (!target) {
    return res.status(400).json({ error: 'Target destination is required' });
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save in Redis with 5-minute expiry (300 seconds)
  const redisKey = `otp:${type}:${target}`;
  await redisClient.setEx(redisKey, 300, otp);

  // MOCK: Output directly to developer console
  console.log(`\n--- [MOCK ${type} GATEWAY] ---`);
  console.log(`Sending OTP to: ${target}`);
  console.log(`Your Verification Code is: ${otp}`);
  console.log(`------------------------------\n`);

  return res.json({ success: true, message: `OTP sent successfully to ${target}` });
});

// Verify the OTP
router.post('/verify', async (req, res) => {
  const { target, type, otp } = req.body;

  if (!target || !otp) {
    return res.status(400).json({ error: 'Target and OTP are required' });
  }

  const redisKey = `otp:${type}:${target}`;
  const storedOtp = await redisClient.get(redisKey);

  if (!storedOtp) {
    return res.status(400).json({ error: 'OTP has expired or was never requested' });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  // Verification succeeded: delete OTP from Redis so it can't be reused
  await redisClient.del(redisKey);

  return res.json({ success: true, message: 'Verification successful' });
});

export default router;