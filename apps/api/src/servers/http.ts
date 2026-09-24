// apps/api/src/servers/http.ts
import { createApp } from '../app';
import { connectDB, disconnectDatabase } from '../config/database';
import { env } from '../config/env';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.info(`API server running on port ${env.port} (${env.nodeEnv})`);
    console.info(`Health check: http://localhost:${env.port}/health`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
};

startServer().catch((error: unknown) => {
  console.error('API startup failed:', error);
  process.exit(1);
});
