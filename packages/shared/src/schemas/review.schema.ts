import { z } from 'zod';

export const submitReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

// Lets an admin seed a listing with realistic-looking reviews (no real booking/guest behind
// them) - see MAX_FAKE_REVIEWS_PER_PROPERTY in constants/platform.ts for the cap.
export const addFakeReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
  authorName: z.string().min(1).max(80),
  authorAvatarUrl: z.string().max(500).optional(),
});
export type AddFakeReviewInput = z.infer<typeof addFakeReviewSchema>;
