import { BookingModel, type BookingDocument } from '@soweto-stays/db';

export const bookingRepository = {
  findById(id: string): Promise<BookingDocument | null> {
    return BookingModel.findById(id);
  },

  create(data: Record<string, unknown>): Promise<BookingDocument> {
    return BookingModel.create(data);
  },

  save(booking: BookingDocument): Promise<BookingDocument> {
    return booking.save();
  },

  listByGuest(guestId: string): Promise<BookingDocument[]> {
    return BookingModel.find({ guestId }).sort({ createdAt: -1 });
  },

  listByHost(hostId: string): Promise<BookingDocument[]> {
    return BookingModel.find({ hostId }).sort({ createdAt: -1 });
  },

  async listForAdmin(page: number, limit: number, status?: string) {
    const query: Record<string, unknown> = {};
    if (status) query.bookingStatus = status;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      BookingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BookingModel.countDocuments(query),
    ]);
    return { items, total };
  },
};
