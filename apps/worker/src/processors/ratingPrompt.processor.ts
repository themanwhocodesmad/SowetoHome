import { BookingModel, PropertyModel, UserModel } from '@soweto-stays/db';
import type { RatingPromptJobPayload } from '@soweto-stays/shared';
import { sendMail } from '../mailer.js';
import { renderTemplate } from '../templates/render.js';

export async function processRatingPromptJob(payload: RatingPromptJobPayload): Promise<void> {
  const booking = await BookingModel.findById(payload.bookingId);
  if (!booking) return;
  if (!['confirmed', 'completed'].includes(booking.bookingStatus) || booking.ratingPromptSentAt) {
    return;
  }

  // This job fires 24h after checkout, so the stay has definitely happened by now - flip
  // status here instead of scheduling a third delayed job just for that transition.
  if (booking.bookingStatus === 'confirmed') {
    booking.bookingStatus = 'completed';
  }

  const [guest, host, property] = await Promise.all([
    UserModel.findById(booking.guestId),
    UserModel.findById(booking.hostId),
    PropertyModel.findById(booking.propertyId),
  ]);
  if (!guest || !host || !property) return;

  const guestPrompt = renderTemplate('How was your stay?', [
    `Hi ${guest.name},`,
    `You stayed at ${property.title} recently. Please take a moment to rate the property and your host.`,
  ]);
  await sendMail(guest.email, guestPrompt.subject, guestPrompt.html, guestPrompt.text);

  const hostPrompt = renderTemplate('Rate your recent guest', [
    `Hi ${host.name},`,
    `${guest.name} recently stayed at ${property.title}. Please take a moment to rate them as a guest.`,
  ]);
  await sendMail(host.email, hostPrompt.subject, hostPrompt.html, hostPrompt.text);

  booking.ratingPromptSentAt = new Date();
  await booking.save();
}
