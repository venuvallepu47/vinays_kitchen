import { Request, Response } from 'express';
import { query } from '../config/db';

// Daily Sales Management
export const getSales = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM sales ORDER BY date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createSales = async (req: Request, res: Response) => {
    const { date, amount, description } = req.body;
    try {
        const result = await query(
            'INSERT INTO sales (date, amount, description) VALUES ($1, $2, $3) RETURNING *',
            [date, amount, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating sales record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteSales = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM sales WHERE id = $1', [id]);
        res.json({ message: 'Sales record deleted' });
    } catch (error) {
        console.error('Error deleting sales record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
