import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SITE_IMAGE_SLOTS } from '@soweto-stays/shared';
import { adminApi } from '../../api/admin.js';
import { apiBaseUrl } from '../../api/client.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

export function AdminSiteImagesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'site-images'],
    queryFn: adminApi.getSiteImages,
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<Record<string, string>>({});

  const handleUpload = async (key: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setSlotError((prev) => ({ ...prev, [key]: '' }));
    setBusyKey(key);
    try {
      await adminApi.uploadSiteImage(key, file);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'site-images'] });
    } catch (err) {
      setSlotError((prev) => ({
        ...prev,
        [key]: err instanceof Error ? err.message : 'Could not upload image',
      }));
    } finally {
      setBusyKey(null);
    }
  };

  const handleReset = async (key: string) => {
    setSlotError((prev) => ({ ...prev, [key]: '' }));
    setBusyKey(key);
    try {
      await adminApi.deleteSiteImage(key);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'site-images'] });
    } catch (err) {
      setSlotError((prev) => ({
        ...prev,
        [key]: err instanceof Error ? err.message : 'Could not reset image',
      }));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <DashboardLayout title="Site Images" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Marketing photos</h2>
      </div>
      <p className="property-card__sub">
        Swap out the demo photos used on the public site yourself — no code changes needed.
      </p>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load site images.</p>}

      {data &&
        SITE_IMAGE_SLOTS.map((slot) => {
          const imagePath = data[slot.key];
          const isBusy = busyKey === slot.key;
          return (
            <div className="panel" key={slot.key}>
              <div className="section-head">
                <h2 style={{ fontSize: '1rem' }}>{slot.label}</h2>
              </div>
              {slotError[slot.key] && <p className="error">{slotError[slot.key]}</p>}
              <div className="site-image-row">
                <div className="site-image-row__preview">
                  {imagePath ? (
                    <img src={`${apiBaseUrl()}${imagePath}`} alt={slot.label} />
                  ) : (
                    <span>Using the default demo photo</span>
                  )}
                </div>
                <div className="site-image-row__actions">
                  <label className="button button--outline">
                    {isBusy ? 'Uploading...' : imagePath ? 'Replace photo' : 'Upload photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isBusy}
                      onChange={(e) => void handleUpload(slot.key, e.target.files)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {imagePath && (
                    <button
                      type="button"
                      className="button button--outline"
                      disabled={isBusy}
                      onClick={() => void handleReset(slot.key)}
                    >
                      Reset to default
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </DashboardLayout>
  );
}
