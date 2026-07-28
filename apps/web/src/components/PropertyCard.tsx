import { Link } from 'react-router-dom';
import type { PropertyDto } from '@soweto-stays/shared';
import { apiBaseUrl } from '../api/client.js';

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
        {property.isAvailable && <span className="property-card__badge">Available</span>}
      </div>
      <div className="property-card__body">
        <h3 className="property-card__title">{property.title}</h3>
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
