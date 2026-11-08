import { Link } from "react-router-dom";
import DashboardReviewNotifications from "./DashboardReviewNotifications.jsx";
import DashboardPartnershipRequests from "./DashboardPartnershipRequests.jsx";
import { failedClassCommunications } from "../utils/liveClassWorkspace.js";

export default function AdminActionInbox({ user, classes = [] }) {
  const failures = failedClassCommunications(classes);
  return <section aria-label="Actions needing attention">
    <h2>Needs attention</h2>
    <article className="analytics-panel">
      <div className="panel-header"><h3>Class email delivery</h3><Link to="/communication">Communication settings</Link></div>
      {failures.length ? <ul className="mini-list">{failures.map(item => <li key={item.id}><span><strong>{item.className} · {item.label}</strong><small>{item.detail || "Last delivery failed. Open the class to review its status."}</small></span><Link to={`/live-classes?classId=${encodeURIComponent(item.classId)}&tab=communication`}>Review delivery</Link></li>)}</ul> : <p>No failed class emails reported in the loaded class records.</p>}
      <small>Uses the dashboard's existing class snapshot. Open a class for current delivery details.</small>
    </article>
    <DashboardReviewNotifications user={user} />
    <DashboardPartnershipRequests user={user} />
  </section>;
}
