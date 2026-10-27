const PUBLIC_CLASS_ENDPOINTS = [
  "/api/public/classes",
];

async function fetchJson(url, fetchImpl = fetch) {
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetchImpl(`${url}${separator}fresh=${Date.now()}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body?.classes)) {
    throw new Error(`${url} did not return a public classes array`);
  }
  return body.classes;
}

function startKey(course = {}) {
  return String(course.startDate || "").slice(0, 10) || "9999-12-31";
}

export async function loadShareablePublicClasses(fetchImpl = fetch) {
  const failures = [];
  for (const endpoint of PUBLIC_CLASS_ENDPOINTS) {
    try {
      const classes = await fetchJson(endpoint, fetchImpl);
      return [...classes].sort((left, right) => {
        const dateDiff = startKey(left).localeCompare(startKey(right));
        if (dateDiff !== 0) return dateDiff;
        return String(left.title || left.name || "").localeCompare(String(right.title || right.name || ""));
      });
    } catch (error) {
      failures.push(error?.message || String(error));
    }
  }
  throw new Error(failures.join(" | ") || "Public class catalogue is unavailable.");
}

export { PUBLIC_CLASS_ENDPOINTS };
