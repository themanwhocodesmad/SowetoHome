import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(6).max(20).optional(),
  payoutDetails: z
    .object({
      bankName: z.string().min(1).max(120),
      accountNumber: z.string().min(1).max(64),
      accountHolder: z.string().min(1).max(120),
    })
    .optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const addHostRoleSchema = z.object({
  confirm: z.literal(true),
});
export type AddHostRoleInput = z.infer<typeof addHostRoleSchema>;
