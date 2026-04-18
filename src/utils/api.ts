import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Ping the server every 14 minutes to prevent Render free tier cold starts
const PING_INTERVAL = 14 * 60 * 1000;
setInterval(() => {
    axios.get('/api/health').catch(() => {});
}, PING_INTERVAL);

export default api;
