import { STAFF_PAGES, staffHomePath } from "./utils/staffPageAccess.js";
import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import "./App.css";
import "./LiveClassesMobile.css";

const PaystackPage = lazy(() => import("./pages/PaystackPage.jsx"));
const TeacherApplicationsPage = lazy(() => import("./pages/TeacherApplicationsPage.jsx"));
const AppointmentAdminPage = lazy(() => import("./pages/AppointmentAdminPage.jsx"));
const AppointmentBookingPage = lazy(() => import("./pages/AppointmentBookingPage.jsx"));
const PartnershipPage = lazy(() => import("./pages/PartnershipPage.jsx"));
const ReferralReviewPage = lazy(() => import("./pages/ReferralReviewPage.jsx"));
const OrganisationEnrolmentPage = lazy(() => import("./pages/OrganisationEnrolmentPage.jsx"));
const PartnerDetailPage = lazy(() => import("./pages/PartnerDetailPage.jsx"));
const ADMIN_BUILD_SHA = String(import.meta.env.VITE_FALOWEN_BUILD_SHA || "dev");
const ADMIN_BUILD_ENV = String(import.meta.env.VITE_FALOWEN_BUILD_ENV || "local");
const ADMIN_BUILD_LABEL = ADMIN_BUILD_SHA === "dev" ? "dev" : ADMIN_BUILD_SHA.slice(0, 8);

