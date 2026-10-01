import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFairReadingAssignments,
  buildReadingChunks,
  incrementReadingHistory,
} from "../src/utils/presenterReadingShare.js";

test("A2 reading is split at sentence boundaries into short chunks", () => {
  const chunks = buildReadingChunks(
    "Anna wohnt in Accra. Sie lernt Deutsch. Am Samstag besucht sie ihre Freundin. Danach gehen sie ins Café. Am Abend fährt Anna nach Hause.",
    "A2",
    5,
  );

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].text, "Anna wohnt in Accra. Sie lernt Deutsch.");
  assert.equal(chunks[1].text, "Am Samstag besucht sie ihre Freundin. Danach gehen sie ins Café.");
  assert.equal(chunks[2].text, "Am Abend fährt Anna nach Hause.");
});

test("B1 reading uses slightly longer chunks and never cuts a sentence", () => {
  const chunks = buildReadingChunks(
    "Viele Menschen arbeiten heute flexibel. Homeoffice spart oft Zeit. Gleichzeitig fehlt manchmal der direkte Kontakt. Teams brauchen deshalb klare Regeln. Regelmäßige Gespräche helfen. Auch gemeinsame Bürotage können sinnvoll sein.",
    "B1",
    6,
  );

  assert.equal(chunks.length, 2);
  assert.equal(
    chunks[0].text,
    "Viele Menschen arbeiten heute flexibel. Homeoffice spart oft Zeit. Gleichzeitig fehlt manchmal der direkte Kontakt.",
  );
  assert.equal(
    chunks[1].text,
    "Teams brauchen deshalb klare Regeln. Regelmäßige Gespräche helfen. Auch gemeinsame Bürotage können sinnvoll sein.",
  );
});

test("reading chunks never exceed the available reader count", () => {
  const chunks = buildReadingChunks(
    "Satz eins. Satz zwei. Satz drei. Satz vier. Satz fünf. Satz sechs. Satz sieben. Satz acht.",
    "A2",
    2,
  );

  assert.equal(chunks.length, 2);
  assert.ok(chunks.every((chunk) => /[.!?]$/u.test(chunk.text)));
});

test("fair reading assignment prioritizes learners with fewer previous reading turns", () => {
  const roster = [
    { key: "anna", name: "Anna" },
    { key: "ben", name: "Ben" },
    { key: "carla", name: "Carla" },
  ];
  const chunks = buildReadingChunks("Eins. Zwei. Drei. Vier.", "A2", 3);
  const history = {
    reader: { anna: 3, ben: 1, carla: 0 },
    listener: { anna: 0, ben: 0, carla: 2 },
  };

  const assignments = buildFairReadingAssignments({
    chunks,
    roster,
    history,
    stats: {
      anna: { turns: 4 },
      ben: { turns: 2 },
      carla: { turns: 1 },
    },
    level: "A2",
  });

  assert.equal(assignments[0].reader.key, "carla");
  assert.notEqual(assignments[0].listener?.key, assignments[0].reader.key);
  assert.match(assignments[0].listenerQuestion, /Hauptidee/u);
});

test("completed reading updates reader and listener history separately", () => {
  const next = incrementReadingHistory(
    { reader: { anna: 1 }, listener: { ben: 2 } },
    {
      reader: { key: "anna" },
      listener: { key: "carla" },
    },
  );

  assert.equal(next.reader.anna, 2);
  assert.equal(next.listener.ben, 2);
  assert.equal(next.listener.carla, 1);
});
