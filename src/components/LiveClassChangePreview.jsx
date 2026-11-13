function date(value) {
  return new Date(value).toLocaleString("en-GB", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" });
}
export default function LiveClassChangePreview({ preview }) {
  if (preview.error) return <div role="alert" className="live-workspace-alert">{preview.error}</div>;
  if (!preview.plan) return null;
  const plan = preview.plan;
  return <section className="live-workspace-preview" aria-label="Schedule change preview">
    <strong>{plan.changes.length} lesson(s) affected · New class end: {plan.endDate || "Unchanged"}</strong>

    <div style={{ maxHeight: 250, overflow: "auto" }}>
      <table><thead><tr><th>Lesson</th><th>Current date</th><th>After saving</th></tr></thead>
        <tbody>{plan.changes.map(change => <tr key={change.session.id}>
          <td>{change.session.topic}</td><td>{date(change.session.startsAt)}</td>
          <td>{change.plannedStatus === "cancelled" ? "Cancelled" : date(change.startsAt)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}
