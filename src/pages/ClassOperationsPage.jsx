import { Link } from "react-router-dom";

const operations = [
  {
    title: "Orientation Setup",
    description: "Manage orientation materials and onboarding activities.",
    to: "/orientation",
  },
  {
    title: "Class Schedule Setup",
    description: "Configure class schedules and sync settings.",
    to: "/class-schedule-setup",
  },
  {
    title: "Attendance",
    description: "Track attendance and review class participation.",
    to: "/attendance",
  },
  {
    title: "Course Schedule",
    description: "Build course schedules and export student-facing timetable plans.",
    to: "/course-schedule",
  },
  {
    title: "Live Class Scheduling",
    description: "Manage canonical class cohorts, sessions, cancellations, rescheduling, communication and audit history.",
    to: "/live-classes",
  },
  {
    title: "Class Archive",
    description: "Review archived completed classes and reopen them when needed.",
    to: "/class-archive",
  },
  {
    title: "Reminder Logs",
    description: "View and manage WhatsApp reminder history.",
    to: "/whatsapp-reminders",
  },
];

export default function ClassOperationsPage() {
  return (
    <div className="page-container">
      <h1>Class Operations</h1>
      <p>Access all class administration tools from one place.</p>

      <div className="card-grid">
        {operations.map((operation) => (
          <article key={operation.title} className="card">
            <h2>{operation.title}</h2>
            <p>{operation.description}</p>
            <Link to={operation.to}>Open</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
