export const SESSION_MINUTES_BY_LEVEL = Object.freeze({
  A1: 60,
  A2: 90,
  B1: 90,
});

function normalize(value) {
  return String(value || "").trim();
}

export function presenterSessionMinutes(level = "") {
  return SESSION_MINUTES_BY_LEVEL[normalize(level).toUpperCase()] || 0;
}

export function presenterSessionDurationSeconds(level = "") {
  return presenterSessionMinutes(level) * 60;
}
