export const PROPERTY_TYPES = ['entire_place', 'private_room', 'shared_room'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ['draft', 'pending_review', 'published', 'suspended'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUSES = [
  'pending_payment',
  'confirmed',
  'cancelled_by_guest',
  'cancelled_by_host',
  'completed',
  'refunded',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// Statuses that CAN hold a property's date range - kept for reference/anywhere a general
// "is this a live booking" status list is useful. The actual date-blocking logic (property
// search, overlap checks, the availability calendar) does NOT use this list directly anymore
// - see apps/api/src/modules/bookings/availability.ts's activeBookingFilter, which also caps
// how long a pending_payment booking counts as active (PENDING_PAYMENT_HOLD_MINUTES) so an
// abandoned/failed checkout doesn't hold real dates hostage forever.
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending_payment', 'confirmed', 'completed'];

export const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const;
export type Province = (typeof PROVINCES)[number];
