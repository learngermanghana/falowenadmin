import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { TRIAL_DURATION_MS, TRIAL_RETENTION_MS } = require("../functions/pendingStudentCleanup.js");
const {
  createTrialAccessWelcomeEmailTrigger,
  runTrialAccessEmailJob,
  _test,
} = require("../functions/trialAccessEmails.js");

const {
  ACCOUNT_URL,
  CAMPUS_URL,
  DAY_MS,
  buildTrialAccessMessage,
  day1LessonUrl,
  resolveTrialEmailConfig,
  rowForTrialAccessEmail,
  trialEmailEligibility,
  trialEmailStage,
  trialEmailDeliveryMode,
  firebaseTrialEmailDeliveryEnabled,
} = _test;

const NOW = Date.UTC(2026, 8, 25, 8, 0, 0);

function student(overrides = {}) {
  return {
    role: "student",
    status: "pending",
    paymentStatus: "pending",
    paid: 0,
    name: "Ama Mensah",
    email: "Ama@example.com",
    level: "A1",
    className: "A1 Hamburg Klasse",
    createdAt: new Date(NOW),
    ...overrides,
  };
}

test("trial welcome trigger sends when a student write becomes trial-eligible", async () => {
  let registered = null;
  const sendWrites = [];
  const sendRef = {
    async set(payload) {
      sendWrites.push(payload);
    },
  };
  const db = {
    collection(name) {
      assert.equal(name, "trialAccessEmailSends");
      return {
        doc() {
          return sendRef;
        },
      };
    },
    async runTransaction(work) {
      return work({
        async get() {
          return { exists: false, data: () => ({}) };
        },
        set() {},
      });
    },
  };
  const admin = {
    firestore: {
      FieldValue: {
        serverTimestamp() {
          return new Date();
        },
      },
    },
  };

  const trigger = createTrialAccessWelcomeEmailTrigger({
    db,
    admin,
    runtimeConfig: {
      trial_emails: { delivery_mode: "firebase" },
      communication: {
        announcement_webhook_url: "https://script.google.com/macros/s/existing/exec",
        announcement_webhook_token: "shared-secret",
        announcement_sheet_name: "Announcements",
      },
    },
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://script.google.com/macros/s/existing/exec");
      const payload = JSON.parse(options.body);
      assert.equal(payload.token, "shared-secret");
      assert.equal(payload.rows.length, 1);
      assert.equal(payload.rows[0].email_type, "trial_access_welcome");
      return {
        ok: true,
        status: 200,
        async json() {
          return { ok: true, count: 1 };
        },
      };
    },
    onDocumentWritten(options, handler) {
      registered = { options, handler };
      return "registered";
    },
  });

  assert.equal(trigger, "registered");
  assert.equal(registered.options.document, "students/{studentId}");
  assert.equal(registered.options.retry, true);

  const result = await registered.handler({
    params: { studentId: "DorothyQuayson843" },
    data: {
      after: {
        id: "DorothyQuayson843",
        exists: true,
        data: () => student({
          name: "Dorothy Quayson",
          email: "dorothy@example.com",
          status: "trial_active",
          trialStatus: "active",
          trialStartedAt: new Date(),
          createdAt: undefined,
        }),
      },
    },
  });

  assert.equal(result.sent, true);
  assert.equal(result.stage, "welcome");
  assert.equal(result.email, "dorothy@example.com");
  assert.equal(sendWrites.at(-1).status, "sent");
});

test("trial email stage accepts trialStartedAt as the signup clock", () => {
  assert.equal(
    trialEmailStage(student({ createdAt: undefined, trialStartedAt: new Date(NOW) }), NOW),
    "welcome",
  );
});

test("trial email stages follow signup, day 3, day 6 and expiry", () => {
  assert.equal(trialEmailStage(student(), NOW), "welcome");
  assert.equal(trialEmailStage(student({ createdAt: new Date(NOW - 3 * DAY_MS) }), NOW), "day3");
  assert.equal(trialEmailStage(student({ createdAt: new Date(NOW - 6 * DAY_MS) }), NOW), "day6");
  assert.equal(trialEmailStage(student({ createdAt: new Date(NOW - TRIAL_DURATION_MS) }), NOW), "expired");
});

