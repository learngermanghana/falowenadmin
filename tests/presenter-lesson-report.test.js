import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPresenterLessonReport, presenterWorkbookUrl } from '../src/utils/presenterLessonReport.js';

test('report counts recorded participation, keeps absent and unassessed distinct, and identifies review topics', () => {
  const roster = ['Ama', 'Kojo', 'Esi', 'Abena'].map(name => ({ name, key: name }));
  const report = buildPresenterLessonReport(roster, {
    Ama: { turns: 2, correct: 1, needsHelp: 1, responses: [{ result: 'needs_review', question: 'Wo oder wohin?' }] },
    Kojo: { skipped: 1, turns: 0 }, Esi: { turns: 0 },
    Abena: { turns: 1, needsHelp: 1, responses: [{ result: 'needs_review', question: 'Wo oder wohin?' }] },
    removed: { turns: 99, needsHelp: 99 },
  }, new Set(['Esi']));
  assert.deepEqual(report.participated.map(s => s.name), ['Ama', 'Abena']);
  assert.deepEqual(report.noTurn.map(s => s.name), ['Kojo']);
  assert.deepEqual(report.absent.map(s => s.name), ['Esi']);
  assert.deepEqual(report.topics, [{ topic: 'Wo oder wohin?', names: ['Ama', 'Abena'] }]);
  assert.equal(report.needsReview.length, 2);
});

test('report supports older marks without questions and does not fabricate workbook destinations', () => {
  const report = buildPresenterLessonReport([{ key: 'ama', name: 'Ama' }], { ama: { turns: 1, needsReview: 1 } });
  assert.equal(report.needsReview.length, 1);
  assert.deepEqual(report.topics, []);
  assert.equal(presenterWorkbookUrl({}), '');
  assert.equal(presenterWorkbookUrl({ workbookConnection: { workbookUrl: 'javascript:alert(1)' } }), '');
  assert.equal(presenterWorkbookUrl({ workbookConnection: { workbookUrl: '/campus/course/day-15?assignmentId=A2-6.15' } }), 'https://www.falowen.app/campus/course/day-15?assignmentId=A2-6.15');
});
