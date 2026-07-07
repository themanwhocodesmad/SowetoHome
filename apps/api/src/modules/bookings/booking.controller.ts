import type { Request, Response } from 'express';
import type { CancelBookingInput, CreateBookingInput } from '@soweto-stays/shared';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { created, ok } from '../../common/http/respond.js';
import { paymentService } from '../payments/payment.service.js';
import { bookingService, toBookingDto } from './booking.service.js';

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateBookingInput;
  const booking = await bookingService.createRequest(req.authUser!.id, input);
  created(res, toBookingDto(booking));
});

export const listMineAsGuest = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await bookingService.listMineAsGuest(req.authUser!.id);
  ok(res, bookings.map((b) => toBookingDto(b)));
});

export const listMineAsHost = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await bookingService.listMineAsHost(req.authUser!.id);
  ok(res, bookings.map((b) => toBookingDto(b)));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.getForRequester(req.params.id as string, req.authUser!);
  ok(res, toBookingDto(booking));
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as CancelBookingInput;
  const { booking, refundEligible } = await bookingService.cancel(
    req.params.id as string,
    req.authUser!,
    reason,
  );
  if (refundEligible) {
    await paymentService.refundBooking(booking);
  }
  ok(res, toBookingDto(booking));
});
