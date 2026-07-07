import { Router } from 'express';
import { cancelBookingSchema, createBookingSchema } from '@soweto-stays/shared';
import { authenticate } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as bookingController from './booking.controller.js';

export const bookingRouter = Router();

bookingRouter.post('/', authenticate, validate(createBookingSchema), bookingController.createBooking);
bookingRouter.get('/mine/guest', authenticate, bookingController.listMineAsGuest);
bookingRouter.get('/mine/host', authenticate, bookingController.listMineAsHost);
bookingRouter.get('/:id', authenticate, bookingController.getById);
bookingRouter.post(
  '/:id/cancel',
  authenticate,
  validate(cancelBookingSchema),
  bookingController.cancel,
);
