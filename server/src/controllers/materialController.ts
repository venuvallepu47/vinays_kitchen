import { Request, Response } from 'express';
import pool from '../config/db';
import { getISTDateString } from '../utils/date';

// GET all materials with current stock
export const getMaterials = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT m.*,
                COALESCE((SELECT SUM(p.quantity) FROM purchases p WHERE p.material_id = m.id), 0) AS total_purchased,
                COALESCE((SELECT SUM(u.quantity_used) FROM material_usage u WHERE u.material_id = m.id), 0) AS total_used,
                COALESCE((SELECT SUM(p.quantity) FROM purchases p WHERE p.material_id = m.id), 0)
                    - COALESCE((SELECT SUM(u.quantity_used) FROM material_usage u WHERE u.material_id = m.id), 0) AS current_stock
            FROM materials m
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
        const { name, unit, min_stock, conversion_factor, base_unit } = req.body;
        const result = await pool.query(
            'INSERT INTO materials (name, unit, min_stock, conversion_factor, base_unit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, unit, min_stock || 0, conversion_factor || null, base_unit || null]
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
        const { name, unit, min_stock, conversion_factor, base_unit } = req.body;
        const result = await pool.query(
            'UPDATE materials SET name=$1, unit=$2, min_stock=$3, conversion_factor=$4, base_unit=$5 WHERE id=$6 RETURNING *',
            [name, unit, min_stock, conversion_factor || null, base_unit || null, id]
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
            SELECT p.*, v.name AS vendor_name, 
                   vb.paid_amount, vb.payment_mode, vb.total_amount AS bill_total
            FROM purchases p
            LEFT JOIN vendors v ON v.id = p.vendor_id
            LEFT JOIN vendor_bills vb ON vb.id = p.bill_id
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
            [material_id, vendor_id || null, quantity, price_per_unit, total_amount, purchase_date || getISTDateString(), notes]
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

// DELETE a purchase — if it belongs to a bill, removes the bill item and recalculates the bill total
export const deletePurchase = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;

        const purchaseRes = await client.query(
            'SELECT * FROM purchases WHERE id=$1',
            [id]
        );
        if (purchaseRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Purchase not found' });
        }
        const purchase = purchaseRes.rows[0];

        // Delete the purchase row
        await client.query('DELETE FROM purchases WHERE id=$1', [id]);

        if (purchase.bill_id) {
            // Remove the matching vendor_bill_items row (match by bill + material + qty + price)
            await client.query(
                `DELETE FROM vendor_bill_items
                 WHERE id = (
                     SELECT id FROM vendor_bill_items
                     WHERE bill_id=$1 AND material_id=$2
                       AND quantity::numeric = $3::numeric
                       AND price_per_unit::numeric = $4::numeric
                     LIMIT 1
                 )`,
                [purchase.bill_id, purchase.material_id, purchase.quantity, purchase.price_per_unit]
            );

            // Check remaining items in the bill
            const remaining = await client.query(
                'SELECT COALESCE(SUM(total_amount),0) AS new_total, COUNT(*) AS item_count FROM vendor_bill_items WHERE bill_id=$1',
                [purchase.bill_id]
            );
            const { new_total, item_count } = remaining.rows[0];

            if (parseInt(item_count) === 0) {
                // No items left — delete the bill entirely
                await client.query('DELETE FROM vendor_bills WHERE id=$1', [purchase.bill_id]);
            } else {
                // Recalculate bill total; cap paid_amount so it never exceeds new total
                await client.query(
                    `UPDATE vendor_bills
                     SET total_amount = $1,
                         paid_amount  = LEAST(paid_amount, $1)
                     WHERE id = $2`,
                    [new_total, purchase.bill_id]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Purchase deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('deletePurchase error:', err);
        res.status(500).json({ error: 'Failed to delete purchase' });
    } finally {
        client.release();
    }
};

// PUT update a purchase
export const updatePurchase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { vendor_id, quantity, price_per_unit, purchase_date, notes } = req.body;
        const total_amount = parseFloat(quantity) * parseFloat(price_per_unit);
        const result = await pool.query(
            `UPDATE purchases SET vendor_id=$1, quantity=$2, price_per_unit=$3, total_amount=$4, purchase_date=$5, notes=$6 
             WHERE id=$7 RETURNING *`,
            [vendor_id || null, quantity, price_per_unit, total_amount, purchase_date, notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update purchase' });
    }
};

// POST log material usage
export const logUsage = async (req: Request, res: Response) => {
    try {
        const { material_id, quantity_used, usage_date, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO material_usage (material_id, quantity_used, usage_date, notes)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [material_id, quantity_used, usage_date || getISTDateString(), notes]
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

// PUT update usage
export const updateUsage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { quantity_used, usage_date, notes } = req.body;
        const result = await pool.query(
            `UPDATE material_usage SET quantity_used=$1, usage_date=$2, notes=$3 WHERE id=$4 RETURNING *`,
            [quantity_used, usage_date, notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update usage' });
    }
};

// DELETE usage
export const deleteUsage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM material_usage WHERE id=$1', [id]);
        res.json({ message: 'Usage deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete usage' });
    }
};

// POST /materials/:id/purchase
// Material-centric purchase: creates a vendor bill or direct purchase.
// If same vendor already has an open bill on the same date within the last 2 hours, merges into it.
export const purchaseMaterial = async (req: Request, res: Response) => {
    const { id: material_id } = req.params;
    const { vendor_id, quantity, price_per_unit, purchase_date, paid_amount, payment_mode, notes } = req.body;

    const qty   = parseFloat(quantity);
    const price = parseFloat(price_per_unit);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
        return res.status(400).json({ error: 'Invalid quantity or price' });
    }

    const item_total = qty * price;
    const bill_date  = purchase_date || getISTDateString();

    // No vendor — direct purchase, no bill
    if (!vendor_id) {
        try {
            const result = await pool.query(
                `INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, notes)
                 VALUES ($1, NULL, $2, $3, $4, $5, $6) RETURNING *`,
                [material_id, qty, price, item_total, bill_date, notes || null]
            );
            return res.status(201).json({ merged: false, purchase: result.rows[0] });
        } catch (err: any) {
            console.error('purchaseMaterial (no vendor) error:', err);
            return res.status(500).json({ error: 'Failed to record purchase' });
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check for an existing open bill: same vendor, same date, created within last 2 hours
        const existing = await client.query(
            `SELECT * FROM vendor_bills
             WHERE vendor_id = $1
               AND bill_date = $2
               AND created_at >= NOW() - INTERVAL '2 hours'
             ORDER BY created_at DESC
             LIMIT 1`,
            [vendor_id, bill_date]
        );

        let bill_id: number;
        let merged = false;

        if (existing.rows.length > 0) {
            // Merge into existing bill
            const bill = existing.rows[0];
            bill_id = bill.id;
            merged  = true;

            const new_total   = parseFloat(bill.total_amount) + item_total;
            const added_paid  = Math.min(parseFloat(paid_amount || '0'), item_total);
            const new_paid    = Math.min(parseFloat(bill.paid_amount) + added_paid, new_total);
            const new_mode    = payment_mode || bill.payment_mode || 'cash';

            await client.query(
                `UPDATE vendor_bills SET total_amount = $1, paid_amount = $2, payment_mode = $3 WHERE id = $4`,
                [new_total, new_paid, new_mode, bill_id]
            );
        } else {
            // Create new bill
            const paid = Math.min(parseFloat(paid_amount || '0'), item_total);
            const billRes = await client.query(
                `INSERT INTO vendor_bills (vendor_id, bill_date, total_amount, paid_amount, payment_mode, notes)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [vendor_id, bill_date, item_total, paid, payment_mode || 'cash', notes || null]
            );
            bill_id = billRes.rows[0].id;
        }

        // Add bill item
        await client.query(
            `INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount)
             VALUES ($1, $2, $3, $4, $5)`,
            [bill_id, material_id, qty, price, item_total]
        );

        // Add purchase record (stock tracking)
        await client.query(
            `INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, notes, bill_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [material_id, vendor_id, qty, price, item_total, bill_date, notes || null, bill_id]
        );

        await client.query('COMMIT');
        res.status(merged ? 200 : 201).json({ merged, bill_id });
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('purchaseMaterial error:', err);
        res.status(500).json({ error: 'Failed to record purchase' });
    } finally {
        client.release();
    }
};
