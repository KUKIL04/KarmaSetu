import { Request, Response, NextFunction } from 'express';
import { QueryService } from '../services/query.service.js';
import { CryptoService } from '../services/crypto.service.js';

export class TenantController {
  static async registerTenant(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Destructure the exact fields coming from our React TenantOnboarding form
      const {
        companyName,
        customDomain,
        adminFirstName,
        adminLastName,
        adminEmail,
        adminMobile,
        adminPassword,
        adminGender,
        adminDob,
        adminMotherTongue,
        securityQ1,
        securityA1,
        securityQ2,
        securityA2
      } = req.body;

      // Basic validation
      if (!companyName || !adminEmail || !adminPassword || !adminFirstName) {
        return res.status(400).json({ error: 'Missing required organization or admin details.' });
      }

      // 2. Create the Organization (Tenant) first
      const tenant = await QueryService.createTenant(companyName, customDomain);

      // 3. Hash the Master Admin's password
      const passwordHash = await CryptoService.hashPassword(adminPassword);

      // 4. Create the Master Admin User 
      // Map the 'admin*' frontend fields to the generic user fields expected by QueryService
      const admin = await QueryService.createUser({
        tenantId: tenant.id,
        email: adminEmail,
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        gender: adminGender,
        mobileNo: adminMobile,
        dateOfBirth: adminDob,
        motherTongue: adminMotherTongue,
        securityQuestion1: securityQ1,
        securityAnswer1: securityA1,
        securityQuestion2: securityQ2,
        securityAnswer2: securityA2,
        isTenantAdmin: true,   // Grants them HR Admin Dashboard access
        status: 'ACTIVE',      // Master Admins bypass the PENDING waiting room
      });

      // 5. Log the provisioning event
      await QueryService.logEvent(
        tenant.id,
        admin.id,
        'TENANT_PROVISIONED',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        { companyName }
      );

      // 6. Return the success data required by the frontend Success Screen
      return res.status(201).json({
        message: 'Workspace successfully provisioned.',
        tenant,
        admin
      });

    } catch (err: any) {
      // Catch unique constraint violations (e.g., email already exists)
      if (err.code === '23505') {
        return res.status(409).json({ error: 'An account with this email or mobile number already exists.' });
      }
      next(err);
    }
  }
}