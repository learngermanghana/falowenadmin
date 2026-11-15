import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SOCIAL_PHOTO_GALLERY, SOCIAL_PHOTO_CATEGORIES, filterSocialPhotos,
} from "../src/data/socialPhotoGallery.js";

const page = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("only ten local African learning scenes are available", () => {
  assert.equal(SOCIAL_PHOTO_GALLERY.length, 10);
  assert.equal(new Set(SOCIAL_PHOTO_GALLERY.map(photo => photo.id)).size, 10);
  for (const photo of SOCIAL_PHOTO_GALLERY) {
    assert.ok(SOCIAL_PHOTO_CATEGORIES.includes(photo.category));
    assert.match(photo.path, /^\/social-photos\/.+\.webp$/);
    assert.equal(readFileSync(new URL("../public" + photo.path, import.meta.url)).toString("ascii", 8, 12), "WEBP");
  }
  assert.doesNotMatch(page("src/data/socialPhotoGallery.js"), /pexels/i);
});

test("gallery filters by category and search text", () => {
  assert.equal(filterSocialPhotos("All", "").length, 10);
  assert.ok(filterSocialPhotos("Students", "").length > 0);
  assert.ok(filterSocialPhotos("Online learning", "").every(photo => photo.category === "Online learning"));
  assert.ok(filterSocialPhotos("Ghana & Africa", "Nairobi").length > 0);
  assert.equal(filterSocialPhotos("All", "not a real category").length, 0);
});

test("all three poster editors use the shared, export-safe picker", () => {
  const ads = page("src/components/SocialAdsDictionary.jsx");
  const classes = page("src/pages/SocialMediaPage.jsx");
  const vocab = page("src/components/SocialVocabularyCreator.jsx");
  const picker = page("src/components/SocialPhotoGallery.jsx");
  for (const editor of [ads, classes, vocab]) {
    assert.match(editor, /import SocialPhotoGallery from/);
    assert.match(editor, /<SocialPhotoGallery/);
    assert.match(editor, /setSelectedGalleryId/);
  }
  assert.match(picker, /candidate.src = photo.path/);
  assert.match(picker, /canvas\.toDataURL\("image\/jpeg"/);
  assert.match(picker, /onSelect\(localImage, photo\)/);
  assert.match(picker, /role="alert"/);
  assert.match(picker, /Show only unused pictures/);
  assert.match(picker, /Images are illustrative/);
  assert.match(picker, /AI-generated African learning scene/);
  assert.match(picker, /Mark used/);
  assert.match(picker, /falowen-social-gallery-used-v1/);
  assert.match(picker, /localStorage\.setItem\(USED_PHOTOS_KEY/);
  assert.match(vocab, /data:image/);
  assert.match(ads, /setPhotoUrl\(image\)/);
  assert.match(classes, /setPhotoSrc\(image\)/);
});
