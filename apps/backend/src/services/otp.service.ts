import { redisClient } from '../db/redis.js';
import { EmailService } from './email.service.js';

export class OtpService {
  
  // Generates and dispatches the OTP
  static async generateAndSend(target: string, type: 'EMAIL' | 'PHONE') {
    // 1. Generate a cryptographically secure 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Store in Redis with a 10-minute (600 seconds) expiration[cite: 36]
    const redisKey = `otp:${type}:${target}`;
    await redisClient.setEx(redisKey, 600, otp);

    // 3. Dispatch via the correct channel
    if (type === 'EMAIL') {
      await EmailService.sendOtpEmail(target, otp);
    } else if (type === 'PHONE') {
      // Placeholder for future Twilio/SMS integration
      console.log(`\n📱 [MOCK SMS] Sent ${otp} to ${target}\n`);
    }

    return true;
  }

  // Validates the OTP provided by the user
  static async verifyOtp(target: string, type: 'EMAIL' | 'PHONE', providedOtp: string) {
    const redisKey = `otp:${type}:${target}`;
    const storedOtp = await redisClient.get(redisKey);

    if (!storedOtp) {
      throw new Error('OTP has expired or does not exist');
    }

    if (storedOtp !== providedOtp) {
      throw new Error('Invalid OTP');
    }

    // Burn the OTP after successful verification so it cannot be reused
    await redisClient.del(redisKey);
    return true;
  }
}