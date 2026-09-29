import fs from "node:fs";
import path from "node:path";

const raw = String(process.env.CLOUD_RUNTIME_CONFIG || "{}").trim() || "{}";

try {
  JSON.parse(raw);
} catch (error) {
  throw new Error(`CLOUD_RUNTIME_CONFIG must be valid JSON: ${error.message}`);
}

const target = path.resolve(process.argv[2] || "functions/.env");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(
  target,
  `CLOUD_RUNTIME_CONFIG=${JSON.stringify(raw)}\n`,
  { mode: 0o600 },
);

console.log(
  `Prepared Firebase runtime config at ${target} (configured=${raw !== "{}"})`,
);
