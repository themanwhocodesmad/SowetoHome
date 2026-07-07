import { Schema, model, Types, type HydratedDocument } from 'mongoose';
import {
  MAX_PROPERTY_IMAGES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type PropertyStatus,
  type PropertyType,
} from '@soweto-stays/shared';

export interface Location {
  address: string;
  suburb: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
}

export interface IProperty {
  hostId: Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  location: Location;
  stayRate: number;
  minNights: number;
  maxNights: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  amenities: string[];
  propertyType: PropertyType;
  houseRules?: string;
  checkInTime: string;
  checkOutTime: string;
  isAvailable: boolean;
  status: PropertyStatus;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyDocument = HydratedDocument<IProperty>;

const locationSchema = new Schema<Location>(
  {
    address: { type: String, required: true },
    suburb: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const propertySchema = new Schema<IProperty>(
  {
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= MAX_PROPERTY_IMAGES,
        message: `A property can have at most ${MAX_PROPERTY_IMAGES} images`,
      },
    },
    location: { type: locationSchema, required: true },
    stayRate: { type: Number, required: true, min: 0 },
    minNights: { type: Number, required: true, min: 1 },
    maxNights: { type: Number, required: true, min: 1 },
    maxGuests: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    beds: { type: Number, required: true, min: 1 },
    amenities: { type: [String], default: [] },
    propertyType: { type: String, enum: PROPERTY_TYPES, required: true },
    houseRules: { type: String },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    status: { type: String, enum: PROPERTY_STATUSES, default: 'pending_review', index: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

propertySchema.index({ 'location.city': 1 });
propertySchema.index({ status: 1, isAvailable: 1 });

export const PropertyModel = model<IProperty>('Property', propertySchema);
