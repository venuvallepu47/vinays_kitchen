import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try multiple paths to find .env.production
const possiblePaths = [
  path.resolve(__dirname, '../../.env.production'),     // from dist/config/ → server/.env.production
  path.resolve(__dirname, '../../../server/.env.production'), // from project root
  path.resolve(process.cwd(), 'server/.env.production'),
  path.resolve(process.cwd(), '.env.production'),
  path.resolve(__dirname, '../../.env'),                 // fallback to .env
];

let loaded = false;
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`[DB] Loaded env from: ${envPath}`);
    loaded = true;
    break;
  }
}
if (!loaded) {
  console.log('[DB] No .env file found, using system environment variables');
  console.log('[DB] Searched paths:', possiblePaths);
}

// Log connection info (sanitized)
console.log(`[DB] Connecting to: host=${process.env.DB_HOST}, db=${process.env.DB_NAME}, user=${process.env.DB_USER}, ssl=${process.env.NODE_ENV === 'production'}`);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vinay_db',
  user: process.env.DB_USER || 'venuvallepu',
  password: process.env.DB_PASSWORD || 'venu',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection and set timezone
pool.on('connect', async (client) => {
  try {
    await client.query("SET timezone = 'Asia/Kolkata'");
    
    // Add dual-amount columns if they don't exist
    await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(12,2) DEFAULT 0");
    await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS upi_amount NUMERIC(12,2) DEFAULT 0");

    // Migrate existing data from 'amount' column if it still exists
    const checkAmount = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='sales' AND column_name='amount'");
    if (checkAmount.rows.length > 0) {
      console.log('Migrating sales data to dual-amount structure...');
      await client.query("UPDATE sales SET upi_amount = amount WHERE payment_method = 'UPI'");
      await client.query("UPDATE sales SET cash_amount = amount WHERE payment_method != 'UPI' OR payment_method IS NULL");
      await client.query("ALTER TABLE sales DROP COLUMN amount");
      await client.query("ALTER TABLE sales DROP COLUMN payment_method");
      console.log('Migration complete: dropped old sales columns.');
    }
  } catch (err) {
    console.error('[DB] on-connect error (non-fatal):', err);
  }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
