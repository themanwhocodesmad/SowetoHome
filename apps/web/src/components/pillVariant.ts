const SUCCESS = new Set(['published', 'confirmed', 'paid', 'completed', 'active']);
const WARNING = new Set(['pending_review', 'pending', 'pending_payment', 'draft']);
const DANGER = new Set(['suspended', 'cancelled_by_guest', 'cancelled_by_host', 'failed', 'refunded']);

export function pillVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (SUCCESS.has(status)) return 'success';
  if (WARNING.has(status)) return 'warning';
  if (DANGER.has(status)) return 'danger';
  return 'neutral';
}

export function pillClass(status: string): string {
  return `pill pill--${pillVariant(status)}`;
}
