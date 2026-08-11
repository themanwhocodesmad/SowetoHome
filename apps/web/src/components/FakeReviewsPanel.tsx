import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MAX_FAKE_REVIEWS_PER_PROPERTY } from '@soweto-stays/shared';
import { adminApi } from '../api/admin.js';
import { reviewsApi } from '../api/reviews.js';
import { apiBaseUrl } from '../api/client.js';

// Admin-only - lets a listing be seeded with realistic-looking reviews that have no real
// booking/guest behind them (see review.service.ts's addFakeReview). Shown on the listing
// edit page only, since it needs a real property id to attach to - a brand-new listing
// (still on the create form) has nowhere to save these yet.
export function FakeReviewsPanel({ propertyId }: { propertyId: string }) {
  const queryClient = useQueryClient();
  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'property', propertyId],
    queryFn: () => reviewsApi.listForProperty(propertyId),
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviews = reviewsQuery.data ?? [];
  const fakeReviews = reviews.filter((r) => r.isFake);
  const atLimit = fakeReviews.length >= MAX_FAKE_REVIEWS_PER_PROPERTY;

  const handleAvatarChange = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setIsUploadingAvatar(true);
    try {
      const { avatarUrl: uploaded } = await adminApi.uploadReviewAvatar(file);
      setAvatarUrl(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAdd = async () => {
    setError(null);
    if (!authorName.trim() || !comment.trim()) {
      setError('Name and comment are required.');
      return;
    }
    setIsSaving(true);
    try {
      await adminApi.addFakeReview(propertyId, {
        rating,
        comment: comment.trim(),
        authorName: authorName.trim(),
        ...(avatarUrl ? { authorAvatarUrl: avatarUrl } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ['reviews', 'property', propertyId] });
      await queryClient.invalidateQueries({ queryKey: ['properties', propertyId] });
      setRating(5);
      setComment('');
      setAuthorName('');
      setAvatarUrl(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add review');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (reviewId: string) => {
    setError(null);
    try {
      await adminApi.removeFakeReview(propertyId, reviewId);
      await queryClient.invalidateQueries({ queryKey: ['reviews', 'property', propertyId] });
      await queryClient.invalidateQueries({ queryKey: ['properties', propertyId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove review');
    }
  };

  return (
    <div className="panel">
      <div className="section-head">
        <h2 style={{ fontSize: '1rem' }}>
          Reviews <span className="listing-form__hint">({fakeReviews.length}/{MAX_FAKE_REVIEWS_PER_PROPERTY} added)</span>
        </h2>
      </div>
      <p className="property-card__sub">
        Add reviews to this listing yourself, with an optional name and photo. These show up
        alongside real guest reviews once the listing has any.
      </p>

      {error && <p className="error">{error}</p>}

      {reviews.length > 0 && (
        <ul className="fake-reviews-list">
          {reviews.map((review) => (
            <li key={review.id} className="fake-reviews-list__item">
              {review.authorAvatarUrl ? (
                <img
                  className="fake-reviews-list__avatar"
                  src={`${apiBaseUrl()}${review.authorAvatarUrl}`}
                  alt={review.authorName ?? 'Reviewer'}
                />
              ) : (
                <span className="fake-reviews-list__avatar fake-reviews-list__avatar--placeholder">
                  {(review.authorName ?? 'G').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="fake-reviews-list__body">
                <strong>{review.authorName ?? 'Guest'}</strong> · ★ {review.rating}
                <p>{review.comment}</p>
              </div>
              {review.isFake && (
                <button type="button" className="fake-reviews-list__remove" onClick={() => void handleRemove(review.id)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {atLimit ? (
        <p className="listing-form__hint">
          Maximum of {MAX_FAKE_REVIEWS_PER_PROPERTY} added reviews reached.
        </p>
      ) : (
        <div className="fake-reviews-form">
          <div className="listing-form__row listing-form__row--2">
            <label>
              Reviewer name
              <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="e.g. Thandiwe M." />
            </label>
            <label>
              Rating
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Comment
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
          </label>
          <label>
            Photo <span className="listing-form__hint">optional</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploadingAvatar}
              onChange={(e) => void handleAvatarChange(e.target.files)}
            />
          </label>
          {avatarUrl && (
            <img className="fake-reviews-list__avatar" src={`${apiBaseUrl()}${avatarUrl}`} alt="Selected avatar preview" />
          )}
          <button type="button" disabled={isSaving || isUploadingAvatar} onClick={() => void handleAdd()}>
            {isSaving ? 'Adding...' : 'Add review'}
          </button>
        </div>
      )}
    </div>
  );
}
