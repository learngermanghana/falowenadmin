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

const cssPath = new URL("../src/components/TeachingSlidePresenter.css", import.meta.url);
let css = fs.readFileSync(cssPath, "utf8");
const portraitMarker = "/* Tablet/phone portrait: do not force the presenter into a 16:9 landscape box. */";
if (!css.includes(portraitMarker)) {
  css += `\n\n${portraitMarker}\n@media (max-width: 900px) and (orientation: portrait) {\n  .presenter-shell {\n    padding: 0;\n    place-items: stretch;\n  }\n\n  .presenter-stage {\n    width: 100vw;\n    height: 100dvh;\n    min-height: 100dvh;\n    max-height: 100dvh;\n    aspect-ratio: auto;\n    border-radius: 0;\n  }\n\n  .presenter-content {\n    min-height: 0;\n    max-height: 100%;\n    overflow-y: auto;\n  }\n}\n`;
}
fs.writeFileSync(cssPath, css, "utf8");

console.log("Presenter fullscreen and portrait viewport layout are safe across desktop, tablet and phone.");
