import { BookingModel, PropertyModel, UserModel } from '@soweto-stays/db';
import type { EmailJobPayload } from '@soweto-stays/shared';
import { sendMail } from '../mailer.js';
import { renderTemplate } from '../templates/render.js';
import { logger } from '../logger.js';

async function resolveBookingContext(bookingId: string) {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) return null;
  const [guest, host, property] = await Promise.all([
    UserModel.findById(booking.guestId),
    UserModel.findById(booking.hostId),
    PropertyModel.findById(booking.propertyId),
  ]);
  if (!guest || !host || !property) return null;
  return { booking, guest, host, property };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Johannesburg',
  });
}

function money(amount: number): string {
  return `R${amount.toFixed(2)}`;
}

// Looks up current data at send time rather than trusting the job payload (see
// packages/shared/src/queues.ts) - a booking cancelled after enqueue is reflected here.
export async function processEmailJob(payload: EmailJobPayload): Promise<void> {
  const { template, context } = payload;

  switch (template) {
    case 'welcome': {
      if (!context.userId) return;
      const user = await UserModel.findById(context.userId);
      if (!user) return;
      const email = renderTemplate('Welcome to Soweto Stays', [
        `Hi ${user.name},`,
        'Welcome to Soweto Stays. You can search stays right away, and list your own place as a host whenever you are ready.',
      ]);
      await sendMail(user.email, email.subject, email.html, email.text);
      return;
    }

    case 'booking-requested': {
      const data = context.bookingId ? await resolveBookingContext(context.bookingId) : null;
      if (!data) return;
      const email = renderTemplate('Your booking request', [
        `Hi ${data.guest.name},`,
        `We've received your booking request for ${data.property.title} from ${formatDate(data.booking.checkIn)} to ${formatDate(data.booking.checkOut)}. Complete payment to confirm your stay.`,
      ]);
      await sendMail(data.guest.email, email.subject, email.html, email.text);
      return;
    }

    case 'booking-confirmed': {
      const data = context.bookingId ? await resolveBookingContext(context.bookingId) : null;
      if (!data) return;

      const guestEmail = renderTemplate('Booking confirmed!', [
        `Hi ${data.guest.name},`,
        `Your booking for ${data.property.title} (${formatDate(data.booking.checkIn)} - ${formatDate(data.booking.checkOut)}) is confirmed. Total paid: ${money(data.booking.totalPrice)}.`,
      ]);
      await sendMail(data.guest.email, guestEmail.subject, guestEmail.html, guestEmail.text);

      const hostEmail = renderTemplate('New booking confirmed', [
        `Hi ${data.host.name},`,
        `${data.guest.name} has booked ${data.property.title} from ${formatDate(data.booking.checkIn)} to ${formatDate(data.booking.checkOut)}. Your payout: ${money(data.booking.hostPayoutAmount)}.`,
      ]);
      await sendMail(data.host.email, hostEmail.subject, hostEmail.html, hostEmail.text);
      return;
    }

    case 'cancellation-confirmed': {
      const data = context.bookingId ? await resolveBookingContext(context.bookingId) : null;
      if (!data) return;
      const email = renderTemplate('Booking cancelled', [
        `Hi ${data.guest.name},`,
        `Your booking for ${data.property.title} has been cancelled.`,
      ]);
      await sendMail(data.guest.email, email.subject, email.html, email.text);
      return;
    }

    case 'refund-processed': {
      const data = context.bookingId ? await resolveBookingContext(context.bookingId) : null;
      if (!data) return;
      const email = renderTemplate('Refund processed', [
        `Hi ${data.guest.name},`,
        `Your refund of ${money(data.booking.totalPrice)} for ${data.property.title} has been processed by our team.`,
      ]);
      await sendMail(data.guest.email, email.subject, email.html, email.text);
      return;
    }

    case 'host-payout-sent': {
      const data = context.bookingId ? await resolveBookingContext(context.bookingId) : null;
      if (!data) return;
      const email = renderTemplate('Payout sent', [
        `Hi ${data.host.name},`,
        `We've sent your payout of ${money(data.booking.hostPayoutAmount)} for the booking at ${data.property.title}.`,
      ]);
      await sendMail(data.host.email, email.subject, email.html, email.text);
      return;
    }

    case 'checkin-reminder':
    case 'checkout-rating-prompt':
      // These are sent by the dedicated BOOKING_REMINDER / RATING_PROMPT queues instead
      // (worker.ts), since they also need to mutate the booking atomically with sending.
      logger.warn({ template }, 'Template belongs to a dedicated queue, not EMAIL');
      return;

    case 'admin-new-host':
    case 'admin-listing-pending':
      // Reserved for a future admin-moderation slice - nothing enqueues these yet.
      return;

    default:
      logger.warn({ template }, 'Unknown email template');
  }
}
