const test = require("node:test");
const assert = require("node:assert/strict");
const { _test } = require("../functions/leadClassStartReminderEmails.js");

const {
  buildLeadReminderMessage,
  csvToObjects,
  findDueLeadReminders,
  normalizeLead,
  resolveLeadReminderConfig,
  rowForLeadReminder,
  sendId,
} = _test;

test("reads the published Leads CSV fields used by the reminder job", () => {
  const csv = [
    "name,email,class_name,level,start_date,status,payment_status,meeting_times,schedule_url,lead_id",
    'Ama,ama@example.com,"A1 Berlin Klasse",A1,2026-07-23,new_lead,unknown,"Mon & Tue 5:00 pm",https://example.com/a1,lead-1',
  ].join("\n");
  const rows = csvToObjects(csv);
  const lead = normalizeLead(rows[0], 0);
  assert.equal(lead.email, "ama@example.com");
  assert.equal(lead.className, "A1 Berlin Klasse");
  assert.equal(lead.startDate, "2026-07-23");
  assert.equal(lead.meetingTimes, "Mon & Tue 5:00 pm");
  assert.equal(lead.leadId, "lead-1");
});

test("sends once when an open lead is within the three-day recovery window", () => {
  const now = new Date("2026-07-20T08:00:00.000Z");
  const base = {
    name: "Ama",
    email: "ama@example.com",
    className: "A1 Berlin Klasse",
    level: "A1",
    status: "new_lead",
    paymentStatus: "unknown",
  };
  const due = findDueLeadReminders({
    now,
    daysBeforeClass: 3,
    leads: [
      { ...base, leadId: "lead-3-days", startDate: "2026-07-23" },
      { ...base, leadId: "lead-1-day", email: "one@example.com", startDate: "2026-07-21" },
      { ...base, leadId: "too-early", email: "early@example.com", startDate: "2026-07-24" },
      { ...base, leadId: "started", email: "started@example.com", startDate: "2026-07-20" },
    ],
  });
  assert.deepEqual(due.map((item) => item.lead.leadId), ["lead-1-day", "lead-3-days"]);
  assert.deepEqual(due.map((item) => item.daysUntilStart), [1, 3]);
});

test("skips registered, paid, closed, previously contacted, missing-email and duplicate leads", () => {
  const now = new Date("2026-07-20T08:00:00.000Z");
  const common = { className: "A2 Accra", startDate: "2026-07-23", status: "new_lead", paymentStatus: "unknown" };
  const due = findDueLeadReminders({
    now,
    leads: [
      { ...common, leadId: "open", email: "open@example.com" },
      { ...common, leadId: "duplicate", email: "OPEN@example.com" },
      { ...common, leadId: "registered", email: "registered@example.com", status: "student_registered" },
      { ...common, leadId: "paid", email: "paid@example.com", paymentStatus: "paid" },
      { ...common, leadId: "closed", email: "closed@example.com", status: "not_interested" },
      { ...common, leadId: "student-code", email: "code@example.com", studentCode: "A1001" },
      { ...common, leadId: "already-sent", email: "sent@example.com", followUpCount: 1 },
      { ...common, leadId: "last-follow-up", email: "followup@example.com", lastFollowUpAt: "2026-07-18T08:00:00Z" },
      { ...common, leadId: "no-email", email: "" },
    ],
  });
  assert.deepEqual(due.map((item) => item.lead.leadId), ["open"]);
});

test("uses communication.announcement_webhook_url as the delivery fallback", () => {
  const config = resolveLeadReminderConfig({
    communication: {
      announcement_webhook_url: "https://example.com/communication",
      announcement_webhook_token: "secret",
      announcement_sheet_name: "Communication",
      lead_reminder_days_before_class: 3,
    },
  }, {});
  assert.equal(config.webhook.url, "https://example.com/communication");
  assert.equal(config.webhook.token, "secret");
  assert.equal(config.webhook.sheetName, "Communication");
  assert.equal(config.daysBeforeClass, 3);
});

test("builds an individual communication row with a secure-seat button", () => {
  const item = {
    lead: {
      leadId: "lead-1",
      name: "Ama",
      email: "ama@example.com",
      className: "A1 Berlin Klasse",
      level: "A1",
      meetingTimes: "Monday and Tuesday at 5:00 pm",
      scheduleUrl: "https://www.falowen.app/classes/a1-berlin",
    },
    startDate: new Date("2026-07-23T12:00:00.000Z"),
    startDateKey: "2026-07-23",
    daysUntilStart: 3,
  };
  const message = buildLeadReminderMessage({ ...item, accountUrl: "https://www.falowen.app/campus/account" });
  assert.match(message, /class you showed interest in starts in 3 days/i);
  assert.match(message, /Monday and Tuesday at 5:00 pm/);
  assert.match(message, /Already registered or paid/);

  const row = rowForLeadReminder({ item, message, accountUrl: "https://www.falowen.app/campus/account" });
  assert.equal(row.email, "ama@example.com");
  assert.equal(row.email_type, "lead_class_start_reminder");
  assert.equal(row.delivery_mode, "individual");
  assert.equal(row.link, "https://www.falowen.app/classes/a1-berlin");
  assert.equal(row.button_label, "Secure your seat");
  assert.equal(row.reminder_lead_days, "3");
});

test("send identity is stable for one lead and one class start date", () => {
  const item = {
    lead: { leadId: "lead-1", email: "ama@example.com", className: "A1 Berlin Klasse" },
    startDateKey: "2026-07-23",
  };
  assert.equal(sendId(item), sendId({ ...item, lead: { ...item.lead } }));
  assert.notEqual(sendId(item), sendId({ ...item, startDateKey: "2026-07-30" }));
});
