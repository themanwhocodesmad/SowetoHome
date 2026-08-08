import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok } from '../../common/http/respond.js';
import { AppError } from '../../common/errors/AppError.js';
import { paymentService } from './payment.service.js';

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params as { bookingId: string };
  const checkoutResult = await paymentService.buildCheckoutForm(bookingId, req.authUser!.id);
  ok(res, checkoutResult);
});

// Yoco posts JSON, signed over the raw bytes - see app.ts's express.json verify hook, which
// stashes req.rawBody only for this path. No user auth applies here; the request is
// authenticated by the signature check in yoco.signature.ts, not a session.
export const notify = asyncHandler(async (req: Request, res: Response) => {
  if (!req.rawBody) throw AppError.badRequest('Missing raw body for signature verification');
  await paymentService.handleNotify(req.rawBody, req.headers);
  res.status(200).send('OK');
});

// PayFast posts form-urlencoded, signed over its own fields (see payfast.signature.ts) -
// express.urlencoded() already parsed the body by the time this runs, so req.body is used
// directly rather than a stashed raw buffer. Also no user auth - authenticated by signature.
export const payfastNotify = asyncHandler(async (req: Request, res: Response) => {
  await paymentService.handlePayFastNotify(req.body as Record<string, string>);
  res.status(200).send('OK');
});
