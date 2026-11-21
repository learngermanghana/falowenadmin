import { paymentDueDateFromContractStart, daysUntilCalendarDate } from "./tuitionPaymentCountdown.js";
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

export function partnerAccessDeadline(student) {
  if (!student || !(Number(student.balanceDue) > 0)) return null;
  const partial = (
    (student.paid !== null && student.paid !== undefined && Number(student.paid) > 0) ||
    clean(student.paymentStatus).toLowerCase().includes("partial")
  );
  const accessEnd = clean(student.accessEndDate);
  return partial && isDate(accessEnd) ? { date: accessEnd, type: "access" } : null;
}

export function partnerPaymentDeadline(student) {
  const explicit = clean(student.paymentDueDate);
  if (isDate(explicit)) return { date: explicit, type: "payment" };

  // Follow the same payment countdown as /whatsapp-reminders, including
  // partially paid students: contract start + 30 calendar days.
  const due = paymentDueDateFromContractStart(student.contractStartDate);
  if (due) return { date: due, type: "payment" };

  // When contract start is unavailable, don't invent a payment due date.
  // A confirmed access end can still be shown, clearly labelled as such.
  return partnerAccessDeadline(student);
}

export function partnerDeadlineLabel(deadline, today) {
  if (!deadline || !isDate(deadline.date)) return "Payment deadline not recorded — please confirm with Falowen";
  const days = daysUntilCalendarDate(deadline.date, today);
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
  const list = owing.flatMap(student => {
    const payment = partnerPaymentDeadline(student);
    const access = partnerAccessDeadline(student);
    return [
      "• " + (student.name || student.studentCode || "Student") + " (" + (student.level || "level unconfirmed") + "): " + currency(student.balanceDue) + " outstanding",
      "  " + partnerDeadlineLabel(payment, today),
      ...(access && payment?.type === "payment" ? ["  " + partnerDeadlineLabel(access, today)] : []),
    ];
  });
  const note = datesAvailable
    ? "Please arrange payment before the indicated dates (or promptly if a date has passed) to help prevent interruption to the students' Falowen account access."
    : "The payment deadline is not recorded for these students. Please confirm the due date with Falowen and arrange payment to help avoid interruption of their account access.";
  return [
    header, "",
    "This is a reminder of the tuition payment deadlines for students enrolled through " + org.name + ".",
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
