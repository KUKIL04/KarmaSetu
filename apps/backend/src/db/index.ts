import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// A utility to automatically run the schema.sql file on startup
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