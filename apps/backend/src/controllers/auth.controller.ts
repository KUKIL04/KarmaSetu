import { Request, Response, NextFunction } from 'express';
import { QueryService } from '../services/query.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { redisClient } from '../db/redis.js';

export class AuthController {
  // Login Endpoint
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, tenantId } = req.body;

      if (!email || !password || !tenantId) {
        return res.status(400).json({ error: 'Email, Password, and Tenant ID are required' });
      }

      const user = await QueryService.getUserByEmailAndTenant(email, tenantId);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const match = await CryptoService.verifyPassword(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Clear any existing security lockouts for this user upon a valid login
      await redisClient.del(`bl:user:${user.id}`);

      // Generate credentials
      const accessToken = CryptoService.generateAccessToken({
        userId: user.id,
        tenantId: user.tenant_id,
        isAdmin: user.is_tenant_admin,
      });

      const rawRefreshToken = CryptoService.generateRandomToken();
      const hashedRefresh = CryptoService.hashToken(rawRefreshToken);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7); // 7 Days

      await QueryService.saveRefreshToken(user.id, user.tenant_id, hashedRefresh, expiry);

      await QueryService.logEvent(
        user.tenant_id,
        user.id,
        'USER_LOGIN',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        {}
      );

      return res.json({
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          status: user.status,
          isAdmin: user.is_tenant_admin,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Handle User Registration via invitation token
  static async registerFromInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password, firstName, middleName, lastName, gender, countryCode, mobileNo, dateOfBirth, alternateEmail, motherTongue, securityQ1, securityA1, securityQ2, securityA2 } = req.body;

      if (!token || !password || !firstName || !lastName || !gender || !mobileNo || !dateOfBirth || !motherTongue) {
        return res.status(400).json({ error: 'Missing registration details' });
      }

      // Find the invitation
      const hashedToken = CryptoService.hashToken(token);
      const invite = await QueryService.getInvitationByHash(hashedToken);

      if (!invite) {
        return res.status(400).json({ error: 'Invalid or expired invitation token' });
      }

      const passwordHash = await CryptoService.hashPassword(password);

      // Create new user defaulted to 'PENDING' state (Waiting Room)
      const newUser = await QueryService.createUser({
        tenantId: invite.tenant_id,
        email: invite.email,
        passwordHash,
        firstName,
        middleName,
        lastName,
        gender,
        mobileNo,
        dateOfBirth,
        alternateEmail,
        motherTongue,
        securityQuestion1: securityQ1,
        securityAnswer1: securityA1,
        securityQuestion2: securityQ2,
        securityAnswer2: securityA2,
        isTenantAdmin: false,
        status: 'PENDING', // Placed directly into the WAITING ROOM
      });

      // Consume the invite token
      await QueryService.updateInvitationStatus(invite.id, 'ACCEPTED');

      await QueryService.logEvent(
        invite.tenant_id,
        newUser.id,
        'USER_SIGNUP',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { inviteId: invite.id }
      );

      return res.status(201).json({
        message: 'Registration complete! Welcome to the Waiting Room. Please wait for HR approval.',
        user: newUser,
      });
    } catch (err) {
      next(err);
    }
  }

  // Handle Password Reset
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
      }

      // Hash the new password using Argon2
      const passwordHash = await CryptoService.hashPassword(newPassword);

      // Update the user's password in the database
      const updatedUser = await QueryService.updateUserPassword(email, passwordHash);

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Verify invite token and return the locked email
  static async verifyInviteToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;
      if (!token) return res.status(400).json({ error: 'Token is required' });

      const hashedToken = CryptoService.hashToken(token);
      const invite = await QueryService.getInvitationByHash(hashedToken);

      if (!invite) {
        return res.status(404).json({ error: 'Invalid or expired invitation link' });
      }

      // Securely return the email tied strictly to this database record
      return res.json({ email: invite.email });
    } catch (err) {
      next(err);
    }
  }

  // Handle Token Refresh
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token is required' });
      }

      // Hash the incoming raw token to compare against the database record[cite: 13]
      const hashedRefresh = CryptoService.hashToken(refreshToken);
      
      // Look up the token ensuring it hasn't been manually revoked[cite: 12]
      const tokenRecord = await QueryService.getRefreshToken(hashedRefresh);

      if (!tokenRecord) {
        return res.status(401).json({ error: 'Invalid or revoked refresh token' });
      }

      // Manually verify the token hasn't expired yet
      if (new Date(tokenRecord.expires_at) < new Date()) {
        return res.status(401).json({ error: 'Refresh token has expired' });
      }

      // Re-verify the user's status using strict multi-tenant validation[cite: 12]
      const user = await QueryService.getUserByIdAndTenant(tokenRecord.user_id, tokenRecord.tenant_id);
      
      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({ error: 'User account is inactive or disabled' });
      }

      // Generate a fresh Access Token using your 15m expiration policy[cite: 13]
      const newAccessToken = CryptoService.generateAccessToken({
        userId: user.id,
        tenantId: user.tenant_id,
        isAdmin: user.is_tenant_admin,
      });

      return res.json({ accessToken: newAccessToken });
    } catch (err) {
      next(err);
    }
  }
}