import { BookingModel, PropertyModel, UserModel } from '@soweto-stays/db';
import type { BookingReminderJobPayload } from '@soweto-stays/shared';
import { sendMail } from '../mailer.js';
import { renderTemplate } from '../templates/render.js';

export async function processBookingReminderJob(payload: BookingReminderJobPayload): Promise<void> {
  const booking = await BookingModel.findById(payload.bookingId);
  // Re-checks live state: a booking cancelled after this delayed job was scheduled must
  // not still send a "your stay is coming up" reminder (claude_plan.md §9).
  if (!booking || booking.bookingStatus !== 'confirmed' || booking.reminderSentAt) return;

  const [guest, property] = await Promise.all([
    UserModel.findById(booking.guestId),
    PropertyModel.findById(booking.propertyId),
  ]);
  if (!guest || !property) return;

  const email = renderTemplate('Your stay is coming up', [
    `Hi ${guest.name},`,
    `Just a reminder that your stay at ${property.title} starts tomorrow. Check-in is from ${property.checkInTime}.`,
  ]);
  await sendMail(guest.email, email.subject, email.html, email.text);

  booking.reminderSentAt = new Date();
  await booking.save();
}
