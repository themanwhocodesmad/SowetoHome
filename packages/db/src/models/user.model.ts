import { Schema, model, type HydratedDocument } from 'mongoose';
import { ROLES, type Role } from '@soweto-stays/shared';

export interface PayoutDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface IUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: Role[];
  phone?: string;
  payoutDetails?: PayoutDetails;
  isSuspended: boolean;
  // Denormalized aggregates - a user can be rated in two distinct capacities (see
  // claude_plan.md §7.5: guests rate hosts, hosts rate guests), so these are kept separate.
  hostRatingAvg: number;
  hostRatingCount: number;
  guestRatingAvg: number;
  guestRatingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const payoutDetailsSchema = new Schema<PayoutDetails>(
  {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountHolder: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    roles: { type: [String], enum: ROLES, default: ['guest'] },
    phone: { type: String },
    payoutDetails: { type: payoutDetailsSchema, required: false },
    isSuspended: { type: Boolean, default: false },
    hostRatingAvg: { type: Number, default: 0 },
    hostRatingCount: { type: Number, default: 0 },
    guestRatingAvg: { type: Number, default: 0 },
    guestRatingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>('User', userSchema);
