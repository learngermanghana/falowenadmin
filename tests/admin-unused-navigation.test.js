import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../src/pages/DashboardPage.jsx', import.meta.url), 'utf8');
const menu = app.slice(app.indexOf('function TopBar()'), app.indexOf('function ToastViewport()'));

test('Admin navigation hides unused Lesson Video Studio and Exam Review', () => {
  assert.doesNotMatch(menu, /<Link to="\/lesson-video-studio"/);
  assert.doesNotMatch(menu, /<Link to="\/examTutorReviewQueue"/);
  assert.match(menu, /<Link to="\/music-studio"/);
  assert.match(menu, /<Link to="\/marking"/);
  assert.match(menu, /<Link to="\/teaching-slides"/);
  assert.match(menu, /<Link to="\/exam-tracking"/);
});

test('Admin dashboard no longer promotes unused Exam Review shortcut', () => {
  assert.doesNotMatch(dashboard, /to="\/examTutorReviewQueue"/);
  assert.match(dashboard, /label="Open Marking"/);
  assert.match(dashboard, /label="Open Grammar Issues"/);
});

test('direct pages, permissions, data and review workflow routes remain intact', () => {
  assert.match(app, /<Route path="\/lesson-video-studio" element=\{<OwnerStudioRoute lesson \/>\} \/>/);
  assert.match(app, /<Route path="\/examTutorReviewQueue" element=\{<ExamReviewRoute \/>\} \/>/);
  assert.match(app, /<Route path="\/examTutorReviewQueue\/:reviewId" element=\{<ExamReviewRoute \/>\} \/>/);
  assert.match(app, /function ExamReviewRoute\(\)/);
});
