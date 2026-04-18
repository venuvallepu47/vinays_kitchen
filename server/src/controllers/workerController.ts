import { Request, Response } from 'express';
import pool from '../config/db';
import { getISTDate, getISTDateString } from '../utils/date';

// GET all workers
export const getWorkers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT w.*,
                COALESCE(att.days_present, 0) AS days_present_month,
                COALESCE(sal.total_paid, 0) AS total_paid_month,
                COALESCE(att.days_present, 0) * w.salary_per_day - COALESCE(sal.total_paid, 0) AS balance_due
            FROM workers w
            LEFT JOIN (
                SELECT worker_id,
                    SUM(CASE WHEN status='Present' THEN 1 WHEN status='Half-day' THEN 0.5 ELSE 0 END) AS days_present
                FROM attendance
                WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY worker_id
            ) att ON att.worker_id = w.id
            LEFT JOIN (
                SELECT worker_id, SUM(amount) AS total_paid
                FROM salary_payments
                WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY worker_id
            ) sal ON sal.worker_id = w.id
            WHERE w.is_active = true
            ORDER BY w.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
};

// GET worker by ID with history
export const getWorkerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const worker = await pool.query('SELECT * FROM workers WHERE id=$1', [id]);
        if (worker.rows.length === 0) return res.status(404).json({ error: 'Worker not found' });

        const attendance = await pool.query(
            'SELECT * FROM attendance WHERE worker_id=$1 ORDER BY date DESC LIMIT 30',
            [id]
        );
        const payments = await pool.query(
            'SELECT * FROM salary_payments WHERE worker_id=$1 ORDER BY payment_date DESC',
            [id]
        );

        // Calculate balance for current month
        const stats = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN status='Present' THEN 1 WHEN status='Half-day' THEN 0.5 ELSE 0 END), 0) AS days_worked,
                (SELECT COALESCE(SUM(amount), 0) FROM salary_payments
                 WHERE worker_id=$1
                   AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                   AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                ) AS paid_this_month
            FROM attendance
            WHERE worker_id=$1
              AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
        `, [id]);

        res.json({
            worker: worker.rows[0],
            attendance: attendance.rows,
            payments: payments.rows,
            stats: stats.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch worker' });
    }
};

// POST create worker
export const createWorker = async (req: Request, res: Response) => {
    try {
        const { name, phone, salary_per_day, joining_date } = req.body;
        const result = await pool.query(
            'INSERT INTO workers (name, phone, salary_per_day, joining_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, phone, salary_per_day, joining_date || getISTDate()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create worker' });
    }
};

// PUT update worker
export const updateWorker = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, phone, salary_per_day } = req.body;
        const result = await pool.query(
            'UPDATE workers SET name=$1, phone=$2, salary_per_day=$3 WHERE id=$4 RETURNING *',
            [name, phone, salary_per_day, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update worker' });
    }
};

// DELETE worker (soft delete with integrity check)
export const deleteWorker = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check for existing records to ensure data integrity
        const attendance = await pool.query('SELECT COUNT(*) FROM attendance WHERE worker_id=$1', [id]);
        const payments = await pool.query('SELECT COUNT(*) FROM salary_payments WHERE worker_id=$1', [id]);

        if (parseInt(attendance.rows[0].count) > 0 || parseInt(payments.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete: This worker has associated attendance or salary records. Please delete those records first if you wish to completely remove them, or keep them active to preserve history.' 
            });
        }

        await pool.query('UPDATE workers SET is_active=false WHERE id=$1', [id]);
        res.json({ message: 'Worker removed' });
    } catch (err) {
        console.error('Delete Worker Error:', err);
        res.status(500).json({ error: 'Failed to remove worker' });
    }
};

// GET attendance for a date
export const getAttendanceByDate = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        const targetDate = typeof date === 'string' ? date : getISTDateString();

        const workers = await pool.query('SELECT * FROM workers WHERE is_active=true ORDER BY name');
        const attendance = await pool.query(
            'SELECT * FROM attendance WHERE date=$1',
            [targetDate]
        );

        const attendanceMap: any = {};
        attendance.rows.forEach((a: any) => { attendanceMap[a.worker_id] = a; });

        const result = workers.rows.map((w: any) => ({
            ...w,
            attendance: attendanceMap[w.id] || null
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

// POST/PUT mark attendance (upsert)
export const markAttendance = async (req: Request, res: Response) => {
    try {
        const { worker_id, date, status } = req.body;
        const result = await pool.query(
            `INSERT INTO attendance (worker_id, date, status)
             VALUES ($1, $2, $3)
             ON CONFLICT (worker_id, date) DO UPDATE SET status = $3
             RETURNING *`,
            [worker_id, date, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};
