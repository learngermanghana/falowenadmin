import StudentDirectoryPage from "./StudentDirectoryPage";

export default function StudentHubPage() {
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
          <h1 style={{ margin: 0, fontSize: 22 }}>Students</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b" }}>
            Manage student records, enrolment, classes, payments, account support, and completion tools.
          </p>
        </div>
      </section>

      <StudentDirectoryPage />
    </div>
  );
}
