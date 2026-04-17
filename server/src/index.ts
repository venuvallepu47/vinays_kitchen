import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic Root Route
app.get('/', (req: Request, res: Response) => {
    res.status(200).send(`
        <div style="font-family: sans-serif; padding: 2rem; line-height: 1.5;">
            <h1 style="color: #4f46e5;">Vinay's Kitchen Backend</h1>
            <p>The backend service is <strong>LIVE</strong> and connected to PostgreSQL.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 2rem 0;">
            <p>API Status: <span style="background: #d1fae5; color: #065f46; padding: 0.25rem 0.5rem; border-radius: 4px;">HEALTHY</span></p>
            <p>Endpoints: <code>/api/health</code>, <code>/api/...</code></p>
        </div>
    `);
});

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'Vinay\'s Kitchen Backend is running' });
});

app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
