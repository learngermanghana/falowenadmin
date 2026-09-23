export const SESSION_MINUTES_BY_LEVEL = Object.freeze({
  A1: 60,
  A2: 90,
  B1: 90,
});

function normalize(value) {
  return String(value || "").trim();
}

export function inferPresenterLevel(...values) {
  for (const value of values) {
    const match = normalize(value).toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
    if (match) return match[1];
  }
  return "";
}

export function presenterSessionMinutes(level = "") {
  return SESSION_MINUTES_BY_LEVEL[normalize(level).toUpperCase()] || 0;
}

export function presenterSessionDurationSeconds(level = "") {
  return presenterSessionMinutes(level) * 60;
}
