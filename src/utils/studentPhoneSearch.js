// UI-only matching helper. Keep original numbers untouched for display.
export const normalizePhoneSearchDigits = value => String(value || "").replace(/\D/g, "");
export function matchesPhoneDigits(query, values=[]) {
  const digits=normalizePhoneSearchDigits(query);
  return digits.length>=5 && values.some(value=>
    normalizePhoneSearchDigits(value).includes(digits));
}
