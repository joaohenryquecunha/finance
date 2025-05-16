import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PWA install event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default behavior
  e.preventDefault();
  // Store the event for later use
  window.deferredPrompt = e;
  // Debug log
  console.log('PWA install prompt detected and saved');
});

// Log when PWA is successfully installed
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed successfully');
  window.deferredPrompt = null;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);