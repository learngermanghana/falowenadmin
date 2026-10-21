const text = value => String(value || '').trim();
const count = value => Math.max(0, Number(value) || 0);

export function buildPresenterLessonReport(roster = [], stats = {}, absentKeys = new Set()) {
  const students = roster.map(entry => {
    const row = stats[entry.key] || {};
    return { key: entry.key, name: entry.name, turns: count(row.turns), correct: count(row.correct),
      needsReview: count(row.needsHelp ?? row.needsReview), absent: absentKeys.has(entry.key),
      reviews: (Array.isArray(row.responses) ? row.responses : [])
        .filter(response => response.result === 'needs_review')
        .map(response => text(response.sourceQuestion || response.question || response.questionContext))
        .filter(Boolean),
    };
  });
  const active = students.filter(student => !student.absent);
  const topics = new Map();
  students.forEach(student => new Set(student.reviews).forEach(topic => {
    topics.set(topic, [...(topics.get(topic) || []), student.name]);
  }));
  return { students, participated: students.filter(student => student.turns > 0),
    noTurn: active.filter(student => !student.turns), absent: students.filter(student => student.absent),
    needsReview: students.filter(student => student.needsReview > 0),
    topics: [...topics].map(([topic, names]) => ({ topic, names })),
  };
}

export function presenterWorkbookUrl(slide = {}) {
  const value = text(slide.workbookConnection?.workbookUrl);
  if (!value) return '';
  try {
    const url = new URL(value, 'https://www.falowen.app');
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}