test("trial_active and active unpaid students stay in the trial email lifecycle", () => {
  assert.equal(
    trialEmailStage(student({ status: "trial_active", createdAt: new Date(NOW - 3 * DAY_MS) }), NOW),
    "day3",
  );
  assert.equal(
    trialEmailStage(student({ status: "active", createdAt: new Date(NOW - 6 * DAY_MS) }), NOW),
    "day6",
  );
});

test("enrollDate can recover a missed Day-0 welcome when createdAt is absent", () => {
  assert.equal(
    trialEmailStage(student({
      status: "trial_active",
      createdAt: undefined,
      enrollDate: new Date(NOW).toISOString(),
    }), NOW),
    "welcome",
  );
});

test("trial eligibility exposes a concrete skip reason for diagnostics", () => {
  assert.deepEqual(
    trialEmailEligibility(student({
      status: "trial_active",
      createdAt: undefined,
      trialStartedAt: undefined,
      enrollDate: undefined,
      registrationDate: undefined,
    }), NOW).reason,
    "missing_start_date",
  );
});

test("scheduled trial worker recovers a missing Day-0 welcome", async () => {
  const sendWrites = [];
  const sendRef = {
    async set(payload) {
      sendWrites.push(payload);
    },
  };
  const trialStudent = student({
    status: "trial_active",
    trialStatus: "active",
    createdAt: undefined,
    enrollDate: new Date(NOW).toISOString(),
    email: "recover@example.com",
  });
  const db = {
    collection(name) {
      if (name === "students") {
        return {
          async get() {
            return {
              size: 1,
              docs: [{ id: "recover-1", data: () => trialStudent }],
            };
          },
        };
      }
      if (name === "trialAccessEmailSends") {
        return { doc: () => sendRef };
      }
      if (name === "trialAccessEmailDiagnostics") {
        return { doc: () => ({ async set() {} }) };
      }
      throw new Error(`Unexpected collection ${name}`);
    },
    async runTransaction(work) {
      return work({
        async get() {
          return { exists: false, data: () => ({}) };
        },
        set() {},
      });
    },
  };
  const admin = {
    firestore: {
      FieldValue: {
        serverTimestamp() {
          return new Date();
        },
      },
    },
  };

  const result = await runTrialAccessEmailJob({
    db,
    admin,
    now: new Date(NOW),
    runtimeConfig: {
      trial_emails: { delivery_mode: "firebase" },
      communication: {
        announcement_webhook_url: "https://script.google.com/macros/s/existing/exec",
        announcement_webhook_token: "shared-secret",
      },
    },
    fetchImpl: async (_url, options) => {
      const payload = JSON.parse(options.body);
      assert.equal(payload.rows[0].email, "recover@example.com");
      assert.equal(payload.rows[0].email_type, "trial_access_welcome");
      assert.deepEqual(payload.row, payload.rows[0]);
      return {
        ok: true,
        status: 200,
        async json() {
          return { ok: true, count: 1 };
        },
      };
    },
  });

  assert.equal(result.checked, 1);
  assert.equal(result.candidates, 1);
  assert.equal(result.due, 1);
  assert.equal(result.sent, 1);
  assert.equal(result.skipped, 0);
  assert.equal(sendWrites.at(-1).status, "sent");
});

test("trial-expired students get the expiry email during retention", () => {
  const row = student({
    status: "trial_expired",
    createdAt: new Date(NOW - TRIAL_DURATION_MS - DAY_MS),
  });
  assert.equal(trialEmailStage(row, NOW), "expired");
});

test("no trial email is due once permanent purge is due", () => {
  const row = student({
    status: "trial_expired",
    createdAt: new Date(NOW - TRIAL_DURATION_MS - TRIAL_RETENTION_MS),
  });
  assert.equal(trialEmailStage(row, NOW), "");
});

