import fs from "node:fs";

const file = "src/pages/CheckinDisplayPage.jsx";
let source = fs.readFileSync(file, "utf8");

const stateBefore = `  const [nowMs, setNowMs] = useState(() => Date.now());`;
const stateAfter = `  const [nowMs, setNowMs] = useState(() => Date.now());\n  const [clockOffsetMs, setClockOffsetMs] = useState(0);`;
if (!source.includes(stateAfter)) {
  if (!source.includes(stateBefore)) throw new Error("Check-in display clock state anchor missing");
  source = source.replace(stateBefore, stateAfter);
}

const timerBefore = `  useEffect(() => {\n    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);\n    return () => window.clearInterval(timer);\n  }, []);`;
const timerAfter = `  useEffect(() => {\n    let active = true;\n    const syncServerClock = async () => {\n      const sentAt = Date.now();\n      try {\n        const response = await fetch(\`${"${window.location.origin}"}/?clock=${"${sentAt}"}\`, {\n          method: "HEAD",\n          cache: "no-store",\n        });\n        const serverAt = Date.parse(response.headers.get("date") || "");\n        const receivedAt = Date.now();\n        if (!active || !Number.isFinite(serverAt)) return;\n        const requestMidpoint = Math.round((sentAt + receivedAt) / 2);\n        setClockOffsetMs(serverAt - requestMidpoint);\n      } catch (error) {\n        console.warn("Could not synchronize check-in display clock", error);\n      }\n    };\n\n    syncServerClock();\n    const syncTimer = window.setInterval(syncServerClock, 5 * 60 * 1000);\n    return () => {\n      active = false;\n      window.clearInterval(syncTimer);\n    };\n  }, []);\n\n  useEffect(() => {\n    const refreshClock = () => setNowMs(Date.now() + clockOffsetMs);\n    refreshClock();\n    const timer = window.setInterval(refreshClock, 1000);\n    return () => window.clearInterval(timer);\n  }, [clockOffsetMs]);`;
if (!source.includes("syncServerClock")) {
  if (!source.includes(timerBefore)) throw new Error("Check-in display timer anchor missing");
  source = source.replace(timerBefore, timerAfter);
}

fs.writeFileSync(file, source, "utf8");
console.log("Check-in display countdown is synchronized to the server clock.");
