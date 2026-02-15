import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { exportMemoryJSON } from './services/vectorMemory';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Expose export function for "Admin" use
(window as any).exportKnowledge = () => {
  const data = exportMemoryJSON();
  console.log("📋 KNOWLEDGE EXPORTED! Copy the JSON string below:");
  console.log(data);
  return "Check console for JSON data";
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);