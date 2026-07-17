import { Request, Response, NextFunction } from 'express';
import { CryptoService } from '../services/crypto.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    isAdmin: boolean;
  };
}

// Ensure user has valid JWT
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header is missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  const decodedPayload = CryptoService.verifyAccessToken(token);

  if (!decodedPayload) {
    return res.status(401).json({ error: 'Access token expired or invalid' });
  }

  req.user = decodedPayload;
  next();
};

// Guard to enforce that only Tenant Admins (HR) can manage the dashboard
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  next();
};