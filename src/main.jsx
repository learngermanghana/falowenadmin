import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

const STALE_ASSET_RELOAD_KEY = 'falowen-stale-asset-reload-at';
const STALE_ASSET_RELOAD_WINDOW_MS = 30_000;

function reloadAfterStaleAsset() {
  const now = Date.now();
  const previous = Number(window.sessionStorage.getItem(STALE_ASSET_RELOAD_KEY) || 0);
  if (Number.isFinite(previous) && previous > 0 && now - previous < STALE_ASSET_RELOAD_WINDOW_MS) return;
  window.sessionStorage.setItem(STALE_ASSET_RELOAD_KEY, String(now));
  window.location.reload();
}

if (typeof window !== 'undefined') {
  // Vite emits this when an already-open tab still references hashed chunks from
  // the previous deployment. Reload once so the tab picks up the current asset
  // manifest instead of trying to execute the SPA HTML fallback as JavaScript.
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadAfterStaleAsset();
  });

  // Firefox can surface the same stale-chunk failure as an unhandled dynamic
  // import rejection. Keep a fallback for that browser-specific path as well.
  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event.reason?.message || event.reason || '');
    if (!/dynamically imported module|failed to fetch dynamically imported module|importing a module script failed/i.test(message)) return;
    event.preventDefault();
    reloadAfterStaleAsset();
  });

  window.setTimeout(() => {
    window.sessionStorage.removeItem(STALE_ASSET_RELOAD_KEY);
  }, STALE_ASSET_RELOAD_WINDOW_MS);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
