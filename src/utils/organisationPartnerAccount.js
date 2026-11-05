import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { auth } from "../firebase.js";
// Separate session: partner sign-in must not replace a learner or staff session.
const app = getApps().find(item => item.name === "falowen-partners") || initializeApp(auth.app.options, "falowen-partners");
export const partnerAuth = getAuth(app);
export async function partnerRequest(path, body) {
  const token = await partnerAuth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to your partner account first.");
  const response = await fetch(`/api/${path}`, { method: body ? "POST" : "GET", cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let data; try { data = JSON.parse(await response.text()); } catch { throw new Error("Partner service unavailable. Your entries are unchanged; retry shortly."); }
  if (!response.ok || data.ok !== true) { const error = new Error(data.error || "Request failed."); error.status = response.status; throw error; }
  return data;
}
export async function downloadPartnerAgreement() {
  const token = await partnerAuth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in first.");
  const response = await fetch('/api/organisation-partners/agreement-copy', { method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' });
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/pdf')) throw new Error('Agreement copy unavailable. Contact Falowen.');
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement('a'); a.href = url; a.download = 'Falowen-signed-agreement.pdf'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
