import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../db/redis.js';
import jwt from 'jsonwebtoken';

export const edgeTelemetry = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', async () => {
    try {
      const diff = process.hrtime(start);
      const latency = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2); // Latency in ms
      
      // 1. Increment Global Live Counters
      await redisClient.incr('telemetry:global:api_calls');
      
      if (res.statusCode >= 500) {
        await redisClient.incr('telemetry:global:errors');
      }

      // 2. Extract Tenant Identity for Metering
      let tenantId = 'ANONYMOUS';
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          // Fast decode (no verification overhead) just for telemetry routing
          const decoded = jwt.decode(token) as any;
          if (decoded && decoded.tenantId) {
            tenantId = decoded.tenantId;
          }
        } catch (e) {
          // Ignore malformed tokens; auth middleware handles the rejection
        }
      }

      // 3. Buffer Tenant Consumption in Redis (Ignore SuperAdmins and Public traffic)
      if (tenantId !== 'ANONYMOUS' && tenantId !== 'SYSTEM') {
         await redisClient.hIncrBy('telemetry:tenant_api_buffer', tenantId, 1);
      }
    } catch (err) {
      console.error('Telemetry capture failed:', err);
    }
  });

  next();
};