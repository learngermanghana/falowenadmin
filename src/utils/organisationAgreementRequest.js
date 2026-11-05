export async function requestOrganisationAgreement(path, body) {
  const response = await fetch(`/api/referrals/${path}`, { method: body ? "POST" : "GET", cache: "no-store", headers: { "Content-Type": "application/json", Accept: "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let data; try { data = JSON.parse(await response.text()); } catch { throw new Error("Falowen could not confirm your request. Your entries are still here; retry shortly."); }
  if (!response.ok || data.ok !== true) throw new Error(data.error || "Request failed. Retry shortly.");
  return data;
}
export async function loadOrganisationAgreement() {
  const data = await requestOrganisationAgreement("agreement-terms?kind=institutional");
  if (data.partnerShareRate !== 0.1 || data.shareSettlement !== "invoice_deduction") throw new Error("The updated 10% organisation agreement is not available yet. Please try again shortly.");
  return data;
}
