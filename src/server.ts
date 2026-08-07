import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { startCleanupJob } from './jobs/cleanup-orphan-files.job.js';

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    const base = `http://localhost:${env.port}`;
    console.log(`🚀 UnBlock API listening on ${base}/api`);
    console.log(`   Environment: ${env.nodeEnv}`);
    console.log(`   API docs:    ${base}/api/docs`);
    console.log(`   OpenAPI JSON: ${base}/api/docs.json`);
    console.log(`   Health:      ${base}/api/health`);
  });

  const stopCleanup = startCleanupJob();

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    stopCleanup?.();
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Force-exit if close hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
