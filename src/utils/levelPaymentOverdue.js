export function isLevelPaymentOverdue(row, today = new Date().toISOString().slice(0,10)) {
 return ["active","expired"].includes(String(row?.status||"").toLowerCase()) && typeof row.balanceDue==="number" && Number.isFinite(row.balanceDue) && row.balanceDue>0 && /^\d{4}-\d{2}-\d{2}$/.test(row.paymentDeadline||"") && row.paymentDeadline<today;
}
