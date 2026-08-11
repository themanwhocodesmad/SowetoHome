export type ReviewKind = 'property' | 'host' | 'guest';

export interface ReviewDto {
  id: string;
  kind: ReviewKind;
  bookingId: string;
  authorId: string;
  targetId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  // Only ever set on admin-added fake reviews (see AddFakeReviewInput) - a real review has
  // no stored display name/avatar of its own, so these stay undefined for them.
  authorName?: string;
  authorAvatarUrl?: string;
  isFake?: boolean;
}
