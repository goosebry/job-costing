import app from './server';
import { testConnection } from './config/database';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await testConnection();
    console.log('[Database] Connection verified');

    const httpServer = createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    const { setupNotifications } = await import('./modules/notifications/notifications.socket');
    setupNotifications(io);

    httpServer.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

start();