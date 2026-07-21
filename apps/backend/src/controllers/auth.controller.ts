import { Request, Response, NextFunction } from 'express';
import { QueryService } from '../services/query.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { redisClient } from '../db/redis.js';
import { pool } from '../db/index.js';
import { OtpService } from '../services/otp.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export class AuthController {
  // --- DEDICATED SUPERADMIN LOGIN ---
  static async superAdminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and Password are required' });
      }

      // Query the global identity matrix directly, bypassing workspace memberships
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userRes.rows[0];

      // Instant denial if they lack the hardware flag
      if (!user.is_superadmin) {
        return res.status(403).json({ error: 'Terminal Access Denied: SuperAdmin clearance required.' });
      }

      const match = await CryptoService.verifyPassword(password, user.password_hash);
      
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate the token. We pass 'SYSTEM' as the tenant ID since they sit above all tenants.
      const accessToken = CryptoService.generateAccessToken({
        userId: user.id,
        tenantId: 'SYSTEM',
        isAdmin: true,
      });

      // Log the login event directly to the highly secure superadmin_audit_logs
      await pool.query(
        `INSERT INTO superadmin_audit_logs (actor_id, action, ip_address) VALUES ($1, $2, $3)`,
        [user.id, 'SUPERADMIN_LOGIN', req.ip || '127.0.0.1']
      );

      return res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isSuperAdmin: true, // Crucial for the frontend context
        },
      });
    } catch (err) {
      next(err);
    }
  }
  
  // Login Endpoint
  // --- 1. THE UPDATED LOGIN METHOD ---
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and Password are required' });
      }

      const workspaces = await QueryService.getTenantsByEmail(email);
      
      if (workspaces.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Use the first workspace found to securely process the password check
      const targetRecord = workspaces[0];
      const lockoutKey = `bl:user:${targetRecord.user_id}`;
      const isLocked = await redisClient.get(lockoutKey);
      
      if (isLocked) {
        return res.status(403).json({ error: 'Account locked due to too many failed attempts. Please wait 15 minutes.' });
      }

      const match = await CryptoService.verifyPassword(password, targetRecord.password_hash);
      
      if (!match) {
        const attemptsKey = `login_attempts:${targetRecord.user_id}`;
        const attempts = await redisClient.incr(attemptsKey);
        
        if (attempts === 1) await redisClient.expire(attemptsKey, 900);

        if (attempts >= 3) {
          await redisClient.setEx(lockoutKey, 900, 'locked'); 
          await redisClient.del(attemptsKey);
          return res.status(403).json({ error: 'Maximum attempts reached. Account locked for 15 minutes.' });
        }

        return res.status(401).json({ error: `Invalid credentials. ${3 - attempts} attempts remaining.` });
      }

      await redisClient.del(lockoutKey);
      await redisClient.del(`login_attempts:${targetRecord.user_id}`);

      // MULTI-TENANT RESOLUTION
      if (workspaces.length > 1) {
        // Generate a 5-minute Pre-Auth token
        const tempToken = CryptoService.generateTempToken({ userId: targetRecord.user_id });
        
        return res.json({
          requiresTenantSelection: true,
          tempToken,
          tenants: workspaces.map(w => ({
            tenantId: w.tenant_id,
            companyName: w.company_name,
            logoUrl: w.logo_url
          }))
        });
      }

      // If they only belong to 1 workspace, proceed to normal login finalization
      const accessToken = CryptoService.generateAccessToken({
        userId: targetRecord.user_id,
        tenantId: targetRecord.tenant_id,
        isAdmin: targetRecord.is_tenant_admin,
      });

      const rawRefreshToken = CryptoService.generateRandomToken();
      const hashedRefresh = CryptoService.hashToken(rawRefreshToken);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      await QueryService.saveRefreshToken(targetRecord.user_id, targetRecord.tenant_id, hashedRefresh, expiry);

      await QueryService.logEvent(targetRecord.tenant_id, targetRecord.user_id, 'USER_LOGIN', req.ip || '127.0.0.1', req.headers['user-agent'] || 'unknown', {});

      return res.json({
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: targetRecord.user_id,
          email: targetRecord.email,
          firstName: targetRecord.first_name,
          lastName: targetRecord.last_name,
          status: targetRecord.status,
          isAdmin: targetRecord.is_tenant_admin,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // --- 2. THE NEW SELECT WORKSPACE METHOD ---
  static async selectWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { tempToken, tenantId, oldRefreshToken } = req.body;

      if (!tempToken || !tenantId) {
        return res.status(400).json({ error: 'Token and Workspace ID are required' });
      }

      // 1. Verify the Pre-Auth token
      const decoded = CryptoService.verifyTempToken(tempToken);
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }

      // 2. Verify the user actually belongs to the requested workspace
      const user = await QueryService.getUserByIdAndTenant(decoded.userId, tenantId);
      
      if (!user || user.status === 'SUSPENDED') {
         return res.status(403).json({ error: 'Your access to this workspace has been suspended.' });
      }

      // Kill the old session if they are switching workspaces ---
      if (oldRefreshToken) {
        const hashedOldRefresh = CryptoService.hashToken(oldRefreshToken);
        await QueryService.revokeRefreshToken(hashedOldRefresh);
      }

      // 3. Generate Final Credentials
      const accessToken = CryptoService.generateAccessToken({
        userId: user.id,
        tenantId: user.tenant_id,
        isAdmin: user.is_tenant_admin,
      });

      const rawRefreshToken = CryptoService.generateRandomToken();
      const hashedRefresh = CryptoService.hashToken(rawRefreshToken);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      await QueryService.saveRefreshToken(user.id, user.tenant_id, hashedRefresh, expiry);
      await QueryService.logEvent(user.tenant_id, user.id, 'USER_LOGIN', req.ip || '127.0.0.1', req.headers['user-agent'] || 'unknown', {});

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

  // --- 3. FETCH AVAILABLE WORKSPACES (For Authenticated Users) ---
  static async getAvailableWorkspaces(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const currentTenantId = req.user?.tenantId;

      if (!userId || !currentTenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Fetch all workspaces this global user belongs to
      // (You will need to add getTenantsByUserId to your QueryService)
      const workspaces = await QueryService.getTenantsByUserId(userId);

      // Clever UI Logic: Filter out the workspace they are currently logged into
      const availableWorkspaces = workspaces.filter(w => w.tenant_id !== currentTenantId);

      if (availableWorkspaces.length === 0) {
        return res.json({ tempToken: null, tenants: [] });
      }

      // Generate a fresh Pre-Auth token for the switch
      const tempToken = CryptoService.generateTempToken({ userId });

      return res.json({
        tempToken,
        tenants: availableWorkspaces.map(w => ({
          tenantId: w.tenant_id,
          companyName: w.company_name,
          logoUrl: w.logo_url
        }))
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

  // Initiate Password Reset (Fail Fast on Invalid Emails)
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // SECURITY CHECK: Verify the user exists in the database FIRST
      const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (userCheck.rows.length === 0) {
        // Fail fast: Prevent OTP dispatch and alert the frontend immediately
        return res.status(404).json({ error: 'No active account found with this corporate email.' });
      }

      // 🚀 FIRE THE OTP SERVICE
      await OtpService.generateAndSend(email, 'EMAIL');
      
      return res.json({ success: true, message: 'OTP dispatched securely.' });
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

       // FETCH TENANT BRANDING
      const tenantSettings = await QueryService.getTenantSettings(invite.tenant_id);

      // Securely return the email tied strictly to this database record
      return res.json({ 
        email: invite.email,
        tenantName: tenantSettings?.name,
        logoUrl: tenantSettings?.logo_url,
        themeColor: tenantSettings?.theme_color
      });
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

      // Hash the incoming raw token to compare against the database record
      const hashedRefresh = CryptoService.hashToken(refreshToken);
      
      // Look up the token ensuring it hasn't been manually revoked
      const tokenRecord = await QueryService.getRefreshToken(hashedRefresh);

      if (!tokenRecord) {
        return res.status(401).json({ error: 'Invalid or revoked refresh token' });
      }

      // Manually verify the token hasn't expired yet
      if (new Date(tokenRecord.expires_at) < new Date()) {
        return res.status(401).json({ error: 'Refresh token has expired' });
      }

      // Re-verify the user's status using strict multi-tenant validation
      const user = await QueryService.getUserByIdAndTenant(tokenRecord.user_id, tokenRecord.tenant_id);
      
      if (!user || user.status === 'SUSPENDED') {
        return res.status(401).json({ error: 'User account is suspended.' });
      }

      // Generate a fresh Access Token using your 15m expiration policy
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

  // Handle User Logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Hash the token exactly as it is stored in the database
        const hashedRefresh = CryptoService.hashToken(refreshToken);
        
        // Mark it as revoked so it drops off the Active Sessions UI
        await QueryService.revokeRefreshToken(hashedRefresh);
      }

      return res.json({ success: true, message: 'Session terminated successfully' });
    } catch (err) {
      next(err);
    }
  }
}