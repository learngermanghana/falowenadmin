const KEY = "falowen:organisation-partner-context";
export function loadOrganisationPartnerContext() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(KEY) || "null");
    if (!value || !/^[a-f0-9]{64}$/.test(value.agreementReference || "")) return null;
    return value;
  } catch { return null; }
}
export function saveOrganisationPartnerContext(value) {
  try { window.sessionStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Form remains usable if session storage is unavailable. */ }
}
