import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, source) {
  fs.writeFileSync(path, source);
}

function insertOnce(source, anchor, insertion, label) {
  if (source.includes(insertion.trim())) return source;
  if (!source.includes(anchor)) throw new Error(`${label} anchor changed`);
  return source.replace(anchor, `${anchor}\n${insertion}`);
}

// Presenter participation toolbar: reuse the selected class for classroom shortcuts.
const pickerPath = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
let picker = read(pickerPath);
const toolsImport = 'import PresenterClassTools from "./PresenterClassTools.jsx";';
if (!picker.includes(toolsImport)) {
  const importAnchor = 'import { buildA1PresenterQuestionPool, resultLabel } from "../utils/a1PresenterQuestionPool.js";';
  if (!picker.includes(importAnchor)) throw new Error("Presenter class tools import anchor changed");
  picker = picker.replace(importAnchor, `${importAnchor}\n${toolsImport}`);
}
const toolsRender = `        <PresenterClassTools\n          slide={slide}\n          classId={selectedClassId}\n          className={selectedClass?.name || selectedClassId}\n        />`;
if (!picker.includes("<PresenterClassTools")) {
  const renderAnchor = '        <details className="presenter-student-more">';
  if (!picker.includes(renderAnchor)) throw new Error("Presenter class tools render anchor changed");
  picker = picker.replace(renderAnchor, `${toolsRender}\n\n${renderAnchor}`);
}
write(pickerPath, picker);

// Presenter launches from Live Classes now carry the exact class/session identity.
const dictionaryPath = new URL("../src/components/SessionDictionaryPicker.jsx", import.meta.url);
let dictionary = read(dictionaryPath);
if (!dictionary.includes("function buildPresenterHref(")) {
  const helperAnchor = `function entryLabel(entry = {}) {\n  const title = String(entry.en || entry.de || "").trim();\n  const chapter = String(entry.chapter || "").trim();\n  return \`${'${entry.assignment_id}${chapter ? ` · ${chapter}` : ""}${title ? ` — ${title}` : ""}'}\`;\n}`;
  if (!dictionary.includes(helperAnchor)) throw new Error("Session presenter helper anchor changed");
  const helpers = `\n\nfunction toDate(value) {\n  if (!value) return null;\n  if (typeof value?.toDate === "function") return value.toDate();\n  if (typeof value?.toMillis === "function") return new Date(value.toMillis());\n  if (typeof value === "object" && Number.isFinite(value.seconds)) {\n    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));\n  }\n  const parsed = value instanceof Date ? value : new Date(value);\n  return Number.isNaN(parsed.getTime()) ? null : parsed;\n}\n\nfunction buildPresenterHref({ slide, assignmentId, classId, className, session }) {\n  const params = new URLSearchParams({ present: "1" });\n  const resolvedClassId = String(classId || session?.classRecordId || session?.classId || "").trim();\n  const resolvedClassName = String(className || session?.className || "").trim();\n  const sessionId = String(session?.id || "").trim();\n  const sessionLabel = String(session?.topic || session?.title || "").trim();\n  const start = toDate(session?.startsAt);\n  const end = toDate(session?.endsAt);\n  if (resolvedClassId) params.set("classId", resolvedClassId);\n  if (resolvedClassName) params.set("className", resolvedClassName);\n  if (sessionId) params.set("sessionId", sessionId);\n  if (sessionLabel) params.set("sessionLabel", sessionLabel);\n  if (assignmentId) params.set("assignmentId", assignmentId);\n  if (start) params.set("sessionStartsAt", start.toISOString());\n  if (end) params.set("sessionEndsAt", end.toISOString());\n  return \`/teaching-slides/course/\${slide.course}/\${slide.id}?\${params.toString()}\`;\n}`;
  dictionary = dictionary.replace(helperAnchor, `${helperAnchor}${helpers}`);
}
if (!dictionary.includes('  classId = "",')) {
  const propsAnchor = `export default function SessionDictionaryPicker({\n  entries = [],\n  assignmentIds = [],`;
  if (!dictionary.includes(propsAnchor)) throw new Error("Session dictionary props anchor changed");
  dictionary = dictionary.replace(propsAnchor, `${propsAnchor}\n  classId = "",\n  className = "",\n  session = null,`);
}
const oldPresenterLink = '              to={`/teaching-slides/course/${slide.course}/${slide.id}?present=1`}';
const newPresenterLink = '              to={buildPresenterHref({ slide, assignmentId, classId, className, session })}';
if (!dictionary.includes(newPresenterLink)) {
  if (!dictionary.includes(oldPresenterLink)) throw new Error("Session presenter link anchor changed");
  dictionary = dictionary.replace(oldPresenterLink, newPresenterLink);
}
write(dictionaryPath, dictionary);

