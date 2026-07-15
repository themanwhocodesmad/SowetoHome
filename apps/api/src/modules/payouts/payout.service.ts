import { Types } from 'mongoose';
import type { MarkPayoutPaidInput, PayoutDto } from '@soweto-stays/shared';
import type { BookingDocument, PayoutDocument } from '@soweto-stays/db';
import { AppError } from '../../common/errors/AppError.js';
import { enqueueEmail } from '../../common/queue/notify.js';
import { payoutRepository } from './payout.repository.js';

export function toPayoutDto(payout: PayoutDocument): PayoutDto {
  return {
    id: payout._id.toString(),
    hostId: payout.hostId.toString(),
    bookingId: payout.bookingId.toString(),
    amount: payout.amount,
    status: payout.status,
    method: payout.method,
    paidAt: payout.paidAt?.toISOString(),
    paidBy: payout.paidBy?.toString(),
    notes: payout.notes,
    createdAt: payout.createdAt.toISOString(),
  };
}

export const payoutService = {
  // Called from payment.service.ts once a booking's payment is confirmed (claude_plan.md §8) -
  // idempotent so a retried ITN webhook can't create two payouts for the same booking.
  async createForConfirmedBooking(booking: BookingDocument): Promise<PayoutDocument> {
    const existing = await payoutRepository.findByBookingId(booking._id.toString());
    if (existing) return existing;
    return payoutRepository.create({
      hostId: booking.hostId,
      bookingId: booking._id,
      amount: booking.hostPayoutAmount,
      status: 'pending',
    });
  },

  listMine(hostId: string): Promise<PayoutDocument[]> {
    return payoutRepository.listByHost(hostId);
  },

  listForAdmin(page: number, limit: number, status?: string) {
    return payoutRepository.listForAdmin(page, limit, status);
  },

  // "manual_eft" per claude_plan.md §3/§8: Yoco has no marketplace payout API, so this
  // records that an admin has actually sent the money via a real bank EFT outside the app.
  async markPaid(
    payoutId: string,
    adminId: string,
    input: MarkPayoutPaidInput,
  ): Promise<PayoutDocument> {
    const payout = await payoutRepository.findById(payoutId);
    if (!payout) throw AppError.notFound('Payout not found');
    if (payout.status === 'paid') return payout;

    payout.status = 'paid';
    payout.paidAt = new Date();
    payout.paidBy = new Types.ObjectId(adminId);
    if (input.notes) payout.notes = input.notes;
    const saved = await payoutRepository.save(payout);
    await enqueueEmail('host-payout-sent', { bookingId: payout.bookingId.toString() });
    return saved;
  },
};
