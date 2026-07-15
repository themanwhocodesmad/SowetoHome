import { z } from 'zod';
import { PROPERTY_STATUSES } from '../constants/enums.js';
import { MAX_FEATURED_LISTINGS } from '../constants/platform.js';

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

export const reviewHostApplicationSchema = z.object({
  approve: z.boolean(),
  reason: z.string().max(500).optional(),
});
export type ReviewHostApplicationInput = z.infer<typeof reviewHostApplicationSchema>;

export const updatePlatformSettingsSchema = z.object({
  adminFeePercent: z.number().min(0).max(100).optional(),
  cancellationFreeWindowHours: z.number().int().nonnegative().optional(),
});
export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;

const homepageStatSchema = z.object({
  value: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
});

const homepageStepSchema = z.object({
  number: z.string().min(1).max(8),
  title: z.string().min(1).max(120),
  copy: z.string().min(1).max(600),
});

export const updateHomepageSchema = z.object({
  content: z
    .object({
      heroEyebrow: z.string().min(1).max(120),
      heroTitle: z.string().min(1).max(200),
      heroTitleAccent: z.string().min(1).max(120),
      heroSubtitle: z.string().min(1).max(600),
      discoveryTitle: z.string().min(1).max(120),
      discoverySubtitle: z.string().min(1).max(300),
      trustStats: z.array(homepageStatSchema).min(1).max(6),
      valuePropEyebrow: z.string().min(1).max(120),
      valuePropTitle: z.string().min(1).max(300),
      valuePropCopy1: z.string().min(1).max(600),
      valuePropCopy2: z.string().min(1).max(600),
      valueSteps: z.array(homepageStepSchema).min(1).max(6),
    })
    .optional(),
  featuredPropertyIds: z.array(z.string().min(1)).max(MAX_FEATURED_LISTINGS).optional(),
});
export type UpdateHomepageInput = z.infer<typeof updateHomepageSchema>;
