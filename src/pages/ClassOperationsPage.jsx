import { Link } from "react-router-dom";

export default function ClassOperationsPage() {
  return (
    <div className="page-container">
      <h1>Class Operations</h1>
      <p>Manage orientation setup for new students.</p>

      <div className="card-grid">
        <article className="card">
          <h2>Orientation Setup</h2>
          <p>Manage orientation materials and onboarding activities.</p>
          <Link to="/orientation">Open</Link>
        </article>
      </div>
    </div>
  );
}
