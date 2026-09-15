import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiPath = path.join(root, "functions", "index.js");
const routerPath = path.join(root, "api", "router.js");

let apiSource = fs.readFileSync(apiPath, "utf8");
const routeMarker = 'app.get("/attendanceAutomationConfig"';
if (!apiSource.includes(routeMarker)) {
  const anchor = 'app.get("/checkinStatus", async (req, res) => {';
  if (!apiSource.includes(anchor)) {
    throw new Error("Could not add attendance automation config route: checkinStatus anchor missing.");
  }

  const route = `app.get("/attendanceAutomationConfig", async (_req, res) => {
  try {
    const attendance = runtimeConfig.attendance || {};
    const clamp = (value, fallback, minimum, maximum) => {
      const parsed = Number(value);
      const resolved = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
      return Math.max(minimum, Math.min(maximum, Math.round(resolved)));
    };
    return res.json({
      ok: true,
      autoOpenEnabled: attendance.auto_open_enabled !== false,
      autoOpenLeadMinutes: clamp(attendance.auto_open_lead_minutes, 30, 1, 240),
      autoOpenWindowMinutes: clamp(attendance.auto_open_window_minutes, 180, 30, 720),
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Could not resolve attendance automation configuration" });
  }
});

`;
  apiSource = apiSource.replace(anchor, `${route}${anchor}`);
  fs.writeFileSync(apiPath, apiSource, "utf8");
}

let routerSource = fs.readFileSync(routerPath, "utf8");
if (!routerSource.includes('"attendanceAutomationConfig"')) {
  const anchor = '  "health",';
  if (!routerSource.includes(anchor)) {
    throw new Error("Could not proxy attendance automation config: API route allow-list anchor missing.");
  }
  routerSource = routerSource.replace(anchor, `  "attendanceAutomationConfig",\n${anchor}`);
  fs.writeFileSync(routerPath, routerSource, "utf8");
}

console.log("Attendance automation config endpoint is available for Session Health.");
