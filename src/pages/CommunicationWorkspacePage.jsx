import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listClasses } from "../services/classesService.js";
import { listAllStudents } from "../services/studentsService.js";
import { saveAnnouncementRow } from "../services/communicationService.js";
import { useToast } from "../context/ToastContext.jsx";
import TargetedCommunicationPanel from "../components/TargetedCommunicationPanel.jsx";
import CommunicationHistoryPanel from "../components/CommunicationHistoryPanel.jsx";
import "./CommunicationWorkspace.css";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const TODAY = () => new Date().toISOString().slice(0, 10);
const ACCOUNT_URL = "https://www.falowen.app/campus/account";
const TABS = [
  { id: "bulk", label: "Bulk messages", number: "01", description: "One announcement for a class, level, or all active learners." },
  { id: "student", label: "One student", number: "02", description: "A personal email to one verified student account." },
  { id: "documents", label: "Documents", number: "03", description: "Prepare a branded school letter as Word or print-ready PDF." },
  { id: "promotions", label: "Class promotions", number: "04", description: "Promote upcoming classes using their actual schedule." },
];

const TEMPLATES = [
  { label: "Class starting soon", subject: "Your class is starting soon", body: "Hello, your Falowen class is about to begin. Please join your scheduled class on time." },
  { label: "Course material updated", subject: "New course materials available", body: "Hello, your course material has been updated. Please open your Falowen Campus to see the latest lesson and practice activities." },
  { label: "Exam practice reminder", subject: "Keep preparing for your exam", body: "Hello, your exam preparation matters. Please continue practising Lesen, Hören, Schreiben and Sprechen in your Falowen account." },
  { label: "Assignment reminder", subject: "Complete your outstanding assignment", body: "Hello, please check your Falowen workbook and complete any outstanding lesson assignments." },
  { label: "Course completed", subject: "Congratulations on completing your course", body: "Congratulations on reaching the end of your course! Please check your results page for verified progress and certificate eligibility." },
];

const clean = (value) => String(value == null ? "" : value).trim();
const className = (klass) => clean(klass?.name || klass?.className || klass?.classId || klass?.id);
const classKey = (klass) => clean(klass?.classRecordId || klass?.id || klass?.classId || className(klass));
const levelOf = (klass) => {
  const raw = [klass?.levelId, klass?.level, klass?.courseLevel, className(klass)].map(clean).join(" ");
  return raw.match(/\b(A1|A2|B1|B2|C1|C2)\b/i)?.[1]?.toUpperCase() || "";
};
const languageOf = (klass) => {
  const raw = [klass?.language, klass?.program, className(klass)].map(clean).join(" ").toLowerCase();
  return /swahili|kiswahili/.test(raw) ? "swahili" : "german";
};
const statusOf = (klass) => clean(klass?.status || klass?.state || klass?.workflowStatus).toLowerCase();
const isAvailable = (klass) => {
  const status = statusOf(klass);
  return !klass?.archived && klass?.active !== false &&
    !["archived", "graduated", "inactive", "completed", "complete", "cancelled", "canceled", "ended", "closed", "deleted"].includes(status);
};
const isUpcoming = (klass) => {
  if (!isAvailable(klass)) return false;
  const status = statusOf(klass);
  if (["active", "in_progress", "inprogress", "ongoing", "running", "started", "live", "current"].includes(status)) return false;
  const date = clean(klass?.startDate || klass?.startsAt || klass?.start || klass?.date).slice(0, 10);
  if (date) return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= TODAY();
  return ["upcoming", "planned", "scheduled", "registration_open", "enrolling", "open"].some((s) => status.includes(s));
};
const uniqueClasses = (rows) => {
  const seen = new Set();
  return rows.filter((klass) => {
    const name = className(klass);
    const key = name.toLowerCase();
    if (!name || seen.has(key) || LEVELS.includes(name.toUpperCase())) return false;
    seen.add(key);
    return true;
  });
};
const studentId = (s) => clean(s?.id || s?.studentCode || s?.student_code || s?.email);
const studentName = (s) => clean(s?.name || s?.studentName || s?.fullName || "Student");
const studentEmail = (s) => clean(s?.email || s?.contactEmail);
const studentClass = (s) => clean(s?.className || s?.class || s?.classId);
const money = (value, currency = "GHS") => value === undefined || value === null || value === "" ? "" : (/^(GH₵|GHS|₵)/i.test(String(value).trim()) ? "" : (currency === "GHS" ? "GH₵" : currency + " ")) + String(value);
const scheduleText = (klass) => Array.isArray(klass?.scheduleRules) ? klass.scheduleRules.map((item) =>
  [clean(item.day || item.weekday), clean(item.time || item.startTime)].filter(Boolean).join(" ")
).filter(Boolean).join(", ") : "";
const escapeHtml = (s) => String(s || "").replace(/[&<>"']/g, (ch) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[ch]);
const previousLevel = (level) => LEVELS[Math.max(0, LEVELS.indexOf(level) - 1)] || "A1";
const formatDate = (value) => {
  const date = new Date((clean(value).slice(0, 10) || TODAY()) + "T12:00:00Z");
  return Number.isNaN(date.getTime()) ? clean(value) : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" });
};
function announcementAccepted(receipt) {
  return Boolean(receipt?.sheet?.success);
}
function newMessage() {
  return { subject: "", body: "", link: "", date: TODAY() };
}
function notifyHistory() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("falowen:communication-sent"));
}
function Field({ label, hint, children }) {
  return <label className="cw-field"><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>;
}
function Preview({ subject, body, link, audience, heading = "Message preview" }) {
  return (
    <section className="cw-preview" aria-label={heading}>
      <div className="cw-preview-head"><strong>{heading}</strong><span>Falowen email</span></div>
      <div className="cw-preview-inner">
        <div className="cw-preview-brand">Falowen <small>Learn Language Education Academy</small></div>
        <strong className="cw-preview-subject">{subject || "Your subject appears here"}</strong>
        <p className="cw-preview-body">{body || "Your message appears here as you type."}</p>
        {link ? <span className="cw-preview-link">{link}</span> : null}
        <small className="cw-muted">Audience: {audience}</small>
      </div>
    </section>
  );
}
function ClassSelector({ classes, value, onChange, label = "Class" }) {
  return <Field label={label}>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose a class</option>
      {classes.map((klass) => <option key={classKey(klass)} value={classKey(klass)}>{className(klass)}</option>)}
    </select>
  </Field>;
}
function MessageFields({ value, onChange, bodyLabel = "Message", subjectHint = "" }) {
  const patch = (field, text) => onChange({ ...value, [field]: text });
  return <>
    <Field label="Subject" hint={subjectHint}><input value={value.subject} onChange={(e) => patch("subject", e.target.value)} placeholder="Email subject" maxLength={160} required /></Field>
    <Field label={bodyLabel}><textarea rows={7} value={value.body} onChange={(e) => patch("body", e.target.value)} placeholder="Write your message..." required /></Field>
    <div className="cw-two-fields">
      <Field label="Link (optional)"><input type="url" value={value.link} onChange={(e) => patch("link", e.target.value)} placeholder="https://" /></Field>
      <Field label="Announcement date"><input type="date" value={value.date} onChange={(e) => patch("date", e.target.value)} required /></Field>
    </div>
  </>;
}
function TemplateList({ onPick }) {
  return <div className="cw-template-list">{TEMPLATES.map((template) => <button type="button" key={template.label} onClick={() => onPick(template)}>
    <span>{template.label}</span><span aria-hidden="true">＋</span>
  </button>)}</div>;
}
function ReceiptNote({ result }) {
  if (!result) return null;
  return <div role="status" className={"cw-receipt " + (result.error ? "cw-receipt-error" : "")}>{result.text}</div>;
}

export default function CommunicationWorkspacePage() {
  const toast = useToast();
  const [tab, setTab] = useState("bulk");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [language, setLanguage] = useState("all");
  const [audience, setAudience] = useState("class");
  const [targetLevel, setTargetLevel] = useState("A1");
  const [targetClass, setTargetClass] = useState("");
  const [bulk, setBulk] = useState(newMessage);
  const [bulkReview, setBulkReview] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [personal, setPersonal] = useState(newMessage);

  const [documentKind, setDocumentKind] = useState("general");
  const [documentStudentId, setDocumentStudentId] = useState("");
  const [documentRecipient, setDocumentRecipient] = useState("");
  const [documentReference, setDocumentReference] = useState("");
  const [documentHeading, setDocumentHeading] = useState("Official Letter");
  const [documentBody, setDocumentBody] = useState("To whom it may concern,\n\n[Write the purpose of this letter and verified details here.]\n\nYours faithfully,");
  const [documentSignatory, setDocumentSignatory] = useState("Falowen Administration");

  const [promoClassId, setPromoClassId] = useState("");
  const [promoAudience, setPromoAudience] = useState("level");
  const [promoSourceClass, setPromoSourceClass] = useState("");
  const [promoLevel, setPromoLevel] = useState("A1");
  const [promo, setPromo] = useState(newMessage);
  const [promoReview, setPromoReview] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([listClasses(), listAllStudents()]).then(([classesResult, studentResult]) => {
      if (!active) return;
      if (classesResult.status === "fulfilled") setClasses(uniqueClasses(classesResult.value));
      if (studentResult.status === "fulfilled") setStudents(studentResult.value);
      if (classesResult.status === "rejected" || studentResult.status === "rejected") {
        setLoadError("Some roster information could not be loaded. Refresh before selecting an audience.");
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const eligibleClasses = useMemo(() => classes.filter(isAvailable), [classes]);
  const audienceClasses = useMemo(() => eligibleClasses.filter((klass) => language === "all" || languageOf(klass) === language), [eligibleClasses, language]);
  const levelClasses = useMemo(() => audienceClasses.filter((klass) => levelOf(klass) === targetLevel), [audienceClasses, targetLevel]);
  const selectedClass = audienceClasses.find((klass) => classKey(klass) === targetClass);
  const selectedStudent = students.find((s) => studentId(s) === selectedStudentId);
  const filteredStudents = useMemo(() => {
    const term = studentSearch.toLowerCase().trim();
    if (!term) return students.slice(0, 120);
    return students.filter((s) => [studentName(s), studentEmail(s), studentId(s), studentClass(s)].some((v) => v.toLowerCase().includes(term))).slice(0, 120);
  }, [students, studentSearch]);
  const upcomingClasses = useMemo(() => classes.filter(isUpcoming).sort((a, b) => clean(a.startDate).localeCompare(clean(b.startDate))), [classes]);
  const upcomingClass = upcomingClasses.find((klass) => classKey(klass) === promoClassId);
  const promotionCandidates = eligibleClasses.filter((klass) => upcomingClass && languageOf(klass) === languageOf(upcomingClass));
  const promotedAudienceClasses = promoAudience === "level" ? promotionCandidates.filter((klass) => levelOf(klass) === promoLevel)
    : promoAudience === "class" ? promotionCandidates.filter((klass) => classKey(klass) === promoSourceClass) : promotionCandidates;

  const bulkTargets = audience === "level" ? levelClasses : audience === "class" ? selectedClass ? [selectedClass] : [] : audienceClasses;
  const bulkAudienceLabel = audience === "all" && language === "all" ? "All active students"
    : audience === "all" ? "All " + language + " classes"
    : audience === "level" ? targetLevel + " · " + (language === "all" ? "both languages" : language)
    : selectedClass ? className(selectedClass) : "Choose a class";
  const promoAudienceLabel = promoAudience === "all" ? "All active " + (upcomingClass ? languageOf(upcomingClass) : "") + " learners"
    : promoAudience === "level" ? promoLevel + " students" : (promotedAudienceClasses[0] ? className(promotedAudienceClasses[0]) : "Choose a class");

  function changeTab(next) { setTab(next); setReceipt(null); }
  function patchBulk(next) { setBulk(next); setBulkReview(false); setReceipt(null); }
  function patchPromo(next) { setPromo(next); setPromoReview(false); setReceipt(null); }
  function applyTemplate(template) {
    if (tab === "student") setPersonal((prev) => ({ ...prev, subject: template.subject, body: template.body }));
    else patchBulk({ ...bulk, subject: template.subject, body: template.body });
  }
  async function dispatchRows(rows, successText) {
    setBusy(true);
    setReceipt(null);
    try {
      const results = await Promise.allSettled(rows.map((row) => saveAnnouncementRow({
        announcement: row.body, topic: row.subject, date: row.date, link: row.link,
        className: row.className, email: row.email || "", studentId: row.studentId || "",
        studentName: row.studentName || "", deliveryMode: row.email ? "individual" : "auto",
      })));
      const succeeded = results.filter((entry) => entry.status === "fulfilled" && announcementAccepted(entry.value)).length;
      const failed = results.length - succeeded;
      const resultText = failed ? succeeded + " accepted; " + failed + " failed. Check Communication history before retrying." : successText;
      setReceipt({ error: failed > 0, text: resultText });
      if (failed) toast.error(resultText);
      else toast.success(resultText);
      notifyHistory();
      return failed === 0;
    } catch (error) {
      setReceipt({ error: true, text: error.message || "Could not submit this message." });
      toast.error(error.message || "Could not submit this message.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  function validateMessage(message) {
    if (!message.subject.trim() || !message.body.trim() || !message.date) {
      toast.error("Add a subject, message, and date first.");
      return false;
    }
    return true;
  }
  async function sendBulk() {
    if (!validateMessage(bulk)) return;
    if (loadError) { toast.error("Class or student data could not load. Refresh to retry."); return; }
    if (audience !== "all" || language !== "all") {
      if (!bulkTargets.length) { toast.error("Choose an available class or level."); return; }
    }
    const rows = audience === "level" ? bulkTargets.map((klass) => ({ ...bulk, className: className(klass) }))
      : [{ ...bulk, className: audience === "all" && language === "all" ? "all" : bulkTargets.map(className).join(",") }];
    const ok = await dispatchRows(rows, rows.length === 1
      ? "Broadcast accepted by the communication worker. Check delivery history for status."
      : rows.length + " class broadcasts accepted by the communication worker.");
    if (ok) { patchBulk(newMessage()); setBulkReview(false); }
  }
  async function sendStudent() {
    if (!selectedStudent || !studentEmail(selectedStudent)) { toast.error("Choose a student with a valid email."); return; }
    if (!validateMessage(personal)) return;
    const ok = await dispatchRows([{ ...personal, className: studentClass(selectedStudent), email: studentEmail(selectedStudent), studentId: studentId(selectedStudent), studentName: studentName(selectedStudent) }],
      "Personal message accepted for " + studentName(selectedStudent) + ". Check delivery history for status.");
    if (ok) setPersonal(newMessage());
  }
  function selectUpcomingClass(id) {
    setPromoClassId(id); setPromoReview(false);
    const klass = upcomingClasses.find((item) => classKey(item) === id);
    if (!klass) { setPromo(newMessage()); return; }
    const languageName = languageOf(klass) === "swahili" ? "Kiswahili" : "German";
    const details = [
      "Our next " + languageName + " " + (levelOf(klass) || "") + " class is coming up: " + className(klass) + ".",
      clean(klass.startDate || klass.startsAt || klass.date) ? "Start date: " + formatDate(klass.startDate || klass.startsAt || klass.date) + "." : "",
      scheduleText(klass) ? "Schedule: " + scheduleText(klass) + "." : "",
      clean(klass.tuitionGhs || klass.price || klass.fee || klass.tuition) ? "Tuition: " + money(klass.tuitionGhs || klass.price || klass.fee || klass.tuition, klass.currency || "GHS") + "." : "",
      "You can register or upgrade through your Falowen account. We look forward to learning with you."
    ].filter(Boolean).join("\n\n");
    const selectedLevel = levelOf(klass);
    setPromoLevel(LEVELS.indexOf(selectedLevel) > 0 ? previousLevel(selectedLevel) : selectedLevel || "A1");
    setPromoSourceClass("");
    setPromo({ subject: "Registration: " + className(klass), body: details, date: TODAY(),
      link: clean(klass.registrationLink || klass.classUrl || klass.link) || ACCOUNT_URL });
  }
  async function sendPromo() {
    if (!upcomingClass) { toast.error("Choose a future class to promote."); return; }
    if (!validateMessage(promo)) return;
    if (!promotedAudienceClasses.length) { toast.error("No matching active audience classes found."); return; }
    const rows = promoAudience === "level" ? promotedAudienceClasses.map((klass) => ({ ...promo, className: className(klass) }))
      : [{ ...promo, className: promotedAudienceClasses.map(className).join(",") }];
    const ok = await dispatchRows(rows, "Class promotion accepted for " + rows.length + " audience group(s). Check delivery history for status.");
    if (ok) setPromoReview(false);
  }

  const docStudent = students.find((s) => studentId(s) === documentStudentId);
  function chooseDocumentKind(kind, student = docStudent) {
    setDocumentKind(kind);
    const name = student ? studentName(student) : "[Student name]";
    const klass = student ? studentClass(student) || "[Class name]" : "[Class name]";
    const templates = {
      general: { heading: "Official Letter", body: "To whom it may concern,\n\n[Write the purpose of this letter and the verified details here.]\n\nYours faithfully," },
      enrollment: { heading: "Student Enrollment Letter", body: "To whom it may concern,\n\nThis letter concerns " + name + ", whose Falowen student record lists the class " + klass + ". Please verify the student's current enrollment status and dates before issuing this letter.\n\nYours faithfully," },
      progress: { heading: "Course Progress Letter", body: "To whom it may concern,\n\nThis letter concerns " + name + " in " + klass + ". [Insert verified assessment results and course progress. Do not state a pass or completion unless confirmed.]\n\nYours faithfully," },
      invitation: { heading: "Student Invitation", body: "Dear " + name + ",\n\nYou are invited to [event or programme].\n\nDate and time: [Insert verified date and time]\nVenue or link: [Insert location]\n\nWe look forward to welcoming you.\n\nKind regards," },
    };
    setDocumentHeading(templates[kind].heading);
    setDocumentBody(templates[kind].body);
  }
  function buildDocumentHtml() {
    const body = escapeHtml(documentBody).replace(/\n/g, "<br>");
    return "<!doctype html><html><head><meta charset=\"utf-8\"><title>" + escapeHtml(documentHeading) +
      "</title><style>@page{size:A4;margin:19mm}body{font:15px/1.65 Arial,sans-serif;color:#16243a;margin:0}.head{border-bottom:3px solid #3156e8;padding-bottom:18px;margin-bottom:30px}.brand{font-size:28px;font-weight:800;color:#3156e8}.subtitle{font-size:12px;color:#64748b}h1{font-size:20px;margin:0 0 16px}.meta{font-size:12px;color:#475569;margin-bottom:30px}.body{min-height:360px;white-space:normal}.sign{margin-top:40px;font-weight:700}.footer{border-top:1px solid #cbd5e1;margin-top:60px;padding-top:10px;font-size:11px;color:#64748b}</style></head><body>" +
      "<div class=\"head\"><div class=\"brand\">Falowen</div><div class=\"subtitle\">Learn Language Education Academy</div></div>" +
      "<div class=\"meta\">Date: " + escapeHtml(formatDate(TODAY())) + (documentReference.trim() ? " &nbsp; | &nbsp; Reference: " + escapeHtml(documentReference) : "") +
      (documentRecipient.trim() ? "<br>To: " + escapeHtml(documentRecipient) : "") + "</div>" +
      "<h1>" + escapeHtml(documentHeading) + "</h1><div class=\"body\">" + body + "</div>" +
      "<div class=\"sign\">" + escapeHtml(documentSignatory) + "</div><div class=\"footer\">Falowen · Learn Language Education Academy · This document must be reviewed and authorised before official use.</div></body></html>";
  }
  function downloadWord() {
    if (!documentHeading.trim() || !documentBody.trim()) { toast.error("Add a document title and body."); return; }
    const blob = new Blob(["\ufeff", buildDocumentHtml()], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "falowen-" + documentKind + "-" + TODAY() + ".doc"; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function printDocument() {
    if (!documentHeading.trim() || !documentBody.trim()) { toast.error("Add a document title and body."); return; }
    const frame = window.open("", "_blank");
    if (!frame) { toast.error("Allow pop-ups to print or save this document as a PDF."); return; }
    frame.document.open(); frame.document.write(buildDocumentHtml()); frame.document.close();
    frame.focus(); frame.print();
  }

  return <div className="cw-workspace">
    <header className="cw-header">
      <div><span className="cw-eyebrow">STUDENT COMMUNICATION</span><h1>Communication</h1>
        <p>Send the right message, prepare a school document, or promote the next class — without switching between tools.</p></div>
      <Link to="/live-classes" className="cw-live-link">Manage live classes <span aria-hidden="true">↗</span></Link>
    </header>
    <nav className="cw-tabs" aria-label="Communication workflows">
      {TABS.map((item) => <button type="button" key={item.id} className={tab === item.id ? "cw-tab active" : "cw-tab"} aria-current={tab === item.id ? "page" : undefined} onClick={() => changeTab(item.id)}>
        <span className="cw-tab-number">{item.number}</span><span>{item.label}</span>
      </button>)}
    </nav>
    <p className="cw-intro">{TABS.find((item) => item.id === tab)?.description}</p>
    {loading ? <p role="status" className="cw-muted">Loading classes and students…</p> : null}
    {loadError ? <p role="alert" className="cw-loading-error">{loadError}</p> : null}

    {tab === "bulk" ? <div className="cw-grid">
      <div className="cw-panel">
        <div className="cw-panel-header"><span className="cw-step">01 / Audience</span><h2>Who should receive it?</h2>
          <p>Choose a school-wide broadcast, level, class, or students matching an attendance or payment condition.</p></div>
        <div className="cw-radio-grid">
          {[["class", "One class"], ["level", "Level broadcast"], ["all", "All active"], ["conditions", "Advanced filters"]].map(([key, text]) =>
            <label key={key} className={"cw-radio " + (audience === key ? "checked" : "")}><input type="radio" name="cw-audience" value={key} checked={audience === key} onChange={() => { setAudience(key); setBulkReview(false); }} />{text}</label>)}
        </div>
        {audience === "conditions" ? <div className="cw-targeted"><TargetedCommunicationPanel embedded showHistory={false} /></div> : <>
          <div className="cw-two-fields">
            <Field label="Course language"><select value={language} onChange={(e) => { setLanguage(e.target.value); setTargetClass(""); setBulkReview(false); }}>
              <option value="all">German and Kiswahili</option><option value="german">German only</option><option value="swahili">Kiswahili only</option>
            </select></Field>
            {audience === "class" ? <ClassSelector classes={audienceClasses} value={targetClass} onChange={(id) => { setTargetClass(id); setBulkReview(false); }} /> : null}
            {audience === "level" ? <Field label="Course level"><select value={targetLevel} onChange={(e) => { setTargetLevel(e.target.value); setBulkReview(false); }}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field> : null}
          </div>
          <div className="cw-audience-summary"><strong>{bulkAudienceLabel}</strong><span>{audience === "all" && language === "all" ? "Uses the existing active-student broadcast" : bulkTargets.length + " matching class(es)"}</span></div>
          {audience === "level" && bulkTargets.length ? <small className="cw-muted">Separate announcement records: {bulkTargets.map(className).join(" · ")}</small> : null}
          <div className="cw-section-rule" />
          <span className="cw-step">02 / Compose</span><h2>Your announcement</h2>
          <MessageFields value={bulk} onChange={patchBulk} />
          <ReceiptNote result={receipt} />
          {!bulkReview ? <button type="button" className="cw-primary" onClick={() => { if (validateMessage(bulk) && !loadError && (audience === "all" && language === "all" || bulkTargets.length > 0)) setBulkReview(true); else if (!bulkTargets.length && !(audience === "all" && language === "all")) toast.error("Choose a class or level with a matching audience."); }} disabled={busy || loading}>Review broadcast <span aria-hidden="true">→</span></button>
            : <div className="cw-review-actions"><p><strong>Ready to submit:</strong> {bulkAudienceLabel}. {audience === "level" ? bulkTargets.length + " class records." : "One announcement."} Delivery is accepted by the worker before the individual email status is known.</p>
              <button type="button" onClick={() => setBulkReview(false)} className="cw-secondary">Edit</button><button type="button" className="cw-primary" onClick={sendBulk} disabled={busy}>{busy ? "Submitting…" : "Confirm & send"}</button></div>}
        </>}
      </div>
      <aside className="cw-sidebar"><div className="cw-panel"><h3>Start with a template</h3><p>Pick a familiar message and personalise it.</p><TemplateList onPick={applyTemplate} /></div>
        <Preview subject={bulk.subject} body={bulk.body} link={bulk.link} audience={bulkAudienceLabel} />
        <div className="cw-help">Class cancellations and timetable changes belong in <Link to="/live-classes">Live Classes</Link>, where the correct student notification follows the saved schedule.</div>
      </aside>
    </div> : null}

    {tab === "student" ? <div className="cw-grid">
      <div className="cw-panel"><span className="cw-step">01 / Student</span><h2>Send a personal message</h2><p>Search the student roster and choose exactly one account. No bulk audience is used.</p>
        <Field label="Find student"><input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search name, email, student code, or class" /></Field>
        <Field label="Student account"><select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
          <option value="">Select one student</option>
          {selectedStudent && !filteredStudents.some((s) => studentId(s) === selectedStudentId) ? <option value={selectedStudentId}>{studentName(selectedStudent)} · {studentEmail(selectedStudent)}</option> : null}
          {filteredStudents.map((s) => <option key={studentId(s)} value={studentId(s)}>{studentName(s)} · {studentEmail(s) || "No email"}</option>)}
        </select></Field>
        {selectedStudent ? <div className="cw-audience-summary"><strong>{studentName(selectedStudent)}</strong><span>{studentEmail(selectedStudent) || "No email on record"}{studentClass(selectedStudent) ? " · " + studentClass(selectedStudent) : ""}</span></div> : null}
        <div className="cw-section-rule" /><span className="cw-step">02 / Compose</span><h2>Your message</h2>
        <MessageFields value={personal} onChange={setPersonal} />
        <ReceiptNote result={receipt} />
        <button type="button" className="cw-primary" disabled={busy || !selectedStudent || !studentEmail(selectedStudent)} onClick={sendStudent}>{busy ? "Submitting…" : "Send to this student"}</button>
      </div>
      <aside className="cw-sidebar"><div className="cw-panel"><h3>Personal message templates</h3><p>Use one of these or write your own.</p><TemplateList onPick={applyTemplate} /></div>
        <Preview subject={personal.subject} body={personal.body} link={personal.link} audience={selectedStudent ? studentName(selectedStudent) : "One selected student"} />
      </aside>
    </div> : null}

    {tab === "documents" ? <div className="cw-grid">
      <div className="cw-panel"><span className="cw-step">01 / Document</span><h2>Create a school document</h2><p>Prepare a Falowen letterhead document. All official claims require your review before signing.</p>
        <div className="cw-two-fields"><Field label="Document type"><select value={documentKind} onChange={(e) => chooseDocumentKind(e.target.value)}>
          <option value="general">Official letter</option><option value="enrollment">Student enrollment letter</option><option value="progress">Course progress letter</option><option value="invitation">Student invitation</option>
        </select></Field>
          <Field label="Student (optional)"><select value={documentStudentId} onChange={(e) => {
            setDocumentStudentId(e.target.value);
            chooseDocumentKind(documentKind, students.find((s) => studentId(s) === e.target.value));
          }}><option value="">No student selected</option>{students.map((s) => <option key={studentId(s)} value={studentId(s)}>{studentName(s)}</option>)}</select></Field>
        </div>
        <div className="cw-two-fields"><Field label="To / Recipient"><input value={documentRecipient} onChange={(e) => setDocumentRecipient(e.target.value)} placeholder="To whom it may concern" /></Field>
          <Field label="Reference number (optional)"><input value={documentReference} onChange={(e) => setDocumentReference(e.target.value)} placeholder="e.g. LLEA/2026/..." /></Field></div>
        <Field label="Document heading"><input value={documentHeading} onChange={(e) => setDocumentHeading(e.target.value)} /></Field>
        <Field label="Letter body"><textarea rows={12} value={documentBody} onChange={(e) => setDocumentBody(e.target.value)} placeholder="Choose a type or write your letter..." /></Field>
        <Field label="Signatory / office"><input value={documentSignatory} onChange={(e) => setDocumentSignatory(e.target.value)} /></Field>
        <div className="cw-document-actions"><button type="button" className="cw-primary" onClick={downloadWord}>Download Word (.doc)</button>
          <button type="button" className="cw-secondary" onClick={printDocument}>Print / Save PDF</button></div>
        <small className="cw-muted">These files are generated in your browser and are not emailed or recorded as issued certificates. Verify enrolment, scores, dates and signatures before official use.</small>
      </div>
      <aside className="cw-sidebar"><div className="cw-document-preview"><div className="cw-letter-brand">Falowen</div><small>Learn Language Education Academy</small><hr />
        <div className="cw-letter-meta">{formatDate(TODAY())}{documentReference ? " · " + documentReference : ""}</div>
        <h3>{documentHeading || "Official Letter"}</h3><div className="cw-letter-body">{documentBody || "Select a document type to prepare your letter."}</div>
        <strong>{documentSignatory}</strong><footer>Falowen · Learn Language Education Academy</footer></div>
        <div className="cw-help">Certificate eligibility and academic scores continue to use the verified Falowen assessment and certificate workflows.</div></aside>
    </div> : null}

    {tab === "promotions" ? <div className="cw-grid">
      <div className="cw-panel"><span className="cw-step">01 / Upcoming class</span><h2>Promote an upcoming class</h2><p>Choose a scheduled future class. Falowen fills the announcement with available course details.</p>
        <ClassSelector label="Class to advertise" classes={upcomingClasses} value={promoClassId} onChange={selectUpcomingClass} />
        {upcomingClass ? <div className="cw-promo-facts"><strong>{className(upcomingClass)}</strong><span>{languageOf(upcomingClass) === "swahili" ? "Kiswahili" : "German"} · {levelOf(upcomingClass)}</span>
          <span>{clean(upcomingClass.startDate || upcomingClass.startsAt || upcomingClass.date) ? "Starts " + formatDate(upcomingClass.startDate || upcomingClass.startsAt || upcomingClass.date) : "Start date to be confirmed"}</span>
          {scheduleText(upcomingClass) ? <span>{scheduleText(upcomingClass)}</span> : null}</div> : <div className="cw-audience-summary">Only upcoming, non-archived classes are eligible. If none appear, check their start dates and statuses in Live Classes.</div>}
        <div className="cw-section-rule" /><span className="cw-step">02 / Recipients</span><h2>Who is this promotion for?</h2>
        <div className="cw-radio-grid cw-radio-grid-three">{[["level", "Previous level"], ["class", "One class"], ["all", "All active in language"]].map(([id, label]) => <label key={id} className={"cw-radio " + (promoAudience === id ? "checked" : "")}>
          <input type="radio" checked={promoAudience === id} onChange={() => { setPromoAudience(id); setPromoReview(false); }} />{label}</label>)}</div>
        {promoAudience === "level" ? <Field label="Current student level"><select value={promoLevel} onChange={(e) => { setPromoLevel(e.target.value); setPromoReview(false); }}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field> : null}
        {promoAudience === "class" ? <ClassSelector classes={promotionCandidates} value={promoSourceClass} onChange={(id) => { setPromoSourceClass(id); setPromoReview(false); }} /> : null}
        {upcomingClass ? <div className="cw-audience-summary"><strong>{promoAudienceLabel}</strong><span>{promotedAudienceClasses.length} class(es) matched in {languageOf(upcomingClass)}</span></div> : null}
        <div className="cw-section-rule" /><span className="cw-step">03 / Preview & send</span><h2>Promotion message</h2>
        <MessageFields value={promo} onChange={patchPromo} />
        <ReceiptNote result={receipt} />
        {!promoReview ? <button type="button" className="cw-primary" disabled={busy || !upcomingClass} onClick={() => { if (validateMessage(promo)) setPromoReview(true); }}>Review promotion</button>
          : <div className="cw-review-actions"><p>Confirm that <strong>{className(upcomingClass)}</strong> is open for registration and these details are accurate. Audience: {promoAudienceLabel}.</p>
            <button type="button" className="cw-secondary" onClick={() => setPromoReview(false)}>Edit</button><button type="button" className="cw-primary" onClick={sendPromo} disabled={busy}>{busy ? "Submitting…" : "Confirm & send"}</button></div>}
      </div>
      <aside className="cw-sidebar"><Preview subject={promo.subject} body={promo.body} link={promo.link} audience={promoAudienceLabel} heading="Promotion email preview" />
        <div className="cw-help">This uses the same announcement worker as your other messages. It does not change class timetables, fees or registration status.</div></aside>
    </div> : null}
    <section className="cw-history"><CommunicationHistoryPanel /></section>
  </div>;
}
