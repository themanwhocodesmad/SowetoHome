import {
  RATING_PROMPT_AFTER_CHECKOUT_HOURS,
  REMINDER_BEFORE_CHECKIN_HOURS,
} from '@soweto-stays/shared';
import { BookingModel, UserModel, PropertyModel, type BookingDocument } from '@soweto-stays/db';
import { env } from '../../common/config/env.js';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../common/logger.js';
import { enqueueEmail, scheduleBookingReminder, scheduleRatingPrompt } from '../../common/queue/notify.js';
import { bookingService } from '../bookings/booking.service.js';
import { payoutService } from '../payouts/payout.service.js';
import { generatePayfastSignature } from './payfast.signature.js';

const HOUR_MS = 60 * 60 * 1000;

interface PayfastCheckout {
  actionUrl: string;
  fields: Record<string, string>;
}

function payfastActionUrl(): string {
  return env.PAYFAST_MODE === 'live'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';
}

function payfastValidateUrl(): string {
  return env.PAYFAST_MODE === 'live'
    ? 'https://www.payfast.co.za/eng/query/validate'
    : 'https://sandbox.payfast.co.za/eng/query/validate';
}

export const paymentService = {
  async buildCheckoutForm(bookingId: string, requesterId: string): Promise<PayfastCheckout> {
    if (!env.PAYFAST_MERCHANT_ID || !env.PAYFAST_MERCHANT_KEY) {
      throw AppError.badRequest(
        'Payments are not configured yet (PAYFAST_MERCHANT_ID/PAYFAST_MERCHANT_KEY missing)',
      );
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.guestId.toString() !== requesterId) {
      throw AppError.forbidden('You do not have access to this booking');
    }
    if (booking.bookingStatus !== 'pending_payment') {
      throw AppError.conflict('This booking is not awaiting payment');
    }

    const [guest, property] = await Promise.all([
      UserModel.findById(booking.guestId),
      PropertyModel.findById(booking.propertyId),
    ]);
    if (!guest || !property) throw AppError.notFound('Booking references missing data');

    const [firstName, ...lastNameParts] = guest.name.trim().split(/\s+/);

    // Field order matters for the PayFast signature - do not reorder without re-checking
    // PayFast's documented field order (see claude_plan.md §3, risk #4).
    const fields: Record<string, string> = {
      merchant_id: env.PAYFAST_MERCHANT_ID,
      merchant_key: env.PAYFAST_MERCHANT_KEY,
      return_url: env.PAYFAST_RETURN_URL ?? `${env.CLIENT_URL}/bookings/${booking._id.toString()}?payment=success`,
      cancel_url: env.PAYFAST_CANCEL_URL ?? `${env.CLIENT_URL}/bookings/${booking._id.toString()}?payment=cancelled`,
      notify_url: env.PAYFAST_NOTIFY_URL ?? `${env.API_PUBLIC_URL}/api/payments/payfast/notify`,
      name_first: firstName || guest.name,
      name_last: lastNameParts.join(' ') || '-',
      email_address: guest.email,
      m_payment_id: booking._id.toString(),
      amount: booking.totalPrice.toFixed(2),
      item_name: `Soweto Stays: ${property.title}`.slice(0, 100),
    };

    const signature = generatePayfastSignature(fields, env.PAYFAST_PASSPHRASE);
    return { actionUrl: payfastActionUrl(), fields: { ...fields, signature } };
  },

  async handleNotify(rawBody: Record<string, string>): Promise<void> {
    const { signature, ...fields } = rawBody;
    const expectedSignature = generatePayfastSignature(fields, env.PAYFAST_PASSPHRASE);
    if (signature !== expectedSignature) {
      logger.warn({ fields }, 'PayFast ITN signature mismatch');
      throw AppError.badRequest('Invalid signature');
    }

    // Extra hardening PayFast recommends: confirm the notification against their own
    // server before trusting it (protects against a spoofed POST to our notify_url).
    const validationResponse = await fetch(payfastValidateUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(rawBody).toString(),
    });
    const validationText = (await validationResponse.text()).trim();
    if (validationText !== 'VALID') {
      logger.warn({ validationText }, 'PayFast could not validate this ITN');
      throw AppError.badRequest('PayFast validation failed');
    }

    const bookingId = fields.m_payment_id;
    if (!bookingId) throw AppError.badRequest('Missing m_payment_id');

    if (fields.payment_status === 'COMPLETE') {
      const booking = await bookingService.confirmPayment(bookingId, fields.pf_payment_id ?? '');
      await this.onBookingConfirmed(booking);
    } else {
      await bookingService.markPaymentFailed(bookingId);
    }
  },

  async onBookingConfirmed(booking: BookingDocument): Promise<void> {
    const bookingId = booking._id.toString();
    await enqueueEmail('booking-confirmed', { bookingId });
    await payoutService.createForConfirmedBooking(booking);

    const reminderAt = new Date(
      booking.checkIn.getTime() - REMINDER_BEFORE_CHECKIN_HOURS * HOUR_MS,
    );
    const ratingPromptAt = new Date(
      booking.checkOut.getTime() + RATING_PROMPT_AFTER_CHECKOUT_HOURS * HOUR_MS,
    );
    await scheduleBookingReminder(bookingId, reminderAt);
    await scheduleRatingPrompt(bookingId, ratingPromptAt);
  },

  // PayFast has no documented API for a marketplace to push a refund back out on demand
  // (see claude_plan.md §3, risk #2) - we record refunded status and notify the guest, but
  // an admin must still execute the actual refund from the PayFast merchant dashboard.
  async refundBooking(booking: BookingDocument): Promise<void> {
    booking.paymentStatus = 'refunded';
    await booking.save();
    await enqueueEmail('refund-processed', { bookingId: booking._id.toString() });
    logger.info(
      { bookingId: booking._id.toString() },
      'Booking marked refunded - an admin must complete the actual PayFast refund manually',
    );
  },
};
