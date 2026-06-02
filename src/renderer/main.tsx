/**
 * Point d'entrée React — createRoot compatible HMR (Vite).
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';

import './styles/main.css';

const container = document.getElementById('root');
if (!container) throw new Error('Élément #root introuvable');

declare global {
  interface Window {
    __SMART_CITY_ROOT__?: ReactDOM.Root;
  }
}

const root = window.__SMART_CITY_ROOT__ ?? ReactDOM.createRoot(container);
window.__SMART_CITY_ROOT__ = root;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.hot) {
  import.meta.hot.accept('./app', (mod) => {
    root.render(
      <React.StrictMode>
        <mod.default />
      </React.StrictMode>
    );
  });
}
