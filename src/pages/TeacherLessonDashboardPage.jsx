import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listClassCohorts } from "../services/liveClassService.js";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import { listStudentsByClass } from "../services/studentsService.js";
import { loadSubmissions } from "../services/markingService.js";
import { loadClassAttendanceAnalytics } from "../services/attendanceAnalyticsService.js";
import { getPresenterTopicFoundation } from "../data/presenterTopicFoundations.js";
import { getCurriculumParityReference } from "../data/studentCurriculumParity.js";
import {
  buildTeacherRosterReadiness,
  grammarTargetForSlide,
  learnerLessonUrl,
  previousTeacherLesson,
  resolveTeacherLessonSlide,
  selectTeacherLessonSession,
  summarizeTeacherReadiness,
  writingFocusForSlide,
} from "../utils/teacherLessonDashboard.js";
import "./TeacherLessonDashboardPage.css";

function normalize(value) {
  return String(value ?? "").trim();
}

function classNameOf(klass = {}) {
  return normalize(klass.name || klass.className || klass.title || klass.id || "Class");
}

function classLevel(klass = {}) {
  return normalize(
    klass.resolvedLevelId
      || klass.levelId
      || klass.level
      || klass.languageLevel
      || klass.courseLevel
      || klass.course
      || klass.program,
  ).toUpperCase();
}

function isActiveClass(klass = {}) {
  const status = normalize(klass.status).toLowerCase();
  return !["archived", "graduated", "cancelled", "canceled", "draft"].includes(status);
}

