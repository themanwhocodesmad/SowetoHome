import { Schema, model, type HydratedDocument } from 'mongoose';
import { ROLES, type Role } from '@soweto-stays/shared';

export interface IUser {
  googleId?: string;
  passwordHash?: string;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: Role[];
  phone?: string;
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

const userSchema = new Schema<IUser>(
  {
    // Optional + sparse: a user can sign up with either Google or an email/password, so
    // neither field is required, but each must still be unique among the users that have one.
    googleId: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    roles: { type: [String], enum: ROLES, default: ['guest'] },
    phone: { type: String },
    isSuspended: { type: Boolean, default: false },
    hostRatingAvg: { type: Number, default: 0 },
    hostRatingCount: { type: Number, default: 0 },
    guestRatingAvg: { type: Number, default: 0 },
    guestRatingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>('User', userSchema);
