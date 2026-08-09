import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaymentProvider, UpdatePaymentGatewaySettingsInput } from '@soweto-stays/shared';
import { adminApi } from '../api/admin.js';
import { apiBaseUrl } from '../api/client.js';

// PayFast has no webhook-management API to automate against (unlike Yoco below), so this is
// still a manual paste-into-the-dashboard field - see payment.routes.ts.
const PAYFAST_NOTIFY_URL = `${apiBaseUrl()}/api/payments/payfast/notify`;

function WebhookTestRow({ provider, disabled }: { provider: PaymentProvider; disabled: boolean }) {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const runTest = async () => {
    setIsTesting(true);
    setResult(null);
    try {
      const outcome = await adminApi.testPaymentWebhook(provider);
      setResult(outcome);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button type="button" disabled={disabled || isTesting} onClick={() => void runTest()}>
        {isTesting ? 'Testing...' : 'Test webhook'}
      </button>
      {disabled && (
        <p className="listing-form__hint" style={{ margin: '4px 0 0' }}>
          Save credentials above first.
        </p>
      )}
      {result && (
        <p
          className={result.ok ? 'listing-form__hint' : 'error'}
          style={{ margin: '6px 0 0', color: result.ok ? 'var(--color-accent, green)' : undefined }}
        >
          {result.ok ? '✓' : '✗'} {result.message}
        </p>
      )}
    </div>
  );
}

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
      // When a Yoco secret key is (re)saved, the server automatically registers (or reuses)
      // a webhook with Yoco itself and returns a status message confirming that - see
      // platformSettings.service.ts's updatePaymentGatewaySettings. No manual webhook setup
      // needed on this end.
      const result = await adminApi.updatePaymentSettings(patch);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'payment-settings'] });
      setYocoSecretKey('');
      setPayfastMerchantKey('');
      setPayfastPassphrase('');
      setStatus(result.message ?? 'Saved.');
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
                  data.yoco.hasSecretKey ? `Currently set (${data.yoco.secretKeyHint}) — leave blank to keep` : 'sk_live_...'
                }
                autoComplete="off"
              />
            </label>
            <p className="listing-form__hint" style={{ margin: '0 0 0.75rem' }}>
              That's it - saving a secret key automatically registers a webhook with Yoco for
              you (or reuses one that's already registered). No dashboard setup needed.
            </p>
            {data.yoco.hasWebhookSecret && (
              <label>
                Webhook status
                <input
                  value={data.yoco.webhookUrl ? `Registered → ${data.yoco.webhookUrl}` : 'Registered'}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
              </label>
            )}
            <WebhookTestRow provider="yoco" disabled={!data.yoco.hasWebhookSecret} />
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
            <label>
              Notify (ITN) URL <span className="listing-form__hint">paste into PayFast → Notify URL</span>
              <input value={PAYFAST_NOTIFY_URL} readOnly onFocus={(e) => e.target.select()} />
            </label>
            <WebhookTestRow provider="payfast" disabled={!payfastMerchantId} />
          </div>

          <button type="button" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? 'Saving...' : 'Save payment gateway settings'}
          </button>
        </>
      )}
    </div>
  );
}
