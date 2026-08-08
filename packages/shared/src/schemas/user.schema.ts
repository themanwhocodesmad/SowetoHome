import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(6).max(20).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
