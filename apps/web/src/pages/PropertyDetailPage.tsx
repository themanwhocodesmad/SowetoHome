import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '../api/properties.js';
import { bookingsApi } from '../api/bookings.js';
import { reviewsApi } from '../api/reviews.js';
import { useAuth } from '../auth/AuthContext.js';
import { apiBaseUrl } from '../api/client.js';
import { googleLoginUrl } from '../api/auth.js';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numGuests, setNumGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const propertyQuery = useQuery({
    queryKey: ['properties', id],
    queryFn: () => propertiesApi.getById(id as string),
    enabled: Boolean(id),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'property', id],
    queryFn: () => reviewsApi.listForProperty(id as string),
    enabled: Boolean(id),
  });

  if (propertyQuery.isLoading) return <p>Loading...</p>;
  if (propertyQuery.error || !propertyQuery.data) return <p className="error">Property not found.</p>;

  const property = propertyQuery.data;
  const isOwner = user?.id === property.hostId;

  const handleBook = async () => {
    setBookingError(null);
    setIsBooking(true);
    try {
      const booking = await bookingsApi.create({
        propertyId: property.id,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        numGuests,
      });
      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Could not create booking');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="property-detail">
      <h1>{property.title}</h1>
      <p className="property-card__sub">
        {property.location.suburb}, {property.location.city}
        {property.hostName && ` · Hosted by ${property.hostName}`}
      </p>

      <div className="property-detail__gallery">
        {property.images.length > 0 ? (
          property.images.map((img) => <img key={img} src={`${apiBaseUrl()}${img}`} alt={property.title} />)
        ) : (
          <div className="property-card__placeholder">No photos uploaded yet.</div>
        )}
      </div>

      <div className="property-detail__meta">
        <span>
          <strong>{property.maxGuests}</strong> guests
        </span>
        <span>
          <strong>{property.bedrooms}</strong> bedrooms
        </span>
        <span>
          <strong>{property.beds}</strong> beds
        </span>
        <span>
          <strong>{property.bathrooms}</strong> baths
        </span>
        {property.ratingCount > 0 && (
          <span>
            ★ {property.ratingAvg.toFixed(1)} ({property.ratingCount})
          </span>
        )}
      </div>

      <p>{property.description}</p>
      <p className="property-card__sub">
        {property.minNights}-{property.maxNights} nights · Check-in {property.checkInTime}, check-out{' '}
        {property.checkOutTime}
      </p>

      {property.amenities.length > 0 && (
        <>
          <strong>What this place offers</strong>
          <ul className="amenity-grid">
            {property.amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
        </>
      )}

      {!property.isAvailable && <p className="notice">This property is not currently accepting bookings.</p>}

      {!isOwner && property.isAvailable && (
        <section className="booking-form panel">
          <div className="property-card__price" style={{ marginBottom: '0.75rem' }}>
            <b>R{property.stayRate.toFixed(0)}</b> / night
          </div>
          {!user ? (
            <p>
              <a href={googleLoginUrl()}>Sign in with Google</a> to book this property.
            </p>
          ) : (
            <>
              {bookingError && <p className="error">{bookingError}</p>}
              <label>
                Check-in
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </label>
              <label>
                Check-out
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </label>
              <label>
                Guests
                <input
                  type="number"
                  min={1}
                  max={property.maxGuests}
                  value={numGuests}
                  onChange={(e) => setNumGuests(Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                className="button"
                disabled={isBooking || !checkIn || !checkOut}
                onClick={() => void handleBook()}
              >
                {isBooking ? 'Booking...' : 'Request to book'}
              </button>
            </>
          )}
        </section>
      )}

      <section className="reviews">
        <h2>Reviews {property.ratingCount > 0 && `(★ ${property.ratingAvg.toFixed(1)})`}</h2>
        {reviewsQuery.data?.length ? (
          <ul>
            {reviewsQuery.data.map((review) => (
              <li key={review.id}>★ {review.rating} - {review.comment}</li>
            ))}
          </ul>
        ) : (
          <p>No reviews yet.</p>
        )}
      </section>
    </div>
  );
}
