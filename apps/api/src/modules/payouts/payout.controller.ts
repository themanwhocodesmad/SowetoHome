import type { Request, Response } from 'express';
import type { MarkPayoutPaidInput } from '@soweto-stays/shared';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok, paginated } from '../../common/http/respond.js';
import { payoutService, toPayoutDto } from './payout.service.js';

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const payouts = await payoutService.listMine(req.authUser!.id);
  ok(res, payouts.map((p) => toPayoutDto(p)));
});

export const listForAdmin = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as string | undefined;
  const { items, total } = await payoutService.listForAdminEnriched(page, limit, status);
  paginated(res, items, page, limit, total);
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as MarkPayoutPaidInput;
  const payout = await payoutService.markPaid(req.params.id as string, req.authUser!.id, input);
  ok(res, toPayoutDto(payout));
});
