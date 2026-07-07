import { z } from 'zod';

export const markPayoutPaidSchema = z.object({
  notes: z.string().max(500).optional(),
});
export type MarkPayoutPaidInput = z.infer<typeof markPayoutPaidSchema>;
