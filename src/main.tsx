import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

import { registerSW } from 'virtual:pwa-register';

// Automatically check for new deployments every 10 minutes.
// If a new version is found, skipWaiting + clientsClaim will trigger 'controllerchange'
// which will then reload the tab instantly for the user.
registerSW({
    onRegistered(r) {
        if (r) {
            // Check every 10 mins
            setInterval(() => { r.update(); }, 10 * 60 * 1000);
            
            // Also check whenever the user switches back to the app
            window.addEventListener('focus', () => { r.update(); });
        }
    },
});

if ('serviceWorker' in navigator) {
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
            reloading = true;
            window.location.reload();
        }
    });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
);
