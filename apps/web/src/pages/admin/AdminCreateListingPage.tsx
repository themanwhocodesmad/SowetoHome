import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreatePropertyInput } from '@soweto-stays/shared';
import { propertiesApi } from '../../api/properties.js';
import { ListingForm } from '../../components/ListingForm.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

// Admins never own listings (claude_plan.md §2/§10) - this always attaches the new
// listing to an existing host account, adding the host role to that account if needed.
export function AdminCreateListingPage() {
  const navigate = useNavigate();
  const [hostId, setHostId] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (values: CreatePropertyInput) => {
    if (!hostId.trim()) throw new Error('Enter the host user ID this listing belongs to');
    const property = await propertiesApi.createOnBehalf(hostId.trim(), values);
    if (files.length > 0) {
      try {
        await propertiesApi.uploadImages(property.id, files);
      } catch {
        // Listing was created — admin can add photos from the host edit page if upload fails.
      }
    }
    navigate('/admin/listings', { replace: true });
  };

  return (
    <DashboardLayout title="Create listing" navItems={ADMIN_NAV_ITEMS}>
      <h2>Create a listing on behalf of a host</h2>
      <label>
        Host user ID
        <input value={hostId} onChange={(e) => setHostId(e.target.value)} placeholder="Mongo user id" required />
      </label>
      <ListingForm
        onSubmit={handleSubmit}
        submitLabel="Create listing for host"
        files={files}
        onFilesChange={setFiles}
      />
    </DashboardLayout>
  );
}