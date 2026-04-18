import { Request, Response } from 'express';
import pool from '../config/db';
import { getISTDate } from '../utils/date';

// GET all sales
export const getSales = async (req: Request, res: Response) => {
    try {
        const { month, year, date } = req.query;
        let query = 'SELECT * FROM sales';
        const params: any[] = [];
        const conditions: string[] = [];

        if (date) {
            conditions.push('date::DATE = $1');
            params.push(date);
        } else if (month && year) {
            conditions.push('EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2');
            params.push(month, year);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY date DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

// POST create sale
export const createSale = async (req: Request, res: Response) => {
    try {
        const { date, cash_amount, upi_amount, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO sales (date, cash_amount, upi_amount, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [date || getISTDate(), cash_amount || 0, upi_amount || 0, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create Sale Error:', err);
        res.status(500).json({ error: 'Failed to create sale' });
    }
};

// PUT update sale
export const updateSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date, cash_amount, upi_amount, notes } = req.body;
        const result = await pool.query(
            'UPDATE sales SET date=$1, cash_amount=$2, upi_amount=$3, notes=$4 WHERE id=$5 RETURNING *',
            [date, cash_amount, upi_amount, notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update Sale Error:', err);
        res.status(500).json({ error: 'Failed to update sale' });
    }
};

// DELETE sale
export const deleteSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM sales WHERE id=$1', [id]);
        res.json({ message: 'Sale deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete sale' });
    }
};
