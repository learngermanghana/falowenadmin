import { useState } from "react";
import MarkingPage from "./MarkingPage.jsx";
import AIMarkingAuditPage from "./AIMarkingAuditPage.jsx";
import AnswerKeySyncPage from "./AnswerKeySyncPage.jsx";
import StudentResultsComparePage from "./StudentResultsComparePage.jsx";

const tabs = [
  { id: "work", label: "Marking", helper: "Use the original detailed marking workspace for manual review, AI support, final score saving, and student feedback." },
  { id: "ai-audit", label: "AI Audit", helper: "Review AI marking records and saved audit details before syncing them." },
  { id: "answer-keys", label: "Answer Keys", helper: "Sync and check reference answer keys." },
  { id: "student-results", label: "Student Results", helper: "Compare a selected student’s Firestore results against the score sheet and override the sheet from Firestore." },
];

export default function MarkingHubPage() {
  const [activeTab, setActiveTab] = useState("work");
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Marking</h2>
          <p style={{ margin: "4px 0 0", opacity: 0.75 }}>
            The marking page now opens the original full marking workspace first. Quick Marking has been removed from this hub.
          </p>
        </div>

        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: activeTab === tab.id ? 800 : 600,
                background: activeTab === tab.id ? "#eff6ff" : "#fff",
                color: activeTab === tab.id ? "#1d4ed8" : "#111827",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>{activeTabMeta.helper}</p>
      </section>

      {activeTab === "work" ? <MarkingPage /> : null}
      {activeTab === "ai-audit" ? <AIMarkingAuditPage /> : null}
      {activeTab === "answer-keys" ? <AnswerKeySyncPage /> : null}
      {activeTab === "student-results" ? <StudentResultsComparePage /> : null}
    </div>
  );
}
