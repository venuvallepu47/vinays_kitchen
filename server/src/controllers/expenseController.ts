import { Request, Response } from 'express';
import pool from '../config/db';

// GET all expenses
export const getExpenses = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        let query = 'SELECT * FROM expenses';
        const params: any[] = [];
        if (month && year) {
            query += ' WHERE EXTRACT(MONTH FROM expense_date) = $1 AND EXTRACT(YEAR FROM expense_date) = $2';
            params.push(month, year);
        }
        query += ' ORDER BY expense_date DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

// POST create expense
export const createExpense = async (req: Request, res: Response) => {
    try {
        const { category, amount, expense_date, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO expenses (category, amount, expense_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [category, amount, expense_date || new Date(), notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create expense' });
    }
};

// PUT update expense
export const updateExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { category, amount, expense_date, notes } = req.body;
        const result = await pool.query(
            'UPDATE expenses SET category=$1, amount=$2, expense_date=$3, notes=$4 WHERE id=$5 RETURNING *',
            [category, amount, expense_date, notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update expense' });
    }
};

// DELETE expense
export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM expenses WHERE id=$1', [id]);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete expense' });
    }
};
