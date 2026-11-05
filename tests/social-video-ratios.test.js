import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SOCIAL_VIDEO_ASPECTS, socialVideoDimensions, drawSocialPosterVideoFrame } from "../src/utils/socialVideoFormats.js";

const file = relative => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
test("TikTok and other export presets have correct real pixel aspect ratios", () => {
  assert.deepEqual(SOCIAL_VIDEO_ASPECTS.map(row => row.id), ["tiktok", "portrait", "square", "landscape"]);
  const values = [
    ["tiktok", "standard", 720, 1280, 9/16],
    ["tiktok", "full", 1080, 1920, 9/16],
    ["portrait", "standard", 720, 900, 4/5],
    ["portrait", "full", 1080, 1350, 4/5],
    ["square", "full", 1080, 1080, 1],
    ["landscape", "standard", 1280, 720, 16/9],
  ];
  for (const [id, quality, width, height, ratio] of values) {
    const actual = socialVideoDimensions(id, quality);
    assert.equal(actual.width, width);
    assert.equal(actual.height, height);
    assert.equal(actual.width / actual.height, ratio);
  }
});
test("poster framing keeps original content visible in TikTok, feed, square and landscape", () => {
  const draws = [];
  const ctx = {
    save() {}, restore() {}, clearRect() {}, fillRect() {},
    set fillStyle(value) { this.color = value; },
    set globalAlpha(value) { this.alpha = value; },
    drawImage(...args) { draws.push(args); },
  };
  const poster = { width: 1080, height: 1920 };
  for (const aspect of SOCIAL_VIDEO_ASPECTS) {
    const {width,height} = socialVideoDimensions(aspect.id,"standard");
    draws.length = 0;
    assert.equal(drawSocialPosterVideoFrame(ctx, poster, width, height, 2, 15), true);
    const [image,x,y,w,h] = draws.at(-1);
    assert.equal(image, poster);
    assert.ok(x >= -0.001 && y >= -0.001, aspect.id);
    assert.ok(x+w <= width+.001 && y+h <= height+.001, aspect.id);
    assert.equal(Math.round(w/h * 1e6), Math.round(poster.width/poster.height * 1e6));
  }
});
test("Ads and Motivation, Vocabulary and Upcoming Classes expose music loops and exact video aspect selectors", () => {
  const ads = file("src/components/SocialAdsDictionary.jsx");
  const vocab = file("src/components/SocialVocabularyVideoCreator.jsx");
  const classes = file("src/pages/SocialMediaPage.jsx");
  for (const text of [ads, vocab, classes]) {
    assert.match(text, /SocialMusicPicker/);
    assert.match(text, /SOCIAL_VIDEO_ASPECTS/);
    assert.match(text, /socialVideoDimensions\(/);
    assert.match(text, /videoAspect/);
  }
  assert.match(ads, /recordSocialPosterVideo/);
  assert.match(classes, /recordSocialPosterVideo/);
  assert.match(ads, /Export PNG/);
  assert.match(classes, /downloadCampaignPack/);
  assert.match(vocab, /renderVocabularyAspectFrame/);
  assert.match(vocab, /drawSocialPosterVideoFrame/);
  assert.match(vocab, /Export \{videoAspect === "tiktok" \? "TikTok 9:16"/);
});
