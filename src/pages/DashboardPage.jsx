import DashboardReviewNotifications from "../components/DashboardReviewNotifications.jsx";
import DashboardPartnershipRequests from "../components/DashboardPartnershipRequests.jsx";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadWhatsappReminderDashboard } from "../services/whatsappRemindersService";
import { getUpcomingHolidays } from "../services/holidayCalendarService";
import { listClassCohorts } from "../services/liveClassService";
import { getEffectiveClassEndDate } from "../utils/liveClassScheduling";
import { listAllStudents } from "../services/studentsService";
import { useAuth } from "../context/AuthContext";
import { summarizeLeadNotifications } from "../services/leadNotificationService.js";
import { fetchStudentLeads } from "../services/studentLeadService.js";
import "./DashboardPage.css";

const moneyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

const DASHBOARD_CACHE_KEY = "falowen-admin-dashboard-core-v1";
const DASHBOARD_CACHE_MAX_AGE_MS = 30 * 60 * 1000;

function readDashboardCache() {
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.savedAt || Date.now() - cached.savedAt > DASHBOARD_CACHE_MAX_AGE_MS) {
      window.localStorage.removeItem(DASHBOARD_CACHE_KEY);
      return null;
    }
    return {
      students: Array.isArray(cached.students) ? cached.students : [],
      liveClasses: Array.isArray(cached.liveClasses) ? cached.liveClasses : [],
    };
  } catch {
    return null;
  }
}

function updateDashboardCache(partial) {
  try {
    const current = readDashboardCache() || {};
    window.localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
      ...current,
      ...partial,
      savedAt: Date.now(),
    }));
  } catch {
    // Storage can be unavailable in private browsing. Live loading still works.
  }
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return String(value ?? "").trim();
}

function normalize(value) {
  return text(value).toLowerCase();
}

function isPaidStudent(student) {
  const status = normalize(student.paymentStatus || student.status);
  return ["paid", "active", "enrolled", "completed"].some((token) => status.includes(token));
}

function isActiveStudent(student) {
  const status = normalize(student.status || student.paymentStatus);
  return !["inactive", "suspended", "cancelled", "canceled", "withdrawn", "trial_expired"].some((token) => status.includes(token));
}

function studentBalance(student) {
  return toNumber(student.balanceDue || student.balance || student.outstandingBalance || student.amountDue);
}

function classLabel(student) {
  return text(student.className || student.level || student.program || student.location || "Unassigned");
}

function initials(name) {
  return text(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ST";
}

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function isSchoolClosed(holiday = {}) {
  if (holiday.schoolClosed === true) return true;
  return ["true", "yes", "1", "closed"].includes(normalize(holiday.schoolClosed));
}

function holidayWeekday(dateIso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text(dateIso))) return "";
  const parsed = new Date(`${dateIso}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" })
    .format(parsed)
    .slice(0, 3)
    .toLowerCase();
}

function scheduleRulesForClass(klass = {}) {
  if (Array.isArray(klass.scheduleRules)) return klass.scheduleRules;
  if (Array.isArray(klass.scheduleRules?.weekly)) return klass.scheduleRules.weekly;
  return [];
}

function isClassAffectedByHoliday(klass = {}, holiday = {}) {
  if (!isSchoolClosed(holiday)) return false;
  const holidayDate = text(holiday.date);
  if (!holidayDate) return false;

  const status = normalize(klass.status);
  if (["archived", "graduated", "draft", "cancelled", "canceled"].includes(status)) return false;

  const startDate = text(klass.startDate);
  const endDate = text(getEffectiveClassEndDate(klass));
  if (startDate && holidayDate < startDate) return false;
  if (endDate && holidayDate > endDate) return false;

  const weekday = holidayWeekday(holidayDate);
  if (!weekday) return false;
  return scheduleRulesForClass(klass).some((rule) =>
    text(rule.day || rule.weekday).slice(0, 3).toLowerCase() === weekday,
  );
}

function liveClassName(klass = {}) {
  return text(klass.name || klass.className || klass.title || klass.id || "Unnamed class");
}

function StatCard({ label, value, helper, tone = "blue", icon, to }) {
  const className = `analytics-card analytics-card-${tone}${to ? " analytics-card-link" : ""}`;
  const content = (
    <>
      <div className="analytics-card-top">
        <span className="analytics-card-icon">{icon}</span>
        <span className="analytics-card-label">{label}</span>
      </div>
      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </>
  );

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return <article className={className}>{content}</article>;
}

function ActionCard({ title, body, to, label, tone = "indigo" }) {
  return (
    <article className={`action-card action-card-${tone}`}>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <Link to={to}>{label}</Link>
    </article>
  );
}

function MiniList({ items, emptyText, renderItem }) {
  if (!items.length) return <p className="empty-state">{emptyText}</p>;
  return <ul className="mini-list">{items.map(renderItem)}</ul>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [initialCache] = useState(() => readDashboardCache());
  const [students, setStudents] = useState(() => initialCache?.students || []);
  const [liveClasses, setLiveClasses] = useState(() => initialCache?.liveClasses || []);
  const [contractEndingSoon, setContractEndingSoon] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [studentLeads, setStudentLeads] = useState([]);
  const [loading, setLoading] = useState(() => !initialCache);
  const [refreshing, setRefreshing] = useState(() => Boolean(initialCache));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setError("");

      // Start every request together. Student metrics control only the headline
      // loading state; class and operational panels never block the page.
      const studentTask = listAllStudents()
        .then((rows) => {
          if (!active) return;
          setStudents(rows);
          updateDashboardCache({ students: rows });
        })
        .catch((err) => {
          if (!active) return;
          if (!initialCache) setError(err?.message || "Failed to load dashboard metrics");
          else console.warn("Could not refresh cached student metrics.", err);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      const classTask = listClassCohorts()
        .then((rows) => {
          if (!active) return;
          setLiveClasses(rows);
          updateDashboardCache({ liveClasses: rows });
        })
        .catch((err) => {
          console.warn("Could not refresh class data.", err);
        });

      const currentYear = new Date().getFullYear();
      const secondaryTask = Promise.allSettled([
        loadWhatsappReminderDashboard(),
        getUpcomingHolidays({ year: currentYear, countryCode: "GH" }),
        fetchStudentLeads(),
      ]).then((results) => {
        if (!active) return;
        const [reminders, holidays, leads] = results;
        if (reminders.status === "fulfilled") setContractEndingSoon(reminders.value.contractEndingSoon || []);
        if (holidays.status === "fulfilled") setUpcomingHolidays(holidays.value);
        if (leads.status === "fulfilled") setStudentLeads(leads.value.leads || []);

        const failedPanel = results.find((result) => result.status === "rejected");
        if (failedPanel) {
          console.warn("Some secondary dashboard panels could not be loaded.", failedPanel.reason);
        }
      });

      await Promise.allSettled([studentTask, classTask, secondaryTask]);
      if (active) setRefreshing(false);
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [initialCache]);
  const analytics = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(isActiveStudent).length;
    const paidStudents = students.filter(isPaidStudent).length;
    const studentsWithBalance = students.filter((student) => studentBalance(student) > 0);
    const totalBalance = studentsWithBalance.reduce((sum, student) => sum + studentBalance(student), 0);
    return {
      totalStudents,
      activeStudents,
      paidStudents,
      studentsWithBalance,
      totalBalance,
      paymentRate: pct(paidStudents, totalStudents),
      activeRate: pct(activeStudents, totalStudents),
    };
  }, [students]);

  const contractEndingSoonPreview = useMemo(() => contractEndingSoon.slice(0, 6), [contractEndingSoon]);
  const upcomingHolidayPreview = useMemo(
    () => upcomingHolidays.slice(0, 8).map((holiday) => ({
      ...holiday,
      affectedClasses: liveClasses
        .filter((klass) => isClassAffectedByHoliday(klass, holiday))
        .sort((left, right) => liveClassName(left).localeCompare(liveClassName(right))),
    })),
    [liveClasses, upcomingHolidays],
  );
  const affectedHolidayClassCount = useMemo(
    () => new Set(upcomingHolidayPreview.flatMap((holiday) => holiday.affectedClasses.map((klass) => klass.id || liveClassName(klass)))).size,
    [upcomingHolidayPreview],
  );
  const leadNotificationSummary = useMemo(
    () => summarizeLeadNotifications(studentLeads, user),
    [studentLeads, user],
  );

  const balancePreview = useMemo(
    () => analytics.studentsWithBalance
      .slice()
      .sort((a, b) => studentBalance(b) - studentBalance(a))
      .slice(0, 6),
    [analytics.studentsWithBalance],
  );

  return (
    <div className="analytics-shell">
      {error ? <p className="analytics-error">{error}</p> : null}
      {refreshing ? <p className="analytics-refresh-status">Refreshing dashboard data…</p> : null}

      <section className="analytics-hero analytics-hero--overview">
        <div>
          <p className="analytics-eyebrow">Falowen Admin Analytics</p>
          <h1>School operations dashboard</h1>
          <p>
            Track students, partnerships, balances, reminders and holiday planning.
            Open Marking or Grammar Issues when you need to review that work.
          </p>
        </div>
      </section>

      <section className="analytics-grid five">
        <StatCard label="Total students" value={loading ? "—" : analytics.totalStudents} helper={loading ? "Loading student records…" : `${analytics.activeRate}% active records`} tone="blue" icon="🎓" />
        <StatCard label="Paid / active" value={loading ? "—" : analytics.paidStudents} helper={loading ? "Loading payment status…" : `${analytics.paymentRate}% marked paid or active`} tone="green" icon="✅" />
        <StatCard label="Balance due" value={loading ? "—" : moneyFormatter.format(analytics.totalBalance)} helper={loading ? "Loading balances…" : `${analytics.studentsWithBalance.length} student(s) with balances`} tone="amber" icon="💳" />
        <StatCard label="Upcoming holidays" value={upcomingHolidays.length} helper={`${affectedHolidayClassCount} affected class${affectedHolidayClassCount === 1 ? "" : "es"}`} tone="purple" icon="📅" />
        <StatCard label="Leads needing attention" value={leadNotificationSummary.unresolvedCount} helper={`${leadNotificationSummary.unseenCount} new unseen lead${leadNotificationSummary.unseenCount === 1 ? "" : "s"}`} tone="rose" icon="🔔" to="/leads" />
      </section>

      <section className="quick-actions-grid">
        <ActionCard
          title="Marking workspace"
          body="Load assignments when you open Marking. Review work, AI audits and answer keys there."
          to="/marking"
          label="Open Marking"
          tone="indigo"
        />
        <ActionCard
          title="Exam review"
          body="Review exam warm-up and exam-prep writing sent separately from normal class submissions."
          to="/examTutorReviewQueue"
          label="Open Exam Review"
          tone="blue"
        />
        <ActionCard title="Grammar workspace" body="Load grammar issue reports only when you open the workspace." to="/grammar-issues" label="Open Grammar Issues" tone="violet" />
      </section>

      <DashboardReviewNotifications user={user} />

      <section className="analytics-grid two-one">
        <DashboardPartnershipRequests user={user} />

        <article className="analytics-panel focus-panel">
          <p className="analytics-eyebrow">Payment focus</p>
          <h2>Largest balances</h2>
          <MiniList
            items={balancePreview}
            emptyText="No balances found in student records."
            renderItem={(student) => (
              <li key={student.id || student.studentCode || student.email}>
                <span className="avatar-chip">{initials(student.name)}</span>
                <span>
                  <strong>{student.name || student.studentCode || "Unnamed student"}</strong>
                  <small>{classLabel(student)}</small>
                </span>
                <em>{moneyFormatter.format(studentBalance(student))}</em>
              </li>
            )}
          />
        </article>
      </section>

      <section className="analytics-grid">
        <article className="analytics-panel">
          <div className="panel-header compact">
            <div>
              <p className="analytics-eyebrow">WhatsApp</p>
              <h2>Reminder watch</h2>
            </div>
            <Link to="/whatsapp-reminders">Open</Link>
          </div>
          <MiniList
            items={contractEndingSoonPreview}
            emptyText="No contract reminders due in the next 10 days."
            renderItem={(student) => (
              <li key={`${student.name}-${student.phone || student.contractEnd?.toISOString() || "reminder"}`}>
                <span className="avatar-chip danger">⏳</span>
                <span>
                  <strong>{student.name}</strong>
                  <small>{student.daysUntilContractEnd != null ? `${student.daysUntilContractEnd} day(s) left` : "Contract reminder"}</small>
                </span>
              </li>
            )}
          />
        </article>
      </section>

      <section className="analytics-grid">
        <article className="analytics-panel">
          <div className="panel-header compact">
            <div>
              <p className="analytics-eyebrow">Course calendar</p>
              <h2>Upcoming holidays</h2>
            </div>
            <Link to="/holiday-calendar">Manage</Link>
          </div>
          <MiniList
            items={upcomingHolidayPreview}
            emptyText="No upcoming holidays loaded from the Holiday Calendar."
            renderItem={(holiday) => {
              const affectedNames = holiday.affectedClasses.map(liveClassName);
              return (
                <li key={`${holiday.countryCode || "GH"}-${holiday.date}`}>
                  <span className="avatar-chip calendar">📅</span>
                  <span>
                    <strong>{holiday.name || holiday.localName || holiday.date}</strong>
                    <small>{holiday.date} · {isSchoolClosed(holiday) ? "School closed" : "School open"}</small>
                    <small>
                      <b>Affected classes:</b>{" "}
                      {isSchoolClosed(holiday)
                        ? affectedNames.length ? affectedNames.join(", ") : "None"
                        : "None — school remains open"}
                    </small>
                  </span>
                </li>
              );
            }}
          />
        </article>
      </section>
    </div>
  );
}
