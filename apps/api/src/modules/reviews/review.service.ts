import type { ReviewDto, SubmitReviewInput } from '@soweto-stays/shared';
import { RATING_PROMPT_AFTER_CHECKOUT_HOURS } from '@soweto-stays/shared';
import { BookingModel, PropertyModel, UserModel, type BookingDocument } from '@soweto-stays/db';
import { AppError } from '../../common/errors/AppError.js';
import { reviewRepository } from './review.repository.js';

const HOUR_MS = 60 * 60 * 1000;

interface ReviewDocLike {
  _id: { toString(): string };
  bookingId: { toString(): string };
  rating: number;
  comment?: string;
  createdAt: Date;
}

function toDto(
  kind: ReviewDto['kind'],
  review: ReviewDocLike,
  authorId: string,
  targetId: string,
): ReviewDto {
  return {
    id: review._id.toString(),
    kind,
    bookingId: review.bookingId.toString(),
    authorId,
    targetId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

// Server-side gate, independent of whether the worker's rating-prompt job has actually run
// yet (claude_plan.md §7.5) - eligibility is derived from wall-clock time, not job state.
function assertEligible(booking: BookingDocument) {
  if (!['confirmed', 'completed'].includes(booking.bookingStatus)) {
    throw AppError.badRequest('This booking is not eligible for reviews');
  }
  const eligibleAt = booking.checkOut.getTime() + RATING_PROMPT_AFTER_CHECKOUT_HOURS * HOUR_MS;
  if (Date.now() < eligibleAt) {
    throw AppError.badRequest('Reviews open 24 hours after checkout');
  }
}

function nextAverage(currentAvg: number, currentCount: number, rating: number): number {
  return Math.round(((currentAvg * currentCount + rating) / (currentCount + 1)) * 100) / 100;
}

async function bumpPropertyRating(propertyId: string, rating: number): Promise<void> {
  const property = await PropertyModel.findById(propertyId);
  if (!property) return;
  property.ratingAvg = nextAverage(property.ratingAvg, property.ratingCount, rating);
  property.ratingCount += 1;
  await property.save();
}

async function bumpHostRating(hostId: string, rating: number): Promise<void> {
  const host = await UserModel.findById(hostId);
  if (!host) return;
  host.hostRatingAvg = nextAverage(host.hostRatingAvg, host.hostRatingCount, rating);
  host.hostRatingCount += 1;
  await host.save();
}

async function bumpGuestRating(guestId: string, rating: number): Promise<void> {
  const guest = await UserModel.findById(guestId);
  if (!guest) return;
  guest.guestRatingAvg = nextAverage(guest.guestRatingAvg, guest.guestRatingCount, rating);
  guest.guestRatingCount += 1;
  await guest.save();
}

export const reviewService = {
  async submitPropertyReview(guestId: string, input: SubmitReviewInput): Promise<ReviewDto> {
    const booking = await BookingModel.findById(input.bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.guestId.toString() !== guestId) throw AppError.forbidden();
    assertEligible(booking);

    const existing = await reviewRepository.findPropertyReviewByBooking(input.bookingId);
    if (existing) throw AppError.conflict('You have already reviewed this property');

    const review = await reviewRepository.createPropertyReview({
      bookingId: booking._id,
      guestId,
      propertyId: booking.propertyId,
      rating: input.rating,
      comment: input.comment,
    });
    await bumpPropertyRating(booking.propertyId.toString(), input.rating);
    return toDto('property', review, guestId, booking.propertyId.toString());
  },

  async submitHostReview(guestId: string, input: SubmitReviewInput): Promise<ReviewDto> {
    const booking = await BookingModel.findById(input.bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.guestId.toString() !== guestId) throw AppError.forbidden();
    assertEligible(booking);

    const existing = await reviewRepository.findHostReviewByBooking(input.bookingId);
    if (existing) throw AppError.conflict('You have already reviewed this host');

    const review = await reviewRepository.createHostReview({
      bookingId: booking._id,
      guestId,
      hostId: booking.hostId,
      rating: input.rating,
      comment: input.comment,
    });
    await bumpHostRating(booking.hostId.toString(), input.rating);
    return toDto('host', review, guestId, booking.hostId.toString());
  },

  async submitGuestReview(hostId: string, input: SubmitReviewInput): Promise<ReviewDto> {
    const booking = await BookingModel.findById(input.bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.hostId.toString() !== hostId) throw AppError.forbidden();
    assertEligible(booking);

    const existing = await reviewRepository.findGuestReviewByBooking(input.bookingId);
    if (existing) throw AppError.conflict('You have already reviewed this guest');

    const review = await reviewRepository.createGuestReview({
      bookingId: booking._id,
      hostId,
      guestId: booking.guestId,
      rating: input.rating,
      comment: input.comment,
    });
    await bumpGuestRating(booking.guestId.toString(), input.rating);
    return toDto('guest', review, hostId, booking.guestId.toString());
  },

  async listForProperty(propertyId: string): Promise<ReviewDto[]> {
    const reviews = await reviewRepository.listPropertyReviews(propertyId);
    return reviews.map((r) => toDto('property', r, r.guestId.toString(), r.propertyId.toString()));
  },

  async listForHost(hostId: string): Promise<ReviewDto[]> {
    const reviews = await reviewRepository.listHostReviews(hostId);
    return reviews.map((r) => toDto('host', r, r.guestId.toString(), r.hostId.toString()));
  },

  async listForGuest(guestId: string): Promise<ReviewDto[]> {
    const reviews = await reviewRepository.listGuestReviews(guestId);
    return reviews.map((r) => toDto('guest', r, r.hostId.toString(), r.guestId.toString()));
  },
};
