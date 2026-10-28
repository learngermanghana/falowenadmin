import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { transformWithEsbuild } from 'vite';
const require = createRequire(import.meta.url);
const React = require('react');
const { JSDOM } = require('jsdom');

test('A1–C2 controls retain questions, reports use live marks and switching class clears results', async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'https://admin.falowen.app/teaching-slides/course/A1/a1-3-6?present=1&classRecordId=LnvBRAxp5IjmQZzfM6eY&classId=LnvBRAxp5IjmQZzfM6eY&sessionDate=2026-10-12',
    pretendToBeVisual: true,
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  dom.window.localStorage.setItem('falowen:presenter:last-class', 'A1 Hamburg Klasse');
  const { createRoot } = require('react-dom/client');
  const context = await transformWithEsbuild(fs.readFileSync('src/utils/presenterClassContext.js', 'utf8'), 'presenterClassContext.js', { format: 'cjs' });
  const contextModule = { exports: {} };
  new Function('module', 'exports', context.code)(contextModule, contextModule.exports);
  const checks = [{ questionDe: 'Welche Antwort ist richtig?', answerDe: 'Die richtige Antwort.' }, { questionDe: 'Frage zwei', answerDe: 'Antwort zwei' }, { questionDe: 'Exit', answerDe: 'Exit-Antwort' }];
  let loads = 0;
  const loadedClasses = [];
  const liveSession = { liveState: {}, hasSnapshot: false, isToday: true, isRemoteState: false, classRecordId: '', deviceId: 'test-device', publish: async () => {} };
  const mocks = {
    '../hooks/usePresenterLiveSession.js': { __esModule: true, default: () => liveSession },
    '../services/presenterLiveSessionService.js': { setPresenterClassContext() {} },
    '../utils/presenterClassContext.js': contextModule.exports,
    '../utils/presenterConceptLabels.js': { presenterConceptLabel: (_question, options = {}) => options.fallback || 'Lesson concept' },
    '../utils/presenterSlidePhotos.js': { getPresenterSlidePhoto: () => null },
    '../services/classesService.js': { listClasses: async () => [
      { id: 'other', classId: 'A1 Hamburg Klasse', name: 'A1 Hamburg Klasse', level: 'A1' },
      { id: 'LnvBRAxp5IjmQZzfM6eY', classId: 'A1 Berlin Klasse', name: 'A1 Berlin Klasse', level: 'A1' },
    ] },
    '../services/studentsService.js': { listStudentsByClass: async id => { loads += 1; loadedClasses.push(id); return [{ id: 'ama', studentCode: 'ama', name: 'Ama Mensah', email: 'ama@example.com' }]; } },
    '../services/classParticipationService.js': { getCurrentClassParticipationSession: async () => ({ session: null, records: [] }), saveClassParticipationSession: async () => ({}) },
    '../utils/a1PresenterQuestionPool.js': { buildA1PresenterQuestionPool: questions => questions.map((q, i) => ({ ...q, id: `q-${i}`, poolPosition: i + 1, poolSize: questions.length })), resultLabel: value => value },
    '../utils/presenterReadingShare.js': { buildFairReadingAssignments: () => [], buildReadingChunks: () => [], incrementReadingHistory: x => x },
    '../data/teacherSlideSupport.js': { buildTeacherSlideSupport: () => ({ modelExamplesDe: [], commonMistakesEn: [] }) },
    '../data/a1GrammarChecks.js': { getA1GrammarChecks: () => checks },
    '../data/a1PresenterUnderstandingChecks.js': { getA1PresenterUnderstandingChecks: () => checks },
    '../data/a1CheckCoaching.js': { buildA1CheckCoaching: check => check ? { hintDe: 'Denke an die Regel.', feedbackQuestionDe: 'Gut?', checkDe: 'Prüfe die Regel.' } : null },
    '../data/a1EverydaySpeaking.js': { getA1EverydaySpeaking: () => null },
    './A1EverydaySpeakingStage.jsx': { __esModule: true, default: () => null },
    './PublishedSongLessonStage.jsx': { __esModule: true, default: () => null },
    '../data/curatedLessonMusic.js': { getCuratedMusicByAssignment: () => null },
    '../data/a1LearningPath.js': { getA1LearningPath: () => null },
    '../data/a1SlideReview.js': { buildA1SlideReviewChecks: () => [] },
    '../utils/a1PresenterActivityTimer.js': { A1_ACTIVITY_TIMER_PRESETS: [2, 5, 7], DEFAULT_A1_ACTIVITY_MINUTES: 5, a1ActivityDeadline: () => 0, a1ActivitySecondsLeft: () => 300 },
    './PresenterSessionTimer.jsx': { __esModule: true, default: () => null },
  };
  for (const range of ['1To5', '6To10', '11To15', '16To20', '21To24']) {
    mocks[`../data/a1Days${range}Understanding.js`] = {
      [`getA1Days${range}QuickChecks`]: () => range === '1To5' ? [checks[0]] : null,
      [`getA1Days${range}ApplicationChecks`]: () => null,
    };
  }
  async function compile(path) {
    const { code } = await transformWithEsbuild(fs.readFileSync(path, 'utf8'), path, { loader: 'jsx', format: 'cjs', jsx: 'automatic' });
    const module = { exports: {} };
    const mockRequire = name => name.endsWith('.css') ? {} : mocks[name] || require(name);
    new Function('require', 'module', 'exports', code)(mockRequire, module, module.exports);
    return module.exports;
  }
  mocks['../utils/presenterLessonReport.js'] = await compile('src/utils/presenterLessonReport.js');
  mocks['./PresenterLessonReport.jsx'] = await compile('src/components/PresenterLessonReport.jsx');
  mocks['./PresenterControls.jsx'] = await compile('src/components/PresenterControls.jsx');
  mocks['./PresenterStudentPicker.jsx'] = await compile('src/components/PresenterStudentPicker.jsx');
  const Presenter = (await compile('src/components/A1GrammarPresenter.jsx')).default;
  const root = createRoot(document.getElementById('root'));
  const click = async node => React.act(async () => { node.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
  const button = label => [...document.querySelectorAll('button')].find(node => node.textContent.trim() === label);
  try {
    await React.act(async () => { root.render(React.createElement(Presenter, { slide: { id: 'a1-3-6', assignmentId: 'A1-3.6', course: 'A1', title: 'Day 14' }, topicLabel: 'A1', onExit() {} })); });
    await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
    assert.equal(document.querySelector('.presenter-student-class-select select').value, 'A1 Berlin Klasse');
    assert.ok(loadedClasses.includes('A1 Berlin Klasse'));
    assert.equal(button('Pick student').disabled, false);
    const settledLoads = loads;
    await click(document.querySelector('.presenter-footer button:last-of-type'));
    await click(button('A1-Lernhilfe · vor der Antwort'));
    assert.ok(document.querySelector('.presenter-a1-check-hint')?.textContent.includes('Denke an die Regel.'));
    await click(button('Antwort anzeigen'));
    assert.ok(document.querySelector('.presenter-model-support')?.textContent.includes('Die richtige Antwort.'));
    assert.equal(document.querySelector('.presenter-a1-check-hint'), null);
    assert.equal(loads, settledLoads, 'revealing support must not reload the roster');
    await click(document.querySelector('.presenter-footer button:last-of-type'));
    await click(button('Pick student'));
    assert.ok(document.querySelector('.presenter-student-current').textContent.includes('Ama Mensah'));
    const selectedQuestion = document.querySelector('.presenter-question').textContent.trim();
    const selectedCheck = checks.find(check => check.questionDe === selectedQuestion);
    assert.ok(selectedCheck, 'a distinct question must be assigned to the picked student');
    await click(button('Antwort anzeigen'));
    assert.ok(document.querySelector('.presenter-model-support')?.textContent.includes(selectedCheck.answerDe));
    assert.equal(document.querySelector('.presenter-question').textContent.trim(), selectedQuestion);
    assert.equal(loads, settledLoads, 'picking and revealing an answer must not restart roster restore');
    await click(button('Needs review'));
    await click(button('Lesson report'));
    assert.ok(document.querySelector('dialog').open);
    assert.ok(document.querySelector('dialog').textContent.includes(selectedQuestion));
    assert.equal(document.querySelector('dialog tbody tr td').textContent, '1');
    await click(button('Back to lesson'));
    assert.equal(document.querySelector('dialog'), null);
    assert.equal(document.querySelector('.presenter-question').textContent.trim(), selectedQuestion);
    const select = document.querySelector('.presenter-student-class-select select');
    await React.act(async () => { select.value = 'A1 Hamburg Klasse'; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    assert.equal(select.value, 'A1 Hamburg Klasse', 'the URL must not prevent a later manual class switch');
    await click(button('Lesson report'));
    assert.equal(document.querySelector('dialog tbody tr td').textContent, '0', 'switching class must not leak the previous class results');
    await click(button('Back to lesson'));

    mocks['../utils/teachingPresenter.js'] = {
      buildTeachingPresenterStages: () => [
        { id: 'intro', type: 'intro', title: 'Lesson introduction' },
        { id: 'questions', type: 'question-reveal', title: 'Speaking', items: ['First question?', 'Second question?'] },
      ],
      clampPresenterIndex: (i, n) => Math.max(0, Math.min(n - 1, i)),
      getSpeakingQuestionModel: () => null, isTeachingPresenterV2Slide: () => true,
    };
    mocks['../utils/warmupText.js'] = { splitWarmupQuestionSegments: text => [{ text }] };
    mocks['../utils/presenterSentenceNumbering.js'] = { numberedPresenterSentences: () => [] };
    mocks['../data/a2B1LessonProfile.js'] = { getA2B1AdminLessonProfileForSlide: () => null };
    mocks['../data/b1Day18CareerChallenge.js'] = { nextB1Day18CareerIndex: () => 0 };
    for (const name of ['C2GrammarTeaching', 'B1HousingChoicePractice', 'A2SportMatchmaker']) mocks[`./${name}.jsx`] = { __esModule: true, default: () => null };
    const SharedPresenter = (await compile('src/components/TeachingSlidePresenter.jsx')).default;
    for (const level of ['A2', 'B1', 'B2', 'C1', 'C2']) {
      await React.act(async () => root.render(React.createElement(SharedPresenter, { key: level, slide: {
        id: `${level}-lesson`, course: level, assignmentId: `${level}-1.1`, title: 'Practice',
        workbookConnection: { workbookUrl: `/campus/course/${level}-lesson` },
      }, onExit() {} })));
      await click(button('Next slide →'));
      assert.ok(document.querySelector('main').textContent.includes('First question?'));
      await click(button('Pick student'));
      await click(button('Needs review'));
      await click(button('Next question →'));
      assert.ok(document.querySelector('main').textContent.includes('Second question?'));
      await click(button('Finish lesson · report'));
      assert.ok(document.querySelector('dialog').textContent.includes('First question?'), `${level} records the question marked for review`);
      assert.equal(document.querySelector('dialog a').href, `https://www.falowen.app/campus/course/${level}-lesson`);
      await click(button('Back to lesson'));
      assert.ok(document.querySelector('main').textContent.includes('Second question?'));
      await click(button('← Previous'));
      assert.ok(document.querySelector('main').textContent.includes('First question?'));
    }
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
