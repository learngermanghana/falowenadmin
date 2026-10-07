import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import config from "../vite.config.js";

test("Vite builds the playlist from public files even when saved source is stale", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "music-build-"));
  const publicDir = path.join(root, "public");
  fs.mkdirSync(publicDir);
  fs.writeFileSync(path.join(publicDir, "New Piano.mp3"), "fixture");
  const plugin = config.plugins.find((item) => item.name === "waiting-music-from-public");
  plugin.configResolved({ root, publicDir });
  const module = plugin.load(path.join(root, "src/data/pianoPlaylist.js"));
  assert.match(module, /New%20Piano\.mp3/);
  fs.unlinkSync(path.join(publicDir, "New Piano.mp3"));
  fs.writeFileSync(path.join(publicDir, "Replacement.mp3"), "fixture");
  const rebuilt = plugin.load(path.join(root, "src/data/pianoPlaylist.js"));
  assert.match(rebuilt, /Replacement\.mp3/);
  assert.doesNotMatch(rebuilt, /New%20Piano/);
  fs.rmSync(root, { recursive: true, force: true });
});
