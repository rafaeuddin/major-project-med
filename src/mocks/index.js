if (typeof window === 'object') {
  const { worker } = require('./browser')
  
  // Start the worker
  worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  })
} 