import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SOCIAL_PHOTO_GALLERY, SOCIAL_PHOTO_CATEGORIES, SOCIAL_PHOTO_LICENSE_URL,
  filterSocialPhotos, socialPhotoImageUrl,
} from "../src/data/socialPhotoGallery.js";

const page = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("gallery has 20 source-attributed, African-centred Pexels photos", () => {
  assert.equal(SOCIAL_PHOTO_GALLERY.length, 20, "keep twenty African-centred options for future posters");
  assert.equal(new Set(SOCIAL_PHOTO_GALLERY.map(photo => photo.photoId)).size, 20);
  assert.deepEqual(
    SOCIAL_PHOTO_CATEGORIES,
    ["All", "Ghana & Africa", "Students", "Online learning", "Teachers"],
  );
  const replacedPhotoIds = [
    16420458,8199165,29558433,5940844,6281829,6238120,6549361,
    4492189,7594214,8055482,8472882,20593094,6446245,7670739,5538622,
    37120347,12903730,4213371,18899163,21316226,
  ];
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
  assert.equal(filterSocialPhotos("Ghana & Africa", "").length, 3);
  assert.equal(filterSocialPhotos("Online learning", "").length, 5);
  assert.equal(filterSocialPhotos("Teachers", "").length, 4);
  assert.ok(filterSocialPhotos("All", "Ghana").length >= 1);
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
  assert.match(picker, /illustrative stock photos/);
  assert.match(picker, /including real scenes from Ghana and Africa/);
  assert.match(picker, /Mark used/);
  assert.match(picker, /falowen-social-gallery-used-v1/);
  assert.match(picker, /localStorage\.setItem\(USED_PHOTOS_KEY/);
  assert.match(vocab, /data:image/);
  assert.match(ads, /setPhotoUrl\(image\)/);
  assert.match(classes, /setPhotoSrc\(image\)/);
});
