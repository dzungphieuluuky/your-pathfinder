
import React from 'react';
import ReactDOM from 'react-dom/client';
import RootLayout from './app/layout';

/**
 * PATHFINDER NEXT.JS ENTRY POINT
 * In a standard Next.js environment, this is handled by the framework.
 * Here we mount the RootLayout which acts as the application container.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RootLayout />
  </React.StrictMode>
);