function formatDateTime(value, timezone = "Africa/Accra") {
  if (!value) return "No scheduled time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No scheduled time";

  const options = {
    timeZone: timezone || "Africa/Accra",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  try {
    return date.toLocaleString("en-GB", options);
  } catch {
    return date.toLocaleString("en-GB", { ...options, timeZone: "Africa/Accra" });
  }
}

function scoreLabel(score) {
  if (score == null || !Number.isFinite(Number(score))) return "—";
  return `${Math.round(Number(score))}%`;
}

function readinessTone(row) {
  if (!row.previousComplete || row.consecutiveAbsences >= 2 || (row.latestScore != null && row.latestScore < 60)) return "attention";
  if (row.currentStarted) return "started";
  return "ready";
}

function lessonDay(slide = null) {
  return Number(slide?.dayNumber || String(slide?.day || "").match(/\d+/)?.[0] || 0);
}

function quickLinkClass(enabled) {
  return `teacher-command-link${enabled ? "" : " is-disabled"}`;
}

export default function TeacherLessonDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedClassId = normalize(searchParams.get("classId"));

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(requestedClassId);
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingClasses(true);
    listClassCohorts()
      .then((rows) => {
        if (!active) return;
        const sorted = [...rows].sort((left, right) => {
          const activeDiff = Number(isActiveClass(right)) - Number(isActiveClass(left));
          if (activeDiff) return activeDiff;
          return classNameOf(left).localeCompare(classNameOf(right));
        });
        setClasses(sorted);
        const validRequested = requestedClassId && sorted.some((row) => row.id === requestedClassId);
        const nextId = validRequested ? requestedClassId : sorted.find(isActiveClass)?.id || sorted[0]?.id || "";
        setSelectedClassId(nextId);
        if (nextId && nextId !== requestedClassId) setSearchParams({ classId: nextId }, { replace: true });
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || "Could not load classes.");
      })
      .finally(() => {
        if (active) setLoadingClasses(false);
      });
    return () => { active = false; };
  }, [requestedClassId, setSearchParams]);

  useEffect(() => {
    if (!selectedClassId) {
      setDashboard(null);
      setStudents([]);
      setSubmissions([]);
      setAttendanceAnalytics(null);
      return;
    }

    let active = true;
    setLoadingLesson(true);
    setError("");
    setSubmissions([]);
    setAttendanceAnalytics(null);

    (async () => {
      try {
        const classRecord = classes.find((row) => row.id === selectedClassId) || {};
        const className = classNameOf(classRecord);

        // Load only the data required to open the lesson dashboard first.
        // Readiness is intentionally deferred because loadSubmissions() scans
        // multiple Firestore collection shapes plus the score index.
        const [nextDashboard, nextStudents] = await Promise.all([
          getCompatibleClassDashboard(selectedClassId),
          listStudentsByClass(selectedClassId, { className }),
        ]);
        if (!active) return;

        setDashboard(nextDashboard);
        setStudents(nextStudents);
        setLoadingLesson(false);

        // Yield once so the core lesson view can paint before the heavier
        // readiness/attendance work begins.
        await new Promise((resolve) => window.setTimeout(resolve, 0));
        if (!active) return;

        const [submissionsResult, attendanceResult] = await Promise.allSettled([
          loadSubmissions({ includeMarked: true }),
          loadClassAttendanceAnalytics({
            classId: selectedClassId,
            className: classNameOf(nextDashboard.klass || classRecord),
            sessions: nextDashboard.sessions,
            students: nextStudents,
            klass: nextDashboard.klass,
          }),
        ]);
        if (!active) return;

        setSubmissions(submissionsResult.status === "fulfilled" ? submissionsResult.value : []);
        setAttendanceAnalytics(
          attendanceResult.status === "fulfilled"
            ? attendanceResult.value?.analytics || null
            : null,
        );
      } catch (loadError) {
        if (!active) return;
        setDashboard(null);
        setStudents([]);
        setSubmissions([]);
        setAttendanceAnalytics(null);
        setError(loadError?.message || "Could not load this class lesson dashboard.");
      } finally {
        if (active) setLoadingLesson(false);
      }
    })();

    return () => { active = false; };
  }, [classes, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((row) => row.id === selectedClassId) || dashboard?.klass || null,
    [classes, dashboard?.klass, selectedClassId],
  );
  const session = useMemo(() => selectTeacherLessonSession(dashboard || {}), [dashboard]);
  const slide = useMemo(() => resolveTeacherLessonSlide({ dashboard: dashboard || {}, session }), [dashboard, session]);
  const previousSlide = useMemo(() => previousTeacherLesson(slide), [slide]);
  const foundation = useMemo(() => getPresenterTopicFoundation(slide || {}), [slide]);
  const parity = useMemo(() => getCurriculumParityReference(slide || {}), [slide]);
  const roster = useMemo(
    () => buildTeacherRosterReadiness({
      students,
      submissions,
      currentSlide: slide,
      previousSlide,
      attendanceAnalytics,
    }),
    [attendanceAnalytics, previousSlide, slide, students, submissions],
  );
  const readiness = useMemo(() => summarizeTeacherReadiness(roster), [roster]);

  const course = normalize(slide?.course).toUpperCase();
  const day = lessonDay(slide);
  const slideUrl = slide ? `/teaching-slides/course/${encodeURIComponent(course)}/${encodeURIComponent(slide.id)}` : "";
  const presentUrl = slideUrl ? `${slideUrl}?present=1` : "";
  const studentUrl = learnerLessonUrl(slide);
  const timezone = dashboard?.klass?.timezone || "Africa/Accra";
  const grammarTarget = grammarTargetForSlide(slide);
  const writingFocus = writingFocusForSlide(slide);
  const speakingQuestions = Array.isArray(slide?.studentQuestionsDe) ? slide.studentQuestionsDe.slice(0, 5) : [];
  const warmupQuestions = Array.isArray(slide?.warmupQuestionsDe) ? slide.warmupQuestionsDe : [];

  const chooseClass = (event) => {
    const value = event.target.value;
    setSelectedClassId(value);
    setSearchParams(value ? { classId: value } : {}, { replace: true });
  };

  return (
    <div className="teacher-command-shell">
      <header className="teacher-command-header">
        <div>
          <p className="teacher-command-eyebrow">Falowen Admin · Teacher command center</p>
          <h1>Teacher Lesson Dashboard</h1>
          <p>Prepare the exact learner lesson, check class readiness, then launch Presenter Mode with the same curriculum identity.</p>
        </div>
        <label className="teacher-command-class-select">
          <span>Class</span>
          <select value={selectedClassId} onChange={chooseClass} disabled={loadingClasses}>
            {!classes.length ? <option value="">No classes available</option> : null}
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {classNameOf(klass)}{classLevel(klass) ? ` · ${classLevel(klass)}` : ""}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error ? <div className="teacher-command-error">{error}</div> : null}
      {loadingLesson ? <p className="teacher-command-loading">Loading lesson, roster, submissions and attendance…</p> : null}

      {!loadingLesson && selectedClassId && !slide ? (
        <section className="teacher-command-empty">
          <h2>No teaching lesson could be resolved</h2>
          <p>The selected class has no current/next session mapped to a teaching slide. Open Live Classes to repair the session curriculum mapping.</p>
          <Link to="/live-classes">Open Live Classes</Link>
        </section>
      ) : null}

      {slide ? (
        <>
          <section className="teacher-command-hero">
            <div className="teacher-command-lesson">
              <div className="teacher-command-badges">
                <span>{course} Day {day}</span>
                <span>{session?.status || "scheduled"}</span>
                {parity ? <span className={parity.status === "aligned" ? "is-aligned" : "is-warning"}>{parity.statusLabel}</span> : null}
              </div>
              <h2>{slide.title}</h2>
              <p>{slide.objective}</p>
              <dl>
                <div><dt>Class</dt><dd>{classNameOf(dashboard?.klass || selectedClass)}</dd></div>
                <div><dt>Session</dt><dd>{formatDateTime(session?.startsAt, timezone)}</dd></div>
                <div><dt>Students</dt><dd>{students.length}</dd></div>
                <div><dt>Assignment</dt><dd>{slide.assignmentId}</dd></div>
              </dl>
            </div>

            <div className="teacher-command-actions">
              <Link className={quickLinkClass(Boolean(slideUrl))} to={slideUrl || "#"}>Open slides</Link>
              <Link className={quickLinkClass(Boolean(presentUrl))} to={presentUrl || "#"}>Start class</Link>
              <a className="teacher-command-link" href={studentUrl} target="_blank" rel="noreferrer">Open student lesson</a>
              <Link className="teacher-command-link secondary" to={`/attendance/session/${encodeURIComponent(selectedClassId)}`}>Attendance</Link>
              <Link className="teacher-command-link secondary" to={`/attendance?tab=tracker&classId=${encodeURIComponent(selectedClassId)}`}>Email health</Link>
              <Link className="teacher-command-link secondary" to={`/class-participation?classId=${encodeURIComponent(selectedClassId)}`}>Participation</Link>
              <Link className="teacher-command-link secondary" to="/live-classes">Live Classes</Link>
            </div>
          </section>

          <section className="teacher-command-summary-grid">
            <article>
              <span>Previous lesson ready</span>
              <strong>{readiness.previousReady}/{readiness.total}</strong>
              <p>{previousSlide ? previousSlide.title : "First lesson in this level"}</p>
            </article>
            <article>
              <span>Current work started</span>
              <strong>{readiness.currentStarted}/{readiness.total}</strong>
              <p>Students with a submission already linked to this lesson.</p>
            </article>
            <article className={readiness.needsAttention ? "is-warning" : ""}>
              <span>Needs attention</span>
              <strong>{readiness.needsAttention}</strong>
              <p>Previous work missing, score below 60%, or 2+ consecutive absences.</p>
            </article>
            <article>
              <span>Warm-up</span>
              <strong>{warmupQuestions.length} questions</strong>
              <p>Presenter includes preparation/timing and Fair Pick controls.</p>
            </article>
          </section>

          <section className="teacher-command-content-grid">
            <article className="teacher-command-panel">
              <div className="teacher-command-panel-heading">
                <span>Before grammar</span>
                <h2>{foundation?.kicker || "Lesson context"}</h2>
              </div>
              <h3>{foundation?.title || slide.title}</h3>
              <p>{foundation?.intro || slide.objective}</p>
              {foundation?.example ? <div className="teacher-command-callout"><strong>{foundation.exampleLabel || "Example"}</strong><p>{foundation.example}</p></div> : null}
              {foundation?.tension ? <div className="teacher-command-callout"><strong>{foundation.tensionLabel || "Tension"}</strong><p>{foundation.tension}</p></div> : null}
              {foundation?.question ? <div className="teacher-command-callout is-question"><strong>{foundation.questionLabel || "Question"}</strong><p>{foundation.question}</p></div> : null}
            </article>

            <article className="teacher-command-panel">
              <div className="teacher-command-panel-heading">
                <span>Language target</span>
                <h2>Grammar</h2>
              </div>
              <p className="teacher-command-primary-text">{grammarTarget || "Open the lesson slides to review the detailed grammar target."}</p>
              <div className="teacher-command-subsection">
                <h3>Writing task</h3>
                <p>{writingFocus || "The Course Book Bridge in Presenter Mode points students to the lesson writing task."}</p>
              </div>
            </article>

            <article className="teacher-command-panel teacher-command-speaking">
              <div className="teacher-command-panel-heading">
                <span>Live class</span>
                <h2>Speaking focus</h2>
              </div>
              {speakingQuestions.length ? (
                <ol>
                  {speakingQuestions.map((question) => <li key={question}>{question}</li>)}
                </ol>
              ) : <p>No separate speaking prompts are attached to this lesson.</p>}
            </article>

            <article className="teacher-command-panel">
              <div className="teacher-command-panel-heading">
                <span>Classroom controls</span>
                <h2>Ready in Presenter</h2>
              </div>
              <ul className="teacher-command-control-list">
                <li><strong>Warm-up:</strong> {warmupQuestions.length || 0} lesson questions with teacher-controlled pacing.</li>
                <li><strong>Fair Pick:</strong> random student rotation uses the selected class roster and avoids repeats within a round.</li>
                <li><strong>Next question:</strong> change the question for the same student without marking an answer.</li>
                <li><strong>Participation:</strong> Correct / Needs help / Skip / Presenter absent sync to the lesson session.</li>
                <li><strong>After class:</strong> Course Book Bridge returns students to Grammar → Speak → Write → Workbook/Submit.</li>
              </ul>
              <Link className="teacher-command-inline-action" to={presentUrl}>Start Presenter Mode →</Link>
            </article>
          </section>

          <section className="teacher-command-panel teacher-command-roster">
            <div className="teacher-command-roster-heading">
              <div>
                <span>Class readiness</span>
                <h2>{students.length} students</h2>
              </div>
              <p>Readiness uses class roster, learner submissions/scores and attendance history. It does not change grades or attendance.</p>
            </div>

            <div className="teacher-command-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Previous lesson</th>
                    <th>Current lesson</th>
                    <th>Latest score</th>
                    <th>Attendance</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((row) => {
                    const tone = readinessTone(row);
                    return (
                      <tr key={row.studentCode || row.name}>
                        <td><strong>{row.name}</strong><small>{row.studentCode || normalize(row.student.email)}</small></td>
                        <td>{row.previousComplete ? "Ready" : "Missing"}</td>
                        <td>{row.currentStarted ? "Started" : "Not started"}</td>
                        <td>{scoreLabel(row.latestScore)}{row.latestAssignment ? <small>{row.latestAssignment}</small> : null}</td>
                        <td>{row.attendancePercent == null ? "—" : `${Math.round(row.attendancePercent)}%`}{row.consecutiveAbsences ? <small>{row.consecutiveAbsences} consecutive absence(s)</small> : null}</td>
                        <td><span className={`teacher-readiness-badge is-${tone}`}>{tone === "attention" ? "Check" : tone === "started" ? "Started" : "Ready"}</span></td>
                      </tr>
                    );
                  })}
                  {!roster.length ? <tr><td colSpan="6">No active students were matched to this class.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
