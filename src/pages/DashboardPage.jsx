import AdminActionInbox from "../components/AdminActionInbox.jsx";
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

function text(value) {
  return String(value ?? "").trim();
}

function normalize(value) {
  return text(value).toLowerCase();
}

function isActiveStudent(student) {
  const status = normalize(student.status || student.paymentStatus);
  return !["inactive", "suspended", "cancelled", "canceled", "withdrawn", "trial_expired"].some((token) => status.includes(token));
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

function MiniList({ items, emptyText, renderItem }) {
  if (!items.length) return <p className="empty-state">{emptyText}</p>;
  return <ul className="mini-list">{items.map(renderItem)}</ul>;
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const canReviewTeachers = role === "admin" && user?.emailVerified === true && String(user?.email || "").toLowerCase() === "moxflex@gmail.com";
  const [teacherCount, setTeacherCount] = useState(null);
  const [teacherCountError, setTeacherCountError] = useState(false);

  // One small request when the owner opens the dashboard; no interval or listener.
  useEffect(() => {
    let active = true;
    setTeacherCount(null);
    setTeacherCountError(false);
    if (!canReviewTeachers) return undefined;
    async function loadTeacherCount() {
      try {
        const token = await user.getIdToken();
        if (!active) return;
        const response = await fetch("/api/teacher-applications?view=count", {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || data.ok !== true || !Number.isSafeInteger(data.newCount) || data.newCount < 0) throw new Error("Count unavailable");
        if (active) setTeacherCount(data.newCount);
      } catch {
        if (active) setTeacherCountError(true);
      }
    }
    loadTeacherCount();
    return () => { active = false; };
  }, [canReviewTeachers, user]);
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
        Promise.all([
          getUpcomingHolidays({ year: currentYear, countryCode: "GH" }),
          getUpcomingHolidays({ year: currentYear + 1, countryCode: "GH" }),
        ]).then(([thisYear, nextYear]) => [...thisYear, ...nextYear]
          .sort((left, right) => String(left.date).localeCompare(String(right.date)))),
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
    return { totalStudents, activeRate: pct(activeStudents, totalStudents) };
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

  return (
    <div className="analytics-shell">
      {error ? <p className="analytics-error">{error}</p> : null}
      {refreshing ? <p className="analytics-refresh-status">Refreshing dashboard data…</p> : null}

      <section className="analytics-hero analytics-hero--overview">
        <div>
          <p className="analytics-eyebrow">Falowen Admin Analytics</p>
          <h1>School operations dashboard</h1>
          <p>
            View students, class communications, reminders, upcoming holidays,
            leads and partnership requests. Open other workspaces from the main menu.
          </p>
        </div>
      </section>

      <section className={`analytics-grid ${canReviewTeachers ? "four" : "three"}`}>
        <StatCard label="Total students" value={loading ? "—" : analytics.totalStudents} helper={loading ? "Loading student records…" : `${analytics.activeRate}% active records`} tone="blue" icon="🎓" />
        <StatCard label="Upcoming holidays" value={upcomingHolidays.length} helper={`${affectedHolidayClassCount} affected class${affectedHolidayClassCount === 1 ? "" : "es"}`} tone="purple" icon="📅" />
        <StatCard label="Leads needing attention" value={leadNotificationSummary.unresolvedCount} helper={`${leadNotificationSummary.unseenCount} new unseen lead${leadNotificationSummary.unseenCount === 1 ? "" : "s"}`} tone="rose" icon="🔔" to="/leads" />
        {canReviewTeachers && <StatCard label="New teacher applications" value={teacherCount ?? "—"} helper={teacherCountError ? "Count unavailable · Open applications" : teacherCount === null ? "Checking applications…" : teacherCount === 0 ? "No new applications · Open" : "Awaiting review · Open applications"} tone="green" icon="🧑‍🏫" to="/teacher-applications" />}
      </section>

      <AdminActionInbox user={user} classes={liveClasses} />

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
                    <small>{holiday.date} · {isSchoolClosed(holiday) ? "School closed" : "School open"} · {holiday.noticeStatus === "sent" ? "Notice sent" : "Email not sent"}</small>
                    <small style={{ color: "#1d4ed8", fontWeight: 700 }}>
                      {(() => {
                        const days = Math.ceil((Date.parse(`${holiday.date}T00:00:00Z`) - Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)) / 86400000);
                        return days === 0 ? "Today" : days === 1 ? "Tomorrow" : Number.isFinite(days) ? `In ${days} days` : "Upcoming";
                      })()}
                    </small>
                    {holiday.noticeStatus !== "sent" && (
                      <Link to={`/holiday-calendar?year=${String(holiday.date).slice(0, 4)}&notice=${holiday.date}`} style={{ display: "inline-block", marginTop: 6, color: "#1d4ed8", fontWeight: 700 }}>
                        Review and send holiday email
                      </Link>
                    )}
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
