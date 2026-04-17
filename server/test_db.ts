import pool from './src/config/db';

async function run() {
    try {
        const result = await pool.query(`
            SELECT v.*,
                COALESCE(SUM(p.total_amount), 0) AS total_purchased
            FROM vendors v
            LEFT JOIN purchases p ON p.vendor_id = v.id
            GROUP BY v.id
            ORDER BY v.created_at DESC
        `);
        console.log('Vendors:', result.rows);
        
        const wResult = await pool.query(`
            SELECT w.*,
                COALESCE((SELECT SUM(amount) FROM salary_payments WHERE worker_id = w.id AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0) as paid_this_month,
                COALESCE((SELECT COUNT(*) FROM attendance WHERE worker_id = w.id AND status = 'Present' AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0) as days_present_month
            FROM workers w
            ORDER BY w.created_at DESC
        `);
        console.log('Workers:', wResult.rows);
    } catch(e) {
        console.error("Query failed with error:", e);
    } finally {
        process.exit(0);
    }
}
run();
