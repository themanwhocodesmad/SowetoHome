import type { BookingStatus, PaymentStatus } from '../constants/enums.js';

export interface BookingDto {
  id: string;
  guestId: string;
  hostId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  nightlyRate: number;
  totalNights: number;
  subtotal: number;
  adminFeeAmount: number;
  hostPayoutAmount: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  bookingStatus: BookingStatus;
  cancelledAt?: string;
  cancellationReason?: string;
  reminderSentAt?: string;
  ratingPromptSentAt?: string;
  createdAt: string;
  updatedAt: string;
}
