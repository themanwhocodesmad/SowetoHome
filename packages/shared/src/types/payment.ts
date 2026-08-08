export interface YocoCheckoutResponse {
  provider: 'yoco';
  redirectUrl: string;
}

// PayFast has no redirect-URL API like Yoco's - the guest's browser must POST an HTML
// form (fields + signature) straight to PayFast's own process URL, so the API hands back
// the exact action URL + field set for the frontend to build and auto-submit that form.
export interface PayFastCheckoutResponse {
  provider: 'payfast';
  actionUrl: string;
  fields: Record<string, string>;
}

export type CheckoutResponse = YocoCheckoutResponse | PayFastCheckoutResponse;
