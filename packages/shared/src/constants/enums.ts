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

// Statuses that "hold" a property's date range - used both to block double-booking and to
// exclude a property from date-filtered search results. Cancelled/refunded bookings free the dates.
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending_payment', 'confirmed', 'completed'];

export const PAYOUT_STATUSES = ['pending', 'paid', 'failed'] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

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
