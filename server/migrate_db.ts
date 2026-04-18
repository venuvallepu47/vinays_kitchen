import { Pool } from 'pg';

const LOCAL_CONFIG = {
    host: 'localhost',
    port: 5432,
    database: 'vinay_db',
    user: 'venuvallepu',
    password: 'venu'
};

const PROD_CONFIG = {
    host: 'dpg-d7hkb8cvikkc73aav7rg-a.singapore-postgres.render.com',
    port: 5432,
    database: 'vinay_db',
    user: 'vinay_db_user',
    password: 'DkuYhP1voiPZPKYvn0sZty2WM9vhWT92',
    ssl: { rejectUnauthorized: false }
};

const localPool = new Pool(LOCAL_CONFIG);
const prodPool = new Pool(PROD_CONFIG);

// Schema DDL — matches your production app's expectations (dual-amount sales)
const SCHEMA_SQL = `
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS material_usage CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    salary_per_day DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    joining_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Half-day')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, date)
);

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL,
    min_stock DECIMAL(10, 2) DEFAULT 0.00,
    current_stock DECIMAL(10, 2) DEFAULT 0.00,
    conversion_factor DECIMAL(10, 4) DEFAULT NULL,
    base_unit VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_usage (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    quantity_used DECIMAL(10, 2) NOT NULL,
    usage_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cash_amount NUMERIC(12,2) DEFAULT 0,
    upi_amount NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_payments (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_purchases_material_id ON purchases(material_id);
CREATE INDEX IF NOT EXISTS idx_purchases_vendor_id ON purchases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_date ON material_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_salary_payments_worker_id ON salary_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_date ON salary_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_workers_is_active ON workers(is_active);

INSERT INTO users (email, password_hash, name)
VALUES ('admin@vinayskitchen.com', 'admin123', 'Vinay Admin')
ON CONFLICT (email) DO NOTHING;
`;

async function migrateTable(tableName: string) {
    console.log(`\nMigrating ${tableName}...`);
    try {
        const localData = await localPool.query(`SELECT * FROM ${tableName}`);
        console.log(`  Local: ${localData.rows.length} rows`);

        if (localData.rows.length === 0) {
            console.log(`  ⏭ Skipped (no data)`);
            return;
        }

        const columns = Object.keys(localData.rows[0]);
        const columnNames = columns.join(', ');

        let inserted = 0;
        for (const row of localData.rows) {
            const values = columns.map(col => row[col]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            try {
                await prodPool.query(
                    `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                    values
                );
                inserted++;
            } catch (rowErr: any) {
                console.error(`  ⚠ Row insert failed:`, rowErr.message);
            }
        }
        console.log(`  ✅ Inserted ${inserted}/${localData.rows.length} rows`);

        // Reset sequence to max id
        try {
            await prodPool.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE((SELECT MAX(id) FROM ${tableName}), 1))`);
        } catch {}
    } catch (err: any) {
        console.error(`  ❌ Failed: ${err.message}`);
    }
}

async function run() {
    console.log('=== VINAY\'S KITCHEN — DATABASE MIGRATION ===\n');

    // 1. Test connections
    try {
        await localPool.query('SELECT 1');
        console.log('✅ Local DB Connected');
    } catch (e: any) {
        console.error('❌ Local DB Failed:', e.message);
        process.exit(1);
    }

    try {
        const res = await prodPool.query('SELECT current_database(), version()');
        console.log('✅ Production DB Connected:', res.rows[0].current_database);
    } catch (e: any) {
        console.error('❌ Production DB Failed:', e.message);
        process.exit(1);
    }

    // 2. Create schema on production
    console.log('\n--- Creating schema on production ---');
    try {
        await prodPool.query(SCHEMA_SQL);
        console.log('✅ Schema created successfully');
    } catch (e: any) {
        console.error('❌ Schema creation failed:', e.message);
        process.exit(1);
    }

    // 3. Migrate data (dependency order)
    console.log('\n--- Migrating data ---');
    const tables = [
        'vendors',
        'workers',
        'materials',
        'attendance',
        'purchases',
        'material_usage',
        'sales',
        'salary_payments',
        'expenses',
        'settings',
    ];

    for (const table of tables) {
        await migrateTable(table);
    }

    // 4. Verify
    console.log('\n--- Verification ---');
    for (const table of tables) {
        try {
            const local = await localPool.query(`SELECT COUNT(*) FROM ${table}`);
            const prod = await prodPool.query(`SELECT COUNT(*) FROM ${table}`);
            const match = local.rows[0].count === prod.rows[0].count ? '✅' : '⚠️';
            console.log(`  ${match} ${table}: local=${local.rows[0].count} prod=${prod.rows[0].count}`);
        } catch {}
    }

    console.log('\n=== MIGRATION COMPLETE ===');
    await localPool.end();
    await prodPool.end();
}

run();
