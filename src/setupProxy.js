const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for OpenAI API requests
  app.use(
    '/api/openai',
    createProxyMiddleware({
      target: 'https://api.openai.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/openai': '/v1'
      },
      onProxyReq: (proxyReq, req, res) => {
        // Don't forward the API key from client
        proxyReq.removeHeader('Authorization');
        
        // Add API key from environment variable (will be added on the server)
        if (process.env.REACT_APP_OPENAI_API_KEY) {
          proxyReq.setHeader('Authorization', `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`);
        }
      }
    })
  );
  
  // Add other proxies as needed for your backend API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );
};
