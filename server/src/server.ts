import { createApp } from './app';
import { ENV } from './config/env';

const app = createApp();

const server = app.listen(ENV.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SaveBite Backend API Server running on port ${ENV.PORT}`);
  console.log(`🌐 Health check: http://localhost:${ENV.PORT}/api/v1/health`);
  console.log(`🌍 Environment: ${ENV.NODE_ENV}`);
  console.log(`💰 Standard Currency: INR (₹)`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default server;
