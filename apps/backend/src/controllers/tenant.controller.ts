import { Request, Response, NextFunction } from 'express';
import { QueryService } from '../services/query.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { pool } from '../db/index.js';

export class TenantController {
  // Brand registration step
  static async registerTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        companyName, customDomain, logoUrl, themeColor, 
        legalName, taxId, registrationNumber, industry, orgSize, 
        addressStreet, addressCity, addressState, addressPincode,
        adminEmail, adminPassword, 
        // These fields are only required if it's a brand new user
        adminFirstName, adminMiddleName, adminLastName, 
        adminGender, adminMobile, adminDob, adminMotherTongue, 
        securityQ1, securityA1, securityQ2, securityA2 
      } = req.body;

      if (!companyName || !adminEmail || !adminPassword) {
        return res.status(400).json({ error: 'Company Name, Email, and Password are required' });
      }

      // 1. Check for Global Identity FIRST
      const existingUserCheck = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
      const isGlobalIdentity = existingUserCheck.rows.length > 0;
      let targetUserId;

      if (isGlobalIdentity) {
        const existingUser = existingUserCheck.rows[0];
        const match = await CryptoService.verifyPassword(adminPassword, existingUser.password_hash);
        
        if (!match) {
          return res.status(401).json({ error: 'Global Identity found, but the master password was incorrect.' });
        }
        targetUserId = existingUser.id;
      } else {
        // Enforce full profile requirements for new users
        if (!adminFirstName || !adminLastName || !adminMobile || !adminDob) {
          return res.status(400).json({ error: 'Complete profile data is required for new accounts.' });
        }
      }

      // 2. Safe to create the Tenant (Credentials are valid)
      const tenant = await QueryService.createTenant({
        companyName, domain: customDomain, logoUrl, themeColor,
        legalName, taxId, registrationNumber, industry, orgSize,
        addressStreet, addressCity, addressState, addressPincode
      });

      let finalAdminUser;

      // 3. Connect the Identity
      if (isGlobalIdentity) {
        // Map existing user as the ACTIVE admin of the new tenant
        await pool.query(`
          INSERT INTO workspace_memberships (user_id, tenant_id, status, is_tenant_admin)
          VALUES ($1, $2, 'ACTIVE', true)
        `, [targetUserId, tenant.id]);

        finalAdminUser = { id: targetUserId, email: adminEmail };
      } else {
        // Create brand new user
        const passwordHash = await CryptoService.hashPassword(adminPassword);
        finalAdminUser = await QueryService.createUser({
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName,
          middleName: adminMiddleName,
          lastName: adminLastName,
          gender: adminGender,
          mobileNo: adminMobile,
          dateOfBirth: adminDob,
          motherTongue: adminMotherTongue,
          securityQuestion1: securityQ1 || 'What is your pets name?',
          securityAnswer1: securityA1,
          securityQuestion2: securityQ2 || 'Who is your favorite player?',
          securityAnswer2: securityA2,
          isTenantAdmin: true,
          status: 'ACTIVE',
        });
      }

      // Log the event
      await QueryService.logEvent(tenant.id, finalAdminUser.id, 'TENANT_ONBOARDED', req.ip || '127.0.0.1', req.headers['user-agent'] || 'unknown', { companyName });

      return res.status(201).json({ message: 'Workspace provisioned successfully!', tenant, admin: finalAdminUser });
    } catch (err) {
      next(err);
    }
  }

  // Modify Branding Options
  static async updateBranding(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { companyName, logoUrl, themeColor } = req.body;

      if (!tenantId) return res.status(400).json({ error: 'Tenant context lost' });

      const updatedTenant = await QueryService.updateTenantBranding(tenantId, companyName, logoUrl, themeColor);

      await QueryService.logEvent(
        tenantId,
        req.user?.userId || null,
        'BRANDING_UPDATED',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { companyName, themeColor }
      );

      return res.json({ success: true, tenant: updatedTenant });
    } catch (err) {
      next(err);
    }
  }
}