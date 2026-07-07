import crypto from 'node:crypto';

// PayFast's signature is an MD5 hash of the fields in the exact order they're submitted
// (NOT alphabetically sorted), space-encoded as "+" per PHP's urlencode - not %20.
// See claude_plan.md §3 (risk #4): verify this against PayFast's current docs/sandbox
// before relying on it for real payments; the general shape is well-established but exact
// edge cases (e.g. custom fields, encoding of special characters) should be tested end-to-end.
function toSignatureString(fields: Record<string, string>, passphrase?: string): string {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, '+')}`);

  if (passphrase) {
    parts.push(`passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`);
  }

  return parts.join('&');
}

export function generatePayfastSignature(
  fields: Record<string, string>,
  passphrase?: string,
): string {
  return crypto.createHash('md5').update(toSignatureString(fields, passphrase)).digest('hex');
}
