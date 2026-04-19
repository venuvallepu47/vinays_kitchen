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

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'vinay_db',
      user: process.env.DB_USER || 'venuvallepu',
      password: process.env.DB_PASSWORD || 'venu',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

console.log(`[DB] Using ${process.env.DATABASE_URL ? 'DATABASE_URL' : `host=${process.env.DB_HOST}`}`);

// Only set timezone per-connection — no schema ops here
pool.on('connect', (client) => {
  client.query("SET timezone = 'Asia/Kolkata'").catch((err) => {
    console.error('[DB] timezone set error:', err);
  });
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

// Run once at startup: schema migrations + performance indexes
export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    // Schema migrations
    await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(12,2) DEFAULT 0");
    await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS upi_amount NUMERIC(12,2) DEFAULT 0");

    const checkAmount = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='sales' AND column_name='amount'"
    );
    if (checkAmount.rows.length > 0) {
      await client.query("UPDATE sales SET upi_amount = amount WHERE payment_method = 'UPI'");
      await client.query("UPDATE sales SET cash_amount = amount WHERE payment_method != 'UPI' OR payment_method IS NULL");
      await client.query("ALTER TABLE sales DROP COLUMN amount");
      await client.query("ALTER TABLE sales DROP COLUMN payment_method");
    }

    // Performance indexes — idempotent, safe to re-run
    await client.query("CREATE INDEX IF NOT EXISTS idx_purchases_material_id   ON purchases (material_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_purchases_bill_id        ON purchases (bill_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_purchases_vendor_id      ON purchases (vendor_id, purchase_date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_mat_usage_material_id    ON material_usage (material_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_sales_date               ON sales (date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_purchases_date           ON purchases (purchase_date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_salary_payments_date     ON salary_payments (payment_date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_salary_payments_worker   ON salary_payments (worker_id, payment_date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_expenses_date            ON expenses (expense_date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_attendance_worker_date   ON attendance (worker_id, date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_attendance_date          ON attendance (date)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_vendor_bills_vendor_id   ON vendor_bills (vendor_id, bill_date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_vendor_bill_items_bill   ON vendor_bill_items (bill_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor   ON vendor_payments (vendor_id, payment_date DESC)");

    console.log('[DB] initDb: schema + indexes ready');
  } catch (err) {
    console.error('[DB] initDb error:', err);
  } finally {
    client.release();
  }
}

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
