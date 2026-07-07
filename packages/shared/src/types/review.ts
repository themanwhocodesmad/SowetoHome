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
}
