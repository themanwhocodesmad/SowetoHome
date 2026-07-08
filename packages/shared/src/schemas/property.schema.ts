import { z } from 'zod';
import { PROPERTY_TYPES } from '../constants/enums.js';
import { MAX_PROPERTY_IMAGES } from '../constants/platform.js';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const locationSchema = z.object({
  address: z.string().min(1),
  suburb: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const basePropertySchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(4000),
  location: locationSchema,
  stayRate: z.number().positive(),
  minNights: z.number().int().positive(),
  maxNights: z.number().int().positive(),
  maxGuests: z.number().int().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  beds: z.number().int().positive(),
  amenities: z.array(z.string()).default([]),
  propertyType: z.enum(PROPERTY_TYPES),
  houseRules: z.string().max(2000).optional(),
  checkInTime: z.string().regex(TIME_RE, 'Expected HH:mm'),
  checkOutTime: z.string().regex(TIME_RE, 'Expected HH:mm'),
  // Only honored when an admin creates/edits a listing on behalf of a host (see claude_plan.md §2/§10).
  // Ignored for host-authored requests, which are always attributed to the logged-in host.
  hostId: z.string().optional(),
});

export const createPropertySchema = basePropertySchema.refine(
  (data) => data.maxNights >= data.minNights,
  { message: 'maxNights must be greater than or equal to minNights', path: ['maxNights'] },
);
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = basePropertySchema.partial();
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const propertySearchQuerySchema = z.object({
  city: z.string().optional(),
  province: z.string().optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  guests: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;

export const MAX_IMAGES = MAX_PROPERTY_IMAGES;
