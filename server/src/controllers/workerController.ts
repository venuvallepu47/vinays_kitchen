import { Request, Response } from 'express';
import { query } from '../config/db';

// Worker Management
export const getWorkers = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM workers ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createWorker = async (req: Request, res: Response) => {
    const { name, phone, salary_per_day, joining_date } = req.body;
    try {
        const result = await query(
            'INSERT INTO workers (name, phone, salary_per_day, joining_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, phone, salary_per_day, joining_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating worker:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Attendance Management
export const getAttendance = async (req: Request, res: Response) => {
    const { date } = req.query;
    try {
        const result = await query(
            'SELECT a.*, w.name FROM attendance a JOIN workers w ON a.worker_id = w.id WHERE a.date = $1',
            [date]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logAttendance = async (req: Request, res: Response) => {
    const { logs } = req.body; // Array of { worker_id, date, status }
    try {
        for (const log of logs) {
            await query(
                `INSERT INTO attendance (worker_id, date, status) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (worker_id, date) 
                 DO UPDATE SET status = EXCLUDED.status`,
                [log.worker_id, log.date, log.status]
            );
        }
        res.json({ message: 'Attendance logged successfully' });
    } catch (error) {
        console.error('Error logging attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Salary Calculation
export const calculateSalary = async (req: Request, res: Response) => {
    const { month, year } = req.query;
    try {
        const result = await query(
            `SELECT w.id, w.name, w.salary_per_day,
                COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_days,
                COUNT(CASE WHEN a.status = 'Half-day' THEN 1 END) as half_days,
                (COUNT(CASE WHEN a.status = 'Present' THEN 1 END) + (COUNT(CASE WHEN a.status = 'Half-day' THEN 1 END) * 0.5)) as total_worked_days
             FROM workers w
             LEFT JOIN attendance a ON w.id = a.worker_id AND EXTRACT(MONTH FROM a.date) = $1 AND EXTRACT(YEAR FROM a.date) = $2
             GROUP BY w.id`,
            [month, year]
        );
        
        const salaries = result.rows.map(row => ({
            ...row,
            calculated_salary: parseFloat(row.total_worked_days) * parseFloat(row.salary_per_day)
        }));
        
        res.json(salaries);
    } catch (error) {
        console.error('Error calculating salary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
