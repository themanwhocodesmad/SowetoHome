import type {
  AboutContentDto,
  ContactContentDto,
  HomepageContentDto,
  PaymentGatewaySettingsDto,
  SectionSpacingMap,
  ServicesContentDto,
  TypographySettings,
  UpdateAboutContentInput,
  UpdateContactContentInput,
  UpdateHomepageInput,
  UpdatePaymentGatewaySettingsInput,
  UpdatePaymentGatewaySettingsResponseDto,
  UpdatePlatformSettingsInput,
  UpdateSectionSpacingInput,
  UpdateServicesContentInput,
  UpdateTypographyInput,
} from '@soweto-stays/shared';
import { registerYocoWebhook } from '../payments/yoco.webhooks.js';
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_SECTION_SPACING,
  DEFAULT_SERVICES_CONTENT,
  DEFAULT_TYPOGRAPHY,
} from '@soweto-stays/shared';
import {
  PLATFORM_SETTINGS_ID,
  PlatformSettingsModel,
  type IPaymentGatewaySettings,
  type PlatformSettingsDocument,
} from '@soweto-stays/db';

// Atomic upsert avoids a race on the very first read (two concurrent requests both finding
// no document and both trying to create it) - Mongoose applies schema defaults on insert.
function getOrCreate(): Promise<PlatformSettingsDocument> {
  return PlatformSettingsModel.findByIdAndUpdate(
    PLATFORM_SETTINGS_ID,
    { $setOnInsert: { _id: PLATFORM_SETTINGS_ID } },
    { upsert: true, new: true },
  );
}

export function resolveHomepageContent(
  stored: HomepageContentDto | undefined | null,
): HomepageContentDto {
  return stored ?? DEFAULT_HOMEPAGE_CONTENT;
}

export function resolveAboutContent(stored: AboutContentDto | undefined | null): AboutContentDto {
  return stored ?? DEFAULT_ABOUT_CONTENT;
}

export function resolveServicesContent(
  stored: ServicesContentDto | undefined | null,
): ServicesContentDto {
  return stored ?? DEFAULT_SERVICES_CONTENT;
}

export function resolveContactContent(
  stored: ContactContentDto | undefined | null,
): ContactContentDto {
  return stored ?? DEFAULT_CONTACT_CONTENT;
}

export function resolveSectionSpacing(
  stored: Partial<SectionSpacingMap> | undefined | null,
): SectionSpacingMap {
  return { ...DEFAULT_SECTION_SPACING, ...stored };
}

const DEFAULT_PAYMENT_GATEWAY_SETTINGS: IPaymentGatewaySettings = {
  activeProvider: 'yoco',
  yoco: { enabled: false },
  payfast: { enabled: false, mode: 'sandbox' },
};

export function resolvePaymentGatewaySettings(
  stored: IPaymentGatewaySettings | undefined | null,
): IPaymentGatewaySettings {
  return {
    activeProvider: stored?.activeProvider ?? DEFAULT_PAYMENT_GATEWAY_SETTINGS.activeProvider,
    yoco: { ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.yoco, ...stored?.yoco },
    payfast: { ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.payfast, ...stored?.payfast },
  };
}

function last4(value: string | undefined): string | undefined {
  if (!value || value.length < 4) return undefined;
  return `••••${value.slice(-4)}`;
}

// Never returns a real secret - only whether one is set, plus a last-4 hint so an admin
// can recognize which credential is currently saved without it ever leaving the server.
export function maskPaymentGatewaySettings(
  settings: IPaymentGatewaySettings,
): PaymentGatewaySettingsDto {
  return {
    activeProvider: settings.activeProvider,
    yoco: {
      enabled: settings.yoco.enabled,
      hasSecretKey: Boolean(settings.yoco.secretKey),
      secretKeyHint: last4(settings.yoco.secretKey),
      hasWebhookSecret: Boolean(settings.yoco.webhookSecret),
      webhookUrl: settings.yoco.webhookUrl,
      mode: settings.yoco.secretKey?.startsWith('sk_live_')
        ? 'live'
        : settings.yoco.secretKey
          ? 'test'
          : undefined,
    },
    payfast: {
      enabled: settings.payfast.enabled,
      merchantId: settings.payfast.merchantId,
      hasMerchantKey: Boolean(settings.payfast.merchantKey),
      merchantKeyHint: last4(settings.payfast.merchantKey),
      hasPassphrase: Boolean(settings.payfast.passphrase),
      mode: settings.payfast.mode,
    },
  };
}

export function resolveTypography(
  stored: Partial<TypographySettings> | undefined | null,
): TypographySettings {
  return { ...DEFAULT_TYPOGRAPHY, ...stored };
}

export const platformSettingsService = {
  getOrCreate,

  async getCancellationFreeWindowHours(): Promise<number> {
    const settings = await getOrCreate();
    return settings.cancellationFreeWindowHours;
  },

  async update(input: UpdatePlatformSettingsInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    if (input.cancellationFreeWindowHours !== undefined) {
      settings.cancellationFreeWindowHours = input.cancellationFreeWindowHours;
    }
    return settings.save();
  },

  async updateSectionSpacing(input: UpdateSectionSpacingInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.sectionSpacing = { ...settings.sectionSpacing, ...input };
    settings.markModified('sectionSpacing');
    return settings.save();
  },

  async updateTypography(input: UpdateTypographyInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.typography = { ...settings.typography, ...input };
    settings.markModified('typography');
    return settings.save();
  },

  async updateAboutContent(input: UpdateAboutContentInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.aboutContent = input;
    settings.markModified('aboutContent');
    return settings.save();
  },

  async updateServicesContent(input: UpdateServicesContentInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.servicesContent = input;
    settings.markModified('servicesContent');
    return settings.save();
  },

  async updateContactContent(input: UpdateContactContentInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.contactContent = input;
    settings.markModified('contactContent');
    return settings.save();
  },

  async getSiteImages(): Promise<Record<string, string>> {
    const settings = await getOrCreate();
    return settings.siteImages ?? {};
  },

  async setSiteImage(key: string, imagePath: string): Promise<Record<string, string>> {
    const settings = await getOrCreate();
    settings.siteImages = { ...settings.siteImages, [key]: imagePath };
    settings.markModified('siteImages');
    await settings.save();
    return settings.siteImages;
  },

  async clearSiteImage(key: string): Promise<Record<string, string>> {
    const settings = await getOrCreate();
    const { [key]: _removed, ...rest } = settings.siteImages ?? {};
    settings.siteImages = rest;
    settings.markModified('siteImages');
    await settings.save();
    return settings.siteImages;
  },

  async getHomepageContent(): Promise<HomepageContentDto> {
    const settings = await getOrCreate();
    return resolveHomepageContent(settings.homepageContent);
  },

  async getSectionSpacing(): Promise<SectionSpacingMap> {
    const settings = await getOrCreate();
    return resolveSectionSpacing(settings.sectionSpacing);
  },

  async getTypography(): Promise<TypographySettings> {
    const settings = await getOrCreate();
    return resolveTypography(settings.typography);
  },

  async getAboutContent(): Promise<AboutContentDto> {
    const settings = await getOrCreate();
    return resolveAboutContent(settings.aboutContent);
  },

  async getServicesContent(): Promise<ServicesContentDto> {
    const settings = await getOrCreate();
    return resolveServicesContent(settings.servicesContent);
  },

  async getContactContent(): Promise<ContactContentDto> {
    const settings = await getOrCreate();
    return resolveContactContent(settings.contactContent);
  },

  // Raw credentials, for payment.service.ts to actually call the gateway APIs with - never
  // exposed to an HTTP response. See getPaymentGatewaySettings below for the admin-facing,
  // secret-masked equivalent.
  async getRawPaymentGatewaySettings(): Promise<IPaymentGatewaySettings> {
    const settings = await getOrCreate();
    return resolvePaymentGatewaySettings(settings.paymentGateways);
  },

  async getPaymentGatewaySettings(): Promise<PaymentGatewaySettingsDto> {
    const settings = await getOrCreate();
    return maskPaymentGatewaySettings(resolvePaymentGatewaySettings(settings.paymentGateways));
  },

  // Every credential field is a deliberate overwrite - sending an empty string clears it
  // (see updatePaymentGatewaySettingsSchema in shared), so "save with the key field blank"
  // is how an admin removes a previously-saved secret.
  //
  // publicOrigin (e.g. "https://bookmystaysa.co.za", derived from the request in
  // admin.controller.ts) is only used to build the Yoco webhook URL when a secret key is
  // (re)saved - see registerYocoWebhook below. Nothing else in here needs it.
  async updatePaymentGatewaySettings(
    input: UpdatePaymentGatewaySettingsInput,
    publicOrigin: string,
  ): Promise<UpdatePaymentGatewaySettingsResponseDto> {
    const settings = await getOrCreate();
    const current = resolvePaymentGatewaySettings(settings.paymentGateways);

    const next: IPaymentGatewaySettings = {
      activeProvider: input.activeProvider ?? current.activeProvider,
      yoco: {
        enabled: input.yoco?.enabled ?? current.yoco.enabled,
        secretKey: input.yoco?.secretKey !== undefined ? input.yoco.secretKey || undefined : current.yoco.secretKey,
        // Never set from admin input (see updatePaymentGatewaySettingsSchema) - only ever
        // filled in below by registerYocoWebhook, or carried over unchanged.
        webhookSecret: current.yoco.webhookSecret,
        webhookUrl: current.yoco.webhookUrl,
      },
      payfast: {
        enabled: input.payfast?.enabled ?? current.payfast.enabled,
        merchantId:
          input.payfast?.merchantId !== undefined
            ? input.payfast.merchantId || undefined
            : current.payfast.merchantId,
        merchantKey:
          input.payfast?.merchantKey !== undefined
            ? input.payfast.merchantKey || undefined
            : current.payfast.merchantKey,
        passphrase:
          input.payfast?.passphrase !== undefined
            ? input.payfast.passphrase || undefined
            : current.payfast.passphrase,
        mode: input.payfast?.mode ?? current.payfast.mode,
      },
    };

    // Auto-register (or reuse) the Yoco webhook whenever a new/changed secret key comes in,
    // or whenever Yoco is enabled with a saved key that's never been registered yet (e.g.
    // enabling it for the first time after the key was already on file) - an admin never has
    // to touch the Yoco dashboard themselves.
    let message: string | undefined;
    const secretKeyChanged =
      input.yoco?.secretKey !== undefined && input.yoco.secretKey !== current.yoco.secretKey;
    const needsFirstRegistration = next.yoco.enabled && next.yoco.secretKey && !next.yoco.webhookUrl;

    if (next.yoco.secretKey && (secretKeyChanged || needsFirstRegistration)) {
      const webhookUrl = `${publicOrigin}/api/payments/yoco/notify`;
      const registered = await registerYocoWebhook(next.yoco.secretKey, webhookUrl);
      next.yoco.webhookUrl = registered.webhookUrl;
      if (registered.webhookSecret) {
        next.yoco.webhookSecret = registered.webhookSecret;
      }
      message = 'Yoco credentials saved and Webhook automatically registered!';
    }

    settings.paymentGateways = next;
    settings.markModified('paymentGateways');
    await settings.save();
    return { ...maskPaymentGatewaySettings(next), message };
  },

  async getFeaturedPropertyIds(): Promise<string[]> {
    const settings = await getOrCreate();
    return settings.featuredPropertyIds ?? [];
  },

  async updateHomepage(input: UpdateHomepageInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    if (input.content !== undefined) {
      settings.homepageContent = input.content;
      settings.markModified('homepageContent');
    }
    if (input.featuredPropertyIds !== undefined) {
      settings.featuredPropertyIds = input.featuredPropertyIds;
    }
    return settings.save();
  },
};