import StudentLeadsPanel from "../components/StudentLeadsPanel.jsx";

export default function LeadsPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          background: "#fff",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Leads</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b" }}>
            Manage prospective students, follow-ups, brochure sharing, payment-link preparation, and conversion to students.
          </p>
        </div>
      </section>

      <StudentLeadsPanel />
    </div>
  );
}
