import { Request, Response } from 'express';
import pool from '../config/db';

// GET all vendors with outstanding balance
export const getVendors = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT v.*,
                COALESCE((SELECT SUM(vb.total_amount) FROM vendor_bills vb WHERE vb.vendor_id = v.id), 0) AS total_credit,
                COALESCE((SELECT SUM(vb.paid_amount) FROM vendor_bills vb WHERE vb.vendor_id = v.id), 0) +
                COALESCE((SELECT SUM(vp.amount) FROM vendor_payments vp WHERE vp.vendor_id = v.id), 0) AS total_paid,
                COALESCE((SELECT SUM(vb.total_amount) FROM vendor_bills vb WHERE vb.vendor_id = v.id), 0) -
                COALESCE((SELECT SUM(vb.paid_amount) FROM vendor_bills vb WHERE vb.vendor_id = v.id), 0) -
                COALESCE((SELECT SUM(vp.amount) FROM vendor_payments vp WHERE vp.vendor_id = v.id), 0) AS outstanding
            FROM vendors v
            ORDER BY v.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("GET /vendors error:", err);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
};

// GET single vendor with purchases
export const getVendorById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const vendor = await pool.query(`
            SELECT v.*, COALESCE(SUM(p.total_amount), 0) AS total_purchased
            FROM vendors v
            LEFT JOIN purchases p ON p.vendor_id = v.id
            WHERE v.id = $1
            GROUP BY v.id
        `, [id]);

        if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

        const purchases = await pool.query(`
            SELECT p.*, m.name AS material_name, m.unit
            FROM purchases p
            LEFT JOIN materials m ON m.id = p.material_id
            WHERE p.vendor_id = $1
            ORDER BY p.purchase_date DESC
        `, [id]);

        res.json({ vendor: vendor.rows[0], purchases: purchases.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch vendor' });
    }
};

// POST create vendor
export const createVendor = async (req: Request, res: Response) => {
    try {
        const { name, phone, address } = req.body;
        const result = await pool.query(
            'INSERT INTO vendors (name, phone, address) VALUES ($1, $2, $3) RETURNING *',
            [name, phone, address]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create vendor' });
    }
};

// PUT update vendor
export const updateVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, phone, address } = req.body;
        const result = await pool.query(
            'UPDATE vendors SET name=$1, phone=$2, address=$3 WHERE id=$4 RETURNING *',
            [name, phone, address, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update vendor' });
    }
};

// DELETE vendor
export const deleteVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM vendors WHERE id=$1', [id]);
        res.json({ message: 'Vendor deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete vendor' });
    }
};
