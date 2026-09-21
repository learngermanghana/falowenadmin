import { useState } from "react";
import TargetedCommunicationPanel from "../components/TargetedCommunicationPanel.jsx";
import CommunicationHistoryPanel from "../components/CommunicationHistoryPanel.jsx";
import CommunicationPage from "./CommunicationPage.jsx";

const selectStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #d0d7de",
  width: "100%",
  maxWidth: 460,
};

export default function CommunicationMessagesPage() {
  const [audienceMode, setAudienceMode] = useState("standard");

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: 16, display: "grid", gap: 14, background: "#fff" }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>Send message</h3>
          <p style={{ margin: 0, color: "#64748b" }}>
            Choose the audience first. Falowen then shows only the fields needed for that message.
          </p>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Who should receive it?</strong>
          <select style={selectStyle} value={audienceMode} onChange={(event) => setAudienceMode(event.target.value)}>
            <option value="standard">Everyone, a level, one class, or one student</option>
            <option value="condition">Students matching a condition</option>
          </select>
          <small style={{ color: "#64748b" }}>
            Use conditions for absent, present, unpaid, not checked in, or missing-assignment follow-ups.
          </small>
        </label>

        {audienceMode === "condition" ? (
          <TargetedCommunicationPanel embedded showHistory={false} />
        ) : (
          <CommunicationPage embedded />
        )}
      </section>

      <CommunicationHistoryPanel />
    </div>
  );
}
