'use strict';

// Owner-only read-only GA4 reporting; no per-listen Firestore documents, jobs or AI.
// GA4 built-in pagePathPlusQueryString dimension identifies tracks, so no GA custom
// dimension registration (or paid reporting export) is required.
const { isStudioOwner } = require('./hoerenStudioApi');

const DAY_OPTIONS = new Set([1, 7, 30]);
const CACHE_MS = 15 * 60 * 1000;
const analyticsCache = new Map();
const inFlight = new Map();

function parseDays(raw) {
  const value = Number(raw);
  return DAY_OPTIONS.has(value) ? value : 7;
}

function cleanCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function firstMetric(report, index = 0) {
  return cleanCount(report?.rows?.[0]?.metricValues?.[index]?.value);
}

function reportRows(report) {
  return Array.isArray(report?.rows) ? report.rows : [];
}

function value(row, index = 0) {
  return String(row?.dimensionValues?.[index]?.value || '').trim();
}

function metric(row) {
  return cleanCount(row?.metricValues?.[0]?.value);
}

function trackIdFromPath(path) {
  if (typeof path !== 'string' || path.length > 600) return '';
  try {
    const url = new URL(path, 'https://music.falowen.app');
    if (url.hostname !== 'music.falowen.app') return '';
    if (url.searchParams.has('track')) return String(url.searchParams.get('track') || '').slice(0, 180);
    const m = url.pathname.match(/^\/music\/songs\/([^/]+)\.html$/);
    return m ? decodeURIComponent(m[1]).slice(0, 180) : '';
  } catch {
    return '';
  }
}

function simpleFilter(name, expected) {
  return { filter: { fieldName: name, stringFilter: { matchType: 'EXACT', value: expected } } };
}

function reportBody(days, dimensions, metrics, additionalFilter) {
  const filters = [simpleFilter('hostName', 'music.falowen.app')];
  if (additionalFilter) filters.push(additionalFilter);
  return {
    dateRanges: [{ startDate: days === 1 ? 'today' : String(days - 1) + 'daysAgo', endDate: 'today' }],
    ...(dimensions?.length ? { dimensions: dimensions.map(name => ({ name })) } : {}),
    metrics: metrics.map(name => ({ name })),
    dimensionFilter: filters.length === 1 ? filters[0] : { andGroup: { expressions: filters } },
    limit: '1000',
  };
}

async function gaReport({ propertyId, accessToken, body, fetchImpl }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    const response = await fetchImpl(
      'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      const error = new Error('GA4 reporting request failed');
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadTrackCatalog(fetchImpl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const result = await fetchImpl('https://music.falowen.app/music/catalog.json', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!result.ok) return new Map();
      const body = await result.json();
      const songs = Array.isArray(body.tracks) ? body.tracks : [];
      return new Map(songs
        .filter(track => typeof track.id === 'string')
        .map(track => [track.id, {
          title: String(track.title || track.id).slice(0, 160),
          level: String(track.level || 'Unknown').toUpperCase(),
          day: Number(track.day) || null,
        }]));
    } finally {
      clearTimeout(timeout);
    }
  } catch { return new Map(); }
}

function normalizeResponse({ days, summary, events, songs, countries, daily, catalog, now = Date.now() }) {
  const eventTotals = Object.fromEntries(reportRows(events).map(row => [value(row), metric(row)]));
  const grouped = new Map();
  for (const row of reportRows(songs)) {
    const id = trackIdFromPath(value(row));
    if (!id) continue;
    grouped.set(id, (grouped.get(id) || 0) + metric(row));
  }
  const topTracks = Array.from(grouped.entries()).map(([id, plays]) => {
    const known = catalog.get(id);
    const inferred = id.match(/(?:^|[-_])(A1|A2|B1|B2|C1|C2)(?:[-_]|$)/i);
    return {
      id,
      title: known?.title || id,
      level: known?.level || inferred?.[1]?.toUpperCase() || 'Unknown',
      day: known?.day || null,
      plays,
    };
  }).sort((a, b) => b.plays - a.plays);

  const levelMap = new Map();
  for (const track of topTracks) levelMap.set(track.level, (levelMap.get(track.level) || 0) + track.plays);

  const dateRows = reportRows(daily).map(row => {
    const date = value(row);
    return {
      date: /^\d{8}$/.test(date) ? date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8) : date,
      visitors: metric(row),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  return {
    ok: true,
    configured: true,
    days,
    generatedAt: new Date(now).toISOString(),
    visitors: firstMetric(summary),
    pageViews: firstMetric(summary, 1),
    plays: eventTotals.music_play || 0,
    completions: eventTotals.music_complete || 0,
    shares: eventTotals.music_share || 0,
    classClicks: eventTotals.music_signup_click || 0,
    topTracks: topTracks.slice(0, 30),
    levels: Array.from(levelMap.entries()).map(([level, plays]) => ({ level, plays })).sort((a, b) => b.plays - a.plays),
    countries: reportRows(countries).map(row => ({ country: value(row) || 'Unknown', visitors: metric(row) })).sort((a, b) => b.visitors - a.visitors).slice(0, 12),
    daily: dateRows,
    note: 'Opt-in GA4 data only. Reports can lag behind real-time listening.',
  };
}

async function loadReport({ propertyId, days, getAccessToken, fetchImpl, now }) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw Object.assign(new Error('Analytics access is not configured.'), { status: 403 });
  const requests = [
    reportBody(days, [], ['activeUsers', 'screenPageViews']),
    reportBody(days, ['eventName'], ['eventCount']),
    reportBody(days, ['pagePathPlusQueryString'], ['eventCount'], simpleFilter('eventName', 'music_play')),
    reportBody(days, ['country'], ['activeUsers']),
    reportBody(days, ['date'], ['activeUsers']),
  ];
  const [summary, events, songs, countries, daily] = await Promise.all(
    requests.map(body => gaReport({ propertyId, accessToken, body, fetchImpl })),
  );
  const catalog = await loadTrackCatalog(fetchImpl);
  return normalizeResponse({ days, summary, events, songs, countries, daily, catalog, now });
}

function registerMusicAnalyticsRoutes({
  app,
  verifyToken,
  runtimeConfig = {},
  getAccessToken = async () => {
    const { GoogleAuth } = require('google-auth-library');
    return new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/analytics.readonly'] }).getAccessToken();
  },
  fetchImpl = global.fetch,
  env = process.env,
  now = () => Date.now(),
}) {
  app.get('/music-analytics/summary', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    let uid;
    try {
      const match = String(req.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
      if (!match) return res.status(401).json({ ok: false, error: 'Sign in to Falowen Admin.' });
      const decoded = await verifyToken(match[1]);
      uid = decoded?.uid;
      if (!uid) return res.status(401).json({ ok: false, error: 'Invalid admin session.' });
      if (!isStudioOwner(uid, runtimeConfig, env)) return res.status(403).json({ ok: false, error: 'Owner access required.' });
    } catch {
      return res.status(401).json({ ok: false, error: 'Invalid admin session.' });
    }

    const propertyId = String(env.FALOWEN_MUSIC_GA4_PROPERTY_ID || '').trim();
    if (!/^\d{6,20}$/.test(propertyId)) {
      return res.json({
        ok: true,
        configured: false,
        message: 'Set FALOWEN_MUSIC_GA4_PROPERTY_ID on the Falowen Admin Firebase Function and give its service account Viewer access to that GA4 property.',
      });
    }

    const days = parseDays(req.query.days);
    const cacheKey = propertyId + ':' + days;
    const cached = analyticsCache.get(cacheKey);
    if (cached && now() - cached.at < CACHE_MS) return res.json(cached.report);

    try {
      if (!inFlight.has(cacheKey)) {
        const task = loadReport({ propertyId, days, getAccessToken, fetchImpl, now: now() })
          .then(report => {
            analyticsCache.set(cacheKey, { at: now(), report });
            return report;
          }).finally(() => inFlight.delete(cacheKey));
        inFlight.set(cacheKey, task);
      }
      return res.json(await inFlight.get(cacheKey));
    } catch (error) {
      console.error('music_analytics_report_failed', { status: error?.status || 500, message: error?.message });
      const message = error?.status === 403
        ? 'Give the Firebase Function service account Viewer access to the GA4 property and enable Google Analytics Data API.'
        : 'Unable to load GA4 reports. Check property ID, Data API access, and reporting quota.';
      return res.status(502).json({ ok: false, error: message });
    }
  });
}

module.exports = { registerMusicAnalyticsRoutes, parseDays, trackIdFromPath, normalizeResponse, reportBody };
