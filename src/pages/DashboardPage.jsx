import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadSubmissions } from "../services/markingService";
import { loadPendingTutorReviews } from "../services/tutorReviewService";
import { loadGrammarIssueReports } from "../services/grammarIssueService";
import { loadWhatsappReminderDashboard } from "../services/whatsappRemindersService";
import { loadSocialMediaData } from "../services/socialMediaService";
import { listUpcomingHolidayReminders } from "../services/holidayService";
import { listAllStudents } from "../services/studentsService";
import "./DashboardPage.css";

const moneyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

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
  return !["inactive", "suspended", "cancelled", "canceled", "withdrawn"].some((token) => status.includes(token));
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

function groupTopClasses(students) {
  const map = new Map();
  for (const student of students) {
    const label = classLabel(student);
    const current = map.get(label) || { label, count: 0, paid: 0, balance: 0 };
    current.count += 1;
    if (isPaidStudent(student)) current.paid += 1;
    current.balance += studentBalance(student);
    map.set(label, current);
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
}

function StatCard({ label, value, helper, tone = "blue", icon }) {
  return (
    <article className={`analytics-card analytics-card-${tone}`}>
      <div className="analytics-card-top">
        <span className="analytics-card-icon">{icon}</span>
        <span className="analytics-card-label">{label}</span>
      </div>
      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </article>
  );
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
  const [students, setStudents] = useState([]);
  const [incomingAssignments, setIncomingAssignments] = useState([]);
  const [pendingTutorReviewsCount, setPendingTutorReviewsCount] = useState(0);
  const [grammarIssueReports, setGrammarIssueReports] = useState([]);
  const [contractEndingSoon, setContractEndingSoon] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [socialMetrics, setSocialMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [studentRows, submissionRows, tutorReviewRows, grammarIssueRows, reminderData, socialData] = await Promise.all([
          listAllStudents(),
          loadSubmissions(),
          loadPendingTutorReviews(),
          loadGrammarIssueReports(),
          loadWhatsappReminderDashboard(),
          loadSocialMediaData(),
        ]);

        setStudents(studentRows);
        setIncomingAssignments(submissionRows);
        setPendingTutorReviewsCount(tutorReviewRows.length);
        setGrammarIssueReports(grammarIssueRows);
        setContractEndingSoon(reminderData.contractEndingSoon || []);
        setUpcomingHolidays(listUpcomingHolidayReminders({ daysAhead: 30 }));
        setSocialMetrics(socialData.metrics || null);
      } catch (err) {
        setError(err?.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const analytics = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(isActiveStudent).length;
    const paidStudents = students.filter(isPaidStudent).length;
    const studentsWithBalance = students.filter((student) => studentBalance(student) > 0);
    const totalBalance = studentsWithBalance.reduce((sum, student) => sum + studentBalance(student), 0);
    const classBreakdown = groupTopClasses(students);
    const workQueue = incomingAssignments.length + pendingTutorReviewsCount + grammarIssueReports.length;
    const socialPosts = socialMetrics?.totalPosts || 0;
    const followerSnapshots = socialMetrics?.totalFollowerSnapshots || 0;

    return {
      totalStudents,
      activeStudents,
      paidStudents,
      studentsWithBalance,
      totalBalance,
      classBreakdown,
      workQueue,
      socialPosts,
      followerSnapshots,
      paymentRate: pct(paidStudents, totalStudents),
      activeRate: pct(activeStudents, totalStudents),
    };
  }, [grammarIssueReports.length, incomingAssignments.length, pendingTutorReviewsCount, socialMetrics, students]);

  const incomingAssignmentPreview = useMemo(() => incomingAssignments.slice(0, 5), [incomingAssignments]);
  const grammarIssuePreview = useMemo(() => grammarIssueReports.slice(0, 5), [grammarIssueReports]);
  const contractEndingSoonPreview = useMemo(() => contractEndingSoon.slice(0, 6), [contractEndingSoon]);
  const upcomingHolidayPreview = useMemo(() => upcomingHolidays.slice(0, 8), [upcomingHolidays]);
  const socialPostPreview = useMemo(() => socialMetrics?.recentPosts?.slice(0, 4) || [], [socialMetrics]);
  const socialFollowerPreview = useMemo(
    () => socialMetrics?.latestSnapshotByPlatform?.slice(0, 4) || [],
    [socialMetrics],
  );
  const balancePreview = useMemo(
    () => analytics.studentsWithBalance
      .slice()
      .sort((a, b) => studentBalance(b) - studentBalance(a))
      .slice(0, 6),
    [analytics.studentsWithBalance],
  );

  if (loading) {
    return (
      <div className="analytics-shell">
        <section className="analytics-hero analytics-loading-hero">
          <p>Loading Falowen Admin analytics…</p>
          <div className="loading-line" />
          <div className="loading-line short" />
        </section>
        <div className="analytics-grid four">
          {[1, 2, 3, 4].map((item) => <div key={item} className="analytics-card skeleton-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-shell">
      {error ? <p className="analytics-error">❌ {error}</p> : null}

      <section className="analytics-hero">
        <div>
          <p className="analytics-eyebrow">Falowen Admin Analytics</p>
          <h1>School operations dashboard</h1>
          <p>
            Track students, marking workload, tutor reviews, grammar issues, WhatsApp reminders,
            holiday planning, and social performance from one control center.
          </p>
        </div>
        <div className="hero-score-card">
          <span>Operational queue</span>
          <strong>{analytics.workQueue}</strong>
          <p>{analytics.workQueue === 0 ? "No urgent admin work pending." : "items need attention"}</p>
        </div>
      </section>

      <section className="analytics-grid four">
        <StatCard label="Total students" value={analytics.totalStudents} helper={`${analytics.activeRate}% active records`} tone="blue" icon="🎓" />
        <StatCard label="Paid / active" value={analytics.paidStudents} helper={`${analytics.paymentRate}% marked paid or active`} tone="green" icon="✅" />
        <StatCard label="Balance due" value={moneyFormatter.format(analytics.totalBalance)} helper={`${analytics.studentsWithBalance.length} student(s) with balances`} tone="amber" icon="💳" />
        <StatCard label="Admin queue" value={analytics.workQueue} helper="assignments, tutor reviews, grammar reports" tone="purple" icon="⚡" />
      </section>

      <section className="quick-actions-grid">
        <ActionCard
          title="Mark incoming work"
          body={`${incomingAssignments.length} assignment${incomingAssignments.length === 1 ? "" : "s"} waiting for review.`}
          to="/marking"
          label="Open marking queue"
          tone="indigo"
        />
        <ActionCard
          title="Tutor review workflow"
          body={`${pendingTutorReviewsCount} tutor review message${pendingTutorReviewsCount === 1 ? "" : "s"} pending final review.`}
          to="/campus/tutor-marking"
          label="Open tutor marking"
          tone="violet"
        />
        <ActionCard
          title="Student records"
          body="Review student status, class, balance, contract dates, and contact details."
          to="/students"
          label="Open students"
          tone="emerald"
        />
      </section>

      <section className="analytics-grid two-one">
        <article className="analytics-panel">
          <div className="panel-header">
            <div>
              <p className="analytics-eyebrow">Class insight</p>
              <h2>Top active class groups</h2>
            </div>
            <Link to="/students">Manage students</Link>
          </div>
          {analytics.classBreakdown.length ? (
            <div className="class-bars">
              {analytics.classBreakdown.map((row) => {
                const width = Math.max(8, pct(row.count, analytics.totalStudents));
                return (
                  <div key={row.label} className="class-bar-row">
                    <div className="class-bar-top">
                      <strong>{row.label}</strong>
                      <span>{row.count} student{row.count === 1 ? "" : "s"}</span>
                    </div>
                    <div className="class-bar-track">
                      <span style={{ width: `${width}%` }} />
                    </div>
                    <small>{row.paid} paid/active · {moneyFormatter.format(row.balance)} balance</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">No student class data found yet.</p>
          )}
        </article>

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

      <section className="analytics-grid three">
        <article className="analytics-panel">
          <div className="panel-header compact">
            <div>
              <p className="analytics-eyebrow">Assignments</p>
              <h2>Incoming work</h2>
            </div>
            <Link to="/marking">Open</Link>
          </div>
          <MiniList
            items={incomingAssignmentPreview}
            emptyText="No incoming assignments to review right now."
            renderItem={(submission) => {
              const studentName = submission.studentName || submission.studentCode || "Unknown student";
              const title = submission.assignment || "Untitled assignment";
              return (
                <li key={submission.path || submission.id}>
                  <span className="avatar-chip">{initials(studentName)}</span>
                  <span>
                    <strong>{studentName}</strong>
                    <small>{title}</small>
                  </span>
                </li>
              );
            }}
          />
        </article>

        <article className="analytics-panel">
          <div className="panel-header compact">
            <div>
              <p className="analytics-eyebrow">Grammar</p>
              <h2>Issue reports</h2>
            </div>
            <Link to="/grammar-issues">Open</Link>
          </div>
          <MiniList
            items={grammarIssuePreview}
            emptyText="No grammar issue reports right now."
            renderItem={(report) => {
              const student = report.studentName || report.studentId || report.student_code || "Unknown student";
              const issueText = report.issue || report.description || report.text || report.message || "No issue text";
              return (
                <li key={report.id}>
                  <span className="avatar-chip warning">!</span>
                  <span>
                    <strong>{student}</strong>
                    <small>{issueText}</small>
                  </span>
                </li>
              );
            }}
          />
        </article>

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

      <section className="analytics-grid two">
        <article className="analytics-panel">
          <div className="panel-header compact">
            <div>
              <p className="analytics-eyebrow">Course calendar</p>
              <h2>Upcoming holidays</h2>
            </div>
            <Link to="/course-schedule">Manage</Link>
          </div>
          <MiniList
            items={upcomingHolidayPreview}
            emptyText="No holiday reminders in the next 30 days."
            renderItem={(holiday) => (
              <li key={holiday.isoDate}>
                <span className="avatar-chip calendar">📅</span>
                <span>
                  <strong>{holiday.displayDate}</strong>
                  <small>{holiday.daysUntil === 0 ? "Today" : `in ${holiday.daysUntil} day(s)`}</small>
                </span>
              </li>
            )}
          />
        </article>

        <article className="analytics-panel social-panel">
          <div className="panel-header compact">
            <div>
              <p className="analytics-eyebrow">Growth</p>
              <h2>Social media analytics</h2>
            </div>
            <Link to="/course-schedule">Open calendar</Link>
          </div>
          <div className="social-metric-row">
            <span>Total posts <strong>{analytics.socialPosts}</strong></span>
            <span>Follower snapshots <strong>{analytics.followerSnapshots}</strong></span>
            <span>Holiday calendar <strong>{upcomingHolidays.length}</strong></span>
          </div>
          {socialFollowerPreview.length > 0 ? (
            <div className="social-snapshots">
              {socialFollowerPreview.map((snapshot) => (
                <div key={`${snapshot.platform}-${snapshot.date || "latest"}`}>
                  <span>{snapshot.platform || "Unknown"}</span>
                  <strong>{snapshot.followers || 0}</strong>
                  <small>followers</small>
                </div>
              ))}
            </div>
          ) : null}
          {socialPostPreview.length > 0 ? (
            <div className="recent-posts">
              {socialPostPreview.map((post, index) => (
                <div key={`${post.date || "post"}-${post.topic || index}`}>
                  <strong>{post.topic || "Untitled post"}</strong>
                  <small>👍 {post.likes || 0} · 💬 {post.comments || 0} · 🔁 {post.shares || 0}</small>
                </div>
              ))}
            </div>
          ) : <p className="empty-state">No social data loaded yet.</p>}
        </article>
      </section>
    </div>
  );
}
