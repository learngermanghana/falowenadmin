import { lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./MarkingHubPage.css";

const GermanMarking = lazy(() => import("./MarkingPage.jsx"));
const SwahiliMarking = lazy(() => import("./SwahiliMarkingPage.jsx"));

export default function MarkingHubPage() {
  const [params] = useSearchParams();
  const language = params.get("language") === "swahili" ? "swahili" : "german";
  return (
    <>
      <h1>Marking</h1>
      <nav className="marking-language-nav" aria-label="Marking language">
        <Link to="/marking" aria-current={language === "german" ? "page" : undefined}>German · Deutsch</Link>
        <Link to="/marking?language=swahili" aria-current={language === "swahili" ? "page" : undefined}>Swahili · Kiswahili</Link>
      </nav>
      <Suspense fallback={<p role="status">Loading marking…</p>}>
        {language === "swahili" ? <SwahiliMarking /> : <GermanMarking />}
      </Suspense>
    </>
  );
}
