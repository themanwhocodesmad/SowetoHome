import {
  RATING_PROMPT_AFTER_CHECKOUT_HOURS,
  REMINDER_BEFORE_CHECKIN_HOURS,
  type CheckoutResponse,
} from '@soweto-stays/shared';
import { BookingModel, type BookingDocument } from '@soweto-stays/db';
import { env } from '../../common/config/env.js';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../common/logger.js';
import { enqueueEmail, scheduleBookingReminder, scheduleRatingPrompt } from '../../common/queue/notify.js';
import { bookingService } from '../bookings/booking.service.js';
import { platformSettingsService } from '../admin/platformSettings.service.js';
import { verifyYocoWebhookSignature } from './yoco.signature.js';
import { buildPayFastSignature, verifyPayFastSignature } from './payfast.signature.js';

const HOUR_MS = 60 * 60 * 1000;
const YOCO_API_BASE = 'https://payments.yoco.com/api';
const PAYFAST_ACTION_URL = {
  sandbox: 'https://sandbox.payfast.co.za/eng/process',
  live: 'https://www.payfast.co.za/eng/process',
} as const;

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

async function loadPayableBooking(bookingId: string, requesterId: string): Promise<BookingDocument> {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.guestId.toString() !== requesterId) {
    throw AppError.forbidden('You do not have access to this booking');
  }
  if (booking.bookingStatus !== 'pending_payment') {
    throw AppError.conflict('This booking is not awaiting payment');
  }
  return booking;
}

