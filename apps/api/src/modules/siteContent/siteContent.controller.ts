import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok } from '../../common/http/respond.js';
import {
  platformSettingsService,
  resolveAboutContent,
  resolveContactContent,
  resolveHomepageContent,
  resolveServicesContent,
  resolveSectionSpacing,
  resolveTypography,
} from '../admin/platformSettings.service.js';
import { propertyService, toPropertyDto } from '../properties/property.service.js';

export const getImages = asyncHandler(async (_req: Request, res: Response) => {
  const siteImages = await platformSettingsService.getSiteImages();
  ok(res, siteImages);
});

export const getHomepage = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  const featuredIds = settings.featuredPropertyIds ?? [];
  const featuredProperties = await propertyService.getFeaturedPublished(featuredIds);

  ok(res, {
    siteImages: settings.siteImages ?? {},
    content: resolveHomepageContent(settings.homepageContent),
    featuredProperties: featuredProperties.map((p) => toPropertyDto(p)),
  });
});

// One shared query for anything applying site-wide (typography + every section's spacing
// preset) - fetched once at the app root instead of once per page.
export const getTheme = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, {
    typography: resolveTypography(settings.typography),
    sectionSpacing: resolveSectionSpacing(settings.sectionSpacing),
  });
});

export const getAbout = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, resolveAboutContent(settings.aboutContent));
});

export const getServices = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, resolveServicesContent(settings.servicesContent));
});

export const getContact = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await platformSettingsService.getOrCreate();
  ok(res, resolveContactContent(settings.contactContent));
});