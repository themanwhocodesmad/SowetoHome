import { z } from 'zod';

export const submitReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
