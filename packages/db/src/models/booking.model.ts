import { Schema, model, Types, type HydratedDocument } from 'mongoose';
import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  type BookingStatus,
  type PaymentStatus,
} from '@soweto-stays/shared';

export interface IBooking {
  guestId: Types.ObjectId;
  hostId: Types.ObjectId;
  propertyId: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
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
  cancelledAt?: Date;
  cancellationReason?: string;
  reminderSentAt?: Date;
  ratingPromptSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = HydratedDocument<IBooking>;

const bookingSchema = new Schema<IBooking>(
  {
    guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numGuests: { type: Number, required: true, min: 1 },
    nightlyRate: { type: Number, required: true },
    totalNights: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    adminFeeAmount: { type: Number, required: true },
    hostPayoutAmount: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    paymentRef: { type: String },
    bookingStatus: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending_payment',
      index: true,
    },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    reminderSentAt: { type: Date },
    ratingPromptSentAt: { type: Date },
  },
  { timestamps: true },
);

bookingSchema.index({ propertyId: 1, checkIn: 1, checkOut: 1 });

export const BookingModel = model<IBooking>('Booking', bookingSchema);
