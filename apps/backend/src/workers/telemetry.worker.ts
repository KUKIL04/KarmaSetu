import { redisClient } from '../db/redis.js';
import { pool } from '../db/index.js';

export const startTelemetryWorker = () => {
  console.log('📡 Telemetry worker initialized. Flushing metrics every 60 seconds.');

  setInterval(async () => {
    try {
      const bufferKey = 'telemetry:tenant_api_buffer';
      
      // 1. Fetch current buffered counts
      const tenantCounts = await redisClient.hGetAll(bufferKey);
      if (Object.keys(tenantCounts).length === 0) return;

      // 2. Immediately clear the buffer so live traffic starts fresh
      await redisClient.del(bufferKey);

      // 3. Commit metrics to PostgreSQL safely
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        for (const [tenantId, count] of Object.entries(tenantCounts)) {
          await client.query(
            `INSERT INTO tenant_subscriptions (tenant_id, plan_tier, api_request_count)
             VALUES ($2, 'FREE_TIER', $1)
             ON CONFLICT (tenant_id) 
             DO UPDATE SET 
                api_request_count = tenant_subscriptions.api_request_count + EXCLUDED.api_request_count, 
                updated_at = CURRENT_TIMESTAMP;`,
            [parseInt(count), tenantId]
          );
        }
        
        await client.query('COMMIT');
      } catch (dbError) {
        await client.query('ROLLBACK');
        console.error('Failed to commit telemetry to DB:', dbError);
        
        // Failsafe: If DB goes down, restore the metrics to Redis so we don't lose billing data
        for (const [tenantId, count] of Object.entries(tenantCounts)) {
          await redisClient.hIncrBy(bufferKey, tenantId, parseInt(count));
        }
      } finally {
        client.release();
      }
    } catch (error) {
       console.error('Telemetry Worker Runtime Error:', error);
    }
  }, 60000); // 60 seconds
};