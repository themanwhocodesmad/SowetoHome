import { Types } from 'mongoose';
import type { AdminPayoutDto, MarkPayoutPaidInput, PayoutDto } from '@soweto-stays/shared';
import { BookingModel, UserModel, type BookingDocument, type PayoutDocument } from '@soweto-stays/db';
import { AppError } from '../../common/errors/AppError.js';
import { enqueueEmail } from '../../common/queue/notify.js';
import { propertyRepository } from '../properties/property.repository.js';
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

async function toAdminPayoutDto(payout: PayoutDocument): Promise<AdminPayoutDto> {
  const base = toPayoutDto(payout);
  const [host, booking] = await Promise.all([
    UserModel.findById(payout.hostId),
    BookingModel.findById(payout.bookingId),
  ]);
  const property = booking ? await propertyRepository.findById(booking.propertyId.toString()) : null;

  return {
    ...base,
    hostName: host?.name ?? 'Unknown host',
    hostEmail: host?.email ?? '',
    hostPayoutDetails: host?.payoutDetails
      ? {
          bankName: host.payoutDetails.bankName,
          accountNumber: host.payoutDetails.accountNumber,
          accountHolder: host.payoutDetails.accountHolder,
        }
      : undefined,
    propertyTitle: property?.title ?? 'Unknown property',
    checkIn: booking?.checkIn.toISOString() ?? '',
    checkOut: booking?.checkOut.toISOString() ?? '',
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

  async listForAdminEnriched(page: number, limit: number, status?: string) {
    const { items, total } = await payoutRepository.listForAdmin(page, limit, status);
    const enriched = await Promise.all(items.map((p) => toAdminPayoutDto(p)));
    return { items: enriched, total };
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