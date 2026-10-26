import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getCheckinDisplayClassName, getCheckinLobbyPractice } from "../src/utils/checkinLobbyView.js";

const display = fs.readFileSync("src/pages/CheckinDisplayPage.jsx", "utf8");
const css = fs.readFileSync("src/pages/CheckinDisplayPage.css", "utf8");
const attendance = fs.readFileSync("src/pages/CanonicalAttendancePageV3.jsx", "utf8");

test("lobby uses a readable class name, never a Firestore ID", () => {
  assert.equal(
    getCheckinDisplayClassName("A1 Leipzig Klasse_2026-10-26_1800", "sGtN97NmKOcSOCZJGfxV"),
    "A1 Leipzig",
  );
  assert.equal(getCheckinDisplayClassName("", "A2 Berlin Klasse"), "A2 Berlin");
  assert.equal(getCheckinDisplayClassName("", "sGtN97NmKOcSOCZJGfxV"), "deiner Deutschklasse");
  assert.equal(getCheckinDisplayClassName("A1 Hamburg Klasse_2026-10-26_1800", ""), "A1 Hamburg");
  assert.match(display, /Willkommen, \{displayClassName\}/);
  assert.doesNotMatch(display, /<span><b>Class:<\/b> \{classId/);
});

test("new check-in links exclude student rosters and old links are redacted", () => {
  assert.doesNotMatch(attendance, /expectedStudents:/);
  assert.match(attendance, /expectedCount: String\(rows\.length\)/);
  assert.match(display, /currentUrl\.searchParams\.has\("expectedStudents"\)/);
  assert.match(display, /currentUrl\.searchParams\.delete\("expectedStudents"\)/);
  assert.match(display, /history\.replaceState/);
  assert.doesNotMatch(display, /expectedStudents: String/);
});

test("teacher class controls, waiting music, check-in link and names are in a collapsed panel", () => {
  assert.match(display, /\[teacherPanelOpen, setTeacherPanelOpen\] = useState\(false\)/);
  const panel = display.slice(display.indexOf('{teacherPanelOpen ? ('), display.indexOf('<header className="checkin-display-hero">'));
  assert.match(panel, /<section id="checkin-display-teacher-panel"/);
  assert.match(panel, /Start class & slides/);
  assert.match(panel, /End class/);
  assert.match(panel, /Copy check-in link/);
  assert.match(panel, /onClick=\{musicPlaying \? stopWaitingMusic : startWaitingMusic\}/);
  assert.match(panel, /onClick=\{\(\) => setShowNames/);
  assert.match(panel, /checkedInNames\.map/);
  assert.equal((display.match(/className="checkin-display-teacher-controls"/g) || []).length, 1);
  assert.match(display, /requestFullscreen/);
  assert.match(display, /Student names are hidden on the projector by default/);
});

test("live projector retains a visible QR rail while the warm-up cards rotate", () => {
  const lobby = display.slice(display.indexOf('<section className="checkin-display-smart-lobby"'), display.indexOf('<div className="checkin-display-lobby-footer">', display.indexOf('<section className="checkin-display-smart-lobby"')));
  assert.match(lobby, /checkin-display-lobby-body/);
  assert.match(lobby, /checkin-display-lobby-qr-rail/);
  assert.match(lobby, /QRCodeCanvas value=\{checkinUrl\} size=\{280\}/);
  assert.match(lobby, /attendanceCountLabel/);
  assert.match(lobby, /attendanceLive/);
  assert.match(lobby, /checkin-display-lobby-stage/);
  assert.equal((lobby.match(/QRCodeCanvas/g) || []).length, 1, "QR should never vanish or duplicate during rotation");
  assert.match(css, /\.checkin-display-lobby-body/);
  assert.match(css, /\.checkin-display-lobby-persistent-qr canvas/);
  assert.match(css, /@media\(max-width:850px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
});

test("A1 Day 2 mini-exercise is optional and never recorded as assessment", () => {
  const ex = getCheckinLobbyPractice("A1-0.2");
  assert.equal(ex.prompt, "Ich ___ Felix.");
  assert.deepEqual([...ex.choices], ["bin", "bist", "ist"]);
  assert.equal(ex.choices[ex.correctIndex], "bin");
  assert.equal(getCheckinLobbyPractice("B1-8.25"), null);
  assert.match(display, /setShowMiniAnswer\(true\), 7500/);
  assert.match(display, /Unbewertete Mini-Übung/);
  assert.match(display, /Nur zum Üben/);
});

test("teacher-controlled start, synchronized timer and existing attendance data stay untouched", () => {
  assert.match(display, /subscribeSessionCheckins/);
  assert.match(display, /syncPresenterStart/);
  assert.match(display, /syncPresenterEnd/);
  assert.match(display, /readClassStartDecision/);
  assert.match(display, /handleStartClassNow/);
  assert.match(display, /handleEndClass/);
  assert.match(display, /pianoPlaylist/);
  assert.match(display, /musicVolume/);
});
