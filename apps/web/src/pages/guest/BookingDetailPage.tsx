import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.js';
import { paymentsApi } from '../../api/payments.js';
import { reviewsApi } from '../../api/reviews.js';
import { useAuth } from '../../auth/AuthContext.js';

// Yoco's success/cancel/failure redirect URLs (see payment.service.ts) all land back
// here with this query param - the booking's real status still comes from the
// signature-verified webhook, not this redirect, but it decides what banner to show.
const POLL_WHILE_PENDING_MS = 2000;
const POLL_TIMEOUT_MS = 20000;

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const paymentOutcome = searchParams.get('payment');

  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pollStartedAt] = useState(() => Date.now());

  const bookingQuery = useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingsApi.getById(id as string),
    enabled: Boolean(id),
    // Yoco redirects the browser back before the webhook necessarily arrives - if we
    // just landed here from a successful checkout and the booking still looks
    // unpaid, keep polling briefly rather than leaving the guest staring at a
    // stale "pending_payment" status that reads as a failure.
    refetchInterval: (query) => {
      if (paymentOutcome !== 'success') return false;
      if (query.state.data?.bookingStatus !== 'pending_payment') return false;
      if (Date.now() - pollStartedAt > POLL_TIMEOUT_MS) return false;
      return POLL_WHILE_PENDING_MS;
    },
  });

  if (bookingQuery.isLoading) return <p>Loading booking...</p>;
  if (bookingQuery.error || !bookingQuery.data) return <p className="error">Booking not found.</p>;

  const booking = bookingQuery.data;
  const stillConfirmingPayment =
    paymentOutcome === 'success' &&
    booking.bookingStatus === 'pending_payment' &&
    Date.now() - pollStartedAt <= POLL_TIMEOUT_MS;
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
      if (checkout.provider === 'payfast') {
        // PayFast has no redirect-URL API like Yoco's - the browser has to POST a real
        // HTML form (with the signed fields) straight to PayFast's own process URL.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = checkout.actionUrl;
        Object.entries(checkout.fields).forEach(([name, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else {
        window.location.href = checkout.redirectUrl;
      }
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

      {paymentOutcome === 'success' && stillConfirmingPayment && (
        <p className="notice">
          Confirming your payment - this usually takes a few seconds. This page will update
          automatically once it's done.
        </p>
      )}
      {paymentOutcome === 'success' && !stillConfirmingPayment && booking.bookingStatus === 'pending_payment' && (
        <p className="error">
          The payment gateway hasn't confirmed this payment yet. If your card was charged, this
          should resolve shortly - if it doesn't within a few minutes, please contact us.
        </p>
      )}
      {paymentOutcome === 'cancelled' && booking.bookingStatus === 'pending_payment' && (
        <p className="notice">Payment was cancelled. You can try again whenever you're ready.</p>
      )}
      {paymentOutcome === 'failed' && booking.bookingStatus === 'pending_payment' && (
        <p className="error">
          Your payment didn't go through. This is usually a decline from your card issuer - check
          with your bank or try a different card, then try again below.
        </p>
      )}

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
          {isPaying ? 'Redirecting to payment...' : 'Pay now'}
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
  const [propertyComment, setPropertyComment] = useState('');
  const [propertySubmitted, setPropertySubmitted] = useState(false);
  const [hostRating, setHostRating] = useState(5);
  const [hostComment, setHostComment] = useState('');
  const [hostSubmitted, setHostSubmitted] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const submitPropertyReview = async () => {
    try {
      await reviewsApi.submitProperty({ bookingId, rating: propertyRating, comment: propertyComment || undefined });
      setStatus('Thanks for rating the property!');
      setPropertySubmitted(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not submit review');
    }
  };

  const submitHostReview = async () => {
    try {
      await reviewsApi.submitHost({ bookingId, rating: hostRating, comment: hostComment || undefined });
      setStatus('Thanks for rating your host!');
      setHostSubmitted(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not submit review');
    }
  };

  return (
    <section>
      <h2>Rate your stay</h2>
      {status && <p>{status}</p>}

      {!propertySubmitted && (
        <>
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
          <label>
            Comment (optional)
            <textarea
              rows={3}
              maxLength={1000}
              value={propertyComment}
              onChange={(e) => setPropertyComment(e.target.value)}
              placeholder="How was the property?"
            />
          </label>
          <button type="button" onClick={() => void submitPropertyReview()}>
            Submit property rating
          </button>
        </>
      )}

      {!hostSubmitted && (
        <>
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
          <label>
            Comment (optional)
            <textarea
              rows={3}
              maxLength={1000}
              value={hostComment}
              onChange={(e) => setHostComment(e.target.value)}
              placeholder="How was your host?"
            />
          </label>
          <button type="button" onClick={() => void submitHostReview()}>
            Submit host rating
          </button>
        </>
      )}
    </section>
  );
}

function HostReviewForm({ bookingId }: { bookingId: string }) {
  const [guestRating, setGuestRating] = useState(5);
  const [guestComment, setGuestComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const submitGuestReview = async () => {
    try {
      await reviewsApi.submitGuest({ bookingId, rating: guestRating, comment: guestComment || undefined });
      setStatus('Thanks for rating your guest!');
      setSubmitted(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not submit review');
    }
  };

  return (
    <section>
      <h2>Rate your guest</h2>
      {status && <p>{status}</p>}
      {!submitted && (
        <>
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
          <label>
            Comment (optional)
            <textarea
              rows={3}
              maxLength={1000}
              value={guestComment}
              onChange={(e) => setGuestComment(e.target.value)}
              placeholder="How was hosting this guest?"
            />
          </label>
          <button type="button" onClick={() => void submitGuestReview()}>
            Submit guest rating
          </button>
        </>
      )}
    </section>
  );
}
