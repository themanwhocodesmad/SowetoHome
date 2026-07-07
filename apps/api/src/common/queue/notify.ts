import type { EmailTemplate } from '@soweto-stays/shared';
import { bookingReminderQueue, emailQueue, ratingPromptQueue } from './queues.js';

export async function enqueueEmail(
  template: EmailTemplate,
  context: { userId?: string; bookingId?: string },
): Promise<void> {
  await emailQueue.add('send', { template, context });
}

// Deterministic jobId makes this idempotent: BullMQ won't duplicate a still-pending job
// with the same id, so a retried webhook can't double-schedule the same reminder.
export async function scheduleBookingReminder(bookingId: string, sendAt: Date): Promise<void> {
  const delay = Math.max(0, sendAt.getTime() - Date.now());
  await bookingReminderQueue.add(
    'remind',
    { bookingId },
    { delay, jobId: `reminder:${bookingId}` },
  );
}

export async function scheduleRatingPrompt(bookingId: string, sendAt: Date): Promise<void> {
  const delay = Math.max(0, sendAt.getTime() - Date.now());
  await ratingPromptQueue.add('prompt', { bookingId }, { delay, jobId: `prompt:${bookingId}` });
}
