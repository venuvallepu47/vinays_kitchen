import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        // Tell the SW's NetworkFirst handler to always go to the network;
        // the cached response is only used if the network times out (offline fallback)
        'Cache-Control': 'no-cache',
    },
});

// Ping the server every 14 minutes to prevent Render free tier cold starts
const PING_INTERVAL = 14 * 60 * 1000;
setInterval(() => {
    axios.get('/api/health').catch(() => {});
}, PING_INTERVAL);

export default api;
