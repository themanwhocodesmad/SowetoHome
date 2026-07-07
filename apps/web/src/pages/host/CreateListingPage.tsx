import { useNavigate } from 'react-router-dom';
import type { CreatePropertyInput } from '@soweto-stays/shared';
import { propertiesApi } from '../../api/properties.js';
import { ListingForm } from '../../components/ListingForm.js';

export function CreateListingPage() {
  const navigate = useNavigate();

  const handleSubmit = async (values: CreatePropertyInput) => {
    const property = await propertiesApi.create(values);
    navigate(`/host/listings/${property.id}/edit`);
  };

  return (
    <div>
      <h1>List a new property</h1>
      <p>New listings are reviewed by an admin before they appear in search.</p>
      <ListingForm onSubmit={handleSubmit} submitLabel="Create listing" />
    </div>
  );
}
