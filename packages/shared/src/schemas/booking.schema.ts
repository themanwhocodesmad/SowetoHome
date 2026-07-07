import { z } from 'zod';

export const createBookingSchema = z
  .object({
    propertyId: z.string().min(1),
    checkIn: z.string().datetime(),
    checkOut: z.string().datetime(),
    numGuests: z.number().int().positive(),
  })
  .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
  });
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
