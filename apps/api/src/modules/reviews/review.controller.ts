import type { Request, Response } from 'express';
import type { SubmitReviewInput } from '@soweto-stays/shared';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { AppError } from '../../common/errors/AppError.js';
import { created, ok } from '../../common/http/respond.js';
import { reviewService } from './review.service.js';

export const submitPropertyReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.submitPropertyReview(
    req.authUser!.id,
    req.body as SubmitReviewInput,
  );
  created(res, review);
});

export const submitHostReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.submitHostReview(
    req.authUser!.id,
    req.body as SubmitReviewInput,
  );
  created(res, review);
});

export const submitGuestReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.submitGuestReview(
    req.authUser!.id,
    req.body as SubmitReviewInput,
  );
  created(res, review);
});

export const listForProperty = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await reviewService.listForProperty(req.params.propertyId as string);
  ok(res, reviews);
});

export const listForHost = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await reviewService.listForHost(req.params.hostId as string);
  ok(res, reviews);
});

// Guest reviews are only visible to the guest themselves or an admin - unlike property/host
// reviews, they aren't meant to be a public-facing reputation signal.
export const listForGuest = asyncHandler(async (req: Request, res: Response) => {
  const guestId = req.params.guestId as string;
  const isSelf = req.authUser!.id === guestId;
  const isAdmin = req.authUser!.roles.includes('admin');
  if (!isSelf && !isAdmin) throw AppError.forbidden();
  const reviews = await reviewService.listForGuest(guestId);
  ok(res, reviews);
});
