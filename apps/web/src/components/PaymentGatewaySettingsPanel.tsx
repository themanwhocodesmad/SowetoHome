import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaymentProvider, UpdatePaymentGatewaySettingsInput } from '@soweto-stays/shared';
import { adminApi } from '../api/admin.js';

// Secret fields (Yoco secret key/webhook secret, PayFast merchant key/passphrase) are never
// sent back from the API - only whether one is set, plus a last-4 hint (see
// platformSettings.service.ts's maskPaymentGatewaySettings). So these inputs start blank:
// leaving one blank on save means "keep the currently-saved value", not "clear it" - only
// the explicit "Clear" button actually removes a saved secret.
export function PaymentGatewaySettingsPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'payment-settings'],
    queryFn: adminApi.getPaymentSettings,
  });

  const [activeProvider, setActiveProvider] = useState<PaymentProvider>('yoco');
  const [yocoEnabled, setYocoEnabled] = useState(false);
  const [yocoSecretKey, setYocoSecretKey] = useState('');
  const [yocoWebhookSecret, setYocoWebhookSecret] = useState('');
  const [payfastEnabled, setPayfastEnabled] = useState(false);
  const [payfastMerchantId, setPayfastMerchantId] = useState('');
  const [payfastMerchantKey, setPayfastMerchantKey] = useState('');
  const [payfastPassphrase, setPayfastPassphrase] = useState('');
  const [payfastMode, setPayfastMode] = useState<'sandbox' | 'live'>('sandbox');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setActiveProvider(data.activeProvider);
    setYocoEnabled(data.yoco.enabled);
    setPayfastEnabled(data.payfast.enabled);
    setPayfastMerchantId(data.payfast.merchantId ?? '');
    setPayfastMode(data.payfast.mode);
  }, [data]);

  const save = async (patch: UpdatePaymentGatewaySettingsInput) => {
    setStatus(null);
    setIsSaving(true);
    try {
      await adminApi.updatePaymentSettings(patch);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'payment-settings'] });
      setYocoSecretKey('');
      setYocoWebhookSecret('');
      setPayfastMerchantKey('');
      setPayfastPassphrase('');
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save payment gateway settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () =>
    save({
      activeProvider,
      yoco: {
        enabled: yocoEnabled,
        ...(yocoSecretKey ? { secretKey: yocoSecretKey } : {}),
        ...(yocoWebhookSecret ? { webhookSecret: yocoWebhookSecret } : {}),
      },
      payfast: {
        enabled: payfastEnabled,
        merchantId: payfastMerchantId,
        mode: payfastMode,
        ...(payfastMerchantKey ? { merchantKey: payfastMerchantKey } : {}),
        ...(payfastPassphrase ? { passphrase: payfastPassphrase } : {}),
      },
    });

  return (
    <div className="panel" style={{ maxWidth: 520, marginBottom: '1.5rem' }}>
      <h3>Payment gateways</h3>
      <p className="property-card__sub">
        Guests pay through whichever gateway is set active below. Credentials are stored on the
        server and never shown back in full once saved.
      </p>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load payment gateway settings.</p>}
      {status && <p>{status}</p>}

      {data && (
        <>
          <label>
            Active gateway
            <select
              value={activeProvider}
              onChange={(e) => setActiveProvider(e.target.value as PaymentProvider)}
            >
              <option value="yoco">Yoco</option>
              <option value="payfast">PayFast</option>
            </select>
          </label>

          <div className="panel" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h4 style={{ marginTop: 0 }}>Yoco {data.yoco.mode && `(${data.yoco.mode} key)`}</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={yocoEnabled}
                onChange={(e) => setYocoEnabled(e.target.checked)}
              />
              Enabled
            </label>
            <label>
              Secret key
              <input
                type="password"
                value={yocoSecretKey}
                onChange={(e) => setYocoSecretKey(e.target.value)}
                placeholder={
                  data.yoco.hasSecretKey ? `Currently set (${data.yoco.secretKeyHint}) — leave blank to keep` : 'sk_test_...'
                }
                autoComplete="off"
              />
            </label>
            <label>
              Webhook secret
              <input
                type="password"
                value={yocoWebhookSecret}
                onChange={(e) => setYocoWebhookSecret(e.target.value)}
                placeholder={data.yoco.hasWebhookSecret ? 'Currently set — leave blank to keep' : 'whsec_...'}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="panel" style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginTop: 0 }}>PayFast</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={payfastEnabled}
                onChange={(e) => setPayfastEnabled(e.target.checked)}
              />
              Enabled
            </label>
            <label>
              Mode
              <select value={payfastMode} onChange={(e) => setPayfastMode(e.target.value as 'sandbox' | 'live')}>
                <option value="sandbox">Sandbox (testing)</option>
                <option value="live">Live</option>
              </select>
            </label>
            <label>
              Merchant ID
              <input
                value={payfastMerchantId}
                onChange={(e) => setPayfastMerchantId(e.target.value)}
                placeholder="10000100"
              />
            </label>
            <label>
              Merchant key
              <input
                type="password"
                value={payfastMerchantKey}
                onChange={(e) => setPayfastMerchantKey(e.target.value)}
                placeholder={
                  data.payfast.hasMerchantKey
                    ? `Currently set (${data.payfast.merchantKeyHint}) — leave blank to keep`
                    : '46f0cd694581a'
                }
                autoComplete="off"
              />
            </label>
            <label>
              Passphrase <span className="listing-form__hint">optional, but recommended</span>
              <input
                type="password"
                value={payfastPassphrase}
                onChange={(e) => setPayfastPassphrase(e.target.value)}
                placeholder={data.payfast.hasPassphrase ? 'Currently set — leave blank to keep' : ''}
                autoComplete="off"
              />
            </label>
          </div>

          <button type="button" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? 'Saving...' : 'Save payment gateway settings'}
          </button>
        </>
      )}
    </div>
  );
}
