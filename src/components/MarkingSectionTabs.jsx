import { useSearchParams } from "react-router-dom";

export default function MarkingSectionTabs({ children }) {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab = ["automatic", "manual"].includes(requested) ? requested : "incoming";

  function select(value) {
    const next = new URLSearchParams(params);
    next.set("tab", value);
    setParams(next);
  }

  return <>
    <nav aria-label="Marking sections" style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <button type="button" aria-pressed={tab === "incoming"} onClick={() => select("incoming")}>Submissions to mark</button>
      <button type="button" aria-pressed={tab === "automatic"} onClick={() => select("automatic")}>AI-marked · Review &amp; edit</button>
      <button type="button" aria-pressed={tab === "manual"} onClick={() => select("manual")}>Manual marking</button>
    </nav>
    {children(tab)}
  </>;
}
