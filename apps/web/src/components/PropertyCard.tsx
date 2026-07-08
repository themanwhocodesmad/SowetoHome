import { Link } from 'react-router-dom';
import type { PropertyDto } from '@soweto-stays/shared';
import { apiBaseUrl } from '../api/client.js';

const PROPERTY_TYPE_LABEL: Record<PropertyDto['propertyType'], string> = {
  entire_place: 'Entire place',
  private_room: 'Private room',
  shared_room: 'Shared room',
};

export function PropertyCard({ property }: { property: PropertyDto }) {
  const cover = property.images[0];
  return (
    <Link to={`/properties/${property.id}`} className="property-card">
      <div className="property-card__image">
        {cover ? (
          <img src={`${apiBaseUrl()}${cover}`} alt={property.title} />
        ) : (
          <div className="property-card__placeholder">No photo yet</div>
        )}
        <span className="property-card__badge">{PROPERTY_TYPE_LABEL[property.propertyType]}</span>
        {property.isAvailable && <span className="property-card__badge property-card__badge--available">Available</span>}
      </div>
      <div className="property-card__title-row">
        <span>
          {property.location.suburb}, {property.location.city}
        </span>
        {property.ratingCount > 0 && (
          <span className="property-card__rating">★ {property.ratingAvg.toFixed(1)}</span>
        )}
      </div>
      <div className="property-card__sub">{property.title}</div>
      <div className="property-card__meta">
        <span>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10.5V19h18v-8.5M3 10.5a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 10.5M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
          </svg>
          {property.beds} bed{property.beds === 1 ? '' : 's'}
        </span>
        <span>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V7a2 2 0 0 1 2-2h2M4 19v2M20 19v2" />
          </svg>
          {property.bathrooms} bath{property.bathrooms === 1 ? '' : 's'}
        </span>
      </div>
      <div className="property-card__footer">
        <div className="property-card__price">
          <b>R{property.stayRate.toFixed(0)}</b> / night
        </div>
        <span className="property-card__link">
          View details
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
