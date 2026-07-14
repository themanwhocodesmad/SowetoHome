import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok } from '../../common/http/respond.js';
import { platformSettingsService } from '../admin/platformSettings.service.js';

export const getImages = asyncHandler(async (_req: Request, res: Response) => {
  const siteImages = await platformSettingsService.getSiteImages();
  ok(res, siteImages);
});
