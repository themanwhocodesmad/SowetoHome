import { Router } from 'express';
import { markPayoutPaidSchema } from '@soweto-stays/shared';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as payoutController from './payout.controller.js';

export const payoutRouter = Router();

payoutRouter.get('/mine', authenticate, requireRole('host'), payoutController.listMine);
payoutRouter.get('/', authenticate, requireRole('admin'), payoutController.listForAdmin);
payoutRouter.post(
  '/:id/mark-paid',
  authenticate,
  requireRole('admin'),
  validate(markPayoutPaidSchema),
  payoutController.markPaid,
);
