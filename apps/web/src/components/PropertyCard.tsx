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
      <div className="property-card__price">
        <b>R{property.stayRate.toFixed(0)}</b> / night
      </div>
    </Link>
  );
}
