import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("fullscreen presenter keeps long content inside a scrollable bounded grid row", () => {
  const css = read("src/components/TeachingSlidePresenter.css");
  assert.match(css, /\.presenter-stage\s*\{[\s\S]*grid-template-rows:\s*auto\s+(?:auto\s+)?minmax\(0,\s*1fr\)\s+auto/);
  assert.match(css, /\.presenter-content\s*\{[\s\S]*min-height:\s*0/);
  assert.match(css, /\.presenter-content\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.presenter-content\s*\{[\s\S]*justify-content:\s*safe center/);
  assert.match(css, /\.presenter-shell:fullscreen[\s\S]*\.presenter-stage/);
});

test("presenter with student picker keeps content as minmax zero row", () => {
  const css = read("src/components/PresenterStudentPicker.css");
  assert.match(css, /grid-template-rows:\s*auto\s+auto\s+minmax\(0,\s*1fr\)\s+auto/);
});

test("tablet and phone portrait presenter fills the available viewport instead of staying 16 by 9", () => {
  const css = read("src/components/TeachingSlidePresenter.css");
  assert.match(css, /@media \(max-width:\s*900px\) and \(orientation:\s*portrait\)/);
  assert.match(css, /@media \(max-width:\s*900px\) and \(orientation:\s*portrait\)[\s\S]*\.presenter-stage\s*\{[\s\S]*height:\s*100dvh/);
  assert.match(css, /@media \(max-width:\s*900px\) and \(orientation:\s*portrait\)[\s\S]*\.presenter-stage\s*\{[\s\S]*aspect-ratio:\s*auto/);
  assert.match(css, /@media \(max-width:\s*900px\) and \(orientation:\s*portrait\)[\s\S]*\.presenter-shell\s*\{[\s\S]*place-items:\s*stretch/);
});


test("presenter fullscreen wiring keeps one A1 dock and synchronizes browser exits", () => {
  const a1 = read("src/components/A1GrammarPresenter.jsx");
  const shared = read("src/components/TeachingSlidePresenter.jsx");
  const css = read("src/components/TeachingSlidePresenter.css");
  assert.match(css, /\.presenter-shell\.is-presentation-mode/);
  assert.doesNotMatch(css, /:has\(\.presenter-stage\.is-focus-mode\)/);

  assert.match(a1, /useEffect, useMemo, useRef, useState/);
  assert.doesNotMatch(a1, /toggleFocusMode/);
  assert.equal((a1.match(/presenter-focus-dock/g) || []).length, 1);
  assert.match(a1, /presenterShellRef\.current\?\.requestFullscreen/);
  assert.match(shared, /presenterShellRef\.current\?\.requestFullscreen/);

  assert.match(a1, /addEventListener\("fullscreenchange", handleFullscreenChange\)/);
  assert.match(shared, /addEventListener\("fullscreenchange", handleFullscreenChange\)/);
  assert.match(a1, /aria-label="Restore presenter controls"/);
  assert.match(shared, /aria-label="Restore presenter controls"/);
  assert.match(a1, /presenter-shell \$\{focusMode \? "is-presentation-mode" : ""\}/);
  assert.match(shared, /presenter-shell \$\{focusMode \? "is-presentation-mode" : ""\}/);
  assert.match(a1, />Restore<\/button>/);
  assert.match(shared, />Restore<\/button>/);
});


test("desktop presenter keeps fullscreen and exit actions in the timer row and compacts participation chrome", () => {
  const a1 = read("src/components/A1GrammarPresenter.jsx");
  const shared = read("src/components/TeachingSlidePresenter.jsx");
  const timer = read("src/components/PresenterSessionTimer.jsx");
  const timerCss = read("src/components/PresenterSessionTimer.css");
  const presenterCss = read("src/components/TeachingSlidePresenter.css");
  const pickerCss = read("src/components/PresenterStudentPicker.css");

  for (const source of [a1, shared]) {
    assert.match(source, /toolbarActions=\{\(/);
    assert.match(source, /className="presenter-session-present"[^>]*>Present full screen<\/button>/);
    assert.match(source, /className="presenter-session-exit"[^>]*>Exit presenter<\/button>/);
    assert.doesNotMatch(source, /className="presenter-top-actions"/);
  }

  assert.match(timer, /PresenterSessionTimer\(\{ slide, stage = null, toolbarActions = null, onTimeStateChange = null \}\)/);
  assert.match(timer, /Sound: \{soundEnabled \? "on" : "off"\}[\s\S]*\{toolbarActions\}/);
  assert.match(timerCss, /compact-presenter-session-toolbar/);
  assert.match(timerCss, /@media \(min-width: 1251px\)[\s\S]*\.presenter-session-timer-actions\s*\{[\s\S]*flex-wrap:\s*nowrap/);
  assert.match(presenterCss, /compact-presenter-chrome/);
  assert.match(presenterCss, /@media \(min-width: 1251px\)[\s\S]*\.presenter-topbar\s*\{[\s\S]*flex-wrap:\s*nowrap/);
  assert.match(pickerCss, /compact-presenter-participation-toolbar/);
  assert.match(pickerCss, /@media \(min-width: 1351px\)[\s\S]*\.presenter-student-picker\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(pickerCss, /\.presenter-stage > \.presenter-topbar\s*\{[\s\S]*min-height:\s*52px/);
});


test("Focus Mode shows the live class remaining time without timer settings", () => {
  const a1 = read("src/components/A1GrammarPresenter.jsx");
  const shared = read("src/components/TeachingSlidePresenter.jsx");
  const timer = read("src/components/PresenterSessionTimer.jsx");
  const css = read("src/components/TeachingSlidePresenter.css");

  assert.match(timer, /onTimeStateChange = null/);
  assert.match(timer, /onTimeStateChange\(\{[\s\S]*remainingSeconds:[\s\S]*durationSeconds:[\s\S]*running:[\s\S]*expired,/);

  for (const source of [a1, shared]) {
    assert.match(source, /const \[classTimeState, setClassTimeState\] = useState/);
    assert.match(source, /onTimeStateChange=\{setClassTimeState\}/);
    assert.match(source, /aria-label="Class time remaining"/);
    assert.match(source, /classTimeState\.remainingSeconds/);
    assert.match(source, /classTimeState\.expired \? "Time up" : "left"/);
  }

  assert.match(css, /Focus Mode live class countdown/);
  assert.match(css, /\.presenter-focus-time\s*\{[\s\S]*position:\s*absolute/);
  assert.match(css, /\.presenter-focus-time\s*\{[\s\S]*top:/);
  assert.match(css, /\.presenter-focus-time\s*\{[\s\S]*right:/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.presenter-stage\.is-focus-mode > \.presenter-content\s*\{[\s\S]*padding-top:\s*6\.9rem/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.presenter-focus-time\s*\{[\s\S]*top:\s*3\.45rem/);
  assert.doesNotMatch(css, /@media \(max-width: 700px\)[\s\S]*\.presenter-focus-time\s*\{[\s\S]*top:\s*0\.45rem/);
});


test("global Focus Mode teaching canvas reserves controls and prioritizes student-facing content", () => {
  const a1 = read("src/components/A1GrammarPresenter.jsx");
  const shared = read("src/components/TeachingSlidePresenter.jsx");
  const css = read("src/components/TeachingSlidePresenter.css");

  for (const source of [a1, shared]) {
    assert.match(source, /presenter-title-long/);
    assert.match(source, />Restore<\/button>/);
  }

  assert.match(a1, /ref=\{contentRef\}/);
  assert.match(a1, /presenter-fit-\$\{fitMode\}/);
  assert.match(a1, /ResizeObserver/);
  assert.match(a1, /node\.scrollHeight > node\.clientHeight \+ 6/);
  assert.match(a1, /setFitMode\("compact"\)/);
  assert.match(a1, /setFitMode\("tight"\)/);
  assert.match(a1, /presenter-teacher-instruction/);

  assert.match(css, /global-focus-teaching-canvas/);
  assert.match(css, /--focus-safe-top:/);
  assert.match(css, /--focus-safe-bottom:/);
  assert.match(css, /width:\s*min\(1180px, 100%\)/);
  assert.match(css, /\.presenter-stage\.is-focus-mode\.presenter-title-long[\s\S]*font-size:/);
  assert.match(css, /\.presenter-stage\.is-focus-mode \.presenter-teacher-instruction,[\s\S]*display:\s*none !important/);
  assert.match(css, /\.presenter-stage\.is-focus-mode \.presenter-model-support small[\s\S]*display:\s*none !important/);
  assert.match(css, /\.presenter-stage\.is-focus-mode \.presenter-question-reveal[\s\S]*justify-items:\s*center/);
  assert.match(css, /\.presenter-focus-dock \.presenter-restore-control[\s\S]*font-size:\s*0\.68rem/);
});
