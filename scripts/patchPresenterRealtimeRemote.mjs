import fs from "node:fs";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchPresenterRealtimeRemote.mjs`);
  return source.replace(before, after);
}

function addImportBeforeCss(source, cssImport, importLines, label) {
  if (importLines.every((line) => source.includes(line))) return source;
  if (!source.includes(cssImport)) throw new Error(`${label} css import anchor changed.`);
  const missing = importLines.filter((line) => !source.includes(line));
  return source.replace(cssImport, `${missing.join("\n")}\n${cssImport}`);
}

function ensureUseRef(source, label) {
  if (/import \{[^}]*\buseRef\b[^}]*\} from "react";/.test(source)) return source;
  const reactImport = source.match(/import \{([^}]*)\} from "react";/)?.[0];
  if (!reactImport) throw new Error(`${label} React import anchor changed.`);
  const next = reactImport.replace(/\} from "react";/, ", useRef } from \"react\";").replace(/,\s*,/g, ",");
  return source.replace(reactImport, next);
}

const hookImport = 'import usePresenterLiveSession from "../hooks/usePresenterLiveSession.js";';

// General teaching presenter: stage/question position follows the same selected class on every device.
const teachingTarget = new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url);
let teaching = fs.readFileSync(teachingTarget, "utf8");
teaching = ensureUseRef(teaching, "TeachingSlidePresenter");
teaching = addImportBeforeCss(
  teaching,
  'import "./TeachingSlidePresenter.css";',
  [hookImport],
  "TeachingSlidePresenter realtime",
);

teaching = replaceOnce(
  teaching,
  '  const [stageIndex, setStageIndex] = useState(0);',
  [
    '  const [stageIndex, setStageIndex] = useState(0);',
    '  const presenterLive = usePresenterLiveSession(slide);',
    '  const lastRemotePresenterSignatureRef = useRef("");',
  ].join("\n"),
  "TeachingSlidePresenter realtime state",
);

const teachingRealtimeEffects = `  useEffect(() => {
    const remote = presenterLive.liveState || {};
    const remoteStamp = Number(remote.presenterStageUpdatedAtMs || 0);
    if (!presenterLive.hasSnapshot || !presenterLive.isToday || !presenterLive.isRemoteState || !remoteStamp) return;
    if (String(remote.presenterLessonId || "").trim() !== String(slide?.id || slide?.assignmentId || "").trim()) return;
    const remoteStage = clampPresenterIndex(Number(remote.presenterStageIndex || 0), stages.length);
    const remoteQuestion = Math.max(0, Number(remote.presenterQuestionIndex || 0));
    const remoteSupport = Boolean(remote.presenterShowSupport);
    const signature = JSON.stringify([remoteStage, remoteQuestion, remoteSupport]);
    if (signature === lastRemotePresenterSignatureRef.current) return;
    lastRemotePresenterSignatureRef.current = signature;
    setStageIndex(remoteStage);
    setQuestionIndex(remoteQuestion);
    setShowQuestionSupport(remoteSupport);
  }, [presenterLive.liveState?.presenterStageUpdatedAtMs, presenterLive.hasSnapshot, presenterLive.isToday, presenterLive.isRemoteState, slide?.id, slide?.assignmentId, stages.length]);

  useEffect(() => {
    if (!presenterLive.classRecordId || !presenterLive.hasSnapshot) return undefined;
    const signature = JSON.stringify([stageIndex, questionIndex, showQuestionSupport]);
    if (signature === lastRemotePresenterSignatureRef.current) return undefined;
    const timer = window.setTimeout(() => {
      presenterLive.publish({
        presenterKind: "teaching",
        presenterLessonId: String(slide?.id || slide?.assignmentId || "").trim(),
        presenterStageIndex: stageIndex,
        presenterQuestionIndex: questionIndex,
        presenterShowSupport: showQuestionSupport,
        presenterStageUpdatedAtMs: Date.now(),
      });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [presenterLive.classRecordId, presenterLive.hasSnapshot, presenterLive.publish, slide?.id, slide?.assignmentId, stageIndex, questionIndex, showQuestionSupport]);

`;

teaching = replaceOnce(
  teaching,
  '  useEffect(() => {\n    function onKeyDown(event) {',
  `${teachingRealtimeEffects}  useEffect(() => {\n    function onKeyDown(event) {`,
  "TeachingSlidePresenter realtime effects",
);
fs.writeFileSync(teachingTarget, teaching);

// A1 presenter: stage/manual-check position is shared; participation question itself is synced by the picker.
const a1Target = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
let a1 = fs.readFileSync(a1Target, "utf8");
a1 = ensureUseRef(a1, "A1GrammarPresenter");
a1 = addImportBeforeCss(
  a1,
  'import "./TeachingSlidePresenter.css";',
  [hookImport],
  "A1GrammarPresenter realtime",
);

a1 = replaceOnce(
  a1,
  '  const [stageIndex, setStageIndex] = useState(0);',
  [
    '  const [stageIndex, setStageIndex] = useState(0);',
    '  const presenterLive = usePresenterLiveSession(slide);',
    '  const lastRemotePresenterSignatureRef = useRef("");',
  ].join("\n"),
  "A1GrammarPresenter realtime state",
);

const a1RealtimeEffects = `  useEffect(() => {
    const remote = presenterLive.liveState || {};
    const remoteStamp = Number(remote.presenterStageUpdatedAtMs || 0);
    if (!presenterLive.hasSnapshot || !presenterLive.isToday || !presenterLive.isRemoteState || !remoteStamp) return;
    if (String(remote.presenterLessonId || "").trim() !== String(slide?.id || slide?.assignmentId || "").trim()) return;
    const last = Math.max(0, stages.length - 1);
    const remoteStage = Math.min(last, Math.max(0, Number(remote.presenterStageIndex || 0)));
    const remoteItem = Math.max(0, Number(remote.presenterItemIndex || 0));
    const remoteAnswer = Boolean(remote.presenterShowAnswer);
    const signature = JSON.stringify([remoteStage, remoteItem, remoteAnswer]);
    if (signature === lastRemotePresenterSignatureRef.current) return;
    lastRemotePresenterSignatureRef.current = signature;
    setStageIndex(remoteStage);
    setItemIndex(remoteItem);
    setShowAnswer(remoteAnswer);
  }, [presenterLive.liveState?.presenterStageUpdatedAtMs, presenterLive.hasSnapshot, presenterLive.isToday, presenterLive.isRemoteState, slide?.id, slide?.assignmentId, stages.length]);

  useEffect(() => {
    if (!presenterLive.classRecordId || !presenterLive.hasSnapshot) return undefined;
    const signature = JSON.stringify([stageIndex, itemIndex, showAnswer]);
    if (signature === lastRemotePresenterSignatureRef.current) return undefined;
    const timer = window.setTimeout(() => {
      presenterLive.publish({
        presenterKind: "a1-grammar",
        presenterLessonId: String(slide?.id || slide?.assignmentId || "").trim(),
        presenterStageIndex: stageIndex,
        presenterItemIndex: itemIndex,
        presenterShowAnswer: showAnswer,
        presenterStageUpdatedAtMs: Date.now(),
      });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [presenterLive.classRecordId, presenterLive.hasSnapshot, presenterLive.publish, slide?.id, slide?.assignmentId, stageIndex, itemIndex, showAnswer]);

`;

a1 = replaceOnce(
  a1,
  '  useEffect(() => {\n    function onKeyDown(event) {',
  `${a1RealtimeEffects}  useEffect(() => {\n    function onKeyDown(event) {`,
  "A1GrammarPresenter realtime effects",
);
fs.writeFileSync(a1Target, a1);

// Student picker: class selection, fair-pick state, selected student/question and response timer sync in realtime.
const pickerTarget = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
let picker = fs.readFileSync(pickerTarget, "utf8");
picker = addImportBeforeCss(
  picker,
  'import "./PresenterStudentPicker.css";',
  [
    hookImport,
    'import { setPresenterClassContext } from "../services/presenterLiveSessionService.js";',
  ],
  "PresenterStudentPicker realtime",
);

if (!picker.includes('  const classRecordId = normalize(selectedClass?.id || selectedClass?.classRecordId);')) {
  if (picker.includes('  const classRecordId = normalize(selectedClass?.id);')) {
    picker = picker.replace(
      '  const classRecordId = normalize(selectedClass?.id);',
      '  const classRecordId = normalize(selectedClass?.id || selectedClass?.classRecordId);',
    );
  } else {
    picker = replaceOnce(
      picker,
      '  const roster = useMemo(() => rosterEntries(students), [students]);\n  const sessionIdentity =',
      '  const roster = useMemo(() => rosterEntries(students), [students]);\n  const classRecordId = normalize(selectedClass?.id || selectedClass?.classRecordId);\n  const sessionIdentity =',
      "PresenterStudentPicker class record id",
    );
  }
}

picker = replaceOnce(
  picker,
  '  const sessionIdentity = `${selectedClassId}|${assignmentId}|${sessionDate}`;',
  [
    '  const sessionIdentity = `${selectedClassId}|${assignmentId}|${sessionDate}`;',
    '  const presenterLive = usePresenterLiveSession(slide);',
    '  const lastRemotePickerStampRef = useRef(0);',
    '  const lastRemotePickerSignatureRef = useRef("");',
  ].join("\n"),
  "PresenterStudentPicker live hook",
);

const classContextEffect = `  useEffect(() => {
    setPresenterClassContext({ classId: selectedClassId, classRecordId });
  }, [selectedClassId, classRecordId]);

`;
picker = replaceOnce(
  picker,
  '  useEffect(() => {\n    if (!selectedClassId || !assignmentId) {',
  `${classContextEffect}  useEffect(() => {\n    if (!selectedClassId || !assignmentId) {`,
  "PresenterStudentPicker class context effect",
);

const remotePickerEffects = `  useEffect(() => {
    const remote = presenterLive.liveState || {};
    const remoteStamp = Number(remote.pickerUpdatedAtMs || 0);
    const remotePickerWriter = normalize(remote.pickerUpdatedByDeviceId);
    const remotePickerWriterStamp = Number(remote.pickerUpdatedByAtMs || 0);
    const pickerWriterMatchesUpdate = Boolean(
      remotePickerWriter
      && remotePickerWriterStamp > 0
      && remotePickerWriterStamp === remoteStamp
    );
    const pickerStateIsRemote = pickerWriterMatchesUpdate
      ? remotePickerWriter !== presenterLive.deviceId
      : normalize(remote.updatedBy) !== presenterLive.deviceId;
    if (!presenterLive.hasSnapshot || !presenterLive.isToday || !pickerStateIsRemote || !remoteStamp) return;
    if (normalize(remote.pickerAssignmentId) !== assignmentId) return;
    if (remoteStamp <= lastRemotePickerStampRef.current) return;

    const remoteKey = normalize(remote.pickerStudentKey);
    const remoteQuestionId = normalize(remote.pickerQuestionId);
    const remoteLastMarked = normalize(remote.pickerLastMarked);
    const remoteDeadline = Math.max(0, Number(remote.pickerResponseDeadline || 0));
    const remoteTimedOut = Boolean(remote.pickerResponseTimedOut) || (remoteDeadline > 0 && remoteDeadline <= Date.now());
    const remoteResponseSeconds = RESPONSE_TIME_PRESETS.includes(Number(remote.pickerResponseSeconds))
      ? Number(remote.pickerResponseSeconds)
      : responseSeconds;
    const remoteRoundPicked = Array.isArray(remote.pickerRoundPicked) ? remote.pickerRoundPicked.map(normalize).filter(Boolean) : [];
    const remoteRoundQuestionIds = Array.isArray(remote.pickerRoundQuestionIds) ? remote.pickerRoundQuestionIds.map(normalize).filter(Boolean) : [];
    const remoteAbsent = Array.isArray(remote.pickerAbsentKeys) ? remote.pickerAbsentKeys.map(normalize).filter(Boolean) : [];
    const signature = JSON.stringify([
      remoteKey,
      remoteQuestionId,
      Boolean(remote.pickerShowAnswer),
      remoteLastMarked,
      remoteDeadline,
      remoteTimedOut,
      remoteResponseSeconds,
      [...remoteRoundPicked].sort(),
      [...remoteRoundQuestionIds].sort(),
      [...remoteAbsent].sort(),
    ]);

    lastRemotePickerStampRef.current = remoteStamp;
    lastRemotePickerSignatureRef.current = signature;
    setCurrentKey(remoteKey);
    setCurrentQuestionId(remoteQuestionId);
    setShowQuestionAnswer(Boolean(remote.pickerShowAnswer));
    setLastMarked(remoteLastMarked);
    setResponseSeconds(remoteResponseSeconds);
    setResponseDeadline(remoteTimedOut ? 0 : remoteDeadline);
    setResponseRemaining(remoteTimedOut ? 0 : Math.max(0, Math.ceil((remoteDeadline - Date.now()) / 1000)));
    setResponseTimedOut(remoteTimedOut);
    setRoundPicked(new Set(remoteRoundPicked));
    setRoundQuestionIds(new Set(remoteRoundQuestionIds));
    setAbsentKeys(new Set(remoteAbsent));

    const remoteStats = remote.pickerStudentStats;
    if (remoteStats && typeof remoteStats === "object" && normalize(remoteStats.key)) {
      const statsKey = normalize(remoteStats.key);
      setStats((currentStats) => {
        const previous = currentStats[statsKey] || { name: normalize(remoteStats.name) || "Student", responses: [] };
        return {
          ...currentStats,
          [statsKey]: {
            ...previous,
            name: normalize(remoteStats.name) || previous.name || "Student",
            turns: Math.max(Number(previous.turns || 0), Number(remoteStats.turns || 0)),
            correct: Math.max(Number(previous.correct || 0), Number(remoteStats.correct || 0)),
            needsHelp: Math.max(Number(previous.needsHelp || previous.needsReview || 0), Number(remoteStats.needsHelp || 0)),
            skipped: Math.max(Number(previous.skipped || 0), Number(remoteStats.skipped || 0)),
            responses: Array.isArray(previous.responses) ? previous.responses : [],
          },
        };
      });
    }

    const remoteQuestion = questionPool.find((question) => question.id === remoteQuestionId) || null;
    if (remoteQuestion) {
      const poolPosition = questionPool.findIndex((question) => question.id === remoteQuestion.id) + 1;
      onQuestionChange?.({ ...remoteQuestion, poolPosition, poolSize: questionPool.length });
    } else {
      onQuestionChange?.(null);
    }
  }, [presenterLive.liveState?.pickerUpdatedAtMs, presenterLive.hasSnapshot, presenterLive.isToday, presenterLive.isRemoteState, presenterLive.deviceId, assignmentId, questionPool, onQuestionChange, responseSeconds]);

  useEffect(() => {
    if (!presenterLive.classRecordId || !presenterLive.hasSnapshot || !assignmentId) return undefined;
    const roundPickedValues = [...roundPicked].sort();
    const roundQuestionValues = [...roundQuestionIds].sort();
    const absentValues = [...absentKeys].sort();
    const signature = JSON.stringify([
      currentKey,
      currentQuestionId,
      showQuestionAnswer,
      lastMarked,
      responseDeadline,
      responseTimedOut,
      responseSeconds,
      roundPickedValues,
      roundQuestionValues,
      absentValues,
    ]);
    if (signature === lastRemotePickerSignatureRef.current) return undefined;

    const currentRow = currentKey ? stats[currentKey] || {} : {};
    const currentEntry = roster.find((entry) => entry.key === currentKey) || null;
    const timer = window.setTimeout(() => {
      const pickerUpdatedAtMs = Date.now();
      presenterLive.publish({
        pickerAssignmentId: assignmentId,
        pickerUpdatedByDeviceId: presenterLive.deviceId,
        pickerUpdatedByAtMs: pickerUpdatedAtMs,
        pickerStudentKey: currentKey,
        pickerStudentName: currentEntry?.name || "",
        pickerQuestionId: currentQuestionId,
        pickerShowAnswer: showQuestionAnswer,
        pickerLastMarked: lastMarked,
        pickerResponseDeadline: Number(responseDeadline || 0),
        pickerResponseTimedOut: Boolean(responseTimedOut),
        pickerResponseSeconds: responseSeconds,
        pickerRoundPicked: roundPickedValues,
        pickerRoundQuestionIds: roundQuestionValues,
        pickerAbsentKeys: absentValues,
        pickerStudentStats: currentKey ? {
          key: currentKey,
          name: currentEntry?.name || currentRow.name || "",
          turns: Number(currentRow.turns || 0),
          correct: Number(currentRow.correct || 0),
          needsHelp: Number(currentRow.needsHelp || currentRow.needsReview || 0),
          skipped: Number(currentRow.skipped || 0),
        } : null,
        pickerUpdatedAtMs,
      });
    }, 70);
    return () => window.clearTimeout(timer);
  }, [presenterLive.classRecordId, presenterLive.hasSnapshot, presenterLive.publish, presenterLive.deviceId, assignmentId, currentKey, currentQuestionId, showQuestionAnswer, lastMarked, responseDeadline, responseTimedOut, responseSeconds, roundPicked, roundQuestionIds, absentKeys, stats, roster]);

`;

picker = replaceOnce(
  picker,
  '  useEffect(() => {\n    if (!selectedClassId) return;\n    safeStorageSet(',
  `${remotePickerEffects}  useEffect(() => {\n    if (!selectedClassId) return;\n    safeStorageSet(`,
  "PresenterStudentPicker realtime effects",
);

const statusAnchor = '        {saveLabel ? <strong className={`presenter-student-save-state is-${saveState || syncState}`}>{saveLabel}</strong> : null}';
const statusWithRemote = `${statusAnchor}\n        {presenterLive.classRecordId ? <strong className={\`presenter-live-sync-state is-\${presenterLive.syncState}\`}>{presenterLive.syncState === "live" ? "Computer ↔ iPad live" : presenterLive.syncState === "connecting" ? "Connecting remote…" : presenterLive.syncState === "offline" ? "Remote offline" : "Remote waiting"}</strong> : null}`;
picker = replaceOnce(
  picker,
  statusAnchor,
  statusWithRemote,
  "PresenterStudentPicker realtime status",
);

fs.writeFileSync(pickerTarget, picker);

const pickerCssTarget = new URL("../src/components/PresenterStudentPicker.css", import.meta.url);
let pickerCss = fs.readFileSync(pickerCssTarget, "utf8");
if (!pickerCss.includes(".presenter-live-sync-state")) {
  pickerCss += `

.presenter-live-sync-state {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}

.presenter-live-sync-state.is-live {
  color: #047857;
}

.presenter-live-sync-state.is-offline {
  color: #b45309;
}
`;
}
fs.writeFileSync(pickerCssTarget, pickerCss);

console.log("Presenter realtime computer/iPad remote synchronization applied.");
