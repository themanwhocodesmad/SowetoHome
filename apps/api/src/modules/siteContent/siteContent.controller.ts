import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok } from '../../common/http/respond.js';
import {
  platformSettingsService,
  resolveHomepageContent,
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