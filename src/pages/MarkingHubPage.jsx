import { useState } from "react";
import MarkingPage from "./MarkingPage.jsx";
import AIMarkingAuditPage from "./AIMarkingAuditPage.jsx";
import AnswerKeySyncPage from "./AnswerKeySyncPage.jsx";

const tabs = [
  { id: "work", label: "Mark Work" },
  { id: "ai-audit", label: "AI Audit" },
  { id: "answer-keys", label: "Answer Keys" },
];

export default function MarkingHubPage() {
  const [activeTab, setActiveTab] = useState("work");

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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: activeTab === tab.id ? 700 : 500,
                background: activeTab === tab.id ? "#eff6ff" : "#fff",
                color: "#111827",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      {activeTab === "work" ? <MarkingPage /> : null}
      {activeTab === "ai-audit" ? <AIMarkingAuditPage /> : null}
      {activeTab === "answer-keys" ? <AnswerKeySyncPage /> : null}
    </div>
  );
}
