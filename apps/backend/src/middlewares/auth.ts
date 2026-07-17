import { Request, Response, NextFunction } from 'express';
import { CryptoService } from '../services/crypto.service.js';
import { redisClient } from '../db/redis.js';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    isAdmin: boolean;
  };
}

// Ensure user has valid JWT and is not blacklisted
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header is missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    
    // 1. Verify JWT cryptographically
    const decodedPayload = CryptoService.verifyAccessToken(token);

    if (!decodedPayload) {
      return res.status(401).json({ error: 'Access token expired or invalid' });
    }

    // 2. Check the Redis Blacklist using the decoded userId
    // If an admin killed their session, this key will exist
    const isBlacklisted = await redisClient.get(`bl:user:${decodedPayload.userId}`);
    
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Unauthorized: Session has been forcefully terminated' });
    }

    // 3. Attach payload and proceed
    req.user = decodedPayload;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
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