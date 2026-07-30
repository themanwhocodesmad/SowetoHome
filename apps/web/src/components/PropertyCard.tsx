import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PropertyDto } from '@soweto-stays/shared';
import { apiBaseUrl } from '../api/client.js';

// Matches the "Guest favorite" ribbon in Airbnb-style listing UIs - a strong rating
// backed by enough reviews to mean something, not just a single 5-star fluke.
const GUEST_FAVORITE_MIN_RATING = 4.8;
const GUEST_FAVORITE_MIN_REVIEWS = 3;

export function PropertyCard({ property }: { property: PropertyDto }) {
  const cover = property.images[0];
  const [isSaved, setIsSaved] = useState(false);
  const isGuestFavorite =
    property.ratingCount >= GUEST_FAVORITE_MIN_REVIEWS && property.ratingAvg >= GUEST_FAVORITE_MIN_RATING;

  return (
    <Link to={`/properties/${property.id}`} className="property-card">
      <div className="property-card__image">
        {cover ? (
          <img src={`${apiBaseUrl()}${cover}`} alt={property.title} />
        ) : (
          <div className="property-card__placeholder">No photo yet</div>
        )}
        <div className="property-card__badges">
          {isGuestFavorite && <span className="property-card__badge">Guest favorite</span>}
          {property.isAvailable && <span className="property-card__badge property-card__badge--available">Available</span>}
        </div>
        <button
          type="button"
          className={`property-card__save${isSaved ? ' property-card__save--active' : ''}`}
          aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          aria-pressed={isSaved}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSaved((saved) => !saved);
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 5.7 5c1.9 0 3.4 1 4.3 2.4C10.9 6 12.4 5 14.3 5c3.4 0 5.2 3.4 3.7 6.7C19.5 16.4 12 21 12 21Z" />
          </svg>
        </button>
      </div>
      <div className="property-card__body">
        <div className="property-card__title-row">
          <h3 className="property-card__title">{property.title}</h3>
          {property.ratingCount > 0 && (
            <span className="property-card__rating">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M12 2.5 15 9l7 .7-5.3 4.7L18.3 21 12 17.2 5.7 21l1.6-6.6L2 9.7 9 9Z" />
              </svg>
              {property.ratingAvg.toFixed(2)}
            </span>
          )}
        </div>
        <p className="property-card__location">
          <span aria-hidden="true">📍</span> {property.location.suburb}, {property.location.city}
        </p>

        <div className="property-card__specs">
          <span>
            🛏 {property.beds} bed{property.beds === 1 ? '' : 's'}
          </span>
          <span>
            🚿 {property.bathrooms} bath{property.bathrooms === 1 ? '' : 's'}
          </span>
          <span>
            👥 {property.maxGuests} guest{property.maxGuests === 1 ? '' : 's'}
          </span>
        </div>

        <div className="property-card__footer">
          <span className="property-card__price">
            R{property.stayRate.toFixed(0)} <span>/ night</span>
          </span>
          <span className="property-card__view">View Details →</span>
        </div>
      </div>
    </Link>
  );
}
