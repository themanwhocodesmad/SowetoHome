import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.js';
import { paymentsApi } from '../../api/payments.js';
import { reviewsApi } from '../../api/reviews.js';
import { useAuth } from '../../auth/AuthContext.js';

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const bookingQuery = useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingsApi.getById(id as string),
    enabled: Boolean(id),
  });

  if (bookingQuery.isLoading) return <p>Loading booking...</p>;
  if (bookingQuery.error || !bookingQuery.data) return <p className="error">Booking not found.</p>;

  const booking = bookingQuery.data;
  const isGuest = user?.id === booking.guestId;
  const isHost = user?.id === booking.hostId;
  const canCancel = booking.bookingStatus === 'pending_payment' || booking.bookingStatus === 'confirmed';
  const reviewsOpen =
    booking.bookingStatus === 'completed' ||
    (booking.bookingStatus === 'confirmed' &&
      Date.now() > new Date(booking.checkOut).getTime() + 24 * 60 * 60 * 1000);

  const handlePay = async () => {
    setActionError(null);
    setIsPaying(true);
    try {
      const checkout = await paymentsApi.getCheckoutForm(booking.id);
      window.location.href = checkout.redirectUrl;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not start payment');
      setIsPaying(false);
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    setIsCancelling(true);
    try {
      await bookingsApi.cancel(booking.id, {});
      await queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div>
      <h1>Booking details</h1>
      {actionError && <p className="error">{actionError}</p>}
      <ul>
        <li>Status: {booking.bookingStatus}</li>
        <li>Payment: {booking.paymentStatus}</li>
        <li>
          {new Date(booking.checkIn).toLocaleDateString()} -{' '}
          {new Date(booking.checkOut).toLocaleDateString()} ({booking.totalNights} nights)
        </li>
        <li>Guests: {booking.numGuests}</li>
        <li>Total: R{booking.totalPrice.toFixed(2)}</li>
      </ul>

      {isGuest && booking.bookingStatus === 'pending_payment' && (
        <button type="button" disabled={isPaying} onClick={() => void handlePay()}>
          {isPaying ? 'Redirecting to Yoco...' : 'Pay now'}
        </button>
      )}

      {canCancel && (isGuest || isHost) && (
        <button type="button" disabled={isCancelling} onClick={() => void handleCancel()}>
          {isCancelling ? 'Cancelling...' : 'Cancel booking'}
        </button>
      )}

      {reviewsOpen && isGuest && <GuestReviewForms bookingId={booking.id} />}
      {reviewsOpen && isHost && <HostReviewForm bookingId={booking.id} />}
    </div>
  );
}

function GuestReviewForms({ bookingId }: { bookingId: string }) {
  const [propertyRating, setPropertyRating] = useState(5);
  const [hostRating, setHostRating] = useState(5);
  const [status, setStatus] = useState<string | null>(null);

  const submitPropertyReview = async () => {
    try {
      await reviewsApi.submitProperty({ bookingId, rating: propertyRating });
      setStatus('Thanks for rating the property!');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not submit review');
    }
  };

  const submitHostReview = async () => {
    try {
      await reviewsApi.submitHost({ bookingId, rating: hostRating });
      setStatus('Thanks for rating your host!');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not submit review');
    }
  };

  return (
    <section>
      <h2>Rate your stay</h2>
      {status && <p>{status}</p>}
      <label>
        Rate the property (1-5)
        <input
          type="number"
          min={1}
          max={5}
          value={propertyRating}
          onChange={(e) => setPropertyRating(Number(e.target.value))}
        />
      </label>
      <button type="button" onClick={() => void submitPropertyReview()}>
        Submit property rating
      </button>

      <label>
        Rate your host (1-5)
        <input
          type="number"
          min={1}
          max={5}
          value={hostRating}
          onChange={(e) => setHostRating(Number(e.target.value))}
        />
      </label>
      <button type="button" onClick={() => void submitHostReview()}>
        Submit host rating
      </button>
    </section>
  );
}

function HostReviewForm({ bookingId }: { bookingId: string }) {
  const [guestRating, setGuestRating] = useState(5);
  const [status, setStatus] = useState<string | null>(null);

  const submitGuestReview = async () => {
    try {
      await reviewsApi.submitGuest({ bookingId, rating: guestRating });
      setStatus('Thanks for rating your guest!');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not submit review');
    }
  };

  return (
    <section>
      <h2>Rate your guest</h2>
      {status && <p>{status}</p>}
      <label>
        Rate the guest (1-5)
        <input
          type="number"
          min={1}
          max={5}
          value={guestRating}
          onChange={(e) => setGuestRating(Number(e.target.value))}
        />
      </label>
      <button type="button" onClick={() => void submitGuestReview()}>
        Submit guest rating
      </button>
    </section>
  );
}
