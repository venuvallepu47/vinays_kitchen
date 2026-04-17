import { Request, Response } from 'express';
import { query } from '../config/db';

// Materials Management
export const getMaterials = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM materials ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createMaterial = async (req: Request, res: Response) => {
    const { name, unit, min_stock } = req.body;
    try {
        const result = await query(
            'INSERT INTO materials (name, unit, min_stock) VALUES ($1, $2, $3) RETURNING *',
            [name, unit, min_stock]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Purchases Management
export const getPurchases = async (req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT p.*, m.name as material_name, m.unit FROM purchases p JOIN materials m ON p.material_id = m.id ORDER BY p.purchase_date DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createPurchase = async (req: Request, res: Response) => {
    const { material_id, quantity, price_per_unit, total_amount, purchase_date, supplier_name } = req.body;
    try {
        const result = await query(
            `INSERT INTO purchases (material_id, quantity, price_per_unit, total_amount, purchase_date, supplier_name) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [material_id, quantity, price_per_unit, total_amount, purchase_date, supplier_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Inventory Stock Levels
export const getStockLevels = async (req: Request, res: Response) => {
    try {
        const result = await query(
            `SELECT m.id, m.name, m.unit, m.min_stock,
                COALESCE(SUM(p.quantity), 0) as total_purchased
             FROM materials m
             LEFT JOIN purchases p ON m.id = p.material_id
             GROUP BY m.id ORDER BY m.name ASC`
        );
        // Note: In a real app, we'd also subtract consumption. 
        // For Vinay's Kitchen, we might just track purchases and maybe manual consumption logs.
        // For now, showing total purchased as stock.
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching stock levels:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
