const expectedSha = String(process.argv[2] || process.env.EXPECTED_SHA || process.env.GITHUB_SHA || "").trim();
const baseUrl = String(
  process.env.PRODUCTION_BUILD_IDENTITY_URL ||
    "https://admin.falowen.app/__falowen-admin-build.json",
).trim();
const timeoutMs = Number(process.env.PRODUCTION_HEALTH_TIMEOUT_MS || 12 * 60 * 1000);
const intervalMs = Number(process.env.PRODUCTION_HEALTH_INTERVAL_MS || 15 * 1000);

if (!expectedSha) {
  console.error("Expected commit SHA is required.");
  process.exit(2);
}

const startedAt = Date.now();
let lastObserved = "";

while (Date.now() - startedAt <= timeoutMs) {
  const url = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
  try {
    const response = await fetch(url, {
      headers: { "cache-control": "no-cache" },
      redirect: "follow",
    });
    if (response.ok) {
      const payload = await response.json();
      const observed = String(payload?.commitSha || "").trim();
      if (observed && observed !== lastObserved) {
        console.log(`Admin production currently reports ${observed}.`);
        lastObserved = observed;
      }
      if (observed === expectedSha) {
        console.log(`Admin production is healthy and matches ${expectedSha}.`);
        process.exit(0);
      }
    } else {
      console.log(`Admin production identity returned HTTP ${response.status}; retrying.`);
    }
  } catch (error) {
    console.log(`Admin production identity check failed: ${error?.message || error}; retrying.`);
  }
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

console.error(
  `Admin production did not reach ${expectedSha} within ${Math.round(timeoutMs / 60000)} minutes. Last observed: ${lastObserved || "none"}.`,
);
process.exit(1);
