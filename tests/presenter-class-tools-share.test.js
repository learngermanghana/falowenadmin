import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("presenter participation toolbar exposes class tools", async () => {
  const [picker, tools] = await Promise.all([
    source("src/components/PresenterStudentPicker.jsx"),
    source("src/components/PresenterClassTools.jsx"),
  ]);
  assert.match(picker, /PresenterClassTools/);
  assert.match(picker, /classId=\{selectedClassId\}/);
  assert.match(tools, />Open check-in</);
  assert.match(tools, />Copy check-in link</);
  assert.match(tools, />Attendance</);
  assert.match(tools, />Students</);
  assert.match(tools, />Participation</);
  assert.match(tools, />Message class</);
  assert.match(tools, />Workbook</);
});

test("Live Classes passes exact class and session context into Presenter Mode", async () => {
  const [picker, liveClasses] = await Promise.all([
    source("src/components/SessionDictionaryPicker.jsx"),
    source("src/pages/LiveClassesPageV2.jsx"),
  ]);
  assert.match(picker, /function buildPresenterHref/);
  assert.match(picker, /params\.set\("classId"/);
  assert.match(picker, /params\.set\("sessionId"/);
  assert.match(picker, /params\.set\("sessionStartsAt"/);
  assert.match(picker, /params\.set\("sessionEndsAt"/);
  assert.match(liveClasses, /classId=\{selectedClassId\}/);
  assert.match(liveClasses, /session=\{session\}/);
  assert.match(liveClasses, /get\("classId"\)/);
  assert.match(liveClasses, /get\("tab"\)/);
});

test("Teaching Slides shares through Falowen Communication instead of the browser mail client", async () => {
  const [page, share] = await Promise.all([
    source("src/pages/TeachingSlidesPage.jsx"),
    source("src/components/SlideClassShare.jsx"),
  ]);
  assert.match(page, /<SlideClassShare courseId=\{courseId\} slide=\{slide\} \/>/);
  assert.match(page, /<SlideClassShare courseId=\{courseId\} \/>/);
  assert.match(share, /saveAnnouncementRow/);
  assert.match(share, /deliveryMode: "auto"/);
  assert.match(share, /topic: "Teaching Slides"/);
  assert.doesNotMatch(share, /mailto:/);
});

test("presenter shortcuts preselect Communication, Participation and Live Classes views", async () => {
  const [communication, participation, tools] = await Promise.all([
    source("src/pages/CommunicationPage.jsx"),
    source("src/pages/ClassParticipationPage.jsx"),
    source("src/components/PresenterClassTools.jsx"),
  ]);
  assert.match(communication, /initialParams\.get\("className"\)/);
  assert.match(communication, /initialParams\.get\("topic"\)/);
  assert.match(communication, /initialParams\.get\("link"\)/);
  assert.match(participation, /get\("classId"\)/);
  assert.match(tools, /tab: "students"/);
  assert.match(tools, /\/class-participation/);
  assert.match(tools, /\/communication/);
});
