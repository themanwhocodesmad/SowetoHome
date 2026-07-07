import { Queue } from 'bullmq';
import { QUEUE_NAMES, parseRedisUrl } from '@soweto-stays/shared';
import { env } from '../config/env.js';

const connection = parseRedisUrl(env.REDIS_URL);

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection });
export const bookingReminderQueue = new Queue(QUEUE_NAMES.BOOKING_REMINDER, { connection });
export const ratingPromptQueue = new Queue(QUEUE_NAMES.RATING_PROMPT, { connection });