const LoginPage = lazy(() => import("./pages/LoginPage"));
const LeadHomepageNotification = lazy(() => import("./components/LeadHomepageNotification.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AssignedTutorAttendancePage = lazy(() => import("./pages/AssignedTutorAttendancePage"));
const AttendanceOverviewPage = lazy(() => import("./pages/AttendanceOverviewPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const CanonicalAttendancePage = lazy(() => import("./pages/CanonicalAttendancePage.jsx"));
const CheckinPage = lazy(() => import("./pages/CheckinPage"));
const ClassPresentationPage = lazy(() => import("./pages/ClassPresentationPage.jsx"));
const CheckinDisplayPage = lazy(() => import("./pages/CheckinDisplayPage"));
const CourseSchedulePage = lazy(() => import("./pages/CourseSchedulePage"));
const PublicCourseSchedulePage = lazy(() => import("./pages/PublicCourseSchedulePage"));
const MarkingHubPage = lazy(() => import("./pages/MarkingHubPage"));
const ExamTutorReviewQueuePage = lazy(() => import("./pages/ExamTutorReviewQueuePage"));
const TutorMarkingSimplePage = lazy(() => import("./pages/TutorMarkingSimplePage.jsx"));
const CommunicationHubPage = lazy(() => import("./pages/CommunicationHubPage.jsx"));
const GrammarIssueReportsPage = lazy(() => import("./pages/GrammarIssueReportsPage"));
const WhatsAppRemindersPage = lazy(() => import("./pages/WhatsAppRemindersPage"));
const TeachingSlidesPage = lazy(() => import("./pages/TeachingSlidesPage"));
const TeacherLessonDashboardPage = lazy(() => import("./pages/TeacherLessonDashboardPage.jsx"));
const ClassParticipationPage = lazy(() => import("./pages/ClassParticipationPage.jsx"));
const StudentHubPage = lazy(() => import("./pages/StudentHubPage.jsx"));
const LeadsPage = lazy(() => import("./pages/LeadsPage.jsx"));
const SocialMediaPage = lazy(() => import("./pages/SocialMediaPage.jsx"));
const MusicStudioPage = lazy(() => import("./pages/MusicStudioPage.jsx"));
const LessonVideoStudioPage = lazy(() => import("./pages/LessonVideoStudioPage.jsx"));
const MusicAnalyticsPage = lazy(() => import("./pages/MusicAnalyticsPage.jsx"));
const HoerenStudioPage = lazy(() => import("./pages/HoerenStudioPage.jsx"));
const WritingSubmissionTrackerPage = lazy(() => import("./pages/WritingSubmissionTrackerPage"));
const TimedAssignmentAttemptsPage = lazy(() => import("./pages/TimedAssignmentAttemptsPage.jsx"));
const ExamTrackingPage = lazy(() => import("./pages/ExamTrackingPage.jsx"));
const SpeakingPracticeReviewPage = lazy(() => import("./pages/SpeakingPracticeReviewPage.jsx"));
const OrientationPage = lazy(() => import("./pages/OrientationSetupTabsPage.jsx"));
const ClassScheduleSetupPage = lazy(() => import("./pages/ClassScheduleSetupPage"));
const ClassOperationsPage = lazy(() => import("./pages/ClassOperationsPage"));
const ClassArchivePage = lazy(() => import("./pages/ClassArchivePage"));
const LiveClassesPage = lazy(() => import("./pages/LiveClassesPage"));
const HolidayCalendarPage = lazy(() => import("./pages/HolidayCalendarPage"));
const GoetheExamConfigPage = lazy(() => import("./pages/GoetheExamConfigPage.jsx"));
const StudentResultsComparePage = lazy(() => import("./pages/StudentResultsComparePage.jsx"));
const StaffRecordsPage = lazy(() => import("./pages/StaffRecordsPage.jsx"));
const StaffWorkspacePage = lazy(() => import("./pages/StaffWorkspacePage.jsx"));
const SharedLanguageDictionaryPage = lazy(() => import("./pages/SharedLanguageDictionaryPage.jsx"));
const UniversityInvitationsPage = lazy(() => import("./pages/UniversityInvitationsPage.jsx"));

function RouteFallback() {
  return <div className="route-loading" role="status" aria-live="polite">Loading…</div>;
}

function TopBar() {
  const { user, logout, isStaff, role, staffPages, staffLanguages } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onEscape = (event) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [menuOpen]);
  const [deploymentStatus, setDeploymentStatus] = useState(null);

  const [checkingDeployment, setCheckingDeployment] = useState(false);
  const [deploymentCheckError, setDeploymentCheckError] = useState("");
  // A version badge is static build metadata; a network freshness check is
  // useful only when an administrator explicitly requests it.
  async function refreshDeploymentStatus() {
    if (checkingDeployment || !user || role !== "admin") return;
    setCheckingDeployment(true);
    setDeploymentCheckError("");
    try {
      const response = await fetch("/api/deployment-status", {
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("Version check unavailable.");
      setDeploymentStatus(await response.json());
    } catch (error) {
      setDeploymentCheckError(error.message || "Version check unavailable.");
    } finally {
      setCheckingDeployment(false);
    }
  }

  if (!user || !role || location.pathname === "/checkin/display") return null;

  return (
    <header className={location.pathname==="/students"?"topbar topbar-students":"topbar"}>
      <div className="topbar-inner">
        <div className="topbar-main-row">
          <button
            type="button"
            className="topbar-menu-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="topbar-navigation"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <Link to={isStaff ? staffHomePath(staffPages, staffLanguages) : "/"} className="topbar-brand" onClick={() => setMenuOpen(false)}>
            Falowen Dashboard
          </Link>
          <button type="button" onClick={refreshDeploymentStatus} disabled={checkingDeployment || role !== "admin"}
            className="topbar-build-badge"
            title={`Falowen Admin build ${ADMIN_BUILD_SHA} · ${ADMIN_BUILD_ENV} · Click to check deployment`}
            aria-label={`Falowen Admin build ${ADMIN_BUILD_LABEL}`}
          >
            Admin · {ADMIN_BUILD_LABEL}{checkingDeployment ? " · Checking…" : ""}
          </button>
          {deploymentCheckError && role === "admin" ? <span role="status">{deploymentCheckError}</span> : null}
          {deploymentStatus?.status === "current" && role === "admin" ? <span role="status">Production up to date</span> : null}
          {deploymentStatus?.status === "behind" || deploymentStatus?.status === "diverged" ? (
            <span
              className="topbar-deployment-warning"
              title={`${deploymentStatus.message || "Production is behind main."} Deployed: ${String(deploymentStatus.deployedSha || "").slice(0, 8)} · Main: ${String(deploymentStatus.mainSha || "").slice(0, 8)}`}
              role="status"
              aria-live="polite"
            >
              {Number.isFinite(Number(deploymentStatus.behindBy)) && Number(deploymentStatus.behindBy) > 0
                ? `Production ${deploymentStatus.behindBy} commit${Number(deploymentStatus.behindBy) === 1 ? "" : "s"} behind`
                : "Production behind main"}
            </span>
          ) : null}

          <div id="topbar-navigation" className={`topbar-links ${menuOpen ? "topbar-links-open" : ""}`}>
            {isStaff ? (
              STAFF_PAGES.filter(page => staffPages.includes(page.id)).map(page =>
                <Link key={page.id} to={page.path} onClick={() => setMenuOpen(false)}>{page.label}</Link>
              )
            ) : (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/students" onClick={() => setMenuOpen(false)}>Students</Link>
                <Link to="/partners" onClick={() => setMenuOpen(false)}>Partnerships</Link>
                <Link to="/staff" onClick={() => setMenuOpen(false)}>Staff Workspace</Link>
                <Link to="/shared-dictionary" onClick={() => setMenuOpen(false)}>Shared Notes</Link>
                {role === "admin" && <Link to="/invitations" onClick={() => setMenuOpen(false)}>Invitations</Link>}
                <Link to="/leads" onClick={() => setMenuOpen(false)}>Leads</Link>
                <Link to="/exam-file" onClick={() => setMenuOpen(false)}>Goethe Exam File</Link>
                <Link to="/live-classes" onClick={() => setMenuOpen(false)}>Live Classes</Link>
                <Link to="/social-media" onClick={() => setMenuOpen(false)}>Social Media</Link>
                {String(import.meta.env.VITE_HOEREN_STUDIO_OWNER_UID || "").trim() === user.uid ? <><Link to="/ai-studio" onClick={() => setMenuOpen(false)}>AI Hören Studio</Link><Link to="/music-studio" onClick={() => setMenuOpen(false)}>Falowen Music Studio</Link><Link to="/music-analytics" onClick={() => setMenuOpen(false)}>Music Analytics</Link></> : null}
                <Link to="/attendance" onClick={() => setMenuOpen(false)}>Attendance</Link>
                <Link to="/timed-attempts" onClick={() => setMenuOpen(false)}>Mock Monitoring & Timers</Link>
                <Link to="/exam-tracking" onClick={() => setMenuOpen(false)}>Exam Tracking</Link>
                <Link to="/class-operations" onClick={() => setMenuOpen(false)}>Class Operations</Link>
                <Link to="/marking" onClick={() => setMenuOpen(false)}>Marking</Link>
                <Link to="/student-results" onClick={() => setMenuOpen(false)}>Results</Link>
                <Link to="/communication" onClick={() => setMenuOpen(false)}>Communication</Link>
                <Link to="/teaching-slides" onClick={() => setMenuOpen(false)}>Slides</Link>
                <Link to="/holiday-calendar" onClick={() => setMenuOpen(false)}>Holidays</Link>
                <Link to="/appointments" onClick={() => setMenuOpen(false)}>Appointments</Link>
                {role === "admin" && <Link to="/teacher-applications" onClick={() => setMenuOpen(false)}>Teacher applications</Link>}
              </>
            )}
          </div>

          <div className={`topbar-user ${menuOpen ? "topbar-user-open" : ""}`}>
            <span className="topbar-email">{user.email}</span>
            <button
              onClick={async () => {
                setMenuOpen(false);
                await logout();
                nav("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ToastViewport() {
  const { toasts, dismissToast } = useToast();
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-item-${toast.type}`}>
          <span>{toast.message}</span>
          <button className="toast-dismiss" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">×</button>
        </div>
      ))}
    </div>
  );
}

function MarkingRoute() {
  return <ProtectedRoute><MarkingHubPage /></ProtectedRoute>;
}

function OwnerMusicAnalyticsRoute() {
  const { user, loading, isStaff, staffPages } = useAuth();
  const ownerUid = String(import.meta.env.VITE_HOEREN_STUDIO_OWNER_UID || "").trim();
  if (!loading && user && (isStaff ? !staffPages.includes("music-analytics") : (!ownerUid || user.uid !== ownerUid))) return <Navigate to="/" replace />;
  return <ProtectedRoute><MusicAnalyticsPage /></ProtectedRoute>;
}

function OwnerStudioRoute({ lesson = false }) {
  const { user, loading, isStaff } = useAuth();
  const ownerUid = String(import.meta.env.VITE_HOEREN_STUDIO_OWNER_UID || "").trim();
  if (!loading && user && (isStaff || !ownerUid || user.uid !== ownerUid)) return <Navigate to="/" replace />;
  return <ProtectedRoute>{lesson ? <LessonVideoStudioPage /> : <HoerenStudioPage />}</ProtectedRoute>;
}

function MusicStudioRoute() {
  const { user, loading, isStaff, staffLanguages, staffPages } = useAuth();
  const ownerUid = String(import.meta.env.VITE_HOEREN_STUDIO_OWNER_UID || "").trim();
  if (!loading && user && (isStaff ? !staffPages.includes("music-studio") : (!ownerUid || user.uid !== ownerUid))) {
    return <Navigate to={isStaff ? staffHomePath(staffPages, staffLanguages) : "/"} replace />;
  }
  const languages = isStaff ? staffLanguages || [] : ["german", "swahili"];
  return <ProtectedRoute>
    {languages.length ? <MusicStudioPage key={languages.join("+")} languages={languages} /> :
      <section role="alert">Assign a language in Staff Workspace to open Music Studio.</section>}
  </ProtectedRoute>;
}

function ExamReviewRoute() {
  return <ProtectedRoute><ExamTutorReviewQueuePage /></ProtectedRoute>;
}

function AttendanceHome() {
  const { isStaff } = useAuth();
  return isStaff ? <AssignedTutorAttendancePage /> : <AttendanceOverviewPage />;
}

function CurrentAttendanceRoute() {
  return <CanonicalAttendancePage />;
}

function PublicVisitorGuideRedirect() {
  const location = useLocation();

  useEffect(() => {
    window.location.replace(`https://www.falowen.app/visitor-guide${location.search || ""}`);
  }, [location.search]);

  return <div className="route-loading" role="status">Opening the public Falowen school guide…</div>;
}

export default function App() {
  const location = useLocation();
  const isStudentPresentation = location.pathname.startsWith("/class-presentation/");
  const isFullscreenRoute = location.pathname === "/checkin/display" || isStudentPresentation;
  const { role } = useAuth();
  const showLeadNotification = location.pathname === "/" && role === "admin";

  return (
    <>
      {!isStudentPresentation && <TopBar />}
      <ToastViewport />
      {showLeadNotification ? <Suspense fallback={null}><LeadHomepageNotification /></Suspense> : null}

      <main className={isFullscreenRoute ? undefined : "page-shell"} data-route={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          <Route path="/partnerships" element={<PartnershipPage />} />
          <Route path="/paystack" element={<ProtectedRoute><PaystackPage /></ProtectedRoute>} />
          <Route path="/teacher-applications" element={<ProtectedRoute>{role === "admin" ? <TeacherApplicationsPage /> : <Navigate to="/" replace />}</ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><AppointmentAdminPage /></ProtectedRoute>} />
          <Route path="/book-appointment" element={<AppointmentBookingPage />} />
          <Route path="/referral-review" element={<ProtectedRoute><ReferralReviewPage /></ProtectedRoute>} />
          <Route path="/organisation-enrolment" element={<OrganisationEnrolmentPage />} />
          <Route path="/organisation-submissions" element={<ProtectedRoute><OrganisationEnrolmentPage review /></ProtectedRoute>} />
          <Route path="/partners" element={<ProtectedRoute><OrganisationEnrolmentPage review /></ProtectedRoute>} />
          <Route path="/partners/:organisationId" element={<ProtectedRoute><PartnerDetailPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/class-presentation/:id" element={<ClassPresentationPage />} />
          <Route path="/checkin/display" element={<CheckinDisplayPage />} />

          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendanceHome /></ProtectedRoute>} />
          <Route path="/attendance/session/:classId" element={<ProtectedRoute><CurrentAttendanceRoute /></ProtectedRoute>} />
          <Route path="/attendance/:classId" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
          <Route path="/class-participation" element={<ProtectedRoute><ClassParticipationPage /></ProtectedRoute>} />
          <Route path="/course-schedule" element={<ProtectedRoute><CourseSchedulePage /></ProtectedRoute>} />
          <Route path="/course-schedule/public" element={<PublicCourseSchedulePage />} />
          <Route path="/marking" element={<MarkingRoute />} />
          <Route path="/student-results" element={<ProtectedRoute>{role === "staff" ? <StaffRecordsPage key="results" page="results" /> : <StudentResultsComparePage />}</ProtectedRoute>} />
          <Route path="/marking/ai-audit" element={<Navigate to="/marking" replace />} />
          <Route path="/marking/answer-keys" element={<Navigate to="/marking" replace />} />
          <Route path="/ai-marking-audit" element={<Navigate to="/marking" replace />} />
          <Route path="/answer-key-sync" element={<Navigate to="/marking" replace />} />
          <Route path="/marking/exam-review" element={<Navigate to="/examTutorReviewQueue" replace />} />
          <Route path="/marking/exam-review/:reviewId" element={<Navigate to={`/examTutorReviewQueue/${location.pathname.split('/').pop()}`} replace />} />
          <Route path="/examTutorReviewQueue" element={<ExamReviewRoute />} />
          <Route path="/examTutorReviewQueue/:reviewId" element={<ExamReviewRoute />} />
          <Route path="/tutor-marking" element={<Navigate to="/campus/tutor-marking" replace />} />
          <Route path="/campus/tutor-marking" element={<ProtectedRoute><TutorMarkingSimplePage /></ProtectedRoute>} />
          <Route path="/grammar-issues" element={<ProtectedRoute><GrammarIssueReportsPage /></ProtectedRoute>} />
          <Route path="/communication" element={<ProtectedRoute><CommunicationHubPage /></ProtectedRoute>} />
          <Route path="/exam-file" element={<ProtectedRoute><GoetheExamConfigPage /></ProtectedRoute>} />
          <Route path="/whatsapp-reminders" element={<ProtectedRoute><WhatsAppRemindersPage /></ProtectedRoute>} />
          <Route path="/teaching-slides" element={<ProtectedRoute><TeachingSlidesPage /></ProtectedRoute>} />
          <Route path="/orientation" element={<ProtectedRoute><OrientationPage /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute>{role === "staff" ? <StaffRecordsPage key="students" page="students" /> : <StudentHubPage />}</ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><StaffWorkspacePage /></ProtectedRoute>} />
          <Route path="/shared-dictionary" element={<ProtectedRoute><SharedLanguageDictionaryPage /></ProtectedRoute>} />
          <Route path="/invitations" element={<ProtectedRoute><UniversityInvitationsPage /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
          <Route path="/student-activity" element={<ProtectedRoute><Navigate to="/students" replace /></ProtectedRoute>} />
          <Route path="/social-media" element={<ProtectedRoute><SocialMediaPage /></ProtectedRoute>} />
          <Route path="/ai-studio" element={<OwnerStudioRoute />} />
          <Route path="/music-studio" element={<MusicStudioRoute />} />
          <Route path="/lesson-video-studio" element={<OwnerStudioRoute lesson />} />
          <Route path="/music-analytics" element={<OwnerMusicAnalyticsRoute />} />
          <Route path="/visitor-guide" element={<PublicVisitorGuideRedirect />} />
          <Route path="/visitor-guide/edit" element={<PublicVisitorGuideRedirect />} />
          <Route path="/writing-submissions" element={<ProtectedRoute><WritingSubmissionTrackerPage /></ProtectedRoute>} />
          <Route path="/writing-submissions/:submissionId" element={<ProtectedRoute><WritingSubmissionTrackerPage /></ProtectedRoute>} />
          <Route path="/timed-attempts" element={<ProtectedRoute><TimedAssignmentAttemptsPage /></ProtectedRoute>} />
          <Route path="/exam-tracking" element={<ProtectedRoute><ExamTrackingPage /></ProtectedRoute>} />
          <Route path="/speaking-review" element={<ProtectedRoute><SpeakingPracticeReviewPage /></ProtectedRoute>} />
          <Route path="/quality-check" element={<Navigate to="/" replace />} />
          <Route path="/class-schedule-setup" element={<ProtectedRoute><ClassScheduleSetupPage /></ProtectedRoute>} />
          <Route path="/holiday-calendar" element={<ProtectedRoute><HolidayCalendarPage /></ProtectedRoute>} />
          <Route path="/class-operations" element={<ProtectedRoute><ClassOperationsPage /></ProtectedRoute>} />
          <Route path="/class-archive" element={<ProtectedRoute><ClassArchivePage /></ProtectedRoute>} />
          <Route path="/live-classes" element={<ProtectedRoute><LiveClassesPage /></ProtectedRoute>} />
          <Route path="/lesson-dashboard" element={<ProtectedRoute><TeacherLessonDashboardPage /></ProtectedRoute>} />
          <Route path="/teaching-slides/course/:courseId" element={<ProtectedRoute><TeachingSlidesPage /></ProtectedRoute>} />
          <Route path="/teaching-slides/course/:courseId/:slideId" element={<ProtectedRoute><TeachingSlidesPage /></ProtectedRoute>} />
          <Route path="/teaching-slides/public/:courseId/print" element={<TeachingSlidesPage publicView />} />
          <Route path="/teaching-slides/:legacySlideId" element={<ProtectedRoute><TeachingSlidesPage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
