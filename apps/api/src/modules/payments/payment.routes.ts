import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import * as paymentController from './payment.controller.js';

export const paymentRouter = Router();

paymentRouter.post('/checkout/:bookingId', authenticate, paymentController.checkout);

// Called by PayFast's servers, not our frontend - no user auth applies here (the
// request is authenticated by signature + the validate() callback in payment.service.ts).
paymentRouter.post('/payfast/notify', paymentController.notify);
