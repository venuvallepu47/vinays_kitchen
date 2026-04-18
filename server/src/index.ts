import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Gzip all responses — reduces payload size by ~70%
app.use(compression());
app.use(cors());
app.use(express.json());

// Root
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: "Vinay's Kitchen API" });
});

// Health check — used by keep-alive ping from frontend
app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
