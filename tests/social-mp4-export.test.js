import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chooseSocialMp4Mime, chooseSocialVideoFormat, requireValidSocialMp4, requireValidSocialVideo} from "../src/utils/socialMp4Export.js";

test("MP4 MIME remains genuine, with explicit WebM fallback", () => {
  assert.equal(chooseSocialMp4Mime(type => type === "video/mp4"), "video/mp4");
  assert.equal(chooseSocialMp4Mime(type => type.includes("webm")), "");
  const supports = type => type === "video/webm;codecs=vp8,opus";
  assert.deepEqual(chooseSocialVideoFormat(supports, "auto"), {mime:"video/webm;codecs=vp8,opus",extension:"webm"});
  assert.equal(chooseSocialVideoFormat(supports, "mp4"), null);
  assert.deepEqual(chooseSocialVideoFormat(supports, "webm"), {mime:"video/webm;codecs=vp8,opus",extension:"webm"});
});

test("export validates real MP4 and WebM container signatures", async () => {
  const mp4 = new Blob([Uint8Array.from([0,0,0,12,102,116,121,112,105,115,111,109])],{type:"video/mp4"});
  const webm = new Blob([Uint8Array.from([0x1a,0x45,0xdf,0xa3,0x00])],{type:"video/webm"});
  assert.equal(await requireValidSocialMp4(mp4),mp4);
  assert.equal(await requireValidSocialVideo(webm,{extension:"webm"}),webm);
  await assert.rejects(() => requireValidSocialMp4(new Blob(["WebM"],{type:"video/mp4"})),/not MP4/i);
  await assert.rejects(() => requireValidSocialVideo(new Blob(["not webm"],{type:"video/webm"}),{extension:"webm"}),/valid WebM/);
});

test("both video exporters validate container and use matching extension", () => {
  for (const file of ["SocialVocabularyVideoCreator.jsx","SocialGermanChallenges.jsx"]) {
    const source = readFileSync(new URL("../src/components/"+file,import.meta.url),"utf8");
    assert.match(source,/await requireValidSocialVideo\(blob,/);
    assert.match(source,/\.extension/);
  }
  const vocabulary = readFileSync(new URL("../src/components/SocialVocabularyVideoCreator.jsx",import.meta.url),"utf8");
  assert.equal([...vocabulary.matchAll(/await requireValidSocialVideo\(blob, mime\)/g)].length,2);
  assert.equal([...vocabulary.matchAll(/videoFileStem\(word\) \+ "-" \+ duration \+ "s\." \+ mime\.extension/g)].length,2);
});
