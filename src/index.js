import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Set up a global fetch timeout
if (process.env.NODE_ENV === 'development') {
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Create a version of fetch with timeout
  window.fetch = async (...args) => {
    const controller = new AbortController();
    const { signal } = controller;
    
    // Add signal to the options if it's not already present
    if (args.length === 2 && !args[1].signal) {
      args[1] = { ...args[1], signal };
    } else if (args.length === 1) {
      args.push({ signal });
    }
    
    // Set a 3 second timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`Fetch timeout for: ${args[0]}`);
    }, 3000);
    
    try {
      const response = await originalFetch(...args);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`Fetch aborted for: ${args[0]}`);
      }
      throw error;
    }
  };
}

// Initialize mock service worker in development
if (process.env.NODE_ENV === 'development') {
  const { worker } = require('./mocks/browser');
  
  // Start the worker with the updated configuration
  worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    serviceWorker: {
      url: '/mockServiceWorker.js',
      options: {
        // Faster timeout for the service worker (3 seconds instead of default)
        timeoutDelay: 3000
      }
    },
    quiet: false, // Log all activity for debugging
  }).catch(error => {
    console.error('MSW worker start failed:', error);
  });
  
  console.log('Mock Service Worker started');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
); 