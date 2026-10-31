const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseDays, trackIdFromPath, normalizeResponse, reportBody, registerMusicAnalyticsRoutes,
} = require('../functions/musicAnalytics.js');

function report(rows) {
  return { rows: rows.map(([label, number]) => ({
    dimensionValues: [{ value: label }],
    metricValues: [{ value: String(number) }],
  })) };
}

test('only supported date ranges are accepted', () => {
  assert.equal(parseDays('1'), 1);
  assert.equal(parseDays('30'), 30);
  assert.equal(parseDays('9999'), 7);
});

test('song paths use GA4 built-in pagePathPlusQueryString dimension', () => {
  assert.equal(trackIdFromPath('/?track=r2-a1-day-22'), 'r2-a1-day-22');
  assert.equal(trackIdFromPath('https://music.falowen.app/?track=B1-X'), 'B1-X');
  assert.equal(trackIdFromPath('/music/songs/A2-27.html'), 'A2-27');
  assert.equal(trackIdFromPath('https://other.example/?track=not-ours'), '');
  assert.equal(trackIdFromPath('/'), '');
});

test('GA4 report filters hostname and requested song-play event', () => {
  const query = reportBody(7, ['pagePathPlusQueryString'], ['eventCount'], { filter: { fieldName: 'eventName', stringFilter: { value: 'music_play' } } });
  assert.deepEqual(query.dateRanges, [{ startDate: '6daysAgo', endDate: 'today' }]);
  assert.equal(query.dimensionFilter.andGroup.expressions[0].filter.fieldName, 'hostName');
  assert.equal(query.dimensionFilter.andGroup.expressions[1].filter.fieldName, 'eventName');
});

test('report transforms aggregates and maps song metadata without reading private listening records', () => {
  const result = normalizeResponse({
    days: 7,
    summary: { rows: [{ metricValues: [{ value: '23' }, { value: '49' }] }] },
    events: report([['music_play', 17], ['music_complete', 9], ['music_share', 2], ['music_signup_click', 1]]),
    songs: report([['/?track=r2-a1-day-02', 12], ['/?track=r2-a2-day-04', 5], ['/unknown', 90]]),
    countries: report([['Ghana', 20], ['Germany', 3]]),
    daily: report([['20261031', 23]]),
    catalog: new Map([['r2-a1-day-02', { title: 'Ich heiße Bina', level: 'A1', day: 2 }]]),
    now: Date.UTC(2026, 9, 31),
  });
  assert.equal(result.visitors, 23);
  assert.equal(result.pageViews, 49);
  assert.equal(result.plays, 17);
  assert.equal(result.completions, 9);
  assert.equal(result.classClicks, 1);
  assert.equal(result.topTracks.length, 2);
  assert.equal(result.topTracks[0].title, 'Ich heiße Bina');
  assert.equal(result.levels[0].level, 'A1');
  assert.equal(result.daily[0].date, '2026-10-31');
});

function responseMock() {
  return {
    statusCode: 200,
    body: null,
    set() { return this; },
    status(n) { this.statusCode = n; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('GA4 endpoint denies unauthenticated and nonowner users, skips GA calls if not configured', async () => {
  let endpoint;
  const app = { get(path, handler) { assert.equal(path, '/music-analytics/summary'); endpoint = handler; } };
  let externalCalls = 0;
  const env = { HOEREN_STUDIO_OWNER_UID: 'the-owner' };
  registerMusicAnalyticsRoutes({
    app,
    env,
    verifyToken: async token => ({ uid: token }),
    getAccessToken: async () => { externalCalls++; return 'forbidden-test'; },
  });
  const anon = responseMock();
  await endpoint({ get: () => '', query: {} }, anon);
  assert.equal(anon.statusCode, 401);
  const staff = responseMock();
  await endpoint({ get: () => 'Bearer staff', query: {} }, staff);
  assert.equal(staff.statusCode, 403);
  const owner = responseMock();
  await endpoint({ get: () => 'Bearer the-owner', query: { days: '7' } }, owner);
  assert.equal(owner.body.configured, false);
  assert.equal(externalCalls, 0);
});
