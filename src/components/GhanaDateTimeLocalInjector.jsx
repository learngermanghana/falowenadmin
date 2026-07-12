import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { applyGhanaDateTimeInputs } from "../utils/ghanaDateTimeLocal.js";

export default function GhanaDateTimeLocalInjector() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/live-classes") return undefined;
    applyGhanaDateTimeInputs(document);

    const observer = new MutationObserver(() => applyGhanaDateTimeInputs(document));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
}
