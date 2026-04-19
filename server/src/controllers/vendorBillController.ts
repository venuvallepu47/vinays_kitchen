import { Request, Response } from 'express';
import pool from '../config/db';

// POST /vendors/:id/bills — create purchase bill with multiple items
export const createBill = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const vendor_id = req.params.id;
        const { bill_date, items, paid_amount, payment_mode, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }

        const total_amount = items.reduce(
            (sum: number, item: any) => sum + parseFloat(item.quantity) * parseFloat(item.price_per_unit),
            0
        );
        const paid = Math.min(parseFloat(paid_amount) || 0, total_amount);

        const billRes = await client.query(
            `INSERT INTO vendor_bills (vendor_id, bill_date, total_amount, paid_amount, payment_mode, notes)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [vendor_id, bill_date, total_amount, paid, payment_mode || 'cash', notes || null]
        );
        const bill = billRes.rows[0];

        for (const item of items) {
            const itemTotal = parseFloat(item.quantity) * parseFloat(item.price_per_unit);

            await client.query(
                `INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [bill.id, item.material_id, item.quantity, item.price_per_unit, itemTotal]
            );

            // Also insert into purchases for stock tracking
            await client.query(
                `INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, bill_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [item.material_id, vendor_id, item.quantity, item.price_per_unit, itemTotal, bill_date, bill.id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(bill);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('createBill error:', err);
        res.status(500).json({ error: 'Failed to create bill' });
    } finally {
        client.release();
    }
};

// GET /vendors/:id/ledger — bills + payments + summary
export const getVendorLedger = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const billsRes = await pool.query(`
            SELECT vb.*,
                COALESCE(json_agg(
                    json_build_object(
                        'id', vbi.id,
                        'material_id', vbi.material_id,
                        'material_name', m.name,
                        'unit', m.unit,
                        'quantity', vbi.quantity,
                        'price_per_unit', vbi.price_per_unit,
                        'total_amount', vbi.total_amount
                    ) ORDER BY vbi.id
                ) FILTER (WHERE vbi.id IS NOT NULL), '[]') AS items
            FROM vendor_bills vb
            LEFT JOIN vendor_bill_items vbi ON vbi.bill_id = vb.id
            LEFT JOIN materials m ON m.id = vbi.material_id
            WHERE vb.vendor_id = $1
            GROUP BY vb.id
            ORDER BY vb.bill_date DESC, vb.created_at DESC
        `, [id]);

        const paymentsRes = await pool.query(`
            SELECT * FROM vendor_payments
            WHERE vendor_id = $1
            ORDER BY payment_date DESC, created_at DESC
        `, [id]);

        const bills = billsRes.rows;
        const payments = paymentsRes.rows;

        // Old purchases recorded directly (before billing system, bill_id IS NULL)
        const oldPurchasesRes = await pool.query(`
            SELECT p.*, m.name AS material_name, m.unit
            FROM purchases p
            LEFT JOIN materials m ON m.id = p.material_id
            WHERE p.vendor_id = $1 AND p.bill_id IS NULL
            ORDER BY p.purchase_date DESC
        `, [id]);
        const oldPurchases = oldPurchasesRes.rows;

        // totalCredit = vendor_bills + old direct purchases
        const totalCreditFromBills = bills.reduce((s: number, b: any) => s + parseFloat(b.total_amount), 0);
        const totalCreditFromOld = oldPurchases.reduce((s: number, p: any) => s + parseFloat(p.total_amount), 0);
        const totalCredit = totalCreditFromBills + totalCreditFromOld;

        const totalPaidOnBills = bills.reduce((s: number, b: any) => s + parseFloat(b.paid_amount), 0);
        const totalStandalonePayments = payments.reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
        const totalPaid = totalPaidOnBills + totalStandalonePayments;
        const outstanding = totalCredit - totalPaid;

        res.json({
            summary: { totalCredit, totalPaid, outstanding },
            bills,
            payments,
            oldPurchases,
        });
    } catch (err) {
        console.error('getVendorLedger error:', err);
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
};

// PUT /vendor-bills/:id — edit bill items + paid amount
export const updateBill = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { bill_date, items, paid_amount, payment_mode, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }

        const total_amount = items.reduce(
            (sum: number, item: any) => sum + parseFloat(item.quantity) * parseFloat(item.price_per_unit),
            0
        );
        const paid = Math.min(parseFloat(paid_amount) || 0, total_amount);

        const vendorRes = await client.query('SELECT vendor_id FROM vendor_bills WHERE id=$1', [id]);
        if (vendorRes.rows.length === 0) return res.status(404).json({ error: 'Bill not found' });
        const vendor_id = vendorRes.rows[0].vendor_id;

        await client.query(
            `UPDATE vendor_bills SET bill_date=$1, total_amount=$2, paid_amount=$3, payment_mode=$4, notes=$5 WHERE id=$6`,
            [bill_date, total_amount, paid, payment_mode || 'cash', notes || null, id]
        );

        // Replace items and synced purchases
        await client.query('DELETE FROM vendor_bill_items WHERE bill_id=$1', [id]);
        await client.query('DELETE FROM purchases WHERE bill_id=$1', [id]);

        for (const item of items) {
            const itemTotal = parseFloat(item.quantity) * parseFloat(item.price_per_unit);
            await client.query(
                `INSERT INTO vendor_bill_items (bill_id, material_id, quantity, price_per_unit, total_amount) VALUES ($1,$2,$3,$4,$5)`,
                [id, item.material_id, item.quantity, item.price_per_unit, itemTotal]
            );
            await client.query(
                `INSERT INTO purchases (material_id, vendor_id, quantity, price_per_unit, total_amount, purchase_date, bill_id) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [item.material_id, vendor_id, item.quantity, item.price_per_unit, itemTotal, bill_date, id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Bill updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('updateBill error:', err);
        res.status(500).json({ error: 'Failed to update bill' });
    } finally {
        client.release();
    }
};

