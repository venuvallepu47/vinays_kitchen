import { Request, Response } from 'express';
import pool from '../config/db';

// GET all sales
export const getSales = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        let query = 'SELECT * FROM sales';
        const params: any[] = [];
        if (month && year) {
            query += ' WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2';
            params.push(month, year);
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
        const { date, amount, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO sales (date, amount, notes) VALUES ($1, $2, $3) RETURNING *',
            [date || new Date(), amount, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create sale' });
    }
};

// PUT update sale
export const updateSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date, amount, notes } = req.body;
        const result = await pool.query(
            'UPDATE sales SET date=$1, amount=$2, notes=$3 WHERE id=$4 RETURNING *',
            [date, amount, notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
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
