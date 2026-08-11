import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CANCELLATION_FREE_WINDOW_HOURS } from '@soweto-stays/shared';
import { propertiesApi } from '../api/properties.js';
import { bookingsApi } from '../api/bookings.js';
import { reviewsApi } from '../api/reviews.js';
import { useAuth } from '../auth/AuthContext.js';
import { apiBaseUrl } from '../api/client.js';
import { openDatePicker } from '../utils/openDatePicker.js';
import { amenityIcon, amenityLabel } from '../utils/amenityIcons.js';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar.js';

// How many photos show in the header gallery before the rest fold behind "View all
// photos" - 1 large + 4 thumbnails, matching a typical stay-listing gallery layout.
const GALLERY_VISIBLE_COUNT = 5;

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numGuests, setNumGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  const imageCount = propertyQuery.data?.images.length ?? 0;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : (i + 1) % imageCount));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : (i - 1 + imageCount) % imageCount));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, imageCount]);

  if (propertyQuery.isLoading) return <p>Loading...</p>;
  if (propertyQuery.error || !propertyQuery.data) return <p className="error">Property not found.</p>;

  const property = propertyQuery.data;
  const isOwner = user?.id === property.hostId;
  const visibleImages = property.images.slice(0, GALLERY_VISIBLE_COUNT);
  const hiddenPhotoCount = property.images.length - visibleImages.length;

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
      <div className="property-detail__gallery">
        {visibleImages.length > 0 ? (
          visibleImages.map((img, index) => (
            <button
              key={img}
              type="button"
              className="property-detail__gallery-item"
              onClick={() => setLightboxIndex(index)}
              aria-label={`View photo ${index + 1} of ${property.images.length} in full screen`}
            >
              <img src={`${apiBaseUrl()}${img}`} alt={property.title} />
              {index === visibleImages.length - 1 && hiddenPhotoCount > 0 && (
                <span className="property-detail__gallery-more">+{hiddenPhotoCount} photos</span>
              )}
              {/* Mobile shows a single full-width photo (see the max-width:560px rule in
                  index.css, which hides every item but the first) - so the "+N photos"
                  count needs to live on the first image there instead of the last, and
                  count every photo beyond it rather than just the ones hidden from the
                  desktop grid. Hidden by default via CSS, shown only at that breakpoint. */}
              {index === 0 && property.images.length > 1 && (
                <span className="property-detail__gallery-more property-detail__gallery-more--mobile">
                  +{property.images.length - 1} photos
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="property-card__placeholder">No photos uploaded yet.</div>
        )}
        {property.images.length > 0 && (
          <button
            type="button"
            className="property-detail__view-all"
            onClick={() => setLightboxIndex(0)}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            View all photos
          </button>
        )}
      </div>

      {lightboxIndex !== null && (
        <div className="lightbox" onClick={() => setLightboxIndex(null)}>
          <button
            type="button"
            className="lightbox__close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close full-screen photo view"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>

          {property.images.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i - 1 + property.images.length) % property.images.length));
                }}
                aria-label="Previous photo"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--next"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i + 1) % property.images.length));
                }}
                aria-label="Next photo"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </>
          )}

          <img
            src={`${apiBaseUrl()}${property.images[lightboxIndex]}`}
            alt={`${property.title} - photo ${lightboxIndex + 1} of ${property.images.length}`}
            className="lightbox__image"
            onClick={(e) => e.stopPropagation()}
          />

          {property.images.length > 1 && (
            <div className="lightbox__counter">
              {lightboxIndex + 1} / {property.images.length}
            </div>
          )}
        </div>
      )}

      <div className="property-detail__layout">
        <div className="property-detail__main">
          <header className="property-detail__head">
            <h1>{property.title}</h1>
            <p className="property-card__sub">
              {property.location.suburb}, {property.location.city}
              {property.hostName && ` · Hosted by ${property.hostName}`}
            </p>
          </header>

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

          <p className="property-detail__description">{property.description}</p>
          <p className="property-card__sub">
            {property.minNights}-{property.maxNights} nights · Check-in {property.checkInTime}, check-out{' '}
            {property.checkOutTime}
          </p>

          {property.amenities.length > 0 && (
            <div className="amenity-badges">
              {property.amenities.slice(0, 6).map((amenity) => (
                <span className="amenity-badge" key={amenity}>
                  {amenityIcon(amenity)}
                  {amenityLabel(amenity)}
                </span>
              ))}
            </div>
          )}

          {property.amenities.length > 0 && (
            <section className="property-detail__section">
              <h2>Amenities</h2>
              <ul className="amenity-grid">
                {property.amenities.map((amenity) => (
                  <li key={amenity}>
                    {amenityIcon(amenity)}
                    {amenityLabel(amenity)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!property.isAvailable && <p className="notice">This property is not currently accepting bookings.</p>}
        </div>

        <aside className="property-detail__sidebar">
          <div className="booking-form panel">
            <div className="property-card__price" style={{ marginBottom: '0.75rem' }}>
              <b>R{property.stayRate.toFixed(0)}</b> / night
            </div>

            {isOwner ? (
              <p className="property-card__sub">This is your listing.</p>
            ) : !property.isAvailable ? null : !user ? (
              <p>
                <Link to="/login">Sign in with Google</Link> to book this property.
              </p>
            ) : (
              <>
                {bookingError && <p className="error">{bookingError}</p>}
                <label>
                  Check-in
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    onClick={openDatePicker}
                    onFocus={openDatePicker}
                  />
                </label>
                <label>
                  Check-out
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    onClick={openDatePicker}
                    onFocus={openDatePicker}
                  />
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
          </div>

          <div className="panel property-detail__facts">
            <h4>Rooms &amp; facilities</h4>
            <ul>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18v2M21 18v2M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
                </svg>
                {property.beds} {property.beds === 1 ? 'bed' : 'beds'} · {property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 3-1.7M4 19v1M18 19v1" />
                </svg>
                {property.bathrooms} {property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" />
                </svg>
                Up to {property.maxGuests} guests
              </li>
            </ul>
          </div>

          <div className="panel property-detail__facts">
            <h4>House rules</h4>
            <ul>
              <li>Check-in after {property.checkInTime}</li>
              <li>Check-out by {property.checkOutTime}</li>
              <li>
                {property.minNights === property.maxNights
                  ? `${property.minNights}-night stay`
                  : `${property.minNights}-${property.maxNights} night stay`}
              </li>
              {property.houseRules && <li>{property.houseRules}</li>}
            </ul>
          </div>

          <div className="panel property-detail__facts">
            <h4>Location</h4>
            <p className="property-card__sub" style={{ marginBottom: '0.75rem' }}>
              {property.location.suburb}, {property.location.city}, {property.location.province}
            </p>
            <iframe
              title="Property location"
              className="property-detail__map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.location.lng - 0.01}%2C${property.location.lat - 0.01}%2C${property.location.lng + 0.01}%2C${property.location.lat + 0.01}&layer=mapnik&marker=${property.location.lat}%2C${property.location.lng}`}
            />
          </div>

          <div className="panel property-detail__facts">
            <h4>Things to note</h4>
            <ul>
              <li>Free cancellation up to {CANCELLATION_FREE_WINDOW_HOURS} hours before check-in.</li>
              <li>Reviews open 24 hours after checkout.</li>
            </ul>
          </div>
        </aside>

        {/* Full-width rows below the main/sidebar pair - each given its own explicit
            grid-area (see .property-detail__layout in index.css) rather than relying on
            CSS Grid's implicit auto-placement to figure out where a grid-column:1/-1 item
            should land relative to the sidebar. Named areas make the position unambiguous
            on both desktop (main+sidebar side by side, these two full-width underneath) and
            mobile (single column, in exactly this order - booking slot and reviews land
            above the calendar automatically since the sidebar comes before both in the
            area list there). */}
        <section className="reviews property-detail__reviews">
          <h2>Reviews {property.ratingCount > 0 && `(★ ${property.ratingAvg.toFixed(1)})`}</h2>
          {reviewsQuery.data?.length ? (
            <ul>
              {reviewsQuery.data.map((review) => (
                <li key={review.id} className="reviews__item">
                  {review.authorAvatarUrl ? (
                    <img
                      className="reviews__avatar"
                      src={`${apiBaseUrl()}${review.authorAvatarUrl}`}
                      alt={review.authorName ?? 'Reviewer'}
                    />
                  ) : (
                    review.authorName && (
                      <span className="reviews__avatar reviews__avatar--placeholder">
                        {review.authorName.charAt(0).toUpperCase()}
                      </span>
                    )
                  )}
                  <span>
                    {review.authorName && <strong>{review.authorName} · </strong>}
                    ★ {review.rating} - {review.comment}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No reviews yet.</p>
          )}
        </section>

        <section className="property-detail__calendar">
          <AvailabilityCalendar propertyId={property.id} />
        </section>
      </div>
    </div>
  );
}
