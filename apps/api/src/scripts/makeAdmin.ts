import { connectDb, disconnectDb, UserModel } from '@soweto-stays/db';
import { env } from '../common/config/env.js';
import { logger } from '../common/logger.js';

// Admin is deliberately never self-assignable via the app (claude_plan.md §2) - this is
// the one-time bootstrap path. Usage: npm run make-admin -- someone@example.com
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error('Usage: npm run make-admin -- <email>');
  }

  await connectDb(env.MONGO_URI);
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error(
        `No user found with email "${email}". Sign in with Google at least once first - the account is created on first login.`,
      );
    }

    if (user.roles.includes('admin')) {
      logger.info(`${email} is already an admin.`);
      return;
    }

    user.roles = [...user.roles, 'admin'];
    await user.save();
    logger.info(`Granted admin to ${email} (roles: ${user.roles.join(', ')})`);
  } finally {
    await disconnectDb();
  }
}

main().catch((err: unknown) => {
  logger.error(err, 'make-admin script failed');
  process.exitCode = 1;
});
