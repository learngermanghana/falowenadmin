import { useState } from "react";
import AttendanceConfirmationAutomationPanel from "../components/AttendanceConfirmationAutomationPanel.jsx";
import AttendanceFailedDeliveryRetryPanel from "../components/AttendanceFailedDeliveryRetryPanel.jsx";
import CommunicationPage from "./CommunicationPage.jsx";

function tabStyle(active) {
  return {
    border: active ? "1px solid #2457ff" : "1px solid #cbd5e1",
    background: active ? "#2457ff" : "#fff",
    color: active ? "#fff" : "#1e293b",
    borderRadius: 999,
    padding: "9px 14px",
    fontWeight: 700,
  };
}

export default function CommunicationHubPage() {
  const [activeTab, setActiveTab] = useState("broadcasts");

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <nav style={{ padding: "16px 16px 0", display: "flex", gap: 8, flexWrap: "wrap" }} aria-label="Communication sections">
        <button type="button" style={tabStyle(activeTab === "broadcasts")} onClick={() => setActiveTab("broadcasts")}>
          Broadcasts
        </button>
        <button type="button" style={tabStyle(activeTab === "attendance")} onClick={() => setActiveTab("attendance")}>
          Attendance confirmation emails
        </button>
      </nav>

      {activeTab === "broadcasts" ? <CommunicationPage /> : null}
      {activeTab === "attendance" ? (
        <div style={{ padding: "0 16px 16px", maxWidth: 1000, display: "grid", gap: 14 }}>
          <AttendanceConfirmationAutomationPanel />
          <AttendanceFailedDeliveryRetryPanel />
        </div>
      ) : null}
    </div>
  );
}
