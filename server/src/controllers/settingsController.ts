import { Request, Response } from 'express';
import pool from '../config/db';

const DEFAULT_UNITS = ['kg', 'g', 'ltr', 'ml', 'pieces', 'packets', 'bundles', 'dozens', 'Bags', 'Cartons'];
const DEFAULT_CATEGORIES = ['Rent', 'Electricity', 'Water', 'Gas', 'Maintenance', 'Transport', 'Miscellaneous'];

export const getSettings = async (req: Request, res: Response) => {
    try {
        // Auto-seed defaults if not yet in DB
        await pool.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
            ['material_units', JSON.stringify(DEFAULT_UNITS)]
        );
        await pool.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
            ['expense_categories', JSON.stringify(DEFAULT_CATEGORIES)]
        );

        const result = await pool.query('SELECT key, value FROM settings');
        
        // Convert array of {key, value} to { [key]: value } object
        const settingsMap: Record<string, any> = {};
        result.rows.forEach(row => {
            try {
                settingsMap[row.key] = JSON.parse(row.value);
            } catch {
                settingsMap[row.key] = row.value; // fallback if not JSON
            }
        });

        res.json(settingsMap);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body; // e.g. { "material_units": ["kg", "g"], "expense_categories": [...] }
        
        // Use a transaction to update multiple keys
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const [key, value] of Object.entries(updates)) {
                const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                await client.query(
                    `INSERT INTO settings (key, value) VALUES ($1, $2)
                     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
                    [key, valStr]
                );
            }
            await client.query('COMMIT');
            res.json({ message: 'Settings updated successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