test("paid students are excluded from trial reminder emails", () => {
  assert.equal(trialEmailStage(student({ paid: 500, paymentStatus: "partial" }), NOW), "");
});

test("welcome email links a German learner directly to Day 1", () => {
  const row = student({ level: "B1" });
  assert.equal(
    day1LessonUrl(row),
    "https://www.falowen.app/campus/course/lesson/B1/1?view=workbook",
  );

  const message = buildTrialAccessMessage({ student: row, stage: "welcome" });
  assert.match(message, /7-day Falowen free trial is now active/i);
  assert.match(message, /even if you have not paid yet/i);
  assert.match(message, /campus\/course\/lesson\/B1\/1\?view=workbook/);
  assert.match(message, /campus\/account/);
});

test("non-German course falls back to the campus instead of a German Day 1 link", () => {
  assert.equal(
    day1LessonUrl(student({ level: "A1", language: "French" })),
    CAMPUS_URL,
  );
});

test("expiry email explains the 30-day recovery window and deletion date", () => {
  const row = student({
    status: "trial_expired",
    createdAt: new Date(NOW - TRIAL_DURATION_MS),
  });
  const message = buildTrialAccessMessage({ student: row, stage: "expired" });

  assert.match(message, /kept for 30 days/i);
  assert.match(message, /permanent deletion/i);
  assert.match(message, /25 October 2026/);
  assert.match(message, /campus\/account/);
});

test("announcement row targets only the student and uses the right action button", () => {
  const row = rowForTrialAccessEmail({
    student: student({ email: " AMA@EXAMPLE.COM " }),
    stage: "welcome",
    now: new Date(NOW),
  });

  assert.equal(row.email, "ama@example.com");
  assert.equal(row.delivery_mode, "individual");
  assert.equal(row.allow_bcc_fallback, "FALSE");
  assert.equal(row.email_type, "trial_access_welcome");
  assert.equal(row.button_label, "Start Day 1 lesson");
  assert.match(row.link, /campus\/course\/lesson\/A1\/1\?view=workbook/);

  const expired = rowForTrialAccessEmail({
    student: student({ status: "trial_expired", createdAt: new Date(NOW - TRIAL_DURATION_MS) }),
    stage: "expired",
    now: new Date(NOW),
  });
  assert.equal(expired.link, ACCOUNT_URL);
  assert.equal(expired.button_label, "Open account to register");
});

test("trial emails reuse the shared Announcement webhook configuration", () => {
  const config = resolveTrialEmailConfig({
    communication: {
      announcement_webhook_url: "https://script.google.com/macros/s/existing/exec",
      announcement_webhook_token: "shared-secret",
      announcement_sheet_name: "Announcements",
    },
  }, {});

  assert.equal(config.url, "https://script.google.com/macros/s/existing/exec");
  assert.equal(config.token, "shared-secret");
  assert.equal(config.sheetName, "Announcements");
});

test("trial-specific webhook settings cannot override the shared Announcement webhook", () => {
  const config = resolveTrialEmailConfig({
    communication: {
      announcement_webhook_url: "https://script.google.com/macros/s/announcement/exec",
      announcement_webhook_token: "announcement-secret",
    },
    trial_emails: {
      webhook_url: "https://example.invalid/trial-only",
      webhook_token: "trial-only-secret",
    },
  }, {});

  assert.equal(config.url, "https://script.google.com/macros/s/announcement/exec");
  assert.equal(config.token, "announcement-secret");
});

test("Announcement Apps Script is the default owner of trial email delivery", async () => {
  assert.equal(trialEmailDeliveryMode({}, {}), "apps_script_native");
  assert.equal(firebaseTrialEmailDeliveryEnabled({}, {}), false);

  const result = await runTrialAccessEmailJob({
    db: {
      collection() {
        throw new Error("native mode must not scan Firestore students");
      },
    },
    admin: {},
    runtimeConfig: {},
  });

  assert.equal(result.disabled, true);
  assert.equal(result.deliveryMode, "apps_script_native");
  assert.equal(result.checked, 0);
  assert.equal(result.sent, 0);
});
