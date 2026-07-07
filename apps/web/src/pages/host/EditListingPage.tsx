import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePropertyInput } from '@soweto-stays/shared';
import { propertiesApi } from '../../api/properties.js';
import { apiBaseUrl } from '../../api/client.js';
import { ListingForm } from '../../components/ListingForm.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { HOST_NAV_ITEMS } from '../../components/dashboardNav.js';
import { pillClass } from '../../components/pillVariant.js';

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [removingImage, setRemovingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const propertyQuery = useQuery({
    queryKey: ['properties', id],
    queryFn: () => propertiesApi.getById(id as string),
    enabled: Boolean(id),
  });

  if (propertyQuery.isLoading) {
    return (
      <DashboardLayout title="Edit listing" navItems={HOST_NAV_ITEMS}>
        <p>Loading...</p>
      </DashboardLayout>
    );
  }
  if (propertyQuery.error || !propertyQuery.data) {
    return (
      <DashboardLayout title="Edit listing" navItems={HOST_NAV_ITEMS}>
        <p className="error">Listing not found.</p>
      </DashboardLayout>
    );
  }

  const property = propertyQuery.data;

  const handleSubmit = async (values: CreatePropertyInput) => {
    await propertiesApi.update(property.id, values);
    navigate('/host/listings');
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoError(null);
    setIsUploading(true);
    try {
      await propertiesApi.uploadImages(property.id, Array.from(files));
      await queryClient.invalidateQueries({ queryKey: ['properties', id] });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload photos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (imagePath: string) => {
    setPhotoError(null);
    setRemovingImage(imagePath);
    try {
      await propertiesApi.removeImage(property.id, imagePath);
      await queryClient.invalidateQueries({ queryKey: ['properties', id] });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not remove photo');
    } finally {
      setRemovingImage(null);
    }
  };

  const canAddMore = property.images.length < 8;

  return (
    <DashboardLayout title="Edit listing" navItems={HOST_NAV_ITEMS}>
      <div className="section-head">
        <h2>{property.title}</h2>
        <span className={pillClass(property.status)}>{property.status}</span>
      </div>

      <div className="panel">
        <div className="section-head">
          <h2 style={{ fontSize: '1rem' }}>Photos ({property.images.length}/8)</h2>
        </div>
        {photoError && <p className="error">{photoError}</p>}
        <div className="photo-grid">
          {property.images.map((img) => (
            <div key={img} className="photo-grid__item">
              <img src={`${apiBaseUrl()}${img}`} alt={property.title} />
              <button
                type="button"
                className="photo-grid__remove"
                disabled={removingImage === img}
                onClick={() => void handleRemoveImage(img)}
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
          {canAddMore && (
            <label className="photo-grid__add">
              {isUploading ? 'Uploading...' : '+ Add photos'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={isUploading}
                onChange={(e) => void handleUpload(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="panel">
        <ListingForm initialValues={property} onSubmit={handleSubmit} submitLabel="Save changes" />
      </div>
    </DashboardLayout>
  );
}
