import crypto from 'node:crypto';

// Yoco delivers webhooks via Svix, signed per https://developer.yoco.com/online/api-reference/webhooks/verifying-events/:
// signedContent = "<webhook-id>.<webhook-timestamp>.<raw body>", HMAC-SHA256'd with the bytes
// after the "whsec_" prefix (base64-decoded), and base64-encoded. webhook-signature can carry
// multiple space-separated "v1,<sig>" entries - match against any of them. This general shape
// is well-established (Svix is used by many providers) but wasn't exercised against a live
// Yoco webhook while building this - verify against the sandbox before relying on it in prod.
const TIMESTAMP_TOLERANCE_SECONDS = 3 * 60;

interface YocoWebhookHeaders {
  'webhook-id'?: string;
  'webhook-timestamp'?: string;
  'webhook-signature'?: string;
}

export function verifyYocoWebhookSignature(
  headers: YocoWebhookHeaders,
  rawBody: Buffer,
  secret: string,
): boolean {
  const id = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signatureHeader = headers['webhook-signature'];
  if (!id || !timestamp || !signatureHeader) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${id}.${timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');
  const expectedBuffer = Buffer.from(expected);

  return signatureHeader.split(' ').some((entry) => {
    const signature = entry.split(',')[1];
    if (!signature) return false;
    const signatureBuffer = Buffer.from(signature);
    return (
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    );
  });
}
