import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok } from '../../common/http/respond.js';
import { savedPropertyService } from './savedProperty.service.js';

export const save = asyncHandler(async (req: Request, res: Response) => {
  await savedPropertyService.save(req.authUser!.id, req.params.propertyId as string);
  ok(res, { saved: true });
});

export const unsave = asyncHandler(async (req: Request, res: Response) => {
  await savedPropertyService.unsave(req.authUser!.id, req.params.propertyId as string);
  ok(res, { saved: false });
});

export const listIds = asyncHandler(async (req: Request, res: Response) => {
  const ids = await savedPropertyService.listIds(req.authUser!.id);
  ok(res, ids);
});

export const listProperties = asyncHandler(async (req: Request, res: Response) => {
  const properties = await savedPropertyService.listProperties(req.authUser!.id);
  ok(res, properties);
});
