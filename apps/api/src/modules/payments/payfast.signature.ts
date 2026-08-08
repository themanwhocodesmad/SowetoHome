import crypto from 'node:crypto';

// PayFast's signature spec (https://developers.payfast.co.za/docs#step_2_signature): build
// "key=urlencoded_value&key=urlencoded_value..." over every non-empty field IN THE ORDER
// THEY APPEAR on the object, append "&passphrase=urlencoded_passphrase" if one is set, then
// MD5 the result. PayFast's own encoding rule is PHP's urlencode (spaces as "+", not "%20"),
// which is why encodeURIComponent alone isn't enough - the %20 substitution below is required.
//
// Field ORDER matters and is never re-sorted:
//  - When *building* an outgoing checkout request, the order is whatever this module's
//    caller assembled the fields in (buildPayFastCheckoutFields below controls that).
//  - When *verifying* an incoming ITN, PayFast requires using the order the fields were
//    POSTed in - Node's object key order for string keys is insertion order, and
//    express.urlencoded() populates req.body in the order the form-urlencoded body listed
//    them, so passing req.body straight through (with 'signature' removed) is correct.
function pfEncode(value: string): string {
  return encodeURIComponent(value.trim()).replace(/%20/g, '+');
}

export function buildPayFastSignature(
  fields: Record<string, string | undefined>,
  passphrase?: string,
): string {
  let paramString = '';
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'signature') continue;
    if (value === undefined || value === '') continue;
    paramString += `${key}=${pfEncode(value)}&`;
  }
  paramString = paramString.slice(0, -1);
  if (passphrase) {
    paramString += `&passphrase=${pfEncode(passphrase)}`;
  }
  return crypto.createHash('md5').update(paramString).digest('hex');
}

export function verifyPayFastSignature(
  fields: Record<string, string | undefined>,
  passphrase: string | undefined,
  receivedSignature: string | undefined,
): boolean {
  if (!receivedSignature) return false;
  const expected = buildPayFastSignature(fields, passphrase);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(receivedSignature);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
