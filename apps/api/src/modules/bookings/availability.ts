import { BookingModel } from '@soweto-stays/db';
import { PENDING_PAYMENT_HOLD_MINUTES } from '@soweto-stays/shared';

const HOLD_MS = PENDING_PAYMENT_HOLD_MINUTES * 60 * 1000;

// "Active" (blocks dates) means confirmed/completed unconditionally, or pending_payment but
// only while still inside its hold window - past that, an abandoned/failed checkout that
// never got a webhook (or got one that failed) stops holding the dates hostage. See
// PENDING_PAYMENT_HOLD_MINUTES for why this exists.
function activeBookingFilter() {
  return {
    $or: [
      { bookingStatus: { $in: ['confirmed', 'completed'] } },
      { bookingStatus: 'pending_payment', createdAt: { $gte: new Date(Date.now() - HOLD_MS) } },
    ],
  };
}

export async function hasOverlappingBooking(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const query: Record<string, unknown> = {
    propertyId,
    ...activeBookingFilter(),
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
    ...activeBookingFilter(),
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  }).distinct('propertyId');
  return propertyIds.map((id) => id.toString());
}

// Powers the public availability calendar on the property detail page - just the date
// ranges that are taken, no guest/booking identity, so this is safe to expose unauthenticated.
export async function getBookedRanges(propertyId: string): Promise<Array<{ checkIn: Date; checkOut: Date }>> {
  const bookings = await BookingModel.find(
    { propertyId, ...activeBookingFilter(), checkOut: { $gte: new Date() } },
    { checkIn: 1, checkOut: 1 },
  ).lean();
  return bookings.map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut }));
}