async function buildYocoCheckout(booking: BookingDocument, secretKey: string): Promise<CheckoutResponse> {
  const bookingIdStr = booking._id.toString();
  // Yoco's docs are explicit: never treat successUrl as payment confirmation, only the
  // signature-verified webhook counts (see yoco.signature.ts) - these URLs just redirect
  // the browser after checkout.
  const response = await fetch(`${YOCO_API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
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

  return { provider: 'yoco', redirectUrl: data.redirectUrl };
}

// PayFast has no checkout-creation API like Yoco's - the guest's browser must POST an HTML
// form straight to PayFast, so this just returns the exact action URL + signed field set for
// the frontend to build and auto-submit that form (see CheckoutResponse in shared/types/payment.ts).
function buildPayFastCheckout(
  booking: BookingDocument,
  settings: { merchantId: string; merchantKey: string; passphrase?: string; mode: 'sandbox' | 'live' },
): CheckoutResponse {
  const bookingIdStr = booking._id.toString();

  // Field order matters for the signature (see payfast.signature.ts) - this is the order
  // PayFast's own documentation lists them in for a payment request.
  const fields: Record<string, string> = {
    merchant_id: settings.merchantId,
    merchant_key: settings.merchantKey,
    return_url: `${env.CLIENT_URL}/bookings/${bookingIdStr}?payment=success`,
    cancel_url: `${env.CLIENT_URL}/bookings/${bookingIdStr}?payment=cancelled`,
    notify_url: `${env.API_PUBLIC_URL}/api/payments/payfast/notify`,
    m_payment_id: bookingIdStr,
    amount: booking.totalPrice.toFixed(2),
    item_name: `Booking ${bookingIdStr}`.slice(0, 100),
    custom_str1: bookingIdStr,
  };

  const signature = buildPayFastSignature(fields, settings.passphrase);

  return {
    provider: 'payfast',
    actionUrl: PAYFAST_ACTION_URL[settings.mode],
    fields: { ...fields, signature },
  };
}

export const paymentService = {
  async buildCheckoutForm(bookingId: string, requesterId: string): Promise<CheckoutResponse> {
    const booking = await loadPayableBooking(bookingId, requesterId);
    const gateways = await platformSettingsService.getRawPaymentGatewaySettings();

    if (gateways.activeProvider === 'payfast') {
      const merchantId = gateways.payfast.merchantId;
      const merchantKey = gateways.payfast.merchantKey;
      if (!gateways.payfast.enabled || !merchantId || !merchantKey) {
        throw AppError.badRequest('PayFast is not configured yet - add your merchant details in Admin → Settings');
      }
      return buildPayFastCheckout(booking, {
        merchantId,
        merchantKey,
        passphrase: gateways.payfast.passphrase,
        mode: gateways.payfast.mode,
      });
    }

    const secretKey = gateways.yoco.secretKey ?? env.YOCO_SECRET_KEY;
    if (!gateways.yoco.enabled && !env.YOCO_SECRET_KEY) {
      throw AppError.badRequest('Yoco is not configured yet - add your secret key in Admin → Settings');
    }
    if (!secretKey) {
      throw AppError.badRequest('Payments are not configured yet (Yoco secret key missing)');
    }
    return buildYocoCheckout(booking, secretKey);
  },

  async handleNotify(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    const gateways = await platformSettingsService.getRawPaymentGatewaySettings();
    const webhookSecret = gateways.yoco.webhookSecret ?? env.YOCO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw AppError.badRequest('Yoco webhook secret is not configured');
    }

    const isValid = verifyYocoWebhookSignature(
      {
        'webhook-id': firstHeaderValue(headers['webhook-id']),
        'webhook-timestamp': firstHeaderValue(headers['webhook-timestamp']),
        'webhook-signature': firstHeaderValue(headers['webhook-signature']),
      },
      rawBody,
      webhookSecret,
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

  // PayFast's ITN: form-urlencoded POST, no header signature - the signature is one of the
  // posted fields instead (see payfast.signature.ts). PayFast's docs also recommend
  // confirming the source IP and re-posting the data back to PayFast for server-side
  // validation before trusting it; IP/source validation isn't done here (this app isn't
  // deployed behind a static, documented egress from PayFast's IP ranges yet) - re-check
  // developer docs before relying on this for real money without that extra check.
  async handlePayFastNotify(fields: Record<string, string>): Promise<void> {
    const gateways = await platformSettingsService.getRawPaymentGatewaySettings();
    const { merchantId, passphrase } = gateways.payfast;
    if (!merchantId) {
      throw AppError.badRequest('PayFast is not configured');
    }
    if (fields.merchant_id !== merchantId) {
      logger.warn('PayFast ITN merchant_id mismatch');
      throw AppError.badRequest('Merchant mismatch');
    }

    const isValid = verifyPayFastSignature(fields, passphrase, fields.signature);
    if (!isValid) {
      logger.warn('PayFast ITN signature verification failed');
      throw AppError.badRequest('Invalid signature');
    }

    const bookingId = fields.m_payment_id || fields.custom_str1;
    if (!bookingId) {
      logger.warn('PayFast ITN missing m_payment_id/custom_str1');
      throw AppError.badRequest('Missing booking reference');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      logger.warn({ bookingId }, 'PayFast ITN referenced an unknown booking');
      return;
    }

    // Defence in depth beyond the signature: the amount PayFast says it collected must
    // match what we asked for, to the cent.
    const paidAmount = Number(fields.amount_gross ?? fields.amount);
    if (Number.isFinite(paidAmount) && Math.abs(paidAmount - booking.totalPrice) > 0.01) {
      logger.error(
        { bookingId, expected: booking.totalPrice, paid: paidAmount },
        'PayFast ITN amount mismatch',
      );
      throw AppError.badRequest('Amount mismatch');
    }

    if (fields.payment_status === 'COMPLETE') {
      const confirmed = await bookingService.confirmPayment(bookingId, fields.pf_payment_id ?? 'payfast');
      await this.onBookingConfirmed(confirmed);
    } else if (fields.payment_status === 'FAILED') {
      await bookingService.markPaymentFailed(bookingId);
    }
  },

  async onBookingConfirmed(booking: BookingDocument): Promise<void> {
    const bookingId = booking._id.toString();
    await enqueueEmail('booking-confirmed', { bookingId });

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
  // money. PayFast's refund API is similarly unverified here. Until then: record refunded status
  // and notify the guest, but an admin must still execute the actual refund from whichever
  // gateway's merchant dashboard was used for this booking.
  async refundBooking(booking: BookingDocument): Promise<void> {
    booking.paymentStatus = 'refunded';
    await booking.save();
    await enqueueEmail('refund-processed', { bookingId: booking._id.toString() });
    logger.info(
      { bookingId: booking._id.toString() },
      'Booking marked refunded - an admin must complete the actual gateway refund manually',
    );
  },
};
