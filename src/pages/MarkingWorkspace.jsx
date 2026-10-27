import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/marking", label: "Mark Work", exact: true },
  { to: "/marking/ai-audit", label: "AI Audit" },
  { to: "/marking/answer-keys", label: "Answer Keys" },
];

export default function MarkingWorkspace({ children }) {
  const location = useLocation();

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Marking</h2>
          <p style={{ margin: "4px 0 0", opacity: 0.75 }}>
            Mark class work, audit AI results, and sync answer keys from one place.
          </p>
        </div>

        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const active = tab.exact ? location.pathname === tab.to : location.pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 999,
                  padding: "8px 12px",
                  textDecoration: "none",
                  fontWeight: active ? 700 : 500,
                  background: active ? "#eff6ff" : "#fff",
                  color: "#111827",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </section>

      {children}
    </div>
  );
}
