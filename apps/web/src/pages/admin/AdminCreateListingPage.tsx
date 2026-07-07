import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreatePropertyInput } from '@soweto-stays/shared';
import { propertiesApi } from '../../api/properties.js';
import { ListingForm } from '../../components/ListingForm.js';

// Admins never own listings (claude_plan.md §2/§10) - this always attaches the new
// listing to an existing host account, adding the host role to that account if needed.
export function AdminCreateListingPage() {
  const navigate = useNavigate();
  const [hostId, setHostId] = useState('');

  const handleSubmit = async (values: CreatePropertyInput) => {
    if (!hostId.trim()) throw new Error('Enter the host user ID this listing belongs to');
    await propertiesApi.createOnBehalf(hostId.trim(), values);
    navigate(`/admin/listings`, { replace: true });
  };

  return (
    <div>
      <h1>Create a listing on behalf of a host</h1>
      <label>
        Host user ID
        <input value={hostId} onChange={(e) => setHostId(e.target.value)} placeholder="Mongo user id" required />
      </label>
      <ListingForm onSubmit={handleSubmit} submitLabel="Create listing for host" />
    </div>
  );
}
