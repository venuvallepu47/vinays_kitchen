import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const envPath = process.env.NODE_ENV === 'production' 
  ? '../../.env.production' 
  : '../../.env';
dotenv.config({ path: path.resolve(__dirname, envPath) });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vinay_db',
  user: process.env.DB_USER || 'venuvallepu',
  password: process.env.DB_PASSWORD || 'venu',
});

// Test connection and set timezone
pool.on('connect', async (client) => {
  await client.query("SET timezone = 'Asia/Kolkata'");
  
  // 1. Add new dual-amount columns if they don't exist
  await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(12,2) DEFAULT 0");
  await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS upi_amount NUMERIC(12,2) DEFAULT 0");

  // 2. Migrate existing data from 'amount' column to new columns if 'amount' still exists
  const checkAmount = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='sales' AND column_name='amount'");
  if (checkAmount.rows.length > 0) {
    console.log('Migrating sales data to dual-amount structure...');
    // If payment_method was UPI, move to upi_amount, otherwise move to cash_amount
    await client.query("UPDATE sales SET upi_amount = amount WHERE payment_method = 'UPI'");
    await client.query("UPDATE sales SET cash_amount = amount WHERE payment_method != 'UPI' OR payment_method IS NULL");
    
    // 3. Drop old columns
    await client.query("ALTER TABLE sales DROP COLUMN amount");
    await client.query("ALTER TABLE sales DROP COLUMN payment_method");
    console.log('Migration complete: dropped old sales columns.');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
