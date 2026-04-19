import { Request, Response } from 'express';
import pool from '../config/db';
import { getISTDate, getISTDateString, getYesterdayISTDateString } from '../utils/date';

// GET dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const istNow = getISTDate();
        const today = getISTDateString(istNow);
        const yesterday = getYesterdayISTDateString();
        
        const month = istNow.getMonth() + 1;
        const year = istNow.getFullYear();

        const [yesterdaySales, monthStats, lowStock, workersPresent] = await Promise.all([
            pool.query('SELECT COALESCE(SUM(cash_amount + upi_amount),0) AS total FROM sales WHERE date=$1', [yesterday]),
            pool.query(`SELECT 
                            COALESCE(SUM(cash_amount + upi_amount),0) AS total,
                            COALESCE(SUM(cash_amount),0) AS cash,
                            COALESCE(SUM(upi_amount),0) AS upi
                        FROM sales
                        WHERE EXTRACT(MONTH FROM date)=$1 AND EXTRACT(YEAR FROM date)=$2`, [month, year]),
            pool.query(`
                WITH stock AS (
                    SELECT m.min_stock,
                        COALESCE(p.total_purchased, 0) - COALESCE(u.total_used, 0) AS current_stock
                    FROM materials m
                    LEFT JOIN (
                        SELECT material_id, SUM(quantity) AS total_purchased FROM purchases GROUP BY material_id
                    ) p ON p.material_id = m.id
                    LEFT JOIN (
                        SELECT material_id, SUM(quantity_used) AS total_used FROM material_usage GROUP BY material_id
                    ) u ON u.material_id = m.id
                )
                SELECT COUNT(*) FROM stock WHERE current_stock <= min_stock
            `),
            pool.query(`
                SELECT COUNT(*) 
                FROM attendance a
                JOIN workers w ON a.worker_id = w.id
                WHERE a.date=$1 AND a.status='Present' AND w.is_active=true
            `, [today]),
        ]);

        const recentSales = await pool.query(
            'SELECT * FROM sales ORDER BY date DESC LIMIT 5'
        );

        res.json({
            yesterday_sales: parseFloat(yesterdaySales.rows[0].total),
            month_sales: parseFloat(monthStats.rows[0].total),
            cash_sales: parseFloat(monthStats.rows[0].cash),
            upi_sales: parseFloat(monthStats.rows[0].upi),
            low_stock_count: parseInt(lowStock.rows[0].count),
            workers_present_today: parseInt(workersPresent.rows[0].count),
            recent_sales: recentSales.rows,
        });
    } catch (err: any) {
        console.error('[statsController] getDashboardStats error:', err.message || err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message });
    }
};

// GET P&L report
export const getProfitLoss = async (req: Request, res: Response) => {
    try {
        const { period = 'monthly', date, month, year } = req.query;
        let whereSales = '';
        let wherePurchases = '';
        let whereSalaries = '';
        let whereExpenses = '';
        const params: any[] = [];

        if (period === 'daily') {
            const d = date || getISTDateString();
            whereSales = `WHERE date = $1`;
            wherePurchases = `WHERE purchase_date::DATE = $1`;
            whereSalaries = `WHERE payment_date::DATE = $1`;
            whereExpenses = `WHERE expense_date::DATE = $1`;
            params.push(d);
        } else if (period === 'yearly') {
            const istToday = getISTDateString();
            const y = year || parseInt(istToday.split('-')[0]);
            whereSales = `WHERE EXTRACT(YEAR FROM date) = $1`;
            wherePurchases = `WHERE EXTRACT(YEAR FROM purchase_date) = $1`;
            whereSalaries = `WHERE EXTRACT(YEAR FROM payment_date) = $1`;
            whereExpenses = `WHERE EXTRACT(YEAR FROM expense_date) = $1`;
            params.push(y);
        } else {
            // monthly (default)
            const istToday = getISTDateString();
            const m = month || parseInt(istToday.split('-')[1]);
            const y = year || parseInt(istToday.split('-')[0]);
            whereSales = `WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2`;
            wherePurchases = `WHERE EXTRACT(MONTH FROM purchase_date) = $1 AND EXTRACT(YEAR FROM purchase_date) = $2`;
            whereSalaries = `WHERE EXTRACT(MONTH FROM payment_date) = $1 AND EXTRACT(YEAR FROM payment_date) = $2`;
            whereExpenses = `WHERE EXTRACT(MONTH FROM expense_date) = $1 AND EXTRACT(YEAR FROM expense_date) = $2`;
            params.push(m, y);
        }

        const [sales, purchases, salaries, expenses] = await Promise.all([
            pool.query(`SELECT 
                          COALESCE(SUM(cash_amount + upi_amount),0) AS total,
                          COALESCE(SUM(cash_amount),0) AS cash,
                          COALESCE(SUM(upi_amount),0) AS upi
                        FROM sales ${whereSales}`, params),
            pool.query(`SELECT COALESCE(SUM(total_amount),0) AS total FROM purchases ${wherePurchases}`, params),
            pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM salary_payments ${whereSalaries}`, params),
            pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM expenses ${whereExpenses}`, params),
        ]);

        const totalSales = parseFloat(sales.rows[0].total);
        const totalPurchases = parseFloat(purchases.rows[0].total);
        const totalSalaries = parseFloat(salaries.rows[0].total);
        const totalExpenses = parseFloat(expenses.rows[0].total);
        const totalCosts = totalPurchases + totalSalaries + totalExpenses;
        const netProfit = totalSales - totalCosts;

        res.json({
            total_sales: totalSales,
            cash_sales: parseFloat(sales.rows[0].cash),
            upi_sales: parseFloat(sales.rows[0].upi),
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
