import { connectDb } from '@soweto-stays/db';
import { createApp } from './app.js';
import { env } from './common/config/env.js';
import { logger } from './common/logger.js';

async function main() {
  await connectDb(env.MONGO_URI);
  logger.info('Connected to MongoDB');

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`Soweto Stays API listening on port ${env.PORT}`);
  });
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
