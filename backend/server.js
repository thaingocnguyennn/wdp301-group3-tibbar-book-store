import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import setupSupportSocket from './src/sockets/supportSocket.js';

const PORT = process.env.PORT || 5000;

const parseAllowedOrigins = () => {
  const defaults = ["http://localhost:5173"];
  const configuredOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL;

  if (!configuredOrigins) {
    return defaults;
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    
    const io = new SocketIOServer(server, {
      cors: {
        origin: parseAllowedOrigins(),
        credentials: true,
      },
    });

    // Setup Socket.IO event handlers
    setupSupportSocket(io);

    // Make io available globally for use in routes
    app.set('io', io);

    server.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`📝 API Documentation: http://localhost:${PORT}/health`);
      console.log(`⚡ Socket.IO enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});