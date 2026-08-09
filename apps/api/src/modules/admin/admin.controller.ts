import type { Request, Response } from 'express';
import type {
  ModeratePropertyInput,
  PaymentProvider,
  SuspendUserInput,
  UpdateAboutContentInput,
  UpdateContactContentInput,
  UpdateHomepageInput,
  UpdatePaymentGatewaySettingsInput,
  UpdatePlatformSettingsInput,
  UpdateSectionSpacingInput,
  UpdateServicesContentInput,
  UpdateTypographyInput,
} from '@soweto-stays/shared';
import { SITE_IMAGE_KEYS } from '@soweto-stays/shared';
import { env } from '../../common/config/env.js';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { AppError } from '../../common/errors/AppError.js';
import { ok, paginated } from '../../common/http/respond.js';
import { userService, toUserDto } from '../users/user.service.js';
import { propertyService, toPropertyDto } from '../properties/property.service.js';
import { bookingService, toBookingDto } from '../bookings/booking.service.js';
import { paymentService } from '../payments/payment.service.js';
import {
  platformSettingsService,
  resolveAboutContent,
  resolveContactContent,
  resolveHomepageContent,
  resolveServicesContent,
  resolveSectionSpacing,
  resolveTypography,
} from './platformSettings.service.js';
import { adminService } from './admin.service.js';
import { toPublicSiteImagePath } from './siteImage.upload.js';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const role = req.query.role as string | undefined;
  const { items, total } = await userService.listPaginated(page, limit, role);
  paginated(res, items.map((u) => toUserDto(u)), page, limit, total);
});

// `reason` is validated but not persisted anywhere yet - there's no moderation audit-log
// model in v1 (see claude_plan.md); add one if/when that history actually needs to be reviewable.
export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const { isSuspended } = req.body as SuspendUserInput;
  const user = await userService.setSuspended(req.params.id as string, isSuspended);
  ok(res, toUserDto(user));
});

export const listProperties = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as string | undefined;
  const hostId = req.query.hostId as string | undefined;
  const { items, total } = await propertyService.listForAdmin(page, limit, status, hostId);
  paginated(res, items.map((p) => toPropertyDto(p)), page, limit, total);
});

export const moderateProperty = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as ModeratePropertyInput;
  const property = await propertyService.setStatus(req.params.id as string, status);
  ok(res, toPropertyDto(property));
});

export const listBookings = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as string | undefined;
  const { items, total } = await bookingService.listForAdmin(page, limit, status);
  paginated(res, items.map((b) => toBookingDto(b)), page, limit, total);
});

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, {
    cancellationFreeWindowHours: settings.cancellationFreeWindowHours,
    sectionSpacing: resolveSectionSpacing(settings.sectionSpacing),
    typography: resolveTypography(settings.typography),
  });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdatePlatformSettingsInput;
  const settings = await platformSettingsService.update(input);
  ok(res, {
    cancellationFreeWindowHours: settings.cancellationFreeWindowHours,
    sectionSpacing: resolveSectionSpacing(settings.sectionSpacing),
    typography: resolveTypography(settings.typography),
  });
});

export const updateSectionSpacing = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateSectionSpacingInput;
  const settings = await platformSettingsService.updateSectionSpacing(input);
  ok(res, resolveSectionSpacing(settings.sectionSpacing));
});

export const updateTypography = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateTypographyInput;
  const settings = await platformSettingsService.updateTypography(input);
  ok(res, resolveTypography(settings.typography));
});

export const getPaymentGatewaySettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getPaymentGatewaySettings();
  ok(res, settings);
});

// The Yoco webhook URL (see registerYocoWebhook) needs this app's own public origin -
// prefer the configured API_PUBLIC_URL (already used for PayFast's notify_url, reliable
// behind a reverse proxy) and only fall back to the request's Host header when that's still
// at its localhost default (e.g. a dev environment where it was never set).
function resolvePublicOrigin(req: Request): string {
  if (!env.API_PUBLIC_URL.includes('localhost')) return env.API_PUBLIC_URL;
  return `${req.protocol}://${req.headers.host}`;
}

export const updatePaymentGatewaySettings = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdatePaymentGatewaySettingsInput;
  const settings = await platformSettingsService.updatePaymentGatewaySettings(
    input,
    resolvePublicOrigin(req),
  );
  ok(res, settings);
});

export const testPaymentWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { provider } = req.body as { provider: PaymentProvider };
  if (provider !== 'yoco' && provider !== 'payfast') {
    throw AppError.badRequest('provider must be "yoco" or "payfast"');
  }
  const result = await paymentService.testWebhookConfig(provider);
  ok(res, result);
});

export const getAboutContent = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, resolveAboutContent(settings.aboutContent));
});

export const updateAboutContent = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateAboutContentInput;
  const settings = await platformSettingsService.updateAboutContent(input);
  ok(res, resolveAboutContent(settings.aboutContent));
});

export const getServicesContent = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, resolveServicesContent(settings.servicesContent));
});

export const updateServicesContent = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateServicesContentInput;
  const settings = await platformSettingsService.updateServicesContent(input);
  ok(res, resolveServicesContent(settings.servicesContent));
});

export const getContactContent = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, resolveContactContent(settings.contactContent));
});

export const updateContactContent = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateContactContentInput;
  const settings = await platformSettingsService.updateContactContent(input);
  ok(res, resolveContactContent(settings.contactContent));
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await adminService.getAnalytics();
  ok(res, analytics);
});

function assertKnownSiteImageKey(key: string): void {
  if (!(SITE_IMAGE_KEYS as string[]).includes(key)) {
    throw AppError.badRequest(`Unknown site image key: ${key}`);
  }
}

export const getSiteImages = asyncHandler(async (_req: Request, res: Response) => {
  const siteImages = await platformSettingsService.getSiteImages();
  ok(res, siteImages);
});

export const uploadSiteImage = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  assertKnownSiteImageKey(key);
  const file = req.file as Express.Multer.File | undefined;
  if (!file) throw AppError.badRequest('No image file was uploaded');
  const siteImages = await platformSettingsService.setSiteImage(key, toPublicSiteImagePath(file.filename));
  ok(res, siteImages);
});

export const deleteSiteImage = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  assertKnownSiteImageKey(key);
  const siteImages = await platformSettingsService.clearSiteImage(key);
  ok(res, siteImages);
});

export const getHomepage = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, {
    siteImages: settings.siteImages ?? {},
    content: resolveHomepageContent(settings.homepageContent),
    featuredPropertyIds: settings.featuredPropertyIds ?? [],
  });
});

export const updateHomepage = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateHomepageInput;
  const settings = await platformSettingsService.updateHomepage(input);
  ok(res, {
    siteImages: settings.siteImages ?? {},
    content: resolveHomepageContent(settings.homepageContent),
    featuredPropertyIds: settings.featuredPropertyIds ?? [],
  });
});
