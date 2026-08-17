import { readFile, writeFile } from "node:fs/promises";

const repairPath = new URL("../src/components/LiveClassLessonDateRepair.jsx", import.meta.url);
const sessionsPath = new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url);
const eventName = "falowen:live-class-schedule-changed";

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchLiveClassRepairRefresh.mjs`);
  return source.replace(before, after);
}

let repairSource = await readFile(repairPath, "utf8");
const refreshBefore = "      await refresh();\n";
const refreshAfter = `      await refresh();\n      window.dispatchEvent(new CustomEvent("${eventName}", { detail: { classId } }));\n`;

if (!repairSource.includes(`new CustomEvent("${eventName}"`)) {
  const matches = repairSource.match(/      await refresh\(\);\n/g) || [];
  if (matches.length < 2) throw new Error("LiveClassLessonDateRepair refresh anchors changed; expected repair and restore refreshes");
  repairSource = repairSource.replace(refreshBefore, refreshAfter);
  repairSource = repairSource.replace(refreshBefore, refreshAfter);
}
await writeFile(repairPath, repairSource);

let sessionsSource = await readFile(sessionsPath, "utf8");
const listenerAnchor = "\n  const levelId = useMemo(() => resolveLevel(dashboard?.klass || {}), [dashboard?.klass]);";
const listenerBlock = `\n  useEffect(() => {\n    let active = true;\n\n    async function handleRepairedSchedule(event) {\n      const changedClassId = String(event?.detail?.classId || \"\").trim();\n      if (!changedClassId || changedClassId !== selectedClassId) return;\n      setLoading(true);\n      try {\n        const next = await getCompatibleClassDashboard(changedClassId);\n        if (!active) return;\n        setDashboard(next);\n        setMessage(next.curriculumSync?.error || \"Timetable repaired. Sessions refreshed.\");\n      } catch (error) {\n        if (active) setMessage(error?.message || \"Could not refresh the repaired timetable\");\n      } finally {\n        if (active) setLoading(false);\n      }\n    }\n\n    window.addEventListener("${eventName}", handleRepairedSchedule);\n    return () => {\n      active = false;\n      window.removeEventListener("${eventName}", handleRepairedSchedule);\n    };\n  }, [selectedClassId]);\n\n  const levelId = useMemo(() => resolveLevel(dashboard?.klass || {}), [dashboard?.klass]);`;

sessionsSource = replaceRequired(sessionsSource, listenerAnchor, listenerBlock, "Live Classes repaired-schedule refresh listener");
await writeFile(sessionsPath, sessionsSource);

console.log("Live Classes now refreshes the Sessions table immediately after timetable repair.");
