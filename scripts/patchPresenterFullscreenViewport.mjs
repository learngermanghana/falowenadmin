import fs from "node:fs";

function patchPresenter(path, label) {
  let source = fs.readFileSync(path, "utf8");

  if (!source.includes("useRef")) {
    source = source.replace(
      'import { useEffect, useMemo, useState } from "react";',
      'import { useEffect, useMemo, useRef, useState } from "react";',
    );
  }

  if (!source.includes("const presenterShellRef = useRef(null);")) {
    const marker = label === "A1"
      ? '  const stages = useMemo(() => stageList(slide, topicLabel), [slide, topicLabel]);'
      : '  const stages = useMemo(() => buildTeachingPresenterStages(slide, topicLabel), [slide, topicLabel]);';
    if (!source.includes(marker)) throw new Error(`${label} presenter fullscreen ref anchor changed`);
    source = source.replace(marker, `${marker}\n  const presenterShellRef = useRef(null);`);
  }

  const oldFullscreen = '      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();';
  const newFullscreen = '      if (!document.fullscreenElement) await presenterShellRef.current?.requestFullscreen?.();';
  if (!source.includes(newFullscreen)) {
    if (!source.includes(oldFullscreen)) throw new Error(`${label} presenter fullscreen request anchor changed`);
    source = source.replace(oldFullscreen, newFullscreen);
  }

  const oldShell = label === "A1"
    ? '<div className="presenter-shell" role="dialog" aria-modal="true" aria-label="A1 teaching presenter">'
    : '<div className="presenter-shell" role="dialog" aria-modal="true" aria-label="Teaching slide presenter">';
  const newShell = oldShell.replace('<div ', '<div ref={presenterShellRef} ');
  if (!source.includes(newShell)) {
    if (!source.includes(oldShell)) throw new Error(`${label} presenter fullscreen shell anchor changed`);
    source = source.replace(oldShell, newShell);
  }

  fs.writeFileSync(path, source, "utf8");
}

patchPresenter(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "General");
patchPresenter(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "A1");

console.log("Presenter fullscreen now targets the presenter shell and uses the full viewport safely.");
