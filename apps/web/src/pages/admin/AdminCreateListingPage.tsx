import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreatePropertyInput } from '@soweto-stays/shared';
import { propertiesApi } from '../../api/properties.js';
import { ListingForm } from '../../components/ListingForm.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

// The platform (admin) is the sole host of every listing - there's no separate host
// account to attach a new listing to, so this just creates it under the admin's own id
// and publishes it immediately (trusted, no moderation queue).
export function AdminCreateListingPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (values: CreatePropertyInput) => {
    const property = await propertiesApi.create(values);
    if (files.length > 0) {
      try {
        await propertiesApi.uploadImages(property.id, files);
      } catch {
        // Listing was created — photos can still be added from the edit page if upload fails.
      }
    }
    navigate('/admin/listings', { replace: true });
  };

  return (
    <DashboardLayout title="Create listing" navItems={ADMIN_NAV_ITEMS}>
      <h2>Create a listing</h2>
      <ListingForm
        onSubmit={handleSubmit}
        submitLabel="Create listing"
        files={files}
        onFilesChange={setFiles}
      />
    </DashboardLayout>
  );
}
