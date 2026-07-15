import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import * as paymentController from './payment.controller.js';

export const paymentRouter = Router();

paymentRouter.post('/checkout/:bookingId', authenticate, paymentController.checkout);

// Called by Yoco's servers, not our frontend - see payment.controller.ts for the auth note.
paymentRouter.post('/yoco/notify', paymentController.notify);
