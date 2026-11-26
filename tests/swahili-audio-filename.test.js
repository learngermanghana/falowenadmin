import test from "node:test";
import assert from "node:assert/strict";
import { swahiliAudioFileBase } from "../src/utils/swahiliAudioFilename.js";
import { swahiliAudioChapters } from "../src/data/swahiliAudioChapters.js";

test("Swahili audio names include level, day and chapter title", () => {
  assert.equal(swahiliAudioFileBase("A1", swahiliAudioChapters.A1[9]), "swahili-a1-day-10-sokoni");
  assert.equal(swahiliAudioFileBase("A1", swahiliAudioChapters.A1[11]), "swahili-a1-day-12-siku-miezi-na-tarehe");
  assert.equal(swahiliAudioFileBase("A2", swahiliAudioChapters.A2[8]), "swahili-a2-day-9-likizo");
  assert.equal(swahiliAudioFileBase("B1", swahiliAudioChapters.B1[27]), "swahili-b1-day-28-kutunza-mazingira-katika-maisha-ya-kila-siku");
});

test("chapter focus does not override filename and custom topics are safe", () => {
  assert.equal(swahiliAudioFileBase("A1", swahiliAudioChapters.A1[10], "Bei"), "swahili-a1-day-11-dukani");
  assert.equal(swahiliAudioFileBase("A2", null, "Café / lunch?"), "swahili-a2-cafe-lunch");
  assert.equal(swahiliAudioFileBase("B1", null, ""), "swahili-b1-custom-topic");
});
