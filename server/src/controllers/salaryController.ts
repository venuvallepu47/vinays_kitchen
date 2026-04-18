import { Request, Response } from 'express';
import pool from '../config/db';
import { getISTDate } from '../utils/date';

// GET salary payments (optionally by worker)
export const getSalaryPayments = async (req: Request, res: Response) => {
    try {
        const { worker_id } = req.query;
        let query = `
            SELECT sp.*, w.name AS worker_name, w.salary_per_day
            FROM salary_payments sp
            JOIN workers w ON w.id = sp.worker_id
        `;
        const params: any[] = [];
        if (worker_id) {
            query += ' WHERE sp.worker_id = $1';
            params.push(worker_id);
        }
        query += ' ORDER BY sp.payment_date DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch salary payments' });
    }
};

// POST log salary payment
export const logSalaryPayment = async (req: Request, res: Response) => {
    try {
        const { worker_id, amount, payment_date, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO salary_payments (worker_id, amount, payment_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [worker_id, amount, payment_date || getISTDate(), notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to log salary payment' });
    }
};

// DELETE salary payment
export const deleteSalaryPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM salary_payments WHERE id=$1', [id]);
        res.json({ message: 'Payment deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete payment' });
    }
};

// PUT update salary payment
export const updateSalaryPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, payment_date, notes } = req.body;
        const result = await pool.query(
            'UPDATE salary_payments SET amount=$1, payment_date=$2, notes=$3 WHERE id=$4 RETURNING *',
            [amount, payment_date, notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update salary payment' });
    }
};
