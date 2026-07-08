import type { Request, Response } from 'express';
import type { SubscribeNewsletterInput } from '@soweto-stays/shared';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { created } from '../../common/http/respond.js';
import { newsletterService } from './newsletter.service.js';

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const subscription = await newsletterService.subscribe(req.body as SubscribeNewsletterInput);
  created(res, subscription);
});
