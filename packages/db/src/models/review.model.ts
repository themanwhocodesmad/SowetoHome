import { Schema, model, Types, type HydratedDocument } from 'mongoose';

interface ReviewFields {
  bookingId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Guest rates the property they stayed at.
export interface IPropertyReview extends ReviewFields {
  guestId: Types.ObjectId;
  propertyId: Types.ObjectId;
}

// Guest rates the host they stayed with.
export interface IHostReview extends ReviewFields {
  guestId: Types.ObjectId;
  hostId: Types.ObjectId;
}

// Host rates the guest who stayed.
export interface IGuestReview extends ReviewFields {
  hostId: Types.ObjectId;
  guestId: Types.ObjectId;
}

export type PropertyReviewDocument = HydratedDocument<IPropertyReview>;
export type HostReviewDocument = HydratedDocument<IHostReview>;
export type GuestReviewDocument = HydratedDocument<IGuestReview>;

const ratingField = { type: Number, required: true, min: 1, max: 5 };
const commentField = { type: String, maxlength: 1000 };

const propertyReviewSchema = new Schema<IPropertyReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    rating: ratingField,
    comment: commentField,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const hostReviewSchema = new Schema<IHostReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: ratingField,
    comment: commentField,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const guestReviewSchema = new Schema<IGuestReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: ratingField,
    comment: commentField,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PropertyReviewModel = model<IPropertyReview>('PropertyReview', propertyReviewSchema);
export const HostReviewModel = model<IHostReview>('HostReview', hostReviewSchema);
export const GuestReviewModel = model<IGuestReview>('GuestReview', guestReviewSchema);