const liveClassesPath = new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url);
let liveClasses = read(liveClassesPath);
const oldClassState = '  const [selectedClassId, setSelectedClassId] = useState("");';
const newClassState = '  const [selectedClassId, setSelectedClassId] = useState(() => new URLSearchParams(window.location.search).get("classId") || "");';
if (!liveClasses.includes(newClassState)) {
  if (!liveClasses.includes(oldClassState)) throw new Error("Live Classes selected class anchor changed");
  liveClasses = liveClasses.replace(oldClassState, newClassState);
}
const oldTabState = '  const [activeTab, setActiveTab] = useState("overview");';
const newTabState = `  const [activeTab, setActiveTab] = useState(() => {\n    const requested = new URLSearchParams(window.location.search).get("tab") || "";\n    return tabs.some((tab) => tab.id === requested) ? requested : "overview";\n  });`;
if (!liveClasses.includes("const requested = new URLSearchParams(window.location.search).get(\"tab\")")) {
  if (!liveClasses.includes(oldTabState)) throw new Error("Live Classes tab anchor changed");
  liveClasses = liveClasses.replace(oldTabState, newTabState);
}
const pickerInvocationAnchor = `                    <SessionDictionaryPicker\n                      entries={dictionaryEntries}\n                      assignmentIds={curriculumIds(session)}`;
const pickerInvocationUpdated = `                    <SessionDictionaryPicker\n                      entries={dictionaryEntries}\n                      assignmentIds={curriculumIds(session)}\n                      classId={selectedClassId}\n                      className={dashboard?.klass?.name || ""}\n                      session={session}`;
if (!liveClasses.includes("                      session={session}")) {
  if (!liveClasses.includes(pickerInvocationAnchor)) throw new Error("Live Classes SessionDictionaryPicker anchor changed");
  liveClasses = liveClasses.replace(pickerInvocationAnchor, pickerInvocationUpdated);
}
write(liveClassesPath, liveClasses);

// Communication supports prefilled links from Presenter Mode.
const communicationPath = new URL("../src/pages/CommunicationPage.jsx", import.meta.url);
let communication = read(communicationPath);
if (!communication.includes("const initialParams = new URLSearchParams(window.location.search);")) {
  const savingAnchor = '  const [saving, setSaving] = useState(false);';
  if (!communication.includes(savingAnchor)) throw new Error("Communication prefill anchor changed");
  const effect = `\n\n  useEffect(() => {\n    const initialParams = new URLSearchParams(window.location.search);\n    const className = normalizeText(initialParams.get("className"));\n    const announcement = normalizeText(initialParams.get("announcement"));\n    const topic = normalizeText(initialParams.get("topic"));\n    const link = normalizeText(initialParams.get("link"));\n    const date = normalizeText(initialParams.get("date"));\n    if (!className && !announcement && !topic && !link && !date) return;\n    setForm((current) => ({\n      ...current,\n      className: className || current.className,\n      announcement: announcement || current.announcement,\n      topic: topic || current.topic,\n      link: link || current.link,\n      date: date || current.date,\n    }));\n  }, []);`;
  communication = communication.replace(savingAnchor, `${savingAnchor}${effect}`);
}
write(communicationPath, communication);

// Participation shortcut opens the class selected in Presenter Mode.
const participationPath = new URL("../src/pages/ClassParticipationPage.jsx", import.meta.url);
let participation = read(participationPath);
const oldParticipationSelection = '        if (active.length) setClassId(classIdOf(active[0]));';
const newParticipationSelection = `        if (active.length) {\n          const requestedClassId = new URLSearchParams(window.location.search).get("classId") || "";\n          const requested = active.find((entry) => classIdOf(entry) === requestedClassId);\n          setClassId(classIdOf(requested || active[0]));\n        }`;
if (!participation.includes("const requestedClassId = new URLSearchParams(window.location.search).get(\"classId\")")) {
  if (!participation.includes(oldParticipationSelection)) throw new Error("Class Participation selection anchor changed");
  participation = participation.replace(oldParticipationSelection, newParticipationSelection);
}
write(participationPath, participation);

// Replace browser mailto sharing with the existing Falowen Communication pipeline.
const slidesPath = new URL("../src/pages/TeachingSlidesPage.jsx", import.meta.url);
let slides = read(slidesPath);
const shareImport = 'import SlideClassShare from "../components/SlideClassShare.jsx";';
if (!slides.includes(shareImport)) {
  const shareImportAnchor = 'import StudentCourseSlides from "../components/StudentCourseSlides.jsx";';
  if (!slides.includes(shareImportAnchor)) throw new Error("Teaching Slides share import anchor changed");
  slides = slides.replace(shareImportAnchor, `${shareImportAnchor}\n${shareImport}`);
}
const detailOld = '      <div className="no-print"><SlideEmailShare courseId={courseId} /></div>';
const detailNew = '      <div className="no-print"><SlideClassShare courseId={courseId} slide={slide} /></div>';
if (!slides.includes(detailNew)) {
  if (!slides.includes(detailOld)) throw new Error("Teaching Slides detail share anchor changed");
  slides = slides.replace(detailOld, detailNew);
}
if (!slides.includes('<SlideClassShare courseId={courseId} />')) {
  const printIndex = slides.indexOf("function SlidePrintPack");
  if (printIndex < 0) throw new Error("Teaching Slides print pack anchor changed");
  const head = slides.slice(0, printIndex);
  let tail = slides.slice(printIndex);
  const printSharePattern = /        <div className="slide-email-share">[\s\S]*?          <p className="slide-email-help">\{loadingRecipients \? "Loading student emails\.\.\." : `Recipients with email: \$\{recipientEmails\.length\}`}<\/p>\n        <\/div>/;
  if (!printSharePattern.test(tail)) throw new Error("Teaching Slides print share block changed");
  tail = tail.replace(printSharePattern, '        <SlideClassShare courseId={courseId} />');
  slides = head + tail;
}
write(slidesPath, slides);

// Small responsive styling for Class tools inside the existing presenter toolbar.
const pickerCssPath = new URL("../src/components/PresenterStudentPicker.css", import.meta.url);
let pickerCss = read(pickerCssPath);
const cssMarker = "/* presenter-class-tools */";
if (!pickerCss.includes(cssMarker)) {
  pickerCss += `\n${cssMarker}\n.presenter-class-tools {\n  position: relative;\n  flex: 0 0 auto;\n}\n\n.presenter-class-tools > summary {\n  cursor: pointer;\n  list-style: none;\n  border: 1px solid #cbd5e1;\n  border-radius: 8px;\n  background: #fff;\n  padding: 0.45rem 0.7rem;\n  font-size: 0.78rem;\n  font-weight: 800;\n  white-space: nowrap;\n}\n\n.presenter-class-tools > summary::-webkit-details-marker { display: none; }\n\n.presenter-class-tools-panel {\n  position: absolute;\n  z-index: 45;\n  top: calc(100% + 0.5rem);\n  right: 0;\n  width: min(360px, 88vw);\n  border: 1px solid #cbd5e1;\n  border-radius: 12px;\n  background: #fff;\n  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.2);\n  padding: 0.8rem;\n}\n\n.presenter-class-tools-heading { display: grid; gap: 0.15rem; margin-bottom: 0.65rem; }\n.presenter-class-tools-heading small, .presenter-class-tools-help { color: #64748b; }\n.presenter-class-tools-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; }\n.presenter-class-tools-grid a, .presenter-class-tools-grid button, .presenter-class-tools-grid .is-disabled {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 38px;\n  border: 1px solid #cbd5e1;\n  border-radius: 8px;\n  background: #f8fafc;\n  color: #0f172a;\n  padding: 0.45rem 0.55rem;\n  text-align: center;\n  text-decoration: none;\n  font: inherit;\n  font-size: 0.75rem;\n  font-weight: 750;\n}\n.presenter-class-tools-grid button { cursor: pointer; }\n.presenter-class-tools-grid .is-disabled { opacity: 0.55; }\n.presenter-class-tools-help { display: block; margin-top: 0.6rem; font-size: 0.7rem; line-height: 1.35; }\n\n@media (max-width: 720px) {\n  .presenter-class-tools-panel { position: fixed; top: 4.5rem; right: 0.75rem; left: 0.75rem; width: auto; }\n}\n`;
}
write(pickerCssPath, pickerCss);

console.log("Presenter class tools, live-session context, and Falowen slide sharing are build-safe.");
