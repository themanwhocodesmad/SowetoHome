// Native date inputs only pop the calendar open when you hit the small built-in icon on
// most desktop browsers, not when you tap/click anywhere else in the field - forcing
// showPicker() on click/focus makes the whole field open it immediately everywhere,
// matching how a dedicated date-picker widget behaves. Support varies (Chrome/Edge/most
// Android browsers yes, iOS Safari no) so it's called defensively - browsers without it
// still fall back to their own native tap-to-open behavior. Shared by every date input in
// the app (SearchBar, PropertyDetailPage's booking widget) so "check-in" opens a calendar
// automatically everywhere, not just in one place.
export function openDatePicker(e: React.SyntheticEvent<HTMLInputElement>) {
  const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
  try {
    input.showPicker?.();
  } catch {
    // Ignored - e.g. thrown without a user gesture, or unsupported in this browser.
  }
}
