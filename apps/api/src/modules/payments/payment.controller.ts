import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok } from '../../common/http/respond.js';
import { paymentService } from './payment.service.js';

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params as { bookingId: string };
  const form = await paymentService.buildCheckoutForm(bookingId, req.authUser!.id);
  ok(res, form);
});

// PayFast posts application/x-www-form-urlencoded and expects a plain 200 response,
// not a JSON envelope - see app.ts for the urlencoded body parser this route relies on.
export const notify = asyncHandler(async (req: Request, res: Response) => {
  await paymentService.handleNotify(req.body as Record<string, string>);
  res.status(200).send('OK');
});
