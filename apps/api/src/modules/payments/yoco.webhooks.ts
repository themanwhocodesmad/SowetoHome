import { logger } from '../../common/logger.js';
import { AppError } from '../../common/errors/AppError.js';

// Same host as the checkout API in payment.service.ts (payments.yoco.com/api) - NOT
// online.yoco.com/v1/webhooks, which doesn't exist (returns a plain 404 "Action not found"
// with no auth check at all). Confirmed live: POST/GET https://payments.yoco.com/api/webhooks
// return a structured 403 Forbidden JSON error without credentials (internally routed to a
// "/subscriptions" resource per the error body's "path" field) - i.e. a real, authenticated
// route, unlike the other URL.
const YOCO_WEBHOOKS_API = 'https://payments.yoco.com/api/webhooks';

interface YocoWebhookRecord {
  id?: string;
  url: string;
  // The exact field Yoco returns the signing secret under wasn't confirmed against a live
  // account (no real Yoco credentials available while building this) - secret/signingSecret
  // are both checked defensively. Verify the real shape against a live response (or Yoco's
  // dashboard) before relying on this in production; the admin UI's "Test webhook" button
  // will clearly report a failure if the wrong field was read.
  secret?: string;
  signingSecret?: string;
  name?: string;
}

function extractSecret(record: YocoWebhookRecord | undefined): string | undefined {
  return record?.secret ?? record?.signingSecret;
}

export interface RegisteredYocoWebhook {
  webhookUrl: string;
  webhookSecret?: string;
}

function authHeaders(secretKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  };
}

// Auto-registers (or reuses) a Yoco webhook endpoint for this deployment whenever an admin
// saves their Yoco secret key - the whole point is that an admin never has to open the Yoco
// dashboard and manually paste in a webhook URL or copy out a webhook secret themselves.
//
// Per Yoco's webhook management API (developer.yoco.com/online/api-reference/webhooks/) -
// this exact request/response shape wasn't exercised against a live Yoco account while
// wiring this up (same caveat already on yoco.signature.ts's verification scheme) - re-check
// against the real API/dashboard before relying on it for production traffic, in particular
// whether GET /v1/webhooks actually returns a usable `secret` for an already-registered
// endpoint (some providers only ever reveal a webhook signing secret once, at creation time -
// if Yoco does the same, a webhook created via the Yoco dashboard rather than this endpoint
// would need its secret pasted in manually the one time, since there'd be nothing to fetch).
export async function registerYocoWebhook(
  secretKey: string,
  webhookUrl: string,
): Promise<RegisteredYocoWebhook> {
  const createRes = await fetch(YOCO_WEBHOOKS_API, {
    method: 'POST',
    headers: authHeaders(secretKey),
    body: JSON.stringify({ url: webhookUrl, name: 'App Automated Webhook' }),
  });

  if (createRes.ok) {
    const data = (await createRes.json()) as YocoWebhookRecord;
    return { webhookUrl, webhookSecret: extractSecret(data) };
  }

  if (createRes.status === 401 || createRes.status === 403) {
    throw AppError.badRequest('Yoco rejected that secret key - double check it was copied correctly.');
  }

  // Most likely reason for a non-auth failure here: Yoco already has a webhook registered at
  // this URL (or this account already has one registered) - fall back to looking it up
  // instead of treating that as a hard failure, so re-saving the same secret key (e.g. after
  // a redeploy, or just clicking Save again) doesn't error out.
  logger.warn(
    { status: createRes.status, body: await createRes.text().catch(() => undefined) },
    'Yoco webhook creation failed - checking for an existing registration before giving up',
  );

  const listRes = await fetch(YOCO_WEBHOOKS_API, { headers: authHeaders(secretKey) });
  if (!listRes.ok) {
    throw AppError.badRequest(
      'Could not register a Yoco webhook with that secret key, and no existing webhook could be found either.',
    );
  }

  const list = (await listRes.json()) as YocoWebhookRecord[] | { data: YocoWebhookRecord[] };
  const records = Array.isArray(list) ? list : (list.data ?? []);
  const existing = records.find((w) => w.url === webhookUrl) ?? records[0];

  if (!existing) {
    throw AppError.badRequest('Yoco rejected the webhook registration and no existing matching webhook was found.');
  }

  return { webhookUrl, webhookSecret: extractSecret(existing) };
}
