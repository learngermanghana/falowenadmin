import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SOCIAL_ADS_DICTIONARY } from "../src/data/socialAdsDictionary.js";

const source = readFileSync(new URL("../src/components/SocialAdsDictionary.jsx", import.meta.url), "utf8");

test("advert dictionary retains its 21 scheduled posts and separate motivation posts", () => {
  assert.equal(SOCIAL_ADS_DICTIONARY.length, 21);
  assert.ok(SOCIAL_ADS_DICTIONARY.some((item) => item.type === "ad"));
  assert.ok(SOCIAL_ADS_DICTIONARY.some((item) => item.type === "motivation"));
  assert.match(source, /SOCIAL_ADS_DICTIONARY\.map/);
});

test("uploaded photos use adjustable brightness, crops and face-friendly overlay instead of a fixed 70-percent wash", () => {
  assert.match(source, /brightness:\s*112/);
  assert.match(source, /overlay:\s*45/);
  assert.match(source, /ctx\.filter = "brightness\("/);
  assert.match(source, /drawOverlay\(ctx, w, h, design\)/);
  assert.match(source, /sourceX = \(img\.width - sourceW\)/);
  assert.match(source, /sourceY = \(img\.height - sourceH\)/);
  assert.match(source, /Photo horizontal position/);
  assert.match(source, /Photo vertical position/);
  assert.match(source, /Soft vignette/);
  assert.doesNotMatch(source, /rgba\(4,19,46,\.70\)/);
});

test("social advert layout renders benefit line, accent heading, CTA and website in all three image sizes", () => {
  assert.match(source, /portrait:\s*\[1080,\s*1350\]/);
  assert.match(source, /square:\s*\[1080,\s*1080\]/);
  assert.match(source, /story:\s*\[1080,\s*1920\]/);
  assert.match(source, /accentedText\(ctx, line/);
  assert.match(source, /Benefit line \(optional\)/);
  assert.match(source, /Yellow CTA text/);
  assert.match(source, /falowen\.app/);
  assert.match(source, /ctx\.measureText\(text\)\.width/);
});

test("design defaults are explicit browser-local settings and failed photos cannot be exported", () => {
  assert.match(source, /Save as my default/);
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(source, /saved only in this browser/);
  assert.match(source, /setReady\(false\); setError\(err\.message\)/);
  assert.match(source, /disabled=\{!ready\}/);
  assert.match(source, /Export PNG/);
  assert.match(source, /Copy caption \+ hashtags/);
});
