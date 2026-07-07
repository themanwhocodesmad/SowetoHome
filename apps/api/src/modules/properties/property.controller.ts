import type { Request, Response } from 'express';
import type {
  CreatePropertyInput,
  PropertySearchQuery,
  UpdatePropertyInput,
} from '@soweto-stays/shared';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { AppError } from '../../common/errors/AppError.js';
import { created, ok, paginated } from '../../common/http/respond.js';
import { propertyService, toPropertyDto } from './property.service.js';
import { toPublicImagePath } from './upload.js';

export const createMine = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreatePropertyInput;
  const property = await propertyService.createByHost(req.authUser!.id, input);
  created(res, toPropertyDto(property));
});

export const createOnBehalf = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreatePropertyInput;
  const { hostId } = req.params as { hostId: string };
  const property = await propertyService.createByAdmin(hostId, input);
  created(res, toPropertyDto(property));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdatePropertyInput;
  const property = await propertyService.update(req.params.id as string, req.authUser!, input);
  ok(res, toPropertyDto(property));
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const properties = await propertyService.listMine(req.authUser!.id);
  ok(res, properties.map((p) => toPropertyDto(p)));
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as PropertySearchQuery;
  const { items, total } = await propertyService.search(query);
  paginated(res, items.map((p) => toPropertyDto(p)), query.page, query.limit, total);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.getPublicById(req.params.id as string, req.authUser);
  ok(res, toPropertyDto(property));
});

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params.id as string;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw AppError.badRequest('No image files were uploaded');
  }
  const relativePaths = files.map((f) => toPublicImagePath(propertyId, f.filename));
  const property = await propertyService.addImages(propertyId, req.authUser!, relativePaths);
  ok(res, toPropertyDto(property));
});

export const removeImage = asyncHandler(async (req: Request, res: Response) => {
  const { imagePath } = req.body as { imagePath: string };
  if (!imagePath) throw AppError.badRequest('imagePath is required');
  const property = await propertyService.removeImage(
    req.params.id as string,
    req.authUser!,
    imagePath,
  );
  ok(res, toPropertyDto(property));
});
