import { Request, Response } from 'express';
import pool from '../config/db';

// GET dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();

        const [todaySales, monthSales, lowStock, workersPresent] = await Promise.all([
            pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM sales WHERE date=$1', [today]),
            pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM sales
                        WHERE EXTRACT(MONTH FROM date)=$1 AND EXTRACT(YEAR FROM date)=$2`, [month, year]),
            pool.query(`
                SELECT COUNT(*) FROM (
                    SELECT m.id,
                        COALESCE(SUM(p.quantity),0) - COALESCE(SUM(u.quantity_used),0) AS stock
                    FROM materials m
                    LEFT JOIN purchases p ON p.material_id = m.id
                    LEFT JOIN material_usage u ON u.material_id = m.id
                    GROUP BY m.id, m.min_stock
                    HAVING COALESCE(SUM(p.quantity),0) - COALESCE(SUM(u.quantity_used),0) <= m.min_stock
                ) sub
            `),
            pool.query(`SELECT COUNT(*) FROM attendance WHERE date=$1 AND status='Present'`, [today]),
        ]);

        const recentSales = await pool.query(
            'SELECT * FROM sales ORDER BY date DESC LIMIT 5'
        );

        res.json({
            today_sales: parseFloat(todaySales.rows[0].total),
            month_sales: parseFloat(monthSales.rows[0].total),
            low_stock_count: parseInt(lowStock.rows[0].count),
            workers_present_today: parseInt(workersPresent.rows[0].count),
            recent_sales: recentSales.rows,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

// GET P&L report for a month
export const getProfitLoss = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        const m = month || new Date().getMonth() + 1;
        const y = year || new Date().getFullYear();

        const [sales, purchases, salaries, expenses] = await Promise.all([
            pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM sales
                        WHERE EXTRACT(MONTH FROM date)=$1 AND EXTRACT(YEAR FROM date)=$2`, [m, y]),
            pool.query(`SELECT COALESCE(SUM(total_amount),0) AS total FROM purchases
                        WHERE EXTRACT(MONTH FROM purchase_date)=$1 AND EXTRACT(YEAR FROM purchase_date)=$2`, [m, y]),
            pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM salary_payments
                        WHERE EXTRACT(MONTH FROM payment_date)=$1 AND EXTRACT(YEAR FROM payment_date)=$2`, [m, y]),
            pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM expenses
                        WHERE EXTRACT(MONTH FROM expense_date)=$1 AND EXTRACT(YEAR FROM expense_date)=$2`, [m, y]),
        ]);

        const totalSales = parseFloat(sales.rows[0].total);
        const totalPurchases = parseFloat(purchases.rows[0].total);
        const totalSalaries = parseFloat(salaries.rows[0].total);
        const totalExpenses = parseFloat(expenses.rows[0].total);
        const totalCosts = totalPurchases + totalSalaries + totalExpenses;
        const netProfit = totalSales - totalCosts;

        res.json({
            total_sales: totalSales,
            total_purchases: totalPurchases,
            total_salaries: totalSalaries,
            total_expenses: totalExpenses,
            total_costs: totalCosts,
            net_profit: netProfit,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch P&L' });
    }
};
