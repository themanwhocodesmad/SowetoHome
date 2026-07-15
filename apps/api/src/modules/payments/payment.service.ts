import {
  RATING_PROMPT_AFTER_CHECKOUT_HOURS,
  REMINDER_BEFORE_CHECKIN_HOURS,
  type YocoCheckoutResponse,
} from '@soweto-stays/shared';
import { BookingModel, type BookingDocument } from '@soweto-stays/db';
import { env } from '../../common/config/env.js';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../common/logger.js';
import { enqueueEmail, scheduleBookingReminder, scheduleRatingPrompt } from '../../common/queue/notify.js';
import { bookingService } from '../bookings/booking.service.js';
import { payoutService } from '../payouts/payout.service.js';
import { verifyYocoWebhookSignature } from './yoco.signature.js';

const HOUR_MS = 60 * 60 * 1000;
const YOCO_API_BASE = 'https://payments.yoco.com/api';

interface YocoCheckoutApiResponse {
  redirectUrl?: string;
}

interface YocoWebhookEvent {
  type: string;
  payload: {
    id: string;
    metadata?: Record<string, unknown>;
  };
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const paymentService = {
  async buildCheckoutForm(bookingId: string, requesterId: string): Promise<YocoCheckoutResponse> {
    if (!env.YOCO_SECRET_KEY) {
      throw AppError.badRequest('Payments are not configured yet (YOCO_SECRET_KEY missing)');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.guestId.toString() !== requesterId) {
      throw AppError.forbidden('You do not have access to this booking');
    }
    if (booking.bookingStatus !== 'pending_payment') {
      throw AppError.conflict('This booking is not awaiting payment');
    }

    const bookingIdStr = booking._id.toString();
    // Yoco's docs are explicit: never treat successUrl as payment confirmation, only the
    // signature-verified webhook counts (see yoco.signature.ts) - these URLs just redirect
    // the browser after checkout.
    const response = await fetch(`${YOCO_API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(booking.totalPrice * 100),
        currency: 'ZAR',
        successUrl: env.YOCO_SUCCESS_URL ?? `${env.CLIENT_URL}/bookings/${bookingIdStr}?payment=success`,
        cancelUrl: env.YOCO_CANCEL_URL ?? `${env.CLIENT_URL}/bookings/${bookingIdStr}?payment=cancelled`,
        failureUrl: env.YOCO_FAILURE_URL ?? `${env.CLIENT_URL}/bookings/${bookingIdStr}?payment=failed`,
        metadata: { bookingId: bookingIdStr },
      }),
    });

    if (!response.ok) {
      logger.error(
        { status: response.status, body: await response.text() },
        'Yoco checkout creation failed',
      );
      throw AppError.badRequest('Could not start Yoco checkout');
    }

    const data = (await response.json()) as YocoCheckoutApiResponse;
    if (!data.redirectUrl) {
      throw AppError.badRequest('Yoco did not return a checkout redirect URL');
    }

    return { redirectUrl: data.redirectUrl };
  },

  async handleNotify(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    if (!env.YOCO_WEBHOOK_SECRET) {
      throw AppError.badRequest('Yoco webhook secret is not configured');
    }

    const isValid = verifyYocoWebhookSignature(
      {
        'webhook-id': firstHeaderValue(headers['webhook-id']),
        'webhook-timestamp': firstHeaderValue(headers['webhook-timestamp']),
        'webhook-signature': firstHeaderValue(headers['webhook-signature']),
      },
      rawBody,
      env.YOCO_WEBHOOK_SECRET,
    );
    if (!isValid) {
      logger.warn('Yoco webhook signature verification failed');
      throw AppError.badRequest('Invalid signature');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as YocoWebhookEvent;
    const bookingId = event.payload?.metadata?.bookingId;
    if (typeof bookingId !== 'string') {
      logger.warn({ eventType: event.type }, 'Yoco webhook missing bookingId in metadata');
      throw AppError.badRequest('Missing bookingId in webhook metadata');
    }

    if (event.type === 'payment.succeeded') {
      const booking = await bookingService.confirmPayment(bookingId, event.payload.id);
      await this.onBookingConfirmed(booking);
    } else if (event.type === 'payment.failed') {
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

  // Yoco does expose a refunds API, but the exact endpoint/shape wasn't verified against a live
  // sandbox call while wiring this up - re-check developer.yoco.com before relying on it for real
  // money. Until then: record refunded status and notify the guest, but an admin must still
  // execute the actual refund from the Yoco merchant dashboard.
  async refundBooking(booking: BookingDocument): Promise<void> {
    booking.paymentStatus = 'refunded';
    await booking.save();
    await enqueueEmail('refund-processed', { bookingId: booking._id.toString() });
    logger.info(
      { bookingId: booking._id.toString() },
      'Booking marked refunded - an admin must complete the actual Yoco refund manually',
    );
  },
};
