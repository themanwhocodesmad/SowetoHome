import { Schema, model, type HydratedDocument } from 'mongoose';
import { CANCELLATION_FREE_WINDOW_HOURS, DEFAULT_ADMIN_FEE_PERCENT } from '@soweto-stays/shared';

export interface IPlatformSettings {
  _id: string;
  adminFeePercent: number;
  cancellationFreeWindowHours: number;
  siteImages: Record<string, string>;
  updatedAt: Date;
}

export type PlatformSettingsDocument = HydratedDocument<IPlatformSettings>;

// Single document ("singleton") pattern - always read/written via this fixed id, so admins
// can tune business parameters (fee %, cancellation window) without a code deploy.
export const PLATFORM_SETTINGS_ID = 'singleton';

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    _id: { type: String, default: PLATFORM_SETTINGS_ID },
    adminFeePercent: { type: Number, default: DEFAULT_ADMIN_FEE_PERCENT, min: 0, max: 100 },
    cancellationFreeWindowHours: {
      type: Number,
      default: CANCELLATION_FREE_WINDOW_HOURS,
      min: 0,
    },
    siteImages: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const PlatformSettingsModel = model<IPlatformSettings>(
  'PlatformSettings',
  platformSettingsSchema,
);
