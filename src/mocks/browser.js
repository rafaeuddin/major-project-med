import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// This configures a Service Worker with the given request handlers.
// Using the original handlers directly for better compatibility
export const worker = setupWorker(...handlers); 