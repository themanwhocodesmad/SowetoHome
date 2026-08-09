import { z } from 'zod';
import { PROPERTY_STATUSES } from '../constants/enums.js';
import {
  BASE_SIZE_SCALES,
  BODY_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  MAX_FEATURED_LISTINGS,
  SECTION_KEYS,
  SECTION_SPACING_PRESETS,
  type BodyFontKey,
  type HeadingFontKey,
} from '../constants/platform.js';

const HEADING_FONT_KEYS = HEADING_FONT_OPTIONS.map((o) => o.key) as [
  HeadingFontKey,
  ...HeadingFontKey[],
];
const BODY_FONT_KEYS = BODY_FONT_OPTIONS.map((o) => o.key) as [BodyFontKey, ...BodyFontKey[]];

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

// Every credential field is optional and, when sent as an empty string, clears the
// currently-saved value (see platformSettings.service.ts) - so an admin can update just
// one field (e.g. flip `enabled`) without needing to resend/re-know the existing secret.
export const updatePaymentGatewaySettingsSchema = z.object({
  activeProvider: z.enum(['yoco', 'payfast']).optional(),
  // No webhookSecret/webhookUrl here - those are auto-registered with Yoco server-side
  // whenever secretKey is (re)saved (see yoco.webhooks.ts), never entered by hand.
  yoco: z
    .object({
      enabled: z.boolean().optional(),
      secretKey: z.string().max(200).optional(),
    })
    .optional(),
  payfast: z
    .object({
      enabled: z.boolean().optional(),
      merchantId: z.string().max(100).optional(),
      merchantKey: z.string().max(200).optional(),
      passphrase: z.string().max(200).optional(),
      mode: z.enum(['sandbox', 'live']).optional(),
    })
    .optional(),
});
export type UpdatePaymentGatewaySettingsInput = z.infer<typeof updatePaymentGatewaySettingsSchema>;

export const updatePlatformSettingsSchema = z.object({
  cancellationFreeWindowHours: z.number().int().nonnegative().optional(),
});
export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;

// Partial map so an admin can update a single section's preset without resending all of them.
export const updateSectionSpacingSchema = z.object(
  Object.fromEntries(SECTION_KEYS.map((key) => [key, z.enum(SECTION_SPACING_PRESETS).optional()])),
);
export type UpdateSectionSpacingInput = z.infer<typeof updateSectionSpacingSchema>;

export const updateTypographySchema = z.object({
  headingFont: z.enum(HEADING_FONT_KEYS).optional(),
  bodyFont: z.enum(BODY_FONT_KEYS).optional(),
  baseSizeScale: z.enum(BASE_SIZE_SCALES).optional(),
});
export type UpdateTypographyInput = z.infer<typeof updateTypographySchema>;

const serviceItemSchema = z.object({
  title: z.string().min(1).max(80),
  copy: z.string().min(1).max(600),
});

export const updateAboutContentSchema = z.object({
  visionEyebrow: z.string().min(1).max(120),
  visionTitle: z.string().min(1).max(200),
  visionCopy1: z.string().min(1).max(2000),
  visionCopy2: z.string().min(1).max(2000),
  corporateEyebrow: z.string().min(1).max(120),
  corporateTitle: z.string().min(1).max(200),
  corporateCopy: z.string().min(1).max(2000),
});
export type UpdateAboutContentInput = z.infer<typeof updateAboutContentSchema>;

export const updateServicesContentSchema = z.object({
  eyebrow: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  subtitle: z.string().min(1).max(600),
  services: z.array(serviceItemSchema).min(1).max(12),
});
export type UpdateServicesContentInput = z.infer<typeof updateServicesContentSchema>;

export const updateContactContentSchema = z.object({
  eyebrow: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  subtitle: z.string().min(1).max(600),
  consultationTitle: z.string().min(1).max(120),
  consultationCopy: z.string().min(1).max(600),
  email: z.string().min(1).max(200),
  phone: z.string().min(1).max(60),
  showPhone: z.boolean(),
});
export type UpdateContactContentInput = z.infer<typeof updateContactContentSchema>;

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
      discoveryEyebrow: z.string().min(1).max(120),
      discoveryTitle: z.string().min(1).max(120),
      discoverySubtitle: z.string().min(1).max(300),
      trustStats: z.array(homepageStatSchema).min(1).max(6),
      valuePropEyebrow: z.string().min(1).max(120),
      valuePropTitle: z.string().min(1).max(300),
      valuePropTitleAccent: z.string().min(1).max(120),
      valuePropCopy1: z.string().min(1).max(600),
      valuePropCopy2: z.string().min(1).max(600),
      valueSteps: z.array(homepageStepSchema).min(1).max(6),
    })
    .optional(),
  featuredPropertyIds: z.array(z.string().min(1)).max(MAX_FEATURED_LISTINGS).optional(),
});
export type UpdateHomepageInput = z.infer<typeof updateHomepageSchema>;
