import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import { resolve } from "node:path";
import { buildSync } from "esbuild";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { SWAHILI_MUSIC_TRACKS } from "../src/data/swahiliMusicTracks.js";

test("Swahili lesson recovers blank Day 12 lyrics and opens the matching recording with estimated cues", async () => {
  const filename = resolve("tests/compiled-swahili-studio.cjs");
  const compiled = new Module(filename);
  compiled.paths = Module._nodeModulePaths(process.cwd());
  const { outputFiles } = buildSync({
    entryPoints: ["src/components/SwahiliSongDraftWorkspace.jsx"],
    bundle: true,
    platform: "node",
    jsx: "automatic",
    packages: "external",
    loader: { ".css": "empty" },
    define: { "import.meta.env": "{}" },
    write: false,
  });
  compiled._compile(outputFiles[0].text, filename);
  const Workspace = compiled.exports.default;
  const { window } = new JSDOM('<div id="root"></div>', { url: "https://admin.falowen.app" });
  Object.assign(globalThis, { window, document: window.document, localStorage: window.localStorage, IS_REACT_ACT_ENVIRONMENT: true });
  window.HTMLCanvasElement.prototype.getContext = () => null;
  localStorage.setItem("falowen-swahili-song-draft-edits:v1", JSON.stringify({
    "swahili-a1-day-12": "",
    "swahili-a1-day-02": "My saved draft",
  }));
  const requests = [];
  const lines = ["Angalia kalenda", "Leo ni Jumatatu"];
  globalThis.fetch = async url => {
    const key = new URL(url, window.location.href).searchParams.get("key");
    if (!key) return { ok: false };
    requests.push(key);
    return {
      ok: true,
      json: async () => ({
        objectKey: key,
        lyrics: lines.join("\n"),
        timingStatus: "estimated",
        cues: lines.map((text, index) => ({ start: 2 + index * 5, text })),
      }),
    };
  };
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => root.render(React.createElement(Workspace)));
    const draft = document.querySelector("#swahili-course-lyrics");
    assert.equal(draft.value, "My saved draft");
    const lesson = document.querySelector('[aria-label="Swahili song lesson"]');
    await act(async () => {
      lesson.value = "12";
      lesson.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    assert.equal(draft.value, lines.join("\n"));
    const continueButton = [...document.querySelectorAll("button")]
      .find(button => button.textContent === "Continue to music & video studio");
    await act(async () => continueButton.click());
    const studio = document.querySelector('[aria-label="Lyrics video studio"]');
    const recording = studio.querySelector("select");
    const day12 = SWAHILI_MUSIC_TRACKS.find(track => track.id === "swahili-a1-day-12");
    assert.equal(recording.value, day12.objectKey);
    assert.equal(studio.querySelector("audio").src, day12.audioUrl);
    assert.match(studio.textContent, /Approximate timing loaded/);
    assert.match(studio.textContent, /Shared line timing: 2\/2 marked/);
    assert.ok([...studio.querySelectorAll("textarea")].some(field => field.value === lines.join("\n")));
    assert.ok([...studio.querySelectorAll("input")].some(field => field.value.includes("Swahili A1 Song")));
    for (const track of SWAHILI_MUSIC_TRACKS) {
      await act(async () => {
        recording.value = track.objectKey;
        recording.dispatchEvent(new window.Event("change", { bubbles: true }));
      });
      assert.ok(requests.includes(track.objectKey));
      assert.equal(studio.querySelector("audio").src, track.audioUrl);
      assert.match(studio.textContent, /Shared line timing: 2\/2 marked/);
    }
  } finally {
    await act(async () => root.unmount());
    window.close();
  }
});
