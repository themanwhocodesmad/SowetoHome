import { Schema, model, type HydratedDocument } from 'mongoose';
import {
  CANCELLATION_FREE_WINDOW_HOURS,
  type AboutContentDto,
  type ContactContentDto,
  type SectionSpacingMap,
  type ServicesContentDto,
  type HomepageContentDto,
  type TypographySettings,
} from '@soweto-stays/shared';

// Raw (unmasked) credential storage - platformSettings.service.ts is the only place that
// reads this shape directly; everywhere else (admin API responses) gets the masked
// PaymentGatewaySettingsDto instead, which never round-trips a real secret to the client.
export interface IPaymentGatewaySettings {
  activeProvider: 'yoco' | 'payfast';
  yoco: {
    enabled: boolean;
    secretKey?: string;
    webhookSecret?: string;
  };
  payfast: {
    enabled: boolean;
    merchantId?: string;
    merchantKey?: string;
    passphrase?: string;
    mode: 'sandbox' | 'live';
  };
}

export interface IPlatformSettings {
  _id: string;
  cancellationFreeWindowHours: number;
  siteImages: Record<string, string>;
  homepageContent?: HomepageContentDto;
  featuredPropertyIds: string[];
  sectionSpacing?: Partial<SectionSpacingMap>;
  typography?: Partial<TypographySettings>;
  aboutContent?: AboutContentDto;
  servicesContent?: ServicesContentDto;
  contactContent?: ContactContentDto;
  paymentGateways?: IPaymentGatewaySettings;
  updatedAt: Date;
}

export type PlatformSettingsDocument = HydratedDocument<IPlatformSettings>;

// Single document ("singleton") pattern - always read/written via this fixed id, so admins
// can tune business parameters (fee %, cancellation window) without a code deploy.
export const PLATFORM_SETTINGS_ID = 'singleton';

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    _id: { type: String, default: PLATFORM_SETTINGS_ID },
    cancellationFreeWindowHours: {
      type: Number,
      default: CANCELLATION_FREE_WINDOW_HOURS,
      min: 0,
    },
    siteImages: { type: Schema.Types.Mixed, default: {} },
    homepageContent: { type: Schema.Types.Mixed, required: false },
    featuredPropertyIds: { type: [String], default: [] },
    // Mixed (resolved against DEFAULT_* constants in application code, same pattern as
    // homepageContent above) rather than strict per-field Mongoose schemas - keeps adding
    // a new editable field a shared-package-only change, no model migration required.
    sectionSpacing: { type: Schema.Types.Mixed, default: {} },
    typography: { type: Schema.Types.Mixed, default: {} },
    aboutContent: { type: Schema.Types.Mixed, required: false },
    servicesContent: { type: Schema.Types.Mixed, required: false },
    contactContent: { type: Schema.Types.Mixed, required: false },
    paymentGateways: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const PlatformSettingsModel = model<IPlatformSettings>(
  'PlatformSettings',
  platformSettingsSchema,
);
