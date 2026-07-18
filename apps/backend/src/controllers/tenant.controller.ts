import { Request, Response, NextFunction } from 'express';
import { QueryService } from '../services/query.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export class TenantController {
  // Brand registration step
  static async registerTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyName, customDomain, logoUrl, themeColor, adminEmail, adminPassword, adminFirstName, adminLastName, adminGender, adminMobile, adminDob, adminMotherTongue, securityQ1, securityA1, securityQ2, securityA2 } = req.body;

      if (!companyName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName || !adminGender || !adminMobile || !adminDob || !adminMotherTongue) {
        return res.status(400).json({ error: 'Required fields for tenant registration are missing' });
      }

      // 1. Create the Tenant
      const tenant = await QueryService.createTenant(companyName, customDomain, logoUrl, themeColor);

      // 2. Hash admin password
      const passwordHash = await CryptoService.hashPassword(adminPassword);

      // 3. Create Admin User (Status is instantly ACTIVE since they are the registrar)
      const adminUser = await QueryService.createUser({
        tenantId: tenant.id,
        email: adminEmail,
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        gender: adminGender,
        mobileNo: adminMobile,
        dateOfBirth: adminDob,
        motherTongue: adminMotherTongue,
        securityQuestion1: securityQ1 || 'What is your favorite player?',
        securityAnswer1: securityA1 || 'sachin',
        securityQuestion2: securityQ2 || 'What is your pets name?',
        securityAnswer2: securityA2 || 'roxi',
        isTenantAdmin: true,
        status: 'ACTIVE',
      });

      // Log the event
      await QueryService.logEvent(
        tenant.id,
        adminUser.id,
        'TENANT_ONBOARDED',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { companyName }
      );

      return res.status(201).json({
        message: 'Tenant and Admin registered successfully!',
        tenant,
        admin: adminUser,
      });
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