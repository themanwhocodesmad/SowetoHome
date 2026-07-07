import { Schema, model, Types, type HydratedDocument } from 'mongoose';
import { PAYOUT_STATUSES, type PayoutStatus } from '@soweto-stays/shared';

export interface IPayout {
  hostId: Types.ObjectId;
  bookingId: Types.ObjectId;
  amount: number;
  status: PayoutStatus;
  method: 'manual_eft';
  paidAt?: Date;
  paidBy?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PayoutDocument = HydratedDocument<IPayout>;

const payoutSchema = new Schema<IPayout>(
  {
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: PAYOUT_STATUSES, default: 'pending', index: true },
    method: { type: String, enum: ['manual_eft'], default: 'manual_eft' },
    paidAt: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true },
);

export const PayoutModel = model<IPayout>('Payout', payoutSchema);
