import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

export function AdminSettingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
  });

  const [adminFeePercent, setAdminFeePercent] = useState(0);
  const [cancellationFreeWindowHours, setCancellationFreeWindowHours] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setAdminFeePercent(data.adminFeePercent);
      setCancellationFreeWindowHours(data.cancellationFreeWindowHours);
    }
  }, [data]);

  const handleSave = async () => {
    setStatus(null);
    try {
      await adminApi.updateSettings({ adminFeePercent, cancellationFreeWindowHours });
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save settings');
    }
  };

  return (
    <DashboardLayout title="Settings" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Platform settings</h2>
      </div>
      <p className="property-card__sub">
        These apply to new bookings going forward - they don't require a deploy to change.
      </p>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load settings.</p>}

      {data && (
        <div className="panel" style={{ maxWidth: 420 }}>
          {status && <p>{status}</p>}
          <label>
            Admin fee (%)
            <input
              type="number"
              min={0}
              max={100}
              value={adminFeePercent}
              onChange={(e) => setAdminFeePercent(Number(e.target.value))}
            />
          </label>
          <label>
            Free cancellation window (hours before check-in)
            <input
              type="number"
              min={0}
              value={cancellationFreeWindowHours}
              onChange={(e) => setCancellationFreeWindowHours(Number(e.target.value))}
            />
          </label>
          <button type="button" onClick={() => void handleSave()}>
            Save settings
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
