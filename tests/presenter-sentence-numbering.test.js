import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

import {
  numberedPresenterSentences,
  splitPresenterSentences,
} from "../src/utils/presenterSentenceNumbering.js";

test("numbers each complete Wissensimpuls sentence in reading order", () => {
  const text = "Ich war am Samstag in der Altstadt. Wir besuchten zuerst einen Markt. Danach gingen wir in ein kleines Café. Am Abend war ich müde, aber zufrieden.";
  const result = numberedPresenterSentences(text);

  assert.deepEqual(result, [
    { number: 1, text: "Ich war am Samstag in der Altstadt." },
    { number: 2, text: "Wir besuchten zuerst einen Markt." },
    { number: 3, text: "Danach gingen wir in ein kleines Café." },
    { number: 4, text: "Am Abend war ich müde, aber zufrieden." },
  ]);
});

test("sentence numbering follows the text length automatically", () => {
  const shortText = "Was siehst du? Ich sehe einen Park! Danach gehen wir weiter.";
  const sentences = splitPresenterSentences(shortText);

  assert.equal(sentences.length, 3);
  assert.equal(numberedPresenterSentences(shortText).at(-1)?.number, 3);
});

test("empty Wissensimpuls text produces no reading numbers", () => {
  assert.deepEqual(numberedPresenterSentences("   "), []);
});

test("Wissensimpuls renders as one continuous paragraph, not a numbered list", () => {
  const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");

  assert.match(presenter, /<p className="presenter-knowledge-numbered-text"/);
  assert.match(presenter, /className="presenter-knowledge-inline-number"/);
  assert.ok(presenter.includes('aria-label={`Highlight sentence ${number}`}'));
  assert.match(presenter, /\{number\}\.\s*<\/button>\{\" \"\}\{text\}/);
  assert.doesNotMatch(presenter, /<ol className="presenter-knowledge-sentences"/);
  assert.doesNotMatch(presenter, /presenter-knowledge-sentence-number/);
});

test("Wissensimpuls keeps the page light while supporting sentence focus and delayed checks", () => {
  const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

  assert.match(presenter, /activeKnowledgeSentence/);
  assert.match(presenter, /className="presenter-knowledge-inline-number"/);
  assert.ok(presenter.includes('aria-label={`Highlight sentence ${number}`}'));
  assert.match(presenter, /Kurz prüfen anzeigen/);
  assert.match(presenter, /!knowledgeChecksVisible/);
  assert.doesNotMatch(presenter, /role="button"\s+tabIndex=\{0\}\s+aria-pressed/);
  assert.match(css, /\.presenter-knowledge-inline-sentence\.is-active\s*\{\s*background: #fef3c7;/);
  assert.match(css, /\.presenter-knowledge-checks-reveal/);
  assert.doesNotMatch(css, /\.presenter-knowledge-inline-sentence\.is-active[\s\S]{0,120}box-shadow/);
});

