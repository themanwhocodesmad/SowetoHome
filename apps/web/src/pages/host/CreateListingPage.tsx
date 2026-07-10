import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreatePropertyInput } from '@soweto-stays/shared';
import { propertiesApi } from '../../api/properties.js';
import { ListingForm } from '../../components/ListingForm.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { HOST_NAV_ITEMS } from '../../components/dashboardNav.js';

export function CreateListingPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);

  // The images endpoint needs a property id, so the listing is created first and the
  // selected photos are uploaded right after.
  const handleSubmit = async (values: CreatePropertyInput) => {
    const property = await propertiesApi.create(values);
    if (files.length > 0) {
      try {
        await propertiesApi.uploadImages(property.id, files);
      } catch {
        // The listing itself was created - land on the edit page where photos can be retried.
      }
    }
    navigate(`/host/listings/${property.id}/edit`);
  };

  return (
    <DashboardLayout title="New listing" navItems={HOST_NAV_ITEMS}>
      <div className="listing-form-wrap">
        <p className="listing-form__intro">
          New listings are reviewed by an admin before they appear in search.
        </p>
        <div className="panel">
          <ListingForm
            onSubmit={handleSubmit}
            submitLabel="Create listing"
            files={files}
            onFilesChange={setFiles}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
