import pool from './src/config/db';
import fs from 'fs';
import path from 'path';

async function run() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'setup_db.sql'), 'utf-8');
        await pool.query(sql);
        console.log("Database setup successfully!");
        process.exit(0);
    } catch(e) {
        console.error("Setup error:", e);
        process.exit(1);
    }
}
run();
