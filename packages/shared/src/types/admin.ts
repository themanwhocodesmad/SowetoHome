import type { PropertyDto } from './property.js';
import type { SectionSpacingMap, TypographySettings } from '../constants/platform.js';

export interface AdminAnalyticsDto {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
}

// ---------- Payment gateway settings (Yoco + PayFast), admin-configurable from the dashboard ----------

export type PaymentProvider = 'yoco' | 'payfast';

export interface YocoGatewaySettingsDto {
  enabled: boolean;
  // Secrets are never round-tripped to the client - only whether one is currently set,
  // plus a last-4 hint so an admin can recognize which key is saved without re-exposing it.
  hasSecretKey: boolean;
  secretKeyHint?: string;
  hasWebhookSecret: boolean;
  // Auto-registered with Yoco when the secret key is saved (see yoco.webhooks.ts) - shown
  // read-only in the admin UI as confirmation, never entered manually.
  webhookUrl?: string;
  // Derived from the secret key's sk_test_/sk_live_ prefix, not stored separately.
  mode?: 'test' | 'live';
}

export interface PayFastGatewaySettingsDto {
  enabled: boolean;
  merchantId?: string;
  hasMerchantKey: boolean;
  merchantKeyHint?: string;
  hasPassphrase: boolean;
  mode: 'sandbox' | 'live';
}

export interface PaymentGatewaySettingsDto {
  activeProvider: PaymentProvider;
  yoco: YocoGatewaySettingsDto;
  payfast: PayFastGatewaySettingsDto;
}

// PATCH /api/admin/payment-settings' response - same as the GET shape, plus an optional
// human-readable status line (e.g. confirming Yoco's webhook was just auto-registered) for
// the admin UI to surface after a save.
export interface UpdatePaymentGatewaySettingsResponseDto extends PaymentGatewaySettingsDto {
  message?: string;
}

export interface PlatformSettingsDto {
  cancellationFreeWindowHours: number;
  sectionSpacing: SectionSpacingMap;
  typography: TypographySettings;
}

export type SiteImagesDto = Record<string, string>;

export interface HomepageStatDto {
  value: string;
  label: string;
}

export interface HomepageStepDto {
  number: string;
  title: string;
  copy: string;
}

export interface HomepageContentDto {
  heroEyebrow: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  discoveryEyebrow: string;
  discoveryTitle: string;
  discoverySubtitle: string;
  trustStats: HomepageStatDto[];
  valuePropEyebrow: string;
  valuePropTitle: string;
  valuePropTitleAccent: string;
  valuePropCopy1: string;
  valuePropCopy2: string;
  valueSteps: HomepageStepDto[];
}

export interface AdminHomepageDto {
  siteImages: SiteImagesDto;
  content: HomepageContentDto;
  featuredPropertyIds: string[];
}

export interface PublicHomepageDto {
  siteImages: SiteImagesDto;
  content: HomepageContentDto;
  featuredProperties: PropertyDto[];
}

// ---------- About / Services / Contact page content (admin-editable, like the homepage) ----------

export interface AboutContentDto {
  visionEyebrow: string;
  visionTitle: string;
  visionCopy1: string;
  visionCopy2: string;
  corporateEyebrow: string;
  corporateTitle: string;
  corporateCopy: string;
}

export interface ServiceItemDto {
  title: string;
  copy: string;
}

export interface ServicesContentDto {
  eyebrow: string;
  title: string;
  subtitle: string;
  services: ServiceItemDto[];
}

export interface ContactContentDto {
  eyebrow: string;
  title: string;
  subtitle: string;
  consultationTitle: string;
  consultationCopy: string;
  email: string;
  phone: string;
  showPhone: boolean;
}

// ---------- Site-wide theme (typography + per-section spacing), fetched once at app root ----------

export interface SiteThemeDto {
  typography: TypographySettings;
  sectionSpacing: SectionSpacingMap;
}