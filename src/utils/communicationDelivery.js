function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function historyStatusBlocksDuplicate(entry = {}) {
  const status = normalize(entry.deliveryStatus || entry.status);
  if (!status) return true;
  return !["failed", "error", "delivery_failed"].includes(status);
}

export function receiptHasSuccessfulDelivery(receipt = {}) {
  return receipt?.sheet?.attempted === true && receipt?.sheet?.success === true;
}

export function deliveryFailureMessage(receipt = {}) {
  if (receipt?.sheet?.attempted !== true) {
    return receipt?.sheet?.message || "Email delivery was not attempted.";
  }
  return receipt?.sheet?.message || "Email delivery failed.";
}
