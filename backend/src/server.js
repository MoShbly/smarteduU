import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

let server;

const startServer = async () => {
  await connectDatabase();

  server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

const shutdown = async (signal, exitCode = 0) => {
  console.log(`${signal} received. Closing Smart Classroom API gracefully...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  process.exit(exitCode);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', async (error) => {
  console.error('Unhandled rejection:', error);
  await shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await shutdown('uncaughtException', 1);
});

startServer();
