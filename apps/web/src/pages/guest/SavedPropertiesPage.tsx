import { useQuery } from '@tanstack/react-query';
import { savedPropertiesApi } from '../../api/savedProperties.js';
import { PropertyCard } from '../../components/PropertyCard.js';

export function SavedPropertiesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['saved-properties', 'full'],
    queryFn: savedPropertiesApi.list,
  });

  if (isLoading) return <p>Loading your saved properties...</p>;
  if (error) return <p className="error">Could not load your saved properties.</p>;

  return (
    <div>
      <h1>Saved properties</h1>
      {data?.length === 0 ? (
        <p>You haven't saved any properties yet - tap the heart icon on a listing to save it here.</p>
      ) : (
        <div className="property-grid property-grid--static">
          {data?.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
