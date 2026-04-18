import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env file only if system env vars are not already set (i.e. not on Render)
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  const possiblePaths = [
    path.resolve(__dirname, '../../.env.production'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env.production'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`[DB] Loaded env from: ${envPath}`);
      break;
    }
  }
}

const isProduction = process.env.NODE_ENV === 'production';

// Prefer DATABASE_URL (set in Render dashboard) over individual vars
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'vinay_db',
      user: process.env.DB_USER || 'venuvallepu',
      password: process.env.DB_PASSWORD || 'venu',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });

console.log(`[DB] Using ${process.env.DATABASE_URL ? 'DATABASE_URL' : `host=${process.env.DB_HOST}`}`);

pool.on('connect', async (client) => {
  try {
    await client.query("SET timezone = 'Asia/Kolkata'");

    await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(12,2) DEFAULT 0");
    await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS upi_amount NUMERIC(12,2) DEFAULT 0");

    const checkAmount = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='sales' AND column_name='amount'");
    if (checkAmount.rows.length > 0) {
      await client.query("UPDATE sales SET upi_amount = amount WHERE payment_method = 'UPI'");
      await client.query("UPDATE sales SET cash_amount = amount WHERE payment_method != 'UPI' OR payment_method IS NULL");
      await client.query("ALTER TABLE sales DROP COLUMN amount");
      await client.query("ALTER TABLE sales DROP COLUMN payment_method");
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
