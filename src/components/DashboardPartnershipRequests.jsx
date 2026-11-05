import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";

export default function DashboardPartnershipRequests({ user }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inFlight = useRef(null);
  const owner = user?.emailVerified && user.email?.trim().toLowerCase() === "moxflex@gmail.com";
  useEffect(() => {
    if (!owner) return;
    let active = true;
    // Reuse the same request during StrictMode's effect replay. No listener,
    // timer, automatic refresh, persistent cache or history-page scan.
    if (inFlight.current?.uid !== user.uid) {
      inFlight.current = { uid: user.uid, promise: organisationEnrolmentRequest("admin/referrals/applications", null, {
        staff: true, getToken: () => user.getIdToken(),
      }) };
    }
    inFlight.current.promise.then(data => { if (active) setResult(data); })
      .catch(e => { if (active) setError(e.message || "Partnership requests could not be loaded."); });
    return () => { active = false; };
  }, [owner, user]);
  if (!owner) return null;
  const pending = (result?.rows || []).filter(row => row.kind === "institutional" && row.status === "pending");
  return <article className="analytics-panel" aria-label="Partnership requests">
    <div className="panel-header"><div><p className="analytics-eyebrow">Partners</p><h2>Partnership requests</h2></div><Link to="/referral-review">Review requests</Link></div>
    {!result && !error && <p role="status">Loading recent requests…</p>}
    {error && <p role="alert">{error} <Link to="/referral-review">Open partnership review</Link></p>}
    {result && <><p>{pending.length} pending partnership request{pending.length === 1 ? "" : "s"} in the latest {result.rows?.length || 0} applications.</p>
      {pending.length ? <ul className="mini-list">{pending.slice(0, 5).map(row => <li key={row.id}><span><strong>{row.name || "Organisation"}</strong><small>{row.signedAt ? "Signed agreement · awaiting approval" : "Awaiting review"}</small></span><Link to="/referral-review">Review</Link></li>)}</ul> : <p className="empty-state">No pending partnerships in this recent batch.</p>}
      {(result.cursor || pending.length > 5) && <p><Link to="/referral-review">View more applications and older requests</Link></p>}
      <p><small>One load when you open this page. Shows up to 5 requests from the latest 40 applications; this is not a total across all history.</small></p></>}
  </article>;
}
