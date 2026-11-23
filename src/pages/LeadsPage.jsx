import { useState } from "react";
import StudentLeadsPanel from "../components/StudentLeadsPanel.jsx";
import PersonalLeadsPanel from "../components/PersonalLeadsPanel.jsx";

export default function LeadsPage() {
  const [tab, setTab] = useState("online");
  return (
    <div style={{ display: "grid", gap: 20, background: "#f5f8f7", borderRadius: 14, padding: "clamp(12px, 3vw, 30px)", color: "#17352d" }}>
      <header>
        <h1 style={{ margin: "0 0 6px", fontSize: 30, color: "#132f27" }}>Leads</h1>
        <p style={{ margin: 0, color: "#647b71" }}>Manage prospective students, follow-ups, brochure enquiries, and their journey to enrollment.</p>
      </header>
      <div role="tablist" aria-label="Lead sources" style={{ display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid #dce7e2" }}>
        <button type="button" role="tab" id="online-leads-tab" aria-controls="online-leads-panel" aria-selected={tab === "online"}
          onClick={() => setTab("online")}
          style={{ border: "none", borderBottom: tab === "online" ? "3px solid #116148" : "3px solid transparent", padding: "12px 18px", background: "transparent", color: tab === "online" ? "#116148" : "#65796f", fontWeight: 750, cursor: "pointer" }}>
          Online Leads
        </button>
        <button type="button" role="tab" id="personal-leads-tab" aria-controls="personal-leads-panel" aria-selected={tab === "personal"}
          onClick={() => setTab("personal")}
          style={{ border: "none", borderBottom: tab === "personal" ? "3px solid #116148" : "3px solid transparent", padding: "12px 18px", background: "transparent", color: tab === "personal" ? "#116148" : "#65796f", fontWeight: 750, cursor: "pointer" }}>
          Personal Contacts
        </button>
      </div>
      {tab === "online"
        ? <section role="tabpanel" id="online-leads-panel" aria-labelledby="online-leads-tab" style={{ background: "#fff", padding: "clamp(12px, 2vw, 24px)", borderRadius: 14, border: "1px solid #dce7e2", minWidth: 0 }}><StudentLeadsPanel /></section>
        : <section role="tabpanel" id="personal-leads-panel" aria-labelledby="personal-leads-tab"><PersonalLeadsPanel /></section>}
    </div>
  );
}
