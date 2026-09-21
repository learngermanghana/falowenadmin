import { useState } from "react";
import AttendanceConfirmationAutomationPanel from "../components/AttendanceConfirmationAutomationPanel.jsx";
import AttendanceFailedDeliveryRetryPanel from "../components/AttendanceFailedDeliveryRetryPanel.jsx";
import CommunicationLiveClassActions from "../components/CommunicationLiveClassActions.jsx";
import IntegrationEventPanel from "../components/IntegrationEventPanel.jsx";
import CommunicationMessagesPage from "./CommunicationMessagesPage.jsx";

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
  const [activeTab, setActiveTab] = useState("messages");
  const [messageMode, setMessageMode] = useState("send");

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <nav style={{ padding: "16px 16px 0", display: "flex", gap: 8, flexWrap: "wrap" }} aria-label="Communication sections">
        <button type="button" style={tabStyle(activeTab === "messages")} onClick={() => setActiveTab("messages")}>
          Messages
        </button>
        <button type="button" style={tabStyle(activeTab === "attendance")} onClick={() => setActiveTab("attendance")}>
          Email Automations
        </button>
        <button type="button" style={tabStyle(activeTab === "integrations")} onClick={() => setActiveTab("integrations")}>
          System Health
        </button>
      </nav>

      {activeTab === "messages" ? (
        <div style={{ padding: "0 16px 16px", maxWidth: 1040, display: "grid", gap: 14 }}>
          <section style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: 14, background: "#fff" }}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ margin: "0 0 4px" }}>Communication</h2>
              <p style={{ margin: 0, color: "#64748b" }}>
                Choose whether you want to send a message or change a live class. Only one workflow is shown at a time.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={tabStyle(messageMode === "send")} onClick={() => setMessageMode("send")}>
                Send message
              </button>
              <button type="button" style={tabStyle(messageMode === "class-change")} onClick={() => setMessageMode("class-change")}>
                Class change
              </button>
            </div>
          </section>

          {messageMode === "send" ? <CommunicationMessagesPage /> : <CommunicationLiveClassActions />}
        </div>
      ) : null}

      {activeTab === "attendance" ? (
        <div style={{ padding: "0 16px 16px", maxWidth: 1000, display: "grid", gap: 14 }}>
          <AttendanceConfirmationAutomationPanel />
          <AttendanceFailedDeliveryRetryPanel />
        </div>
      ) : null}

      {activeTab === "integrations" ? <IntegrationEventPanel /> : null}
    </div>
  );
}
