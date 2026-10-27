import test from "node:test";
import assert from "node:assert/strict";
import { readPresenterClassContext, requestedPresenterClass } from "../src/utils/presenterClassContext.js";

test("the linked A1 Berlin document ID resolves ahead of a saved/default class", () => {
  const context = readPresenterClassContext('?classId=LnvBRAxp5IjmQZzfM6eY&classRecordId=LnvBRAxp5IjmQZzfM6eY&sessionDate=2026-10-12');
  const classes = [
    { id: 'other', classId: 'A1 Hamburg Klasse', name: 'A1 Hamburg Klasse' },
    { id: 'LnvBRAxp5IjmQZzfM6eY', classId: 'A1 Berlin Klasse', name: 'A1 Berlin Klasse' },
  ];
  assert.equal(requestedPresenterClass(classes, context).name, 'A1 Berlin Klasse');
  assert.equal(context.sessionDate, '2026-10-12');
});

test("class document identity takes priority, names remain supported, and missing context keeps normal selection", () => {
  const classes = [{ id: 'berlin', classId: 'A1 Berlin Klasse' }, { id: 'hamburg', name: 'A1 Hamburg Klasse' }];
  assert.equal(requestedPresenterClass(classes, { classRecordId: 'berlin', classId: 'A1 Hamburg Klasse' }).id, 'berlin');
  assert.equal(requestedPresenterClass(classes, { classId: 'a1 berlin klasse' }).id, 'berlin');
  assert.equal(requestedPresenterClass(classes, {}), null);
});
