import { Link } from "react-router-dom";

const ROUTE_GUIDANCE = {
  "live-classes": {
    title: "How Live Classes connects",
    summary: "Schedule changes should be made here first so Attendance can reuse the same session record and Holiday Calendar can explain closures or reschedules.",
    items: [
      { label: "Attendance", to: "/attendance", text: "Open the matching session to mark attendance after reviewing the timetable." },
      { label: "Class Operations", to: "/class-operations", text: "Use as the command center for related class tools." },
      { label: "Holidays", to: "/holiday-calendar", text: "Check school-closed days before moving a lesson." },
    ],
  },
  "class-operations": {
    title: "Connected class workflow",
    summary: "Use these tools together: plan the class, confirm holiday conflicts, run sessions, then record attendance from the same class record.",
    items: [
      { label: "Live Classes", to: "/live-classes", text: "Create or update sessions and curriculum mapping." },
      { label: "Attendance", to: "/attendance", text: "Mark attendance using the generated session dates." },
      { label: "Holidays", to: "/holiday-calendar", text: "Prepare closure notices and holiday messages." },
    ],
  },
  attendance: {
    title: "Attendance sync checklist",
    summary: "Attendance reads dates from Live Classes, while archive status and completed class flow stay visible in Class Operations.",
    items: [
      { label: "Live Classes", to: "/live-classes", text: "Fix session dates or topics at the source before marking." },
      { label: "Class Operations", to: "/class-operations", text: "Archive completed classes or reopen operational tools." },
      { label: "Holidays", to: "/holiday-calendar", text: "Confirm if today is a school-closed day before contacting students." },
    ],
  },
  holidays: {
    title: "Holiday communication flow",
    summary: "Holiday decisions should inform schedule changes and attendance expectations so students receive consistent messages.",
    items: [
      { label: "Live Classes", to: "/live-classes", text: "Reschedule affected sessions after marking a school closure." },
      { label: "Attendance", to: "/attendance", text: "Review classes that may need a no-class or makeup-day note." },
      { label: "Class Operations", to: "/class-operations", text: "Return to the operational hub for follow-up tasks." },
    ],
  },
};

export default function OperationsCommunicationPanel({ context = "class-operations" }) {
  const content = ROUTE_GUIDANCE[context] || ROUTE_GUIDANCE["class-operations"];

  return (
    <aside className="card" style={{ borderColor: "#bfdbfe", background: "#eff6ff", margin: "16px 0" }}>
      <h2 style={{ marginTop: 0 }}>{content.title}</h2>
      <p>{content.summary}</p>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {content.items.map((item) => (
          <div key={item.to} style={{ border: "1px solid #dbeafe", borderRadius: 10, padding: 10, background: "#fff" }}>
            <strong><Link to={item.to}>{item.label}</Link></strong>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>{item.text}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
