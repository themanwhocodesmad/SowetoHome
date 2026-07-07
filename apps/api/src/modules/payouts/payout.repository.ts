import { PayoutModel, type PayoutDocument } from '@soweto-stays/db';

export const payoutRepository = {
  findById(id: string): Promise<PayoutDocument | null> {
    return PayoutModel.findById(id);
  },

  findByBookingId(bookingId: string): Promise<PayoutDocument | null> {
    return PayoutModel.findOne({ bookingId });
  },

  create(data: Record<string, unknown>): Promise<PayoutDocument> {
    return PayoutModel.create(data);
  },

  save(payout: PayoutDocument): Promise<PayoutDocument> {
    return payout.save();
  },

  listByHost(hostId: string): Promise<PayoutDocument[]> {
    return PayoutModel.find({ hostId }).sort({ createdAt: -1 });
  },

  async listForAdmin(page: number, limit: number, status?: string) {
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      PayoutModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PayoutModel.countDocuments(query),
    ]);
    return { items, total };
  },
};
