import { z } from 'zod';
import { PROPERTY_STATUSES } from '../constants/enums.js';

export const moderatePropertySchema = z.object({
  status: z.enum(PROPERTY_STATUSES),
  reason: z.string().max(500).optional(),
});
export type ModeratePropertyInput = z.infer<typeof moderatePropertySchema>;

export const suspendUserSchema = z.object({
  isSuspended: z.boolean(),
  reason: z.string().max(500).optional(),
});
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;

export const updatePlatformSettingsSchema = z.object({
  adminFeePercent: z.number().min(0).max(100).optional(),
  cancellationFreeWindowHours: z.number().int().nonnegative().optional(),
});
export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;
