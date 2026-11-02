import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SOCIAL_PHOTO_GALLERY, SOCIAL_PHOTO_CATEGORIES, SOCIAL_PHOTO_LICENSE_URL,
  filterSocialPhotos, socialPhotoImageUrl,
} from "../src/data/socialPhotoGallery.js";

const page = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("gallery uses a small fixed collection of source-attributed, commercially usable Pexels photos", () => {
  assert.equal(SOCIAL_PHOTO_GALLERY.length, 20, "replace the 9 used photos with 20 fresh choices");
  assert.equal(new Set(SOCIAL_PHOTO_GALLERY.map(photo => photo.photoId)).size, 20);
  assert.deepEqual(
    SOCIAL_PHOTO_CATEGORIES,
    ["All", "Students", "Online learning", "Study spaces", "Germany"],
  );
  const replacedPhotoIds = [6146987, 5940708, 6281831, 5965559, 895465, 17556501, 606539, 15348624, 34220597];
  for (const id of replacedPhotoIds) {
    assert.equal(SOCIAL_PHOTO_GALLERY.some(photo => photo.photoId === id), false, "old photo " + id + " removed");
  }
  assert.deepEqual(new Set(SOCIAL_PHOTO_GALLERY.map(x => x.id)).size, SOCIAL_PHOTO_GALLERY.length);
  assert.ok(SOCIAL_PHOTO_LICENSE_URL.startsWith("https://www.pexels.com/"));
  for (const item of SOCIAL_PHOTO_GALLERY) {
    assert.ok(item.title && item.category && item.photographer && item.tags);
    assert.ok(SOCIAL_PHOTO_CATEGORIES.includes(item.category));
    assert.match(item.source, new RegExp("^https://www\\.pexels\\.com/photo/.+-" + item.photoId + "/$"));
    assert.match(socialPhotoImageUrl(item), new RegExp("images\\.pexels\\.com/photos/" + item.photoId + "/pexels-photo-" + item.photoId));
  }
});

test("gallery filters by type and words, and image sizes are bounded", () => {
  assert.equal(filterSocialPhotos("Students", "").every(x => x.category === "Students"), true);
  assert.equal(filterSocialPhotos("Germany", "Berlin").length, 2);
  assert.equal(filterSocialPhotos("All", "not a real category").length, 0);
  assert.match(socialPhotoImageUrl(SOCIAL_PHOTO_GALLERY[0], 999999), /w=1800$/);
  assert.match(socialPhotoImageUrl(SOCIAL_PHOTO_GALLERY[0], 4), /w=240$/);
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
  assert.match(picker, /crossOrigin = "anonymous"/);
  assert.match(picker, /canvas\.toDataURL\("image\/jpeg"/);
  assert.match(picker, /onSelect\(localImage, photo\)/);
  assert.match(picker, /role="alert"/);
  assert.match(picker, /Show only unused pictures/);
  assert.match(picker, /Mark used/);
  assert.match(picker, /falowen-social-gallery-used-v1/);
  assert.match(picker, /localStorage\.setItem\(USED_PHOTOS_KEY/);
  assert.match(vocab, /data:image/);
  assert.match(ads, /setPhotoUrl\(image\)/);
  assert.match(classes, /setPhotoSrc\(image\)/);
});
