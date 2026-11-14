import { lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { staffCan } from "../utils/staffAccess.js";
import "./MarkingHubPage.css";

const GermanMarking = lazy(() => import("./MarkingPage.jsx"));
const SwahiliMarking = lazy(() => import("./SwahiliMarkingPage.jsx"));

export default function MarkingHubPage() {
  const [params] = useSearchParams();
  const { role, staffLanguages, staffAccess, staffRole, workspaceLanguage, setWorkspaceLanguage } = useAuth();
  const permitted = role !== "staff" || !staffLanguages ? ["german", "swahili"]
    : staffLanguages.filter(language => staffCan(staffAccess, staffLanguages, language, "marking", staffRole));
  const selected = params.get("language") || (role === "staff" ? workspaceLanguage : "german");
  const language = permitted.includes(selected) ? selected : permitted[0];
  if (!language) return <p role="alert">No teaching languages have been assigned to this account.</p>;
  return (
    <>
      <h1>Marking</h1>
      <nav className="marking-language-nav" aria-label="Marking language">
        {permitted.includes("german") && <Link to="/marking" onClick={() => setWorkspaceLanguage("german")} aria-current={language === "german" ? "page" : undefined}>German · Deutsch</Link>}
        {permitted.includes("swahili") && <Link to="/marking?language=swahili" onClick={() => setWorkspaceLanguage("swahili")} aria-current={language === "swahili" ? "page" : undefined}>Swahili · Kiswahili</Link>}
      </nav>
      <Suspense fallback={<p role="status">Loading marking…</p>}>
        {language === "swahili" ? <SwahiliMarking /> : <GermanMarking />}
      </Suspense>
    </>
  );
}
