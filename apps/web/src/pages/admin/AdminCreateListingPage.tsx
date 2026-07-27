import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CreatePropertyInput } from '@soweto-stays/shared';
import { adminApi } from '../../api/admin.js';
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

  const hostsQuery = useQuery({
    queryKey: ['admin', 'users', 'host'],
    queryFn: () => adminApi.listUsers(1, 100, 'host'),
  });

  const handleSubmit = async (values: CreatePropertyInput) => {
    if (!hostId) throw new Error('Select the host this listing belongs to');
    const property = await propertiesApi.createOnBehalf(hostId, values);
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
        Host
        <select value={hostId} onChange={(e) => setHostId(e.target.value)} required>
          <option value="" disabled>
            {hostsQuery.isLoading ? 'Loading hosts...' : 'Select a host...'}
          </option>
          {hostsQuery.data?.items.map((host) => (
            <option key={host.id} value={host.id}>
              {host.name} ({host.email})
            </option>
          ))}
        </select>
        {hostsQuery.error && <p className="error">Could not load hosts.</p>}
        {hostsQuery.data && hostsQuery.data.items.length === 0 && (
          <p className="property-card__sub">No hosts yet — approve a host application first.</p>
        )}
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