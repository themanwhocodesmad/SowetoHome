import type { BookingDto, CreateBookingInput } from '@soweto-stays/shared';
import { PropertyModel, type BookingDocument } from '@soweto-stays/db';
import { AppError } from '../../common/errors/AppError.js';
import { enqueueEmail } from '../../common/queue/notify.js';
import { platformSettingsService } from '../admin/platformSettings.service.js';
import { bookingRepository } from './booking.repository.js';
import { hasOverlappingBooking } from './availability.js';

interface AuthUser {
  id: string;
  roles: string[];
}

const HOUR_MS = 60 * 60 * 1000;

function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / (24 * HOUR_MS));
}

export function toBookingDto(booking: BookingDocument): BookingDto {
  return {
    id: booking._id.toString(),
    guestId: booking.guestId.toString(),
    hostId: booking.hostId.toString(),
    propertyId: booking.propertyId.toString(),
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    numGuests: booking.numGuests,
    nightlyRate: booking.nightlyRate,
    totalNights: booking.totalNights,
    subtotal: booking.subtotal,
    adminFeeAmount: booking.adminFeeAmount,
    hostPayoutAmount: booking.hostPayoutAmount,
    totalPrice: booking.totalPrice,
    paymentStatus: booking.paymentStatus,
    paymentRef: booking.paymentRef,
    bookingStatus: booking.bookingStatus,
    cancelledAt: booking.cancelledAt?.toISOString(),
    cancellationReason: booking.cancellationReason,
    reminderSentAt: booking.reminderSentAt?.toISOString(),
    ratingPromptSentAt: booking.ratingPromptSentAt?.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

export const bookingService = {
  async createRequest(guestId: string, input: CreateBookingInput): Promise<BookingDocument> {
    const property = await PropertyModel.findById(input.propertyId);
    if (!property || property.status !== 'published') {
      throw AppError.notFound('Property not found');
    }
    if (!property.isAvailable) {
      throw AppError.badRequest('This property is not currently accepting bookings');
    }
    if (property.hostId.toString() === guestId) {
      throw AppError.badRequest('You cannot book your own property');
    }

    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);
    const totalNights = nightsBetween(checkIn, checkOut);

    if (totalNights < property.minNights || totalNights > property.maxNights) {
      throw AppError.badRequest(
        `Stay length must be between ${property.minNights} and ${property.maxNights} nights`,
      );
    }
    if (input.numGuests > property.maxGuests) {
      throw AppError.badRequest(`This property allows a maximum of ${property.maxGuests} guests`);
    }

    const overlapping = await hasOverlappingBooking(property._id.toString(), checkIn, checkOut);
    if (overlapping) {
      throw AppError.conflict('These dates are no longer available for this property');
    }

    const adminFeePercent = await platformSettingsService.getAdminFeePercent();
    const subtotal = Math.round(property.stayRate * totalNights * 100) / 100;
    const adminFeeAmount = Math.round(subtotal * (adminFeePercent / 100) * 100) / 100;
    const hostPayoutAmount = Math.round((subtotal - adminFeeAmount) * 100) / 100;

    const booking = await bookingRepository.create({
      guestId,
      hostId: property.hostId,
      propertyId: property._id,
      checkIn,
      checkOut,
      numGuests: input.numGuests,
      nightlyRate: property.stayRate,
      totalNights,
      subtotal,
      adminFeeAmount,
      hostPayoutAmount,
      totalPrice: subtotal,
      paymentStatus: 'pending',
      bookingStatus: 'pending_payment',
    });
    await enqueueEmail('booking-requested', { bookingId: booking._id.toString() });
    return booking;
  },

  async getForRequester(bookingId: string, requester: AuthUser): Promise<BookingDocument> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    const isParty =
      booking.guestId.toString() === requester.id || booking.hostId.toString() === requester.id;
    if (!isParty && !requester.roles.includes('admin')) {
      throw AppError.forbidden('You do not have access to this booking');
    }
    return booking;
  },

  listMineAsGuest(guestId: string): Promise<BookingDocument[]> {
    return bookingRepository.listByGuest(guestId);
  },

  listMineAsHost(hostId: string): Promise<BookingDocument[]> {
    return bookingRepository.listByHost(hostId);
  },

  listForAdmin(page: number, limit: number, status?: string) {
    return bookingRepository.listForAdmin(page, limit, status);
  },

  // Idempotent: PayFast's ITN may retry, so re-confirming an already-confirmed booking is a no-op.
  async confirmPayment(bookingId: string, paymentRef: string): Promise<BookingDocument> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.bookingStatus !== 'pending_payment') return booking;

    booking.paymentStatus = 'paid';
    booking.paymentRef = paymentRef;
    booking.bookingStatus = 'confirmed';
    return bookingRepository.save(booking);
  },

  async markPaymentFailed(bookingId: string): Promise<BookingDocument> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    booking.paymentStatus = 'failed';
    return bookingRepository.save(booking);
  },

  // Refund execution against PayFast is the payments module's job (see payment.service.ts) -
  // this only decides booking-state eligibility per the flat 24-48h rule (claude_plan.md §2).
  async cancel(
    bookingId: string,
    requester: AuthUser,
    reason?: string,
  ): Promise<{ booking: BookingDocument; refundEligible: boolean }> {
    const booking = await this.getForRequester(bookingId, requester);
    if (booking.bookingStatus !== 'pending_payment' && booking.bookingStatus !== 'confirmed') {
      throw AppError.badRequest(`Cannot cancel a booking with status "${booking.bookingStatus}"`);
    }

    const isGuest = booking.guestId.toString() === requester.id;
    const wasPaid = booking.paymentStatus === 'paid';

    booking.bookingStatus = isGuest ? 'cancelled_by_guest' : 'cancelled_by_host';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;

    const freeWindowHours = await platformSettingsService.getCancellationFreeWindowHours();
    const hoursUntilCheckIn = (booking.checkIn.getTime() - Date.now()) / HOUR_MS;
    const refundEligible = wasPaid && hoursUntilCheckIn >= freeWindowHours;

    await bookingRepository.save(booking);
    await enqueueEmail('cancellation-confirmed', { bookingId: booking._id.toString() });
    return { booking, refundEligible };
  },
};
