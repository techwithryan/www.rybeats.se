const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.DEV_API_URL || 'http://127.0.0.1:3001';
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
