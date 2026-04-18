import pool from './src/config/db';

// material IDs already in DB: 1=Gundu, 2=Palli, 3=Oil, 4=Basmati Rice
const MAT = { gundu: 1, palli: 2, oil: 3, rice: 4 };

function daysAgo(n: number): string {
    const d = new Date('2026-04-18');
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ── Truncate all transactional tables (keep materials, users, settings) ──
        await client.query(`
            TRUNCATE TABLE
                vendor_bill_items, vendor_bills, vendor_payments,
                purchases, material_usage,
                salary_payments, attendance, workers,
                expenses, sales, vendors
            RESTART IDENTITY CASCADE
        `);
        console.log('Truncated transactional tables');

        // ── Vendors ──
        const vendorRes = await client.query(`
            INSERT INTO vendors (name, phone, address) VALUES
                ('Raju Wholesale Mart',  '9876543210', 'Main Market, Shop 12, Hyderabad'),
                ('Bhavani Oil Depot',    '9845012345', 'Gandhi Nagar, Opp. Bus Stand'),
                ('Sri Ganesh Traders',   '9900112233', 'Kachiguda Market, Row 4')
            RETURNING id, name
        `);
        const [raju, bhavani, ganesh] = vendorRes.rows;
        console.log('Vendors inserted:', vendorRes.rows.map((v: any) => v.name).join(', '));

        // ── Workers ──
        const workerRes = await client.query(`
            INSERT INTO workers (name, phone, salary_per_day, joining_date, is_active) VALUES
                ('Ramaiah K',   '9123456780', 1500, '2025-01-10', true),
                ('Suresh B',    '9234567891', 1200, '2025-03-01', true),
                ('Lakshmi Bai', '9345678902', 1000, '2025-06-15', true)
            RETURNING id, name
        `);
        const [ramaiah, suresh, lakshmi] = workerRes.rows;
        console.log('Workers inserted:', workerRes.rows.map((w: any) => w.name).join(', '));

        // ── Attendance (last 25 working days) ──
        const workers = [ramaiah, suresh, lakshmi];
        // Pattern: Ramaiah full attendance, Suresh 2 half-days, Lakshmi 3 absents
        for (let d = 1; d <= 25; d++) {
            const date = daysAgo(d);
            for (const w of workers) {
                let status = 'Present';
                if (w.id === suresh.id && (d === 5 || d === 14)) status = 'Half-day';
                if (w.id === lakshmi.id && (d === 3 || d === 11 || d === 19)) status = 'Absent';
                await client.query(
                    `INSERT INTO attendance (worker_id, date, status) VALUES ($1, $2, $3)
                     ON CONFLICT (worker_id, date) DO NOTHING`,
                    [w.id, date, status]
                );
            }
        }
        console.log('Attendance inserted for 25 days');

        // ── Salary Payments ──
        await client.query(`
            INSERT INTO salary_payments (worker_id, amount, payment_date, notes) VALUES
                ($1, 30000, $4, 'March salary advance'),
                ($2, 24000, $4, 'March salary'),
                ($3, 20000, $5, 'March full settlement'),
                ($1, 15000, $6, 'April week 1 advance')
        `, [ramaiah.id, suresh.id, lakshmi.id, daysAgo(18), daysAgo(17), daysAgo(5)]);
        console.log('Salary payments inserted');

        // ── Expenses ──
        await client.query(`
            INSERT INTO expenses (category, amount, expense_date, notes) VALUES
                ('Rent',        12000, $1, 'April shop rent'),
                ('Electricity',  2400, $2, 'March electricity bill'),
                ('Gas',          3200, $3, '4 cylinders @ ₹800 each'),
                ('Maintenance',   800, $4, 'Tap repair and plumbing'),
                ('Packaging',    1500, $5, 'Containers and covers for delivery'),
                ('Miscellaneous', 600, $6, 'Cleaning supplies')
        `, [daysAgo(17), daysAgo(15), daysAgo(12), daysAgo(9), daysAgo(6), daysAgo(3)]);
        console.log('Expenses inserted');

        // ── Sales (last 22 days) — [days_ago, cash_amount, upi_amount] ──
        const salesData: [number, number, number][] = [
            [1,  4200, 8100], [2,  5500, 6000], [3,  3800, 9200], [4,  6000, 5500],
            [5,  4500, 8500], [6,  5200, 7800], [7,  7000, 4200], [8,  4800, 8200],
            [9,  6100, 6900], [10, 3900, 9600], [11, 5800, 6700], [12, 4200, 9800],
            [13, 5500, 8500], [14, 6800, 5700], [15, 4100, 9400], [16, 5300, 7200],
            [17, 4700, 8800], [18, 6200, 6300], [19, 3800, 9700], [20, 5000, 8000],
            [21, 6500, 5500], [22, 4300, 9100],
        ];
        for (const [d, cash, upi] of salesData) {
            await client.query(
                `INSERT INTO sales (date, cash_amount, upi_amount, notes) VALUES ($1,$2,$3,$4)`,
                [daysAgo(d), cash, upi, 'Daily tiffin counter sales']
            );
        }
        console.log('Sales inserted for 22 days');

        // ── Old-style purchases (direct, no bill) ──
        const oldDate1 = daysAgo(17);
        const oldDate2 = daysAgo(3);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, notes) VALUES ($1,$2,100,180,18000,$3,'Monthly Gundu stock')`, [MAT.gundu, raju.id, oldDate1]);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, notes) VALUES ($1,$2,100,100,10000,$3,'Monthly Palli stock')`, [MAT.palli, raju.id, oldDate1]);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, notes) VALUES ($1,$2,100,150,15000,$3,'Oil stock for April')`, [MAT.oil, bhavani.id, oldDate1]);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, notes) VALUES ($1,$2,50,100,5000,$3,'Basmati rice for special orders')`, [MAT.rice, raju.id, oldDate2]);
        console.log('Old direct purchases inserted');

        // ── Vendor Bills (new billing system) ──

        // Bill 1: Raju — Gundu + Palli restock, 2 weeks ago — partial payment
        const bill1Res = await client.query(`
            INSERT INTO vendor_bills (vendor_id, bill_date, total_amount, paid_amount, payment_mode, notes)
            VALUES ($1, $2, 32000, 15000, 'cash', 'Fortnightly restock')
            RETURNING id
        `, [raju.id, daysAgo(14)]);
        const bill1 = bill1Res.rows[0].id;
        await client.query(`INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount) VALUES ($1,$2,100,180,18000)`, [bill1, MAT.gundu]);
        await client.query(`INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount) VALUES ($1,$2,100,100,10000)`, [bill1, MAT.palli]);
        await client.query(`INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount) VALUES ($1,$2, 20,200, 4000)`, [bill1, MAT.rice]);
        // sync to purchases
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, bill_id) VALUES ($1,$2,100,180,18000,$3,$4)`, [MAT.gundu, raju.id, daysAgo(14), bill1]);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, bill_id) VALUES ($1,$2,100,100,10000,$3,$4)`, [MAT.palli, raju.id, daysAgo(14), bill1]);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, bill_id) VALUES ($1,$2, 20,200, 4000,$3,$4)`, [MAT.rice,  raju.id, daysAgo(14), bill1]);

        // Bill 2: Bhavani Oil — fully paid
        const bill2Res = await client.query(`
            INSERT INTO vendor_bills (vendor_id, bill_date, total_amount, paid_amount, payment_mode, notes)
            VALUES ($1, $2, 22500, 0, 'upi', 'Oil restock — 150 ltrs')
            RETURNING id
        `, [bhavani.id, daysAgo(10)]);
        const bill2 = bill2Res.rows[0].id;
        await client.query(`INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount) VALUES ($1,$2,150,150,22500)`, [bill2, MAT.oil]);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, bill_id) VALUES ($1,$2,150,150,22500,$3,$4)`, [MAT.oil, bhavani.id, daysAgo(10), bill2]);

        // Bill 3: Sri Ganesh — Gundu + Rice, recent, unpaid
        const bill3Res = await client.query(`
            INSERT INTO vendor_bills (vendor_id, bill_date, total_amount, paid_amount, payment_mode, notes)
            VALUES ($1, $2, 27000, 0, 'cash', 'Emergency restock')
            RETURNING id
        `, [ganesh.id, daysAgo(4)]);
        const bill3 = bill3Res.rows[0].id;
        await client.query(`INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount) VALUES ($1,$2,100,180,18000)`, [bill3, MAT.gundu]);
        await client.query(`INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount) VALUES ($1,$2, 50,180, 9000)`, [bill3, MAT.rice]);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, bill_id) VALUES ($1,$2,100,180,18000,$3,$4)`, [MAT.gundu, ganesh.id, daysAgo(4), bill3]);
        await client.query(`INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, bill_id) VALUES ($1,$2, 50,180, 9000,$3,$4)`, [MAT.rice,  ganesh.id, daysAgo(4), bill3]);

        // ── Vendor Payments ──
        // Raju — paid ₹10,000 via UPI after bill1
        await client.query(`INSERT INTO vendor_payments (vendor_id, amount, payment_date, payment_mode, notes) VALUES ($1,10000,$2,'upi','Partial payment for Bill #${bill1}')`, [raju.id, daysAgo(10)]);
        // Bhavani — full payment for bill2
        await client.query(`INSERT INTO vendor_payments (vendor_id, amount, payment_date, payment_mode, notes) VALUES ($1,22500,$2,'upi','Full payment for oil delivery')`, [bhavani.id, daysAgo(8)]);
        console.log('Vendor bills & payments inserted');

        // ── Material Usage ──
        const usageData = [
            // [material_id, qty_per_day_approx, days_back]
            [MAT.gundu, 8,  1], [MAT.palli, 5, 1], [MAT.oil, 3, 1], [MAT.rice, 2, 1],
            [MAT.gundu, 9,  2], [MAT.palli, 6, 2], [MAT.oil, 3, 2],
            [MAT.gundu, 7,  3], [MAT.palli, 5, 3], [MAT.oil, 2, 3], [MAT.rice, 3, 3],
            [MAT.gundu, 8,  4], [MAT.palli, 4, 4], [MAT.oil, 3, 4],
            [MAT.gundu, 10, 5], [MAT.palli, 6, 5], [MAT.oil, 4, 5], [MAT.rice, 2, 5],
            [MAT.gundu, 8,  6], [MAT.palli, 5, 6], [MAT.oil, 3, 6],
            [MAT.gundu, 9,  7], [MAT.palli, 5, 7], [MAT.oil, 3, 7], [MAT.rice, 1, 7],
        ];
        for (const [mid, qty, day] of usageData) {
            await client.query(
                `INSERT INTO material_usage (material_id, quantity_used, usage_date, notes) VALUES ($1,$2,$3,'Daily kitchen usage')`,
                [mid, qty, daysAgo(day as number)]
            );
        }
        console.log('Material usage inserted');

        await client.query('COMMIT');
        console.log('\n✅ Seed complete!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seed failed:', err);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

seed();
