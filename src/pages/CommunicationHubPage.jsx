import CommunicationWorkspacePage from "./CommunicationWorkspacePage.jsx";
import AttendanceConfirmationAutomationPanel from "../components/AttendanceConfirmationAutomationPanel.jsx";
import AttendanceFailedDeliveryRetryPanel from "../components/AttendanceFailedDeliveryRetryPanel.jsx";
import IntegrationEventPanel from "../components/IntegrationEventPanel.jsx";

export default function CommunicationHubPage() {
  return (
    <>
      <CommunicationWorkspacePage />
      <section className="cw-operations" aria-label="Communication operations">
        <details>
          <summary>Email Automations · existing attendance settings</summary>
          <div className="cw-operations-inner">
            <AttendanceConfirmationAutomationPanel />
            <AttendanceFailedDeliveryRetryPanel />
          </div>
        </details>
        <details>
          <summary>System Health · delivery and integration status</summary>
          <div className="cw-operations-inner">
            <IntegrationEventPanel />
          </div>
        </details>
      </section>
    </>
  );
}
