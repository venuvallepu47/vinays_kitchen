import pool from './src/config/db';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running migrations...');
        await client.query('BEGIN');

        // Existing migration
        await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) DEFAULT 'Cash';");

        // Vendor billing system
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_bills (
                id SERIAL PRIMARY KEY,
                vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                bill_date DATE NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                payment_mode VARCHAR(20) DEFAULT 'cash',
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_bill_items (
                id SERIAL PRIMARY KEY,
                bill_id INT NOT NULL REFERENCES vendor_bills(id) ON DELETE CASCADE,
                material_id INT NOT NULL REFERENCES materials(id),
                quantity DECIMAL(10,3) NOT NULL,
                price_per_unit DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_payments (
                id SERIAL PRIMARY KEY,
                vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_mode VARCHAR(20) DEFAULT 'cash',
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Link existing purchases to bills
        await client.query(`
            ALTER TABLE purchases ADD COLUMN IF NOT EXISTS bill_id INT REFERENCES vendor_bills(id) ON DELETE CASCADE;
        `);

        // Indexes
        await client.query(`CREATE INDEX IF NOT EXISTS idx_vendor_bills_vendor ON vendor_bills(vendor_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_vendor_bill_items_bill ON vendor_bill_items(bill_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON vendor_payments(vendor_id);`);

        await client.query('COMMIT');
        console.log('All migrations successful.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

migrate();
