
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './app/providers';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* Explicitly passing children as a prop to resolve TypeScript's missing children error for AuthProvider */}
    <AuthProvider children={<App />} />
  </React.StrictMode>
);
