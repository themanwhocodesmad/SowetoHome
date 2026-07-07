import {
  GuestReviewModel,
  HostReviewModel,
  PropertyReviewModel,
  type GuestReviewDocument,
  type HostReviewDocument,
  type PropertyReviewDocument,
} from '@soweto-stays/db';

export const reviewRepository = {
  findPropertyReviewByBooking(bookingId: string): Promise<PropertyReviewDocument | null> {
    return PropertyReviewModel.findOne({ bookingId });
  },
  findHostReviewByBooking(bookingId: string): Promise<HostReviewDocument | null> {
    return HostReviewModel.findOne({ bookingId });
  },
  findGuestReviewByBooking(bookingId: string): Promise<GuestReviewDocument | null> {
    return GuestReviewModel.findOne({ bookingId });
  },

  createPropertyReview(data: Record<string, unknown>): Promise<PropertyReviewDocument> {
    return PropertyReviewModel.create(data);
  },
  createHostReview(data: Record<string, unknown>): Promise<HostReviewDocument> {
    return HostReviewModel.create(data);
  },
  createGuestReview(data: Record<string, unknown>): Promise<GuestReviewDocument> {
    return GuestReviewModel.create(data);
  },

  listPropertyReviews(propertyId: string): Promise<PropertyReviewDocument[]> {
    return PropertyReviewModel.find({ propertyId }).sort({ createdAt: -1 });
  },
  listHostReviews(hostId: string): Promise<HostReviewDocument[]> {
    return HostReviewModel.find({ hostId }).sort({ createdAt: -1 });
  },
  listGuestReviews(guestId: string): Promise<GuestReviewDocument[]> {
    return GuestReviewModel.find({ guestId }).sort({ createdAt: -1 });
  },
};
