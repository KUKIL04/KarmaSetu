import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { redisClient } from './redis.js';

// Get the current directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use exact credentials from your docker-compose.yml
export const pool = new Pool({
  user: 'admin',
  password: 'password123',
  host: 'localhost',
  port: 5434,
  database: 'auth_saas_db',
});

// Deep Telemetry Configuration
const SLOW_QUERY_THRESHOLD_MS = 2; // Threshold for flagging slow database queries (in milliseconds)
const MAX_BUFFER_SIZE = 49; // latest 50 queries in memory (0-indexed)

// Preserve the original query execution method
const originalQuery = pool.query.bind(pool);

// --- ENTERPRISE QUERY PROFILER INTERCEPTOR ---
pool.query = async function <R extends QueryResultRow = any, I extends any[] = any[]>(
  this: typeof pool,
  ...args: Parameters<typeof originalQuery>
): Promise<QueryResult<R>> {
  const start = process.hrtime();

  try {
    // Explicitly cast the execution to the Promise-based overload to fix TS compilation
    const executeQuery = originalQuery as unknown as (...a: any[]) => Promise<QueryResult<R>>;
    const res = await executeQuery(...args);

    const diff = process.hrtime(start);
    const durationMs = parseFloat((diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2));

    if (redisClient.isOpen) {
      Promise.all([
        redisClient.incr('telemetry:db:query_count'),
        redisClient.set('telemetry:db:last_query_latency_ms', durationMs.toString())
      ]).catch(err => console.error('Redis metrics sync failed:', err));

      if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
        // Safely extract text whether args[0] is a string or a QueryConfig object
        const queryText = typeof args[0] === 'string' ? args[0] : (args[0] as unknown as { text?: string })?.text;
        const queryNormalized = queryText ? queryText.replace(/\s+/g, ' ').trim() : 'UNKNOWN QUERY';

        const slowQueryPayload = JSON.stringify({
          query: queryNormalized,
          durationMs,
          timestamp: new Date().toISOString()
        });

        (async () => {
          try {
            await redisClient.lPush('telemetry:db:slow_queries', slowQueryPayload);
            await redisClient.lTrim('telemetry:db:slow_queries', 0, MAX_BUFFER_SIZE);
            await redisClient.incr('telemetry:db:slow_query_count');
          } catch (err) {
            console.error('Redis slow query push failed:', err);
          }
        })();

        console.warn(`⚠️ [SLOW DB QUERY] Execution took ${durationMs}ms: "${queryNormalized.substring(0, 80)}..."`);
      }
    }

    return res;
  } catch (error) {
    if (redisClient.isOpen) {
      redisClient.incr('telemetry:db:error_count').catch(() => {});
    }
    throw error;
  }
} as typeof pool.query; // Safely cast the completed function back to the exact pg signature

export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(sql);
    console.log('✅ Database schema initialized successfully.');
  } catch (err) {
    console.error('❌ Error initializing database schema:', err);
  } finally {
    client.release();
  }
};