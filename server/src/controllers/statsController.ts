import { Request, Response } from 'express';
import { query } from '../config/db';

export const getProfitLoss = async (req: Request, res: Response) => {
    const { month, year } = req.query;
    try {
        // Total Sales
        const salesResult = await query(
            'SELECT COALESCE(SUM(amount), 0) as total_sales FROM sales WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2',
            [month, year]
        );
        
        // Total Purchases (Stock)
        const purchasesResult = await query(
            'SELECT COALESCE(SUM(total_amount), 0) as total_purchases FROM purchases WHERE EXTRACT(MONTH FROM purchase_date) = $1 AND EXTRACT(YEAR FROM purchase_date) = $2',
            [month, year]
        );
        
        // Total Salaries
        // This query sums up the calculated salaries for the given month/year based on attendance
        const attendanceResult = await query(
            `SELECT w.id, w.salary_per_day,
                (COUNT(CASE WHEN a.status = 'Present' THEN 1 END) + (COUNT(CASE WHEN a.status = 'Half-day' THEN 1 END) * 0.5)) as total_worked_days
             FROM workers w
             LEFT JOIN attendance a ON w.id = a.worker_id AND EXTRACT(MONTH FROM a.date) = $1 AND EXTRACT(YEAR FROM a.date) = $2
             GROUP BY w.id`,
            [month, year]
        );
        
        const totalSalaries = attendanceResult.rows.reduce((sum, row) => {
            return sum + (parseFloat(row.total_worked_days) * parseFloat(row.salary_per_day));
        }, 0);

        const totalSales = parseFloat(salesResult.rows[0].total_sales);
        const totalPurchases = parseFloat(purchasesResult.rows[0].total_purchases);
        const netProfit = totalSales - (totalPurchases + totalSalaries);

        res.json({
            total_sales: totalSales,
            total_purchases: totalPurchases,
            total_salaries: totalSalaries,
            net_profit: netProfit,
            month,
            year
        });
    } catch (error) {
        console.error('Error calculating P&L:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const todaySales = await query('SELECT COALESCE(SUM(amount), 0) as amount FROM sales WHERE date = $1', [today]);
        const lowStockItems = await query('SELECT COUNT(*) FROM (SELECT m.id FROM materials m LEFT JOIN purchases p ON m.id = p.material_id GROUP BY m.id, m.min_stock HAVING COALESCE(SUM(p.quantity), 0) < m.min_stock) as low_stock');
        const activeWorkers = await query('SELECT COUNT(*) FROM workers');
        
        res.json({
            today_sales: parseFloat(todaySales.rows[0].amount),
            low_stock_count: parseInt(lowStockItems.rows[0].count),
            worker_count: parseInt(activeWorkers.rows[0].count)
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
