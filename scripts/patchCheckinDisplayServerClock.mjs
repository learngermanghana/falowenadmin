import fs from "node:fs";

const file = "src/pages/CheckinDisplayPage.jsx";
let source = fs.readFileSync(file, "utf8");

const authoritativeClockMaterialized = [
  "const serverClockAnchorRef = useRef(null);",
  "const syncAuthoritativeClock = async () => {",
  "serverClockAnchorRef.current = {",
  "serverTimeMs: authoritativeMs",
  "return anchor.serverTimeMs + (performance.now() - anchor.performanceMs);",
].every((marker) => source.includes(marker));

if (!authoritativeClockMaterialized) {
  const stateBefore = `  const [nowMs, setNowMs] = useState(() => Date.now());`;
  const stateAfter = `  const [nowMs, setNowMs] = useState(() => Date.now());
  const [clockOffsetMs, setClockOffsetMs] = useState(0);`;
  if (!source.includes(stateAfter)) {
    if (!source.includes(stateBefore)) throw new Error("Check-in display clock state anchor missing");
    source = source.replace(stateBefore, stateAfter);
  }

  const timerBefore = `  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);`;
  const timerAfter = `  useEffect(() => {
    let active = true;
    const syncServerClock = async () => {
      const sentAt = Date.now();
      try {
        const response = await fetch(\`\${window.location.origin}/?clock=\${sentAt}\`, {
          method: "HEAD",
          cache: "no-store",
        });
        const serverAt = Date.parse(response.headers.get("date") || "");
        const receivedAt = Date.now();
        if (!active || !Number.isFinite(serverAt)) return;
        const requestMidpoint = Math.round((sentAt + receivedAt) / 2);
        setClockOffsetMs(serverAt - requestMidpoint);
      } catch (error) {
        console.warn("Could not synchronize check-in display clock", error);
      }
    };

    syncServerClock();
    const syncTimer = window.setInterval(syncServerClock, 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(syncTimer);
    };
  }, []);

  useEffect(() => {
    const refreshClock = () => setNowMs(Date.now() + clockOffsetMs);
    refreshClock();
    const timer = window.setInterval(refreshClock, 1000);
    return () => window.clearInterval(timer);
  }, [clockOffsetMs]);`;
  if (!source.includes("syncServerClock")) {
    if (!source.includes(timerBefore)) throw new Error("Check-in display timer anchor missing");
    source = source.replace(timerBefore, timerAfter);
  }
}

fs.writeFileSync(file, source, "utf8");
console.log(
  authoritativeClockMaterialized
    ? "Check-in display already uses the authoritative attendance server clock."
    : "Check-in display countdown is synchronized to the server clock.",
);
