import { BookingModel } from '@soweto-stays/db';
import { ACTIVE_BOOKING_STATUSES } from '@soweto-stays/shared';

export async function hasOverlappingBooking(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const query: Record<string, unknown> = {
    propertyId,
    bookingStatus: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  const conflict = await BookingModel.exists(query);
  return conflict !== null;
}

// Used by property search to exclude properties already booked over the requested dates.
export async function findBookedPropertyIds(checkIn: Date, checkOut: Date): Promise<string[]> {
  const propertyIds = await BookingModel.find({
    bookingStatus: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  }).distinct('propertyId');
  return propertyIds.map((id) => id.toString());
}

// Powers the public availability calendar on the property detail page - just the date
// ranges that are taken, no guest/booking identity, so this is safe to expose unauthenticated.
export async function getBookedRanges(propertyId: string): Promise<Array<{ checkIn: Date; checkOut: Date }>> {
  const bookings = await BookingModel.find(
    { propertyId, bookingStatus: { $in: ACTIVE_BOOKING_STATUSES }, checkOut: { $gte: new Date() } },
    { checkIn: 1, checkOut: 1 },
  ).lean();
  return bookings.map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut }));
}
