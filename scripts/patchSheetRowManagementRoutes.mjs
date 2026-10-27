import { readFileSync, writeFileSync } from "node:fs";

const path = "functions/index.js";
let source = readFileSync(path, "utf8");

function insertBefore(marker, block, label) {
  if (source.includes(block.trim())) return;
  const index = source.indexOf(marker);
  if (index === -1) throw new Error(`Could not find marker for ${label}`);
  source = `${source.slice(0, index)}\n${block}\n${source.slice(index)}`;
}

const classScheduleRoute = `
app.post("/class-schedule/remove-row", async (req, res) => {
  try {
    await requireAuth(req);

    const appsScriptUrl = String(classScheduleAppsScriptUrlSecret.value() || process.env.CLASS_SCHEDULE_APPS_SCRIPT_URL || "").trim();
    const syncSecret = String(classScheduleSyncSecret.value() || process.env.CLASS_SCHEDULE_SYNC_SECRET || "").trim();

    if (!appsScriptUrl) return res.status(500).json({ error: "Missing required env var: CLASS_SCHEDULE_APPS_SCRIPT_URL" });
    if (!syncSecret) return res.status(500).json({ error: "Missing required env var: CLASS_SCHEDULE_SYNC_SECRET" });

    const body = req.body || {};
    const rowNumber = Number(body.rowNumber || body.sheetRowNumber);
    if (!Number.isInteger(rowNumber) || rowNumber < 2) {
      return res.status(400).json({ error: "rowNumber must be a sheet row number greater than 1" });
    }

    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "removeClassScheduleRow",
        secret: syncSecret,
        rowNumber,
        className: String(body.className || "").trim(),
        row: body.row || {},
      }),
    });

    const responseJson = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok || responseJson?.ok === false) {
      return res.status(502).json({ error: "Class schedule row request failed", details: responseJson });
    }

    return res.json(Object.keys(responseJson).length ? responseJson : { ok: true, rowNumber });
  } catch (e) {
    return res.status(401).json({ error: e?.message || "Unauthorized" });
  }
});
`;

const orientationRoute = `
app.post("/orientation/remove-row", async (req, res) => {
  try {
    await requireAuth(req);

    const appsScriptUrl = String(orientationAppsScriptUrlSecret.value() || process.env.ORIENTATION_APPS_SCRIPT_URL || "").trim();
    const syncSecret = String(orientationSyncSecret.value() || process.env.ORIENTATION_SYNC_SECRET || "").trim();

    if (!appsScriptUrl) return res.status(500).json({ error: "Missing required env var: ORIENTATION_APPS_SCRIPT_URL" });
    if (!syncSecret) return res.status(500).json({ error: "Missing required env var: ORIENTATION_SYNC_SECRET" });

    const body = req.body || {};
    const rowNumber = Number(body.rowNumber || body.sheetRowNumber);
    if (!Number.isInteger(rowNumber) || rowNumber < 2) {
      return res.status(400).json({ error: "rowNumber must be a sheet row number greater than 1" });
    }

    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "removeOrientationRow",
        secret: syncSecret,
        rowNumber,
        email: String(body.email || "").trim(),
        studentCode: String(body.studentCode || "").trim(),
        row: body.row || {},
      }),
    });

    const responseJson = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok || responseJson?.ok === false) {
      return res.status(502).json({ error: "Orientation row request failed", details: responseJson });
    }

    return res.json(Object.keys(responseJson).length ? responseJson : { ok: true, rowNumber });
  } catch (e) {
    return res.status(401).json({ error: e?.message || "Unauthorized" });
  }
});
`;

insertBefore('app.post("/orientation/sync", async (req, res) => {', classScheduleRoute, "class schedule row route");
insertBefore("function safeRegistryId", orientationRoute, "orientation row route");

writeFileSync(path, source);
console.log("Sheet row management routes are present in functions/index.js.");
