import { Worker } from 'bullmq';
import { connectDb } from '@soweto-stays/db';
import {
  QUEUE_NAMES,
  parseRedisUrl,
  type BookingReminderJobPayload,
  type EmailJobPayload,
  type RatingPromptJobPayload,
} from '@soweto-stays/shared';
import { env } from './config/env.js';
import { logger } from './logger.js';
import { processEmailJob } from './processors/email.processor.js';
import { processBookingReminderJob } from './processors/bookingReminder.processor.js';
import { processRatingPromptJob } from './processors/ratingPrompt.processor.js';

async function main() {
  await connectDb(env.MONGO_URI);
  logger.info('Worker connected to MongoDB');

  const connection = parseRedisUrl(env.REDIS_URL);

  const emailWorker = new Worker<EmailJobPayload>(
    QUEUE_NAMES.EMAIL,
    (job) => processEmailJob(job.data),
    { connection },
  );
  const reminderWorker = new Worker<BookingReminderJobPayload>(
    QUEUE_NAMES.BOOKING_REMINDER,
    (job) => processBookingReminderJob(job.data),
    { connection },
  );
  const ratingPromptWorker = new Worker<RatingPromptJobPayload>(
    QUEUE_NAMES.RATING_PROMPT,
    (job) => processRatingPromptJob(job.data),
    { connection },
  );

  for (const worker of [emailWorker, reminderWorker, ratingPromptWorker]) {
    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, queue: worker.name, err }, 'Job failed');
    });
  }

  logger.info('Soweto Stays worker is running');
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Failed to start worker');
  process.exit(1);
});
