import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { QueryService } from '../services/query.service.js';

export class UserController {
  // Check current profile status (Useful for the Waiting Room)
  static async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      
      if (!tenantId || !userId) return res.status(400).json({ error: 'Context lost' });

      const profile = await QueryService.getUserByIdAndTenant(userId, tenantId);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });

      return res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  // Fetch only the modules explicitly assigned to this user
  static async getMyModules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      
      if (!tenantId || !userId) return res.status(400).json({ error: 'Context lost' });

      const modules = await QueryService.getUserAccessibleModules(userId, tenantId);
      return res.json(modules);
    } catch (err) {
      next(err);
    }
  }
}