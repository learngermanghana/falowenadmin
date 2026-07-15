import fs from "node:fs";

function patchFile(relativePath, patcher) {
  const filePath = new URL(relativePath, import.meta.url);
  const source = fs.readFileSync(filePath, "utf8");
  const next = patcher(source);
  if (next !== source) {
    fs.writeFileSync(filePath, next);
    console.log(`Patched ${relativePath}`);
  } else {
    console.log(`Already patched ${relativePath}`);
  }
}

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) throw new Error(`Could not patch ${label}`);
  return source.replace(search, replacement);
}

patchFile("../src/services/studentLeadService.js", (input) => {
  let source = input;

  source = replaceOnce(
    source,
    'export const STUDENT_LEADS_PUBLISHED_URL =',
    'import { auth } from "../firebase.js";\n\nexport const STUDENT_LEADS_PUBLISHED_URL =',
    "student lead service auth import",
  );

  source = replaceOnce(
    source,
    'export const STUDENT_LEADS_SHEET_NAME = "Leads";',
    'export const STUDENT_LEADS_SHEET_NAME = "Leads";\nexport const STUDENT_LEADS_DELETE_ENDPOINT = "/api/student-leads/delete";',
    "student lead delete endpoint",
  );

  const insertBefore = 'async function fetchText(url) {';
  const deletionFunctions = `async function leadAuthHeaders() {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
  };
}

export function parseLeadDeletionResponse(response = {}, responseText = "") {
  const text = String(responseText || "").trim();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok || data?.ok === false) {
    const nonHtmlText = text && !/^\\s*</.test(text) ? text.slice(0, 500) : "";
    const statusLabel = [response.status, response.statusText].filter(Boolean).join(" ");
    const fallback = response.status === 404
      ? "Lead deletion endpoint is not deployed yet. Deploy the latest Firebase function and retry."
      : \`Lead deletion request failed\${statusLabel ? \` (\${statusLabel})\` : ""}.\`;
    throw new Error(String(data?.error || data?.message || nonHtmlText || fallback));
  }

  return data;
}

export async function deleteStudentLead(lead = {}) {
  const leadId = String(lead.leadId || lead.id || "").trim();
  const email = normalizeLeadEmail(lead.email);
  const phone = normalizeLeadPhone(lead.number || lead.phone);

  if (!leadId && !email && !phone) {
    throw new Error("Lead ID, email, or phone number is required");
  }

  const response = await fetch(STUDENT_LEADS_DELETE_ENDPOINT, {
    method: "POST",
    headers: await leadAuthHeaders(),
    body: JSON.stringify({ leadId, email, phone, lead }),
  });

  const responseText = await response.text();
  return parseLeadDeletionResponse(response, responseText);
}

`;

  if (!source.includes('export async function deleteStudentLead')) {
    if (!source.includes(insertBefore)) throw new Error("Could not patch student lead deletion service");
    source = source.replace(insertBefore, `${deletionFunctions}${insertBefore}`);
  }

  return source;
});

patchFile("../src/components/StudentLeadsPanel.jsx", (input) => {
  let source = input;

  source = replaceOnce(
    source,
    '  fetchStudentLeads,\n',
    '  deleteStudentLead,\n  fetchStudentLeads,\n',
    "StudentLeadsPanel delete import",
  );

  const helperAnchor = 'function StatusPill({ value }) {';
  const completionHelper = `function isCompletedLead(lead = {}) {
  const status = String(lead.status || "").trim().toLowerCase();
  const paymentStatus = String(lead.paymentStatus || "").trim().toLowerCase();
  const terminalStatus = [
    "student_registered",
    "completed",
    "complete",
    "converted",
    "closed",
    "class_started_no_followup",
    "not_interested",
    "cancelled",
    "canceled",
    "archived",
  ].some((token) => status.includes(token));
  const paid = ["paid", "registered_paid", "success", "successful", "completed", "complete"]
    .some((token) => paymentStatus.includes(token));
  return terminalStatus || paid;
}

`;
  if (!source.includes('function isCompletedLead(lead = {})')) {
    if (!source.includes(helperAnchor)) throw new Error("Could not patch completed lead helper");
    source = source.replace(helperAnchor, `${completionHelper}${helperAnchor}`);
  }

  source = replaceOnce(
    source,
    '  const [copyNotice, setCopyNotice] = useState("");',
    '  const [copyNotice, setCopyNotice] = useState("");\n  const [deletingId, setDeletingId] = useState("");',
    "StudentLeadsPanel deleting state",
  );

  const handlerAnchor = '  useEffect(() => {\n    loadLeads();\n  }, []);';
  const deleteHandler = `  async function handleDeleteLead(lead) {
    if (!isCompletedLead(lead)) {
      setError("Only completed, converted, registered, closed, or fully paid leads can be deleted.");
      return;
    }

    const leadLabel = lead.name || lead.email || lead.number || "this lead";
    const confirmed = window.confirm(
      \`Delete completed lead "\${leadLabel}"? This permanently removes the row from the Leads sheet.\`,
    );
    if (!confirmed) return;

    setDeletingId(lead.id);
    setError("");
    try {
      await deleteStudentLead(lead);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      setTotalRows((current) => Math.max(0, current - 1));
      setCopyNotice(\`Deleted completed lead: \${leadLabel}.\`);
      window.setTimeout(() => setCopyNotice(""), 2500);
    } catch (deleteError) {
      setError(deleteError?.message || "Completed lead could not be deleted.");
    } finally {
      setDeletingId("");
    }
  }

`;
  if (!source.includes('async function handleDeleteLead(lead)')) {
    if (!source.includes(handlerAnchor)) throw new Error("Could not patch lead delete handler");
    source = source.replace(handlerAnchor, `${deleteHandler}${handlerAnchor}`);
  }

  const actionAnchor = `                            {lead.email ? (
                              <button type="button" onClick={() => handleCopy(lead.email, "Email")}>Copy email</button>
                            ) : null}`;
  const actionReplacement = `${actionAnchor}
                            {isCompletedLead(lead) ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead)}
                                disabled={deletingId === lead.id}
                                style={{ borderColor: "#fecaca", color: "#991b1b", background: "#fff5f5" }}
                              >
                                {deletingId === lead.id ? "Deleting…" : "Delete completed"}
                              </button>
                            ) : null}`;
  source = replaceOnce(source, actionAnchor, actionReplacement, "completed lead delete button");

  return source;
});

patchFile("../src/pages/DashboardPage.jsx", (input) => {
  let source = input;

  source = replaceOnce(
    source,
    'import { listAllStudents } from "../services/studentsService";',
    'import { listAllStudents } from "../services/studentsService";\nimport { fetchStudentLeads } from "../services/studentLeadService.js";',
    "dashboard lead service import",
  );

  const normalizeAnchor = `function normalize(value) {
  return text(value).toLowerCase();
}
`;
  const leadHelpers = `${normalizeAnchor}
function isCompletedLead(lead = {}) {
  const status = normalize(lead.status);
  const paymentStatus = normalize(lead.paymentStatus);
  const terminal = [
    "student_registered",
    "completed",
    "complete",
    "converted",
    "closed",
    "class_started_no_followup",
    "not_interested",
    "cancelled",
    "canceled",
    "archived",
  ].some((token) => status.includes(token));
  const paid = ["paid", "registered_paid", "success", "successful", "completed", "complete"]
    .some((token) => paymentStatus.includes(token));
  return terminal || paid;
}

function isNewLead(lead = {}) {
  const status = normalize(lead.status);
  return !status || status === "new" || status === "new_lead";
}

function leadDateValue(lead = {}) {
  const parsed = new Date(lead.registrationDate || lead.createdAt || 0);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}
`;
  source = replaceOnce(source, normalizeAnchor, leadHelpers, "dashboard lead helpers");

  source = replaceOnce(
    source,
    '  const [upcomingHolidays, setUpcomingHolidays] = useState([]);',
    '  const [upcomingHolidays, setUpcomingHolidays] = useState([]);\n  const [studentLeads, setStudentLeads] = useState([]);\n  const [leadError, setLeadError] = useState("");',
    "dashboard lead state",
  );

  const holidaysSet = '        setUpcomingHolidays(holidayRows);';
  const leadLoad = `${holidaysSet}

        try {
          const leadResult = await fetchStudentLeads();
          setStudentLeads(leadResult.leads || []);
          setLeadError("");
        } catch (leadLoadError) {
          setStudentLeads([]);
          setLeadError(leadLoadError?.message || "Student leads could not be loaded.");
        }`;
  source = replaceOnce(source, holidaysSet, leadLoad, "dashboard lead loading");

  const workQueueLine = '    const workQueue = incomingAssignments.length + pendingTutorReviewsCount + grammarIssueReports.length;';
  const workQueueReplacement = `    const leadAttention = studentLeads.filter((lead) => !isCompletedLead(lead));
    const newLeads = leadAttention.filter(isNewLead);
    const workQueue = incomingAssignments.length + pendingTutorReviewsCount + grammarIssueReports.length + leadAttention.length;`;
  source = replaceOnce(source, workQueueLine, workQueueReplacement, "dashboard lead queue");

  source = replaceOnce(
    source,
    '      classBreakdown,\n      workQueue,',
    '      classBreakdown,\n      leadAttention,\n      newLeads,\n      workQueue,',
    "dashboard analytics lead return",
  );

  source = replaceOnce(
    source,
    '  }, [grammarIssueReports.length, incomingAssignments.length, pendingTutorReviewsCount, students]);',
    '  }, [grammarIssueReports.length, incomingAssignments.length, pendingTutorReviewsCount, studentLeads, students]);',
    "dashboard analytics dependencies",
  );

  const previewAnchor = '  const contractEndingSoonPreview = useMemo(() => contractEndingSoon.slice(0, 6), [contractEndingSoon]);';
  const previewReplacement = `${previewAnchor}
  const leadAttentionPreview = useMemo(
    () => analytics.leadAttention.slice().sort((a, b) => leadDateValue(b) - leadDateValue(a)).slice(0, 3),
    [analytics.leadAttention],
  );`;
  source = replaceOnce(source, previewAnchor, previewReplacement, "dashboard lead preview");

  const heroEnd = `      </section>

      <section className="analytics-grid four">`;
  const notificationBlock = `      </section>

      <section
        className="analytics-panel"
        aria-live="polite"
        style={{
          borderColor: analytics.leadAttention.length ? "#f59e0b" : "#86efac",
          background: analytics.leadAttention.length ? "#fffbeb" : "#f0fdf4",
        }}
      >
        <div className="panel-header compact">
          <div>
            <p className="analytics-eyebrow">🔔 Lead notification</p>
            <h2>
              {analytics.leadAttention.length
                ? \`\${analytics.leadAttention.length} lead\${analytics.leadAttention.length === 1 ? "" : "s"} need attention\`
                : "No leads need attention"}
            </h2>
            <p style={{ marginBottom: 0 }}>
              {analytics.newLeads.length
                ? \`\${analytics.newLeads.length} new lead\${analytics.newLeads.length === 1 ? "" : "s"} waiting for contact.\`
                : "All current leads are completed, registered, paid, or closed."}
            </p>
            {leadError ? <small style={{ color: "#991b1b" }}>Lead warning: {leadError}</small> : null}
          </div>
          <Link to="/students?tab=leads">Open leads</Link>
        </div>
        {leadAttentionPreview.length ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {leadAttentionPreview.map((lead) => (
              <span key={lead.id} style={{ padding: "6px 10px", borderRadius: 999, background: "#ffffff", border: "1px solid #fde68a" }}>
                <strong>{lead.name || lead.email || lead.number || "Unnamed lead"}</strong>
                {lead.className || lead.level ? \` · \${lead.className || lead.level}\` : ""}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="analytics-grid four">`;
  source = replaceOnce(source, heroEnd, notificationBlock, "dashboard lead notification panel");

  const statsAnchor = '        <StatCard label="Upcoming holidays" value={upcomingHolidays.length} helper={`${affectedHolidayClassCount} affected class${affectedHolidayClassCount === 1 ? "" : "es"}`} tone="purple" icon="📅" />';
  const statsReplacement = `${statsAnchor}
        <StatCard label="Open leads" value={analytics.leadAttention.length} helper={\`\${analytics.newLeads.length} new lead\${analytics.newLeads.length === 1 ? "" : "s"}\`} tone="amber" icon="🔔" />`;
  source = replaceOnce(source, statsAnchor, statsReplacement, "dashboard lead stat card");

  const studentRecordsCard = `        <ActionCard
          title="Student records"
          body="Review student status, class, balance, contract dates, and contact details."
          to="/students"
          label="Open students"
          tone="emerald"
        />`;
  const leadActionCard = `        <ActionCard
          title="Student leads"
          body={analytics.leadAttention.length
            ? \`\${analytics.leadAttention.length} lead\${analytics.leadAttention.length === 1 ? "" : "s"} currently need contact or follow-up.\`
            : "No open leads currently need follow-up."}
          to="/students?tab=leads"
          label="Open leads"
          tone="amber"
        />
${studentRecordsCard}`;
  source = replaceOnce(source, studentRecordsCard, leadActionCard, "dashboard lead action card");

  return source;
});

patchFile("../src/pages/StudentDirectoryPage.jsx", (input) => {
  return replaceOnce(
    input,
    '  const [activeTab, setActiveTab] = useState("directory");',
    '  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get("tab") === "leads" ? "leads" : "directory");',
    "Student Directory lead query tab",
  );
});
