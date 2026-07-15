import type { Request, Response } from 'express';
import type {
  ModeratePropertyInput,
  ReviewHostApplicationInput,
  SuspendUserInput,
  UpdateHomepageInput,
  UpdatePlatformSettingsInput,
} from '@soweto-stays/shared';
import { SITE_IMAGE_KEYS } from '@soweto-stays/shared';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { AppError } from '../../common/errors/AppError.js';
import { ok, paginated } from '../../common/http/respond.js';
import { userService, toUserDto } from '../users/user.service.js';
import { propertyService, toPropertyDto } from '../properties/property.service.js';
import { bookingService, toBookingDto } from '../bookings/booking.service.js';
import { platformSettingsService, resolveHomepageContent } from './platformSettings.service.js';
import { adminService } from './admin.service.js';
import { toPublicSiteImagePath } from './siteImage.upload.js';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const { items, total } = await userService.listPaginated(page, limit);
  paginated(res, items.map((u) => toUserDto(u)), page, limit, total);
});

// `reason` is validated but not persisted anywhere yet - there's no moderation audit-log
// model in v1 (see claude_plan.md); add one if/when that history actually needs to be reviewable.
export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const { isSuspended } = req.body as SuspendUserInput;
  const user = await userService.setSuspended(req.params.id as string, isSuspended);
  ok(res, toUserDto(user));
});

export const listHostApplications = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = (req.query.status as string | undefined) ?? 'pending';
  const { items, total } = await userService.listHostApplications(status, page, limit);
  paginated(res, items.map((u) => toUserDto(u)), page, limit, total);
});

// `reason` is validated but, like suspendUser's, not persisted - no moderation audit log in v1.
export const reviewHostApplication = asyncHandler(async (req: Request, res: Response) => {
  const { approve } = req.body as ReviewHostApplicationInput;
  const user = await userService.reviewHostApplication(req.params.id as string, approve);
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
    adminFeePercent: settings.adminFeePercent,
    cancellationFreeWindowHours: settings.cancellationFreeWindowHours,
  });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdatePlatformSettingsInput;
  const settings = await platformSettingsService.update(input);
  ok(res, {
    adminFeePercent: settings.adminFeePercent,
    cancellationFreeWindowHours: settings.cancellationFreeWindowHours,
  });
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
