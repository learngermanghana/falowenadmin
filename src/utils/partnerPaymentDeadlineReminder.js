// Business copy for human-reviewed partner email and WhatsApp reminder drafts.
// Ghana follows UTC and both payment date and access date are civil calendar days.
const clean = value => String(value ?? "").trim();
const currency = value => new Intl.NumberFormat("en-GH", {
  style: "currency", currency: "GHS",
}).format(value);
const isDate = value => {
  const string = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(string)) return false;
  const time = Date.parse(string + "T00:00:00Z");
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === string;
};
const dayNumber = value => Math.floor(Date.parse(value + "T00:00:00Z") / 86400000);

export function partnerPaymentDeadline(student) {
  const explicit = clean(student.paymentDueDate);
  if (isDate(explicit)) return { date: explicit, type: "payment" };
  // A confirmed partial payment grants one month of access (contractEnd).
  // This date is an ACCESS deadline, not an invented payment-due date.
  const partial = student.balanceDue > 0 && (
    (student.paid !== null && Number(student.paid) > 0) ||
    clean(student.paymentStatus).toLowerCase().includes("partial")
  );
  const accessEnd = clean(student.accessEndDate);
  if (partial && isDate(accessEnd)) return { date: accessEnd, type: "access" };

  // Keep consistent with the existing WhatsApp reminders: first
  // payment due at contract start + 30 days, when a start is recorded.
  const start = clean(student.contractStartDate);
  if (isDate(start)) {
    const due = new Date((dayNumber(start) + 30) * 86400000).toISOString().slice(0, 10);
    return { date: due, type: "payment" };
  }
  if (isDate(accessEnd)) return { date: accessEnd, type: "access" };
  return null;
}

function deadlineLabel(deadline, today) {
  if (!deadline || !isDate(deadline.date)) return "Payment deadline not recorded — please confirm with Falowen";
  const days = dayNumber(deadline.date) - dayNumber(today);
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(deadline.date + "T12:00:00Z"));
  const remaining = days > 0 ? days + " day" + (days === 1 ? "" : "s") + " left"
    : days === 0 ? "due today"
    : Math.abs(days) + " day" + (days === -1 ? "" : "s") + " past this date";
  return (deadline.type === "access" ? "Current paid access ends" : "Payment due") + ": " + formatted + " (" + remaining + ")";
}

export function buildPartnerPaymentDeadlineReminder(org, ledger, today = new Date().toISOString().slice(0, 10)) {
  const owing = (ledger?.students || []).filter(student => student.balanceDue !== null && Number(student.balanceDue) > 0);
  if (!owing.length || !isDate(today)) return "";
  const datesAvailable = owing.some(student => partnerPaymentDeadline(student) !== null);
  const header = org.contactName ? "Hello " + org.contactName + "," : "Hello,";
  const list = owing.flatMap(student => [
    "• " + (student.name || student.studentCode || "Student") + " (" + (student.level || "level unconfirmed") + "): " + currency(student.balanceDue) + " outstanding",
    "  " + deadlineLabel(partnerPaymentDeadline(student), today),
  ]);
  const note = datesAvailable
    ? "We are sharing this reminder ahead of the indicated deadline(s) so payment can be arranged in time and the students' Falowen access can continue without interruption."
    : "The payment deadline is not recorded for these students. Please confirm the due date with Falowen and arrange payment to help avoid interruption of their account access.";
  return [
    header, "",
    "This is a friendly reminder of the upcoming tuition payment deadline for students enrolled through " + org.name + ".",
    "",
    ...list,
    "",
    "Total confirmed outstanding tuition: " + currency(ledger.outstandingTotal) + ".",
    ...(ledger.unverifiedCount ? ["Other balances are still unverified and are excluded from this total."] : []),
    "", note,
    "If payment has already been made, please share the payment reference so we can update our records.",
    "", "Thank you,", "Falowen · Learn Language Education Academy",
  ].join("\n");
}
