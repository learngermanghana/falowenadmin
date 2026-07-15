import fs from "node:fs";

const filePath = new URL("../functions/index.js", import.meta.url);
let source = fs.readFileSync(filePath, "utf8");

if (!source.includes('app.post("/student-leads/delete"')) {
  const anchor = 'app.post("/students/delete-account", async (req, res) => {';
  if (!source.includes(anchor)) {
    throw new Error("Could not find the student deletion route anchor in functions/index.js");
  }

  const leadDeletionRuntime = `async function deleteLeadRowFromSheet({ leadId, email, phone, lead }) {
  const appsScriptUrl = String(studentDeleteAppsScriptUrlSecret.value() || process.env.STUDENT_DELETE_APPS_SCRIPT_URL || "").trim();
  const syncSecret = String(studentDeleteSyncSecret.value() || process.env.STUDENT_DELETE_SYNC_SECRET || "").trim();
  if (!appsScriptUrl || !syncSecret) {
    return { attempted: false, success: false, message: "Lead deletion Google Sheets webhook is not configured." };
  }

  const response = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: syncSecret,
      action: "deleteLead",
      leadId,
      email,
      phone,
      lead,
    }),
  });
  const data = await response.json().catch(() => ({}));
  return {
    attempted: true,
    success: response.ok && data?.ok !== false,
    message: data?.message || (response.ok ? "Lead row deleted." : "Lead row deletion failed."),
    details: data,
  };
}

app.post("/student-leads/delete", async (req, res) => {
  try {
    await requireAuth(req);
    const body = req.body || {};
    const lead = body.lead || {};
    const leadId = cleanIdentifier(body.leadId || lead.leadId || lead.id);
    const email = normalizeLower(body.email || lead.email);
    const phone = cleanIdentifier(body.phone || lead.number || lead.phone).replace(/\D+/g, "");
    if (!leadId && !email && !phone) {
      return res.status(400).json({ error: "leadId, email, or phone is required" });
    }

    const sheet = await deleteLeadRowFromSheet({ leadId, email, phone, lead });
    if (!sheet.attempted || !sheet.success) {
      return res.status(502).json({ ok: false, error: sheet.message, sheet });
    }
    return res.json({ ok: true, sheet });
  } catch (error) {
    const message = error?.message || "Lead deletion failed";
    const status = /authorization|unauthorized|not allowed/i.test(message) ? 401 : 500;
    return res.status(status).json({ error: message });
  }
});

`;

  source = source.replace(anchor, `${leadDeletionRuntime}${anchor}`);
  fs.writeFileSync(filePath, source);
  console.log("Student lead deletion route patched into Firebase functions.");
} else {
  console.log("Student lead deletion route already installed.");
}
