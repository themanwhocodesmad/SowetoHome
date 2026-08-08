import { Router } from 'express';
import { submitReviewSchema } from '@soweto-stays/shared';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as reviewController from './review.controller.js';

export const reviewRouter = Router();

reviewRouter.post(
  '/property',
  authenticate,
  validate(submitReviewSchema),
  reviewController.submitPropertyReview,
);
reviewRouter.post(
  '/host',
  authenticate,
  validate(submitReviewSchema),
  reviewController.submitHostReview,
);
// Only an admin can be "the host" leaving a guest review now (see property.service.ts).
reviewRouter.post(
  '/guest',
  authenticate,
  requireRole('admin'),
  validate(submitReviewSchema),
  reviewController.submitGuestReview,
);

reviewRouter.get('/property/:propertyId', reviewController.listForProperty);
reviewRouter.get('/host/:hostId', reviewController.listForHost);
reviewRouter.get('/guest/:guestId', authenticate, reviewController.listForGuest);
