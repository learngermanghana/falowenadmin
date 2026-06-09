import { useState } from "react";
import MarkingPage from "./MarkingPage.jsx";
import MarkingQuickPage from "./MarkingQuickPage.jsx";
import AIMarkingAuditPage from "./AIMarkingAuditPage.jsx";
import AnswerKeySyncPage from "./AnswerKeySyncPage.jsx";

const tabs = [
  { id: "quick", label: "Quick Marking", helper: "Recommended: pick work, mark with AI, save final score, notify student." },
  { id: "work", label: "Full Marking", helper: "Older detailed workspace for manual review and advanced checks." },
  { id: "ai-audit", label: "AI Audit", helper: "Review AI marking records and saved audit details." },
  { id: "answer-keys", label: "Answer Keys", helper: "Sync and check reference answer keys." },
];

export default function MarkingHubPage() {
  const [activeTab, setActiveTab] = useState("quick");
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Marking</h2>
          <p style={{ margin: "4px 0 0", opacity: 0.75 }}>
            Start with Quick Marking for the normal workflow. Use the other tabs only when you need deeper checks.
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

      {activeTab === "quick" ? <MarkingQuickPage /> : null}
      {activeTab === "work" ? <MarkingPage /> : null}
      {activeTab === "ai-audit" ? <AIMarkingAuditPage /> : null}
      {activeTab === "answer-keys" ? <AnswerKeySyncPage /> : null}
    </div>
  );
}