// DELETE /vendor-bills/:id — explicitly removes items + purchases then the bill
export const deleteBill = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        await client.query('DELETE FROM vendor_bill_items WHERE bill_id=$1', [id]);
        await client.query('DELETE FROM purchases WHERE bill_id=$1', [id]);
        await client.query('DELETE FROM vendor_bills WHERE id=$1', [id]);
        await client.query('COMMIT');
        res.json({ message: 'Bill deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('deleteBill error:', err);
        res.status(500).json({ error: 'Failed to delete bill' });
    } finally {
        client.release();
    }
};

// POST /vendors/:id/payments
export const createPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, payment_date, payment_mode, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO vendor_payments (vendor_id, amount, payment_date, payment_mode, notes)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id, amount, payment_date, payment_mode || 'cash', notes || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to record payment' });
    }
};

// PUT /vendor-payments/:id
export const updatePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, payment_date, payment_mode, notes } = req.body;
        const result = await pool.query(
            `UPDATE vendor_payments SET amount=$1, payment_date=$2, payment_mode=$3, notes=$4 WHERE id=$5 RETURNING *`,
            [amount, payment_date, payment_mode || 'cash', notes || null, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update payment' });
    }
};

// DELETE /vendor-payments/:id
export const deletePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM vendor_payments WHERE id = $1', [id]);
        res.json({ message: 'Payment deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete payment' });
    }
};

// GET /vendor-bills/:id
export const getBill = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT vb.*,
                COALESCE(json_agg(
                    json_build_object(
                        'id', vbi.id,
                        'material_id', vbi.material_id,
                        'material_name', m.name,
                        'unit', m.unit,
                        'quantity', vbi.quantity,
                        'price_per_unit', vbi.price_per_unit,
                        'total_amount', vbi.total_amount
                    ) ORDER BY vbi.id
                ) FILTER (WHERE vbi.id IS NOT NULL), '[]') AS items
            FROM vendor_bills vb
            LEFT JOIN vendor_bill_items vbi ON vbi.bill_id = vb.id
            LEFT JOIN materials m ON m.id = vbi.material_id
            WHERE vb.id = $1
            GROUP BY vb.id
        `, [id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Bill not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bill' });
    }
};
