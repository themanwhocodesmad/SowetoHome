import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../../api/properties.js';
import { apiBaseUrl } from '../../api/client.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { HOST_NAV_ITEMS } from '../../components/dashboardNav.js';
import { pillClass } from '../../components/pillVariant.js';

export function HostListingsPage() {
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', 'mine'],
    queryFn: propertiesApi.listMine,
  });

  const handleUpload = async (propertyId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingId(propertyId);
    try {
      await propertiesApi.uploadImages(propertyId, Array.from(files));
      await queryClient.invalidateQueries({ queryKey: ['properties', 'mine'] });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <DashboardLayout title="Listings" navItems={HOST_NAV_ITEMS}>
      <div className="section-head">
        <h2>Your listings</h2>
        <Link to="/host/listings/new" className="button">
          + Add listing
        </Link>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load your listings.</p>}

      <div className="panel panel--flush">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Price / night</th>
              <th>Rating</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((property) => (
              <tr key={property.id}>
                <td>
                  <div className="row-thumb">
                    {property.images[0] ? (
                      <img src={`${apiBaseUrl()}${property.images[0]}`} alt="" />
                    ) : (
                      <div className="row-thumb__placeholder" />
                    )}
                    <div>
                      <div className="t-title">{property.title}</div>
                      <div className="t-sub">
                        {property.location.suburb}, {property.location.city}
                      </div>
                    </div>
                  </div>
                </td>
                <td>R{property.stayRate.toFixed(0)}</td>
                <td>{property.ratingCount > 0 ? `★ ${property.ratingAvg.toFixed(1)}` : '—'}</td>
                <td>
                  <span className={pillClass(property.status)}>{property.status}</span>
                  {!property.isAvailable && (
                    <span className="pill pill--neutral" style={{ marginLeft: 6 }}>
                      unavailable
                    </span>
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Link to={`/host/listings/${property.id}/edit`} className="button">
                    Edit
                  </Link>{' '}
                  <label className="button" style={{ position: 'relative', overflow: 'hidden' }}>
                    {uploadingId === property.id ? 'Uploading...' : 'Add photos'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploadingId === property.id}
                      onChange={(e) => void handleUpload(property.id, e.target.files)}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data?.length === 0 && <p>You haven't listed a property yet.</p>}
    </DashboardLayout>
  );
}
