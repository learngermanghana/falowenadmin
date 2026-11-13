import { lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./MarkingHubPage.css";

const GermanMarking = lazy(() => import("./MarkingPage.jsx"));
const SwahiliMarking = lazy(() => import("./SwahiliMarkingPage.jsx"));

export default function MarkingHubPage() {
  const [params] = useSearchParams();
  const { role, staffLanguages } = useAuth();
  const permitted = role !== "staff" || !staffLanguages ? ["german", "swahili"] : staffLanguages;
  const selected = params.get("language") === "swahili" ? "swahili" : "german";
  const language = permitted.includes(selected) ? selected : permitted[0];
  if (!language) return <p role="alert">No teaching languages have been assigned to this account.</p>;
  return (
    <>
      <h1>Marking</h1>
      <nav className="marking-language-nav" aria-label="Marking language">
        {permitted.includes("german") && <Link to="/marking" aria-current={language === "german" ? "page" : undefined}>German · Deutsch</Link>}
        {permitted.includes("swahili") && <Link to="/marking?language=swahili" aria-current={language === "swahili" ? "page" : undefined}>Swahili · Kiswahili</Link>}
      </nav>
      <Suspense fallback={<p role="status">Loading marking…</p>}>
        {language === "swahili" ? <SwahiliMarking /> : <GermanMarking />}
      </Suspense>
    </>
  );
}
