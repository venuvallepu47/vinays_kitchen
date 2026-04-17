import { Request, Response } from 'express';
import pool from '../config/db';

// GET all materials with current stock
export const getMaterials = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT m.*,
                COALESCE(SUM(p.quantity), 0) AS total_purchased,
                COALESCE(SUM(u.quantity_used), 0) AS total_used,
                COALESCE(SUM(p.quantity), 0) - COALESCE(SUM(u.quantity_used), 0) AS current_stock
            FROM materials m
            LEFT JOIN purchases p ON p.material_id = m.id
            LEFT JOIN material_usage u ON u.material_id = m.id
            GROUP BY m.id
            ORDER BY m.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch materials' });
    }
};

// POST create material
export const createMaterial = async (req: Request, res: Response) => {
    try {
        const { name, unit, min_stock } = req.body;
        const result = await pool.query(
            'INSERT INTO materials (name, unit, min_stock) VALUES ($1, $2, $3) RETURNING *',
            [name, unit, min_stock || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create material' });
    }
};

// PUT update material
export const updateMaterial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, unit, min_stock } = req.body;
        const result = await pool.query(
            'UPDATE materials SET name=$1, unit=$2, min_stock=$3 WHERE id=$4 RETURNING *',
            [name, unit, min_stock, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update material' });
    }
};

// DELETE material
export const deleteMaterial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM materials WHERE id=$1', [id]);
        res.json({ message: 'Material deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete material' });
    }
};

// GET purchases for a material
export const getMaterialPurchases = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT p.*, v.name AS vendor_name
            FROM purchases p
            LEFT JOIN vendors v ON v.id = p.vendor_id
            WHERE p.material_id = $1
            ORDER BY p.purchase_date DESC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
};

// POST log a purchase (stock intake)
export const logPurchase = async (req: Request, res: Response) => {
    try {
        const { material_id, vendor_id, quantity, price_per_unit, purchase_date, notes } = req.body;
        const total_amount = parseFloat(quantity) * parseFloat(price_per_unit);
        const result = await pool.query(
            `INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [material_id, vendor_id || null, quantity, price_per_unit, total_amount, purchase_date || new Date(), notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to log purchase' });
    }
};

// GET all purchases (for general listing)
export const getAllPurchases = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT p.*, m.name AS material_name, m.unit, v.name AS vendor_name
            FROM purchases p
            LEFT JOIN materials m ON m.id = p.material_id
            LEFT JOIN vendors v ON v.id = p.vendor_id
            ORDER BY p.purchase_date DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
};

// DELETE a purchase
export const deletePurchase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM purchases WHERE id=$1', [id]);
        res.json({ message: 'Purchase deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete purchase' });
    }
};

// POST log material usage
export const logUsage = async (req: Request, res: Response) => {
    try {
        const { material_id, quantity_used, usage_date, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO material_usage (material_id, quantity_used, usage_date, notes)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [material_id, quantity_used, usage_date || new Date(), notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to log usage' });
    }
};

// GET usage logs for a material
export const getMaterialUsage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM material_usage WHERE material_id = $1 ORDER BY usage_date DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch usage' });
    }
};
