import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { resolveClassCohort } from "../services/liveClassService.js";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import CanonicalAttendancePageV3 from "./CanonicalAttendancePageV3.jsx";

function CancelledSessionNotice() {
  const { classId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const requestedSessionId = searchParams.get("session") || "";
  const [session, setSession] = useState(null);

  useEffect(() => {
    let active = true;
    if (!classId || !requestedSessionId) {
      setSession(null);
      return () => { active = false; };
    }

    (async () => {
      try {
        const resolved = await resolveClassCohort(decodeURIComponent(classId));
        if (!resolved) return;
        const dashboard = await getCompatibleClassDashboard(resolved.id);
        if (!active) return;
        setSession(dashboard.sessions.find((item) => item.id === requestedSessionId) || null);
      } catch {
        if (active) setSession(null);
      }
    })();

    return () => { active = false; };
  }, [classId, requestedSessionId]);

  const status = String(session?.status || "").toLowerCase();
  const cancelled = status === "cancelled";
  const reason = String(session?.cancellationReason || "").trim();
  const liveClassesUrl = useMemo(() => "/live-classes", []);

  if (!cancelled) return null;

  return (
    <div role="alert" style={{ maxWidth: 1000, margin: "0 auto 14px", padding: 14, borderRadius: 10, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b" }}>
      <strong>This lesson was cancelled in Live Classes.</strong>
      <p style={{ margin: "6px 0" }}>QR check-in is locked and the cancelled status is shared with the class schedule and student communication records.</p>
      {reason ? <p style={{ margin: "6px 0" }}>Reason: {reason}</p> : null}
      <Link to={liveClassesUrl}>Open Change session to move and reactivate it</Link>
    </div>
  );
}

export default function CanonicalAttendancePage() {
  return (
    <>
      <CancelledSessionNotice />
      <CanonicalAttendancePageV3 />
    </>
  );
}
