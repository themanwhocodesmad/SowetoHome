import { useEffect, useState } from 'react';
import type { PayoutDetailsDto } from '@soweto-stays/shared';
import { usersApi } from '../../api/users.js';
import { useAuth } from '../../auth/AuthContext.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { HOST_NAV_ITEMS } from '../../components/dashboardNav.js';

const EMPTY_DETAILS: PayoutDetailsDto = {
  bankName: '',
  accountNumber: '',
  accountHolder: '',
};

export function HostPaymentDetailsPage() {
  const { user, refresh } = useAuth();
  const [details, setDetails] = useState<PayoutDetailsDto>(EMPTY_DETAILS);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.payoutDetails) {
      setDetails(user.payoutDetails);
    }
  }, [user?.payoutDetails]);

  const handleSave = async () => {
    setStatus(null);
    setIsSaving(true);
    try {
      await usersApi.updateProfile({ payoutDetails: details });
      await refresh();
      setStatus('Payment details saved. Admins will use these when sending your payout via EFT.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save payment details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Payment details" navItems={HOST_NAV_ITEMS}>
      <div className="section-head">
        <h2>Bank account for payouts</h2>
      </div>
      <p className="property-card__sub">
        After a guest pays, BookMyStay collects the full amount. Your share is sent to this account
        via manual EFT once an admin processes the payout.
      </p>

      <div className="panel" style={{ maxWidth: 480 }}>
        {status && <p>{status}</p>}
        <label>
          Bank name
          <input
            value={details.bankName}
            onChange={(e) => setDetails((d) => ({ ...d, bankName: e.target.value }))}
            placeholder="e.g. FNB, Capitec, Standard Bank"
            required
          />
        </label>
        <label>
          Account holder name
          <input
            value={details.accountHolder}
            onChange={(e) => setDetails((d) => ({ ...d, accountHolder: e.target.value }))}
            placeholder="Name as it appears on the account"
            required
          />
        </label>
        <label>
          Account number
          <input
            value={details.accountNumber}
            onChange={(e) => setDetails((d) => ({ ...d, accountNumber: e.target.value }))}
            placeholder="Account number"
            required
          />
        </label>
        <button type="button" disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? 'Saving...' : 'Save payment details'}
        </button>
      </div>
    </DashboardLayout>
  );
}