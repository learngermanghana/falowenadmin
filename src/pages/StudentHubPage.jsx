import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StudentDirectoryPage from "./StudentDirectoryPage";
import StudentActivityPage from "./StudentActivityPage";

const TAB_STYLES = {
  base: {
    borderRadius: 999,
    padding: "9px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  active: {
    border: "1px solid #2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  inactive: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#334155",
  },
};

function normalizeTab(value) {
  return value === "activity" ? "activity" : "students";
}

export default function StudentHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = normalizeTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(queryTab);

  useEffect(() => {
    setActiveTab(queryTab);
  }, [queryTab]);

  const selectTab = (tab) => {
    const nextTab = normalizeTab(tab);
    setActiveTab(nextTab);
    if (nextTab === "activity") {
      setSearchParams({ tab: "activity" });
    } else {
      setSearchParams({});
    }
  };

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
            Manage student records and review student activity from one place.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="tablist" aria-label="Student sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "students"}
            onClick={() => selectTab("students")}
            style={{
              ...TAB_STYLES.base,
              ...(activeTab === "students" ? TAB_STYLES.active : TAB_STYLES.inactive),
            }}
          >
            Students
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "activity"}
            onClick={() => selectTab("activity")}
            style={{
              ...TAB_STYLES.base,
              ...(activeTab === "activity" ? TAB_STYLES.active : TAB_STYLES.inactive),
            }}
          >
            Student Activity
          </button>
        </div>
      </section>

      {activeTab === "activity" ? <StudentActivityPage /> : <StudentDirectoryPage />}
    </div>
  );
}
