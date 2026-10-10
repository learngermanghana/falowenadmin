import { markingConsistencyWarnings, reconcileMarkingQuality } from "../utils/markingQuality.js";
import "./MarkingPage.css";
import { answerKeyComparison, feedbackWordCount } from "../utils/markingWorkspace.js";
import { submittedWorkFiles } from "../utils/studentResultSubmissions.js";
import { getA1WritingTaskSpec } from "../data/a1WritingTaskSpecs.js";
import { getB1WritingTaskSpec } from "../data/b1WritingTaskSpecs.js";
import { getA2WritingTaskSpec } from "../data/a2WritingTaskSpecs.js";
import { stripMarkingEmojis } from "../utils/markingFeedbackText.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import answersDictionary from "../data/answers_dictionary.json";
import { createMarkingJob, fetchSubmissions, hideSubmissionFromQueue, loadAnswerKey, loadAnswerKeyRegistry, loadRoster, loadSubmissions, markSubmissionWithAI, saveMarkingResult, saveScoreRow } from "../services/markingService.js";
import { buildAssignmentId } from "../utils/assignmentId.js";
import { computeObjectiveScore } from "../utils/objectiveMarking.js";
import { objectivePercentFromResult, getMaxWritingScore, writingPercentFromResult, mergeObjectiveScore } from "../utils/markingReview.js";
import { calculateFinalScore } from "../utils/finalScore.js";
import { calculateWeightedMarkingOutcome } from "../utils/markingScorePolicy.js";
import { useToast } from "../context/ToastContext.jsx";

const DEFAULT_REFERENCE_LINK =
  "https://docs.google.com/spreadsheets/d/1bENY4-5AG9hrgaDKqyNpTwKT02i58wGva6tVRn-hhbE/gviz/tq?tqx=out:html&sheet=Key";
const REFERENCE_ASSIGNMENT_STORAGE_KEY = "marking.referenceAssignment";
function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeStudentCode(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function SubmissionAttemptLabels({ submission }) {
  if (!submission) return null;
  const isResubmission = Boolean(submission.isResubmission || Number(submission.attempt) > 1 || normalize(submission.status) === "resubmitted");
  if (!isResubmission && !submission.previousScore && !submission.attempt) return null;
  return (
    <span className="marking-attempt-badges">
      {isResubmission ? <span className="marking-attempt-badge">Resubmission</span> : null}
      {submission.attempt ? <span className="marking-attempt-badge">Attempt {submission.attempt}</span> : null}
      {submission.previousScore !== null && submission.previousScore !== undefined ? <span className="marking-attempt-badge">Previous score: {submission.previousScore}</span> : null}
    </span>
  );
}

function getObjectiveAssignmentId(...candidates) {
  for (const candidate of candidates) {
    const assignmentId = inferAssignmentId(candidate);
    if (assignmentId) return assignmentId;
  }
  return "";
}

function formatWritingScore(result = {}) {
  if (result.writingScore === null || result.writingScore === undefined) return "—";
  const maxWritingScore = getMaxWritingScore(result);
  const writingPercent = writingPercentFromResult(result);
  if (maxWritingScore && maxWritingScore !== 100) {
    return `${result.writingScore}/${maxWritingScore} → ${writingPercent}%`;
  }
  return `${writingPercent}%`;
}

function objectiveWrongAnswerRows(objectiveDetails = {}) {
  return Object.entries(objectiveDetails || {})
    .map(([question, detail]) => ({ question, ...detail }))
    .filter((row) => row && row.correct === false);
}

function flattenAnswers(value, prefix = "") {
  if (typeof value === "string") {
    return [`${prefix}${value}`];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}${key}. ` : `${key}: `;
    return flattenAnswers(nested, nextPrefix);
  });
}

function inferLevel(assignment = "") {
  const match = String(assignment).trim().match(/^([A-Z]\d+)/i);
  return match ? match[1].toUpperCase() : "";
}

function inferAssignmentId(...candidates) {
  for (const value of candidates) {
    const match = String(value || "").trim().match(/([A-Z]\d+-[\d._]+)/i);
    if (match?.[1]) {
      return match[1].toUpperCase().replace(/_/g, ".");
    }
  }
  return "";
}

function formatReferenceAssignmentLabel(entry = {}) {
  const assignment = String(entry.assignment || "").trim();
  if (!assignment) return "";

  const looksLikeBareId = /^[A-Z]\d+-/.test(assignment);
  const topic = String(entry.de || entry.en || "").trim();

  if (!looksLikeBareId || !topic) return assignment;
  return `${assignment.replace("-", " ")} — ${topic}`;
}

function findReferenceEntryForSubmission(referenceEntries = [], submission = {}) {
  const submissionAssignmentId = inferAssignmentId(
    submission.assignmentId,
    submission.assignment_id,
    submission.assignmentKey,
    submission.assignment_key,
    submission.raw?.assignmentId,
    submission.raw?.assignment_id,
    submission.raw?.assignmentKey,
    submission.raw?.assignment_key,
    submission.assignment,
  );

  if (submissionAssignmentId) {
    const matchedById = referenceEntries.find((entry) => {
      const referenceAssignmentId = inferAssignmentId(
        entry.assignmentId,
        entry.assignment_id,
        entry.assignment,
        ...(entry.assignmentAliases || []),
      );
      return normalize(referenceAssignmentId) === normalize(submissionAssignmentId);
    });

    if (matchedById) {
      return matchedById;
    }
  }

  return referenceEntries.find((entry) => normalize(entry.assignment) === normalize(submission.assignment)) || null;
}

function findRosterMatchForSubmission(roster = [], submission = {}) {
  const submissionCode = normalizeStudentCode(submission.studentCode);
  const submissionName = normalize(submission.studentName || submission.name);
  const submissionLevel = normalize(submission.level || inferLevel(submission.assignment));

  const hasCode = Boolean(submissionCode);
  const hasName = Boolean(submissionName);
  const hasLevel = Boolean(submissionLevel);

  if (hasCode && hasLevel) {
    const exactMatch = roster.find((row) => {
      return normalizeStudentCode(row.studentCode) === submissionCode && normalize(row.level) === submissionLevel;
    });
    if (exactMatch) return exactMatch;
  }

  if (hasCode) {
    const codeMatch = roster.find((row) => normalizeStudentCode(row.studentCode) === submissionCode);
    if (codeMatch) return codeMatch;
  }

  if (hasName && hasLevel) {
    const nameAndLevelMatch = roster.find((row) => normalize(row.name) === submissionName && normalize(row.level) === submissionLevel);
    if (nameAndLevelMatch) return nameAndLevelMatch;
  }

  if (hasName) {
    const nameMatch = roster.find((row) => normalize(row.name) === submissionName);
    if (nameMatch) return nameMatch;
  }

  return null;
}

export default function MarkingPage() {
  const { success, error } = useToast();
  const [roster, setRoster] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionNotifications, setSubmissionNotifications] = useState([]);
  const [attemptSearch, setAttemptSearch] = useState("");
  const [selectedAttemptPath, setSelectedAttemptPath] = useState("");
  const feedbackLimit = "40";
  const [qualityAcknowledgement, setQualityAcknowledgement] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [referenceAssignment, setReferenceAssignment] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(REFERENCE_ASSIGNMENT_STORAGE_KEY) || "";
  });
  const [schreibenMark, setSchreibenMark] = useState("");
  const [finalScoreOverride, setFinalScoreOverride] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState("");
  const [assignmentValue, setAssignmentValue] = useState("");
  const [assignmentIdValue, setAssignmentIdValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [savingScore, setSavingScore] = useState(false);
  const [autoMarking, setAutoMarking] = useState(false);
  const [syncingAnswerKeys, setSyncingAnswerKeys] = useState(false);
  const [smartMarkingResult, setSmartMarkingResult] = useState(null);
  const [showAllObjectiveAnswers, setShowAllObjectiveAnswers] = useState(false);
  const [showDesktopReference, setShowDesktopReference] = useState(false);
  const [showDesktopCorrections, setShowDesktopCorrections] = useState(false);
  const [reportFallbackVisible, setReportFallbackVisible] = useState(false);
  const workflowSaving = false;
  const [answerKeyRegistry, setAnswerKeyRegistry] = useState([]);
  const [answerKeyRegistryStatus, setAnswerKeyRegistryStatus] = useState("loading");
  const [answerKeyRegistryError, setAnswerKeyRegistryError] = useState("");

  const referenceEntries = useMemo(() => {
    if (Array.isArray(answersDictionary)) {
      return answersDictionary.map((entry) => {
        const assignmentId = inferAssignmentId(entry.assignmentId, entry.assignment_id, entry.assignment, entry.assignmentKey);
        return {
          ...entry,
          assignment: String(entry.assignment || assignmentId || "").trim(),
          assignmentId,
          level: String(entry.level || inferLevel(entry.assignment || assignmentId)).toUpperCase(),
        };
      });
    }

    return Object.entries(answersDictionary || {}).map(([assignmentKey, data]) => {
      const assignmentId = inferAssignmentId(data?.assignmentId, data?.assignment_id, assignmentKey);
      const assignment = String(data?.assignment || assignmentKey || assignmentId || "").trim();
      return {
        assignment,
        assignmentId,
        level: String(data?.level || inferLevel(assignment)).toUpperCase(),
        assignmentAliases: [assignmentKey, assignmentId, data?.assignment, assignment].filter(Boolean),
        ...data,
      };
    });
  }, []);

  const refreshAnswerKeyRegistry = useCallback(async () => {
    setAnswerKeyRegistryStatus("loading");
    setAnswerKeyRegistryError("");
    try {
      const rows = await loadAnswerKeyRegistry();
      setAnswerKeyRegistry(rows);
      setAnswerKeyRegistryStatus("ready");
      return rows;
    } catch (err) {
      const message = err?.message || "Failed to load answer key registry";
      setAnswerKeyRegistryStatus("error");
      setAnswerKeyRegistryError(message);
      error(message);
      throw err;
    }
  }, [error]);

  useEffect(() => {
    void refreshAnswerKeyRegistry().catch(() => {});
  }, [refreshAnswerKeyRegistry]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rosterRows = await loadRoster();
        setRoster(rosterRows);

        const firstReference = referenceEntries?.[0]?.assignment || "";
        setReferenceAssignment((current) => current || firstReference);
      } catch (err) {
        error(err?.message || "Failed to load marking data");
      } finally {
        setLoading(false);
      }
    })();
  }, [referenceEntries, error]);

  useEffect(() => {
    const selectedStudent = roster.find((row) => row.id === selectedStudentId);
    if (!selectedStudent?.studentCode || !selectedStudent?.level) {
      setSubmissions([]);
      setLoadingSubmissions(false);
      return;
    }

    let cancelled = false;
    setSubmissions([]);
    (async () => {
      setLoadingSubmissions(true);
      try {
        const submissionRows = await fetchSubmissions(selectedStudent.level, selectedStudent.studentCode);
        if (!cancelled) setSubmissions(submissionRows);
      } catch (err) {
        if (!cancelled) error(err?.message || "Failed to load student submissions");
      } finally {
        if (!cancelled) setLoadingSubmissions(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roster, selectedStudentId, error]);

  useEffect(() => {
    let cancelled = false;

    const loadLatestSubmissions = async () => {
      try {
        const rows = await loadSubmissions();
        if (!cancelled) {
          setSubmissionNotifications(rows);
        }
      } catch (err) {
        if (!cancelled) error(err?.message || "Failed to load submission notifications");
      }
    };

    loadLatestSubmissions();
    const refreshId = window.setInterval(loadLatestSubmissions, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshId);
    };
  }, [error]);

  useEffect(() => {
    if (!referenceAssignment || typeof window === "undefined") return;
    window.localStorage.setItem(REFERENCE_ASSIGNMENT_STORAGE_KEY, referenceAssignment);
  }, [referenceAssignment]);

  const selectedStudent = useMemo(() => {
    return roster.find((row) => row.id === selectedStudentId) || null;
  }, [roster, selectedStudentId]);

  const referenceEntry = useMemo(() => {
    return referenceEntries.find((entry) => entry.assignment === referenceAssignment) || null;
  }, [referenceAssignment, referenceEntries]);

  const formattedReferenceAnswers = useMemo(() => {
    // The persisted registry is the active answer key. The bundled dictionary
    // only supplies a fallback when no saved key exists for the assignment.
    const key = normalize(referenceEntry?.assignmentId || referenceEntry?.assignment_id);
    const active = answerKeyRegistry.find((entry) => normalize(entry.assignmentKey || entry.id) === key);
    if (active?.parts && Object.keys(active.parts).length) return flattenAnswers(active.parts).join("\n");
    if (active?.rawAnswers) return flattenAnswers(active.rawAnswers).join("\n");
    if (active) return "Current saved key is available, but has no displayable answer parts.";
    if (referenceEntry?.reference) return referenceEntry.reference;
    return flattenAnswers(referenceEntry?.answers).join("\n");
  }, [referenceEntry, answerKeyRegistry]);

  const studentSubmissions = useMemo(() => submissions, [submissions]);

  const latestSubmission = useMemo(() => {
    if (!studentSubmissions.length) return null;

    const selectedReference = referenceEntries.find((entry) => entry.assignment === referenceAssignment);
    const referenceAliases = [
      selectedReference?.assignment,
      selectedReference?.assignmentId,
      ...(selectedReference?.assignmentAliases || []),
    ].map(normalize).filter(Boolean);

    const exact = studentSubmissions.find((row) => {
      const submissionAssignmentId = inferAssignmentId(row.assignmentId, row.assignmentKey, row.assignment);
      const submissionAliases = [row.assignment, row.assignmentId, row.assignmentKey, submissionAssignmentId].map(normalize);
      return submissionAliases.some((alias) => referenceAliases.includes(alias));
    });
    return exact || null;
  }, [studentSubmissions, referenceAssignment, referenceEntries]);

  const selectedSubmission = studentSubmissions.find((row) => (row.path || row.id) === selectedAttemptPath) || latestSubmission;

  useEffect(() => {
    if (!selectedSubmission) return;
    const automaticReference = findReferenceEntryForSubmission(referenceEntries, selectedSubmission);
    if (automaticReference?.assignment) {
      setReferenceAssignment((current) => current === automaticReference.assignment ? current : automaticReference.assignment);
    }
  }, [
    selectedSubmission?.path,
    selectedSubmission?.id,
    selectedSubmission?.assignment,
    selectedSubmission?.assignmentId,
    selectedSubmission?.assignmentKey,
    referenceEntries,
  ]);

  const automaticReferenceEntry = selectedSubmission
    ? findReferenceEntryForSubmission(referenceEntries, selectedSubmission)
    : null;
  const currentReferenceKey = normalize(referenceEntry?.assignmentId || referenceEntry?.assignment_id);
  const matchingRegistry = answerKeyRegistry.find((entry) => normalize(entry.assignmentKey) === currentReferenceKey);
  const keyComparison = answerKeyComparison(referenceEntry, matchingRegistry);
  const answerKeyRegistryReady = answerKeyRegistryStatus === "ready";
  const answerKeyRegistryLoading = answerKeyRegistryStatus === "loading";
  const answerKeyRegistryFailed = answerKeyRegistryStatus === "error";
  const answerKeySyncNeeded = answerKeyRegistryReady && keyComparison === "missing";
  const aiMarkingBlockedByKey = !answerKeyRegistryReady || answerKeySyncNeeded;
  const writingTaskCandidate = getA1WritingTaskSpec(referenceEntry?.assignmentId) || getA2WritingTaskSpec(referenceEntry?.assignmentId) || getB1WritingTaskSpec(referenceEntry?.assignmentId);
  const writingExpected = Array.isArray(referenceEntry?.writingParts) ? referenceEntry.writingParts.length > 0 : Boolean(writingTaskCandidate);
  const writingTask = writingExpected ? writingTaskCandidate : null;
  const queueRows = submissionNotifications.filter((row) => {
    const search = normalize(attemptSearch);
    const status = normalize(row.markingStatus || row.status || "pending");
    const stillNeedsMarking = !["marked", "sent"].includes(status);
    return stillNeedsMarking
      && (!search || [row.studentName, row.studentCode, row.assignment, row.assignmentId].some((value) => normalize(value).includes(search)));
  });
  const reviewIdentity = JSON.stringify([selectedStudentId, selectedSubmission?.path, selectedSubmission?.id, referenceAssignment]);
  const reviewIdentityRef = useRef(reviewIdentity);
  reviewIdentityRef.current = reviewIdentity;

  useEffect(() => {
    const referenceAssignment = referenceEntry?.assignment || "";
    const submissionAssignment = selectedSubmission?.assignment || "";
    const nextAssignment = submissionAssignment || referenceAssignment;
    const submissionAssignmentId = inferAssignmentId(
      selectedSubmission?.assignmentId,
      selectedSubmission?.assignmentKey,
      selectedSubmission?.raw?.assignment_id,
      selectedSubmission?.raw?.assignmentId,
      submissionAssignment,
    );
    const referenceAssignmentId = inferAssignmentId(
      referenceEntry?.assignmentId,
      referenceEntry?.assignment_id,
      referenceEntry?.assignment,
      ...(referenceEntry?.assignmentAliases || []),
    );
    const level = selectedStudent?.level || referenceEntry?.level || inferLevel(nextAssignment) || inferLevel(referenceAssignment);

    setAssignmentValue(nextAssignment);
    setAssignmentIdValue(submissionAssignmentId || referenceAssignmentId || buildAssignmentId(level, nextAssignment));
    setSmartMarkingResult(null);
    setFeedback("");
    setSchreibenMark("");
    setFinalScoreOverride(null);
    setSelectedHighlight("");
    setShowAllObjectiveAnswers(false);
  }, [
    reviewIdentity,
    selectedStudent?.level,
    referenceEntry?.level,
    referenceEntry?.assignment,
    referenceEntry?.assignmentId,
    referenceEntry?.assignment_id,
    referenceEntry?.assignmentAliases,
    selectedSubmission?.assignment,
    selectedSubmission?.assignmentId,
    selectedSubmission?.assignmentKey,
    selectedSubmission?.raw?.assignment_id,
    selectedSubmission?.raw?.assignmentId,
  ]);

  const objectiveAssignmentId = useMemo(() => getObjectiveAssignmentId(
    assignmentIdValue,
    selectedSubmission?.assignmentKey,
    selectedSubmission?.assignmentId,
    selectedSubmission?.raw?.assignment_id,
    selectedSubmission?.raw?.assignmentId,
    referenceEntry?.assignmentId,
    referenceEntry?.assignment_id,
    referenceEntry?.assignment,
  ), [
    assignmentIdValue,
    selectedSubmission?.assignmentKey,
    selectedSubmission?.assignmentId,
    selectedSubmission?.raw?.assignment_id,
    selectedSubmission?.raw?.assignmentId,
    referenceEntry?.assignmentId,
    referenceEntry?.assignment_id,
    referenceEntry?.assignment,
  ]);

  const objectiveMarkingResult = useMemo(() => {
    return computeObjectiveScore(matchingRegistry || objectiveAssignmentId, selectedSubmission?.text || "");
  }, [matchingRegistry, objectiveAssignmentId, selectedSubmission?.text]);

  const objectiveEntries = Object.entries(objectiveMarkingResult.details || {});
  const objectiveIssueEntries = objectiveEntries.filter(([, answer]) => !answer?.correct);
  const visibleObjectiveEntries = showAllObjectiveAnswers ? objectiveEntries : objectiveIssueEntries;
  const markingStage = smartMarkingResult ? 3 : selectedSubmission ? 2 : 1;

  const objectiveScorePercent = objectivePercentFromResult(objectiveMarkingResult);
  const scoringLevel = smartMarkingResult?.level
    || selectedStudent?.level
    || referenceEntry?.level
    || inferLevel(selectedSubmission?.assignment || referenceEntry?.assignment || assignmentValue);
  const scoringOptions = {
    level: scoringLevel,
    assignmentId: objectiveAssignmentId || assignmentIdValue,
    assignmentKey: smartMarkingResult?.assignmentKey || selectedSubmission?.assignmentKey || assignmentIdValue,
    objectiveDetails: objectiveMarkingResult.details || {},
  };
  const calculatedFinalScore = calculateFinalScore(objectiveScorePercent, schreibenMark, {
    ...scoringOptions, hasObjective: objectiveMarkingResult.totalCount > 0,
  });
  const manualWeightedOutcome = calculateWeightedMarkingOutcome({
    ...scoringOptions,
    writingPercent: schreibenMark === "" ? null : Number(schreibenMark),
    objectiveScore: objectiveMarkingResult.totalCount ? objectiveScorePercent : null,
    hasWriting: schreibenMark !== "" && Number.isFinite(Number(schreibenMark)),
  });
  const finalScore = finalScoreOverride === null || finalScoreOverride === ""
    ? calculatedFinalScore
    : Number(finalScoreOverride);
  const displayedCalculatedFinalScore = Number.isInteger(calculatedFinalScore)
    ? calculatedFinalScore
    : Number(calculatedFinalScore.toFixed(2));
  const displayedFinalScore = Number.isInteger(finalScore) ? finalScore : Number(finalScore.toFixed(2));

  const currentReviewedResult = {
    ...(smartMarkingResult || {}),
    score: finalScore,
    finalScore,
    feedback: stripMarkingEmojis(feedback),
    objectiveScore: objectiveMarkingResult.totalCount ? objectiveScorePercent : null,
    objectiveCorrect: objectiveMarkingResult.correctCount,
    objectiveTotal: objectiveMarkingResult.totalCount,
    objectiveDetails: objectiveMarkingResult.details,
    writingScore: schreibenMark === "" ? null : Number(schreibenMark),
    writingScorePercent: schreibenMark === "" ? null : Number(schreibenMark),
    maxWritingScore: 100,
    scoreBreakdown: manualWeightedOutcome.scoreBreakdown
      ? { ...manualWeightedOutcome.scoreBreakdown, finalScore }
      : null,
    markingPolicy: manualWeightedOutcome.policy,
    writingMinimumMet: manualWeightedOutcome.writingMinimumMet,
    passed: finalScore >= 60 && manualWeightedOutcome.writingMinimumMet
      && !manualWeightedOutcome.writingRequiredButMissing,
    manualOverride: true,
  };

  const handleSelectFromNotification = async (submission) => {
    if (!submission?.studentCode && !submission?.studentName) {
      error("This notification is missing student information and cannot be opened.");
      return;
    }

    const matchingStudent = findRosterMatchForSubmission(roster, submission);

    if (!matchingStudent) {
      setSubmissionNotifications((prev) => prev.filter((row) => row.path !== submission.path));
      error("Student for this submission was not found in the roster.");
      return;
    }

    let freshRows = [];
    try {
      freshRows = await fetchSubmissions(matchingStudent.level, matchingStudent.studentCode);
    } catch (err) {
      error(err?.message || "Failed to verify this submission before loading.");
      return;
    }

    const submissionStillExists = submission.path
      ? freshRows.some((row) => row.path === submission.path)
      : freshRows.some((row) => normalize(row.assignment) === normalize(submission.assignment));

    if (!submissionStillExists) {
      setSubmissionNotifications((prev) => prev.filter((row) => row.path !== submission.path));
      error("This submission no longer exists (it may already be deleted).");
      return;
    }

    setSelectedAttemptPath(submission.path || submission.id);
    setSubmissions(freshRows);
    setSelectedStudentId(matchingStudent.id);

    const matchingReference = findReferenceEntryForSubmission(referenceEntries, submission);
    if (matchingReference?.assignment) {
      setReferenceAssignment(matchingReference.assignment);
    }

    const nextAssignment = submission.assignment || matchingReference?.assignment || "";
    const submissionAssignmentId = inferAssignmentId(
      submission.assignmentId,
      submission.assignment_id,
      submission.assignmentKey,
      submission.assignment_key,
      submission.raw?.assignmentId,
      submission.raw?.assignment_id,
      matchingReference?.assignmentId,
      matchingReference?.assignment,
      nextAssignment,
    );
    const level = matchingStudent.level || matchingReference?.level || inferLevel(nextAssignment);
    setAssignmentValue(nextAssignment);
    setAssignmentIdValue(submissionAssignmentId || buildAssignmentId(level, nextAssignment));
  };

  const handleSyncAnswerKeys = async () => {
    try {
      setSyncingAnswerKeys(true);
      const refreshedRegistry = await refreshAnswerKeyRegistry();
      const saved = refreshedRegistry.find((entry) => normalize(entry.assignmentKey || entry.id) === currentReferenceKey);
      if (saved) {
        success("Current saved answer key refreshed. Existing edited answers were preserved.");
      } else {
        error("No saved key exists for this assignment. Publish its latest answers to the Admin registry before marking. Bulk GitHub sync is disabled here to protect newer keys.");
      }
    } catch (err) {
      error(err?.message || "Could not refresh the saved answer key.");
    } finally {
      setSyncingAnswerKeys(false);
    }
  };

  const handleAutoMark = async () => {
    const startedIdentity = reviewIdentity;
    const submissionText = selectedSubmission?.text || "";
    if (!submissionText.trim()) {
      error("No student submission available to auto-mark.");
      return;
    }

    try {
      setAutoMarking(true);
      const candidateKeys = [
        assignmentIdValue,
        selectedSubmission?.assignmentKey,
        selectedSubmission?.assignmentId,
        selectedSubmission?.raw?.assignment_id,
        selectedSubmission?.raw?.assignmentId,
        referenceEntry?.assignmentId,
        referenceEntry?.assignment_id,
      ].filter(Boolean);
      let registryEntry = null;
      for (const candidateKey of candidateKeys) {
        registryEntry = await loadAnswerKey(candidateKey);
        if (registryEntry) break;
      }

      const deterministicAssignmentId = getObjectiveAssignmentId(
        registryEntry?.assignmentKey,
        assignmentIdValue,
        selectedSubmission?.assignmentKey,
        selectedSubmission?.assignmentId,
        referenceEntry?.assignmentId,
        referenceEntry?.assignment,
      );
      const deterministicObjective = computeObjectiveScore(registryEntry || deterministicAssignmentId, submissionText);
      const aiResult = writingExpected || !deterministicObjective.totalCount ? await markSubmissionWithAI({
        referenceEntry: registryEntry,
        submission: { ...selectedSubmission, assignmentKey: registryEntry?.assignmentKey || selectedSubmission.assignmentKey },
        submissionText,
        feedbackWordTarget: Number(feedbackLimit) || null,
      }) : { level: selectedStudent.level, assignmentKey: deterministicAssignmentId, writingScorePercent: null, writingScore: null, status: "marked", confidence: 1 };
      if (reviewIdentityRef.current !== startedIdentity) return;
      const result = reconcileMarkingQuality(mergeObjectiveScore(aiResult, deterministicObjective), deterministicObjective, selectedSubmission, { writingExpected, wordTarget: feedbackLimit });
      setSmartMarkingResult(result);
      setSchreibenMark(result.writingScorePercent === null || result.writingScorePercent === undefined
        ? ""
        : String(result.writingScorePercent));
      setFinalScoreOverride(null);
      setFeedback(result.feedback);
      await createMarkingJob({
        submissionId: selectedSubmission.id,
        submissionPath: selectedSubmission.path,
        assignmentKey: result.assignmentKey,
        level: result.level,
        status: "pending",
      });
      await saveMarkingResult({
        submissionId: selectedSubmission.id,
        submissionPath: selectedSubmission.path,
        result,
        status: result.status,
        sentToStudent: result.shouldSendAutomatically && result.status === "marked",
      });
      success(result.status === "needs_review" ? "Smart marking saved for tutor review." : "Smart marking completed and saved.");
    } catch (err) {
      if (reviewIdentityRef.current === startedIdentity) error(err?.message || "Failed to auto-mark submission.");
    } finally {
      setAutoMarking(false);
    }
  };

  const handleSelectSubmissionText = (event) => {
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    setSelectedHighlight(selectionEnd > selectionStart ? value.slice(selectionStart, selectionEnd).trim() : "");
  };

  const handleAddHighlightToComment = () => {
    if (!selectedHighlight) return;

    const comment = `Issue found: "${selectedHighlight}"\nCorrection:`;
    setFeedback((current) => current.trim() ? `${current.trimEnd()}\n\n${comment}` : comment);
    setSelectedHighlight("");
  };

  const consistencyWarnings = [
    ...markingConsistencyWarnings(currentReviewedResult, selectedSubmission || {}, calculatedFinalScore),
    ...(Array.isArray(smartMarkingResult?.reviewReasons)
      ? smartMarkingResult.reviewReasons
        .filter((reason) => reason?.code === "learner_answer_key_disagreement")
        .map((reason) => reason.message).filter(Boolean)
      : []),
  ];
  const qualitySignature = JSON.stringify([reviewIdentity, feedback, finalScore, schreibenMark, consistencyWarnings]);
  const qualityNeedsReview = consistencyWarnings.length > 0 && qualityAcknowledgement !== qualitySignature;

  const handleSave = async (shareFeedback = false) => {
    if (qualityNeedsReview) { error("Review the score and feedback warnings and confirm the review before saving."); return; }
    if (!selectedStudent) {
      error("Pick a student before saving.");
      return;
    }
    if (!assignmentValue.trim()) {
      error("Assignment is required.");
      return;
    }
    if (!assignmentIdValue.trim()) {
      error("Assignment ID is required.");
      return;
    }
    if (!feedback.trim()) {
      error("Feedback is required.");
      return;
    }
    try {
      setSavingScore(true);
      const level = selectedStudent.level || referenceEntry?.level || inferLevel(referenceEntry?.assignment || assignmentValue);
      const safeAssignment = assignmentValue.trim();

      const currentScore = finalScore;
      const currentFeedback = stripMarkingEmojis(feedback);
      const currentObjectiveResult = objectiveMarkingResult;
      const currentObjectiveScore = objectivePercentFromResult(currentObjectiveResult);
      const currentWritingScore = schreibenMark === "" ? null : Number(schreibenMark);
      const aiOriginalScore = smartMarkingResult?.aiOriginalScore ?? smartMarkingResult?.finalScore ?? smartMarkingResult?.score ?? null;

      const receipt = await saveScoreRow({
        studentCode: selectedStudent.studentCode,
        name: selectedStudent.name,
        assignment: safeAssignment,
        assignmentId: assignmentIdValue.trim(),
        score: currentScore,
        comments: currentFeedback,
        level,
        link: referenceEntry?.answer_url ?? DEFAULT_REFERENCE_LINK,
        blockAnyDuplicate: false,
        forceSheetDedupeId: true,
        requireAllTargets: true,
        markingDetails: {
          objectiveScore: currentObjectiveScore,
          objectiveCorrect: currentObjectiveResult.correctCount,
          objectiveTotal: currentObjectiveResult.totalCount,
          objectiveDetails: currentObjectiveResult.details,
          writingScore: currentWritingScore,
          writingScorePercent: currentWritingScore,
          maxWritingScore: 100,
          finalScore: currentScore,
          scoreBreakdown: currentReviewedResult.scoreBreakdown,
          markingPolicy: currentReviewedResult.markingPolicy,
          writingMinimumMet: currentReviewedResult.writingMinimumMet,
        },
      });

      if (selectedSubmission?.id || selectedSubmission?.path) {
        await saveMarkingResult({
          submissionId: selectedSubmission.id,
          submissionPath: selectedSubmission.path,
          result: {
            ...currentReviewedResult,
            score: currentScore,
            finalScore: currentScore,
            feedback: currentFeedback,
            objectiveCorrect: currentObjectiveResult.correctCount,
            objectiveTotal: currentObjectiveResult.totalCount,
            objectiveDetails: currentObjectiveResult.details,
            objectiveScore: currentObjectiveScore,
            writingScore: currentWritingScore,
            writingScorePercent: currentWritingScore,
            maxWritingScore: 100,
            manualOverride: true,
            duplicateScoreBlocked: receipt.duplicateSkipped,
            tutorVerificationRequired: receipt.duplicateSkipped,
            aiOriginalScore,
            aiOriginalFeedback: smartMarkingResult?.aiOriginalFeedback ?? smartMarkingResult?.feedback ?? "",
          },
          status: receipt.duplicateSkipped ? "needs_review" : shareFeedback ? "sent" : "marked",
          sentToStudent: shareFeedback && !receipt.duplicateSkipped,
        });
      }

      if (receipt.duplicateSkipped) {
        error(receipt.sheet?.message || "Score save blocked. Review the existing score or wait for the current save to finish, then try again.");
        return;
      }

      const successfulTargets = [
        receipt.sheet.success ? "Google Sheets" : null,
        receipt.firestore.success ? "Firestore" : null,
      ].filter(Boolean);

      const targetMessage = successfulTargets.length
        ? `Saved to ${successfulTargets.join(" and ")}.`
        : "Save completed with warnings.";

      if (selectedSubmission?.path) {
        await hideSubmissionFromQueue(selectedSubmission.path);
        setSubmissions((prev) => prev.filter((row) => row.path !== selectedSubmission.path));
        setSubmissionNotifications((prev) => prev.filter((row) => row.path !== selectedSubmission.path));
      }

      success(`Saved score for ${receipt.row.name} (${receipt.row.assignment} · ${receipt.row.assignment_id || "No assignment ID"}). ${targetMessage}`);
    } catch (err) {
      error(err?.message || "Failed to save score");
    } finally {
      setSavingScore(false);
    }
  };

  const markingReport = stripMarkingEmojis([
    "Falowen marking bug report",
    `Student: ${selectedStudent?.name || selectedSubmission?.studentName || "Unknown"}`,
    `Assignment: ${assignmentIdValue || selectedSubmission?.assignmentId || "Unknown"}`,
    `Attempt: ${selectedSubmission?.attempt || 1}`,
    `Final score: ${displayedFinalScore}/100`,
    `Answer key check: ${keyComparison}`,
    "",
    "REFERENCE",
    (formattedReferenceAnswers || "No reference answer available.").trim(),
    "",
    "STUDENT WORK",
    (selectedSubmission?.text || "No student submission available.").trim(),
    "",
    "OBJECTIVE MAPPING",
    objectiveMarkingResult.totalCount
      ? Object.entries(objectiveMarkingResult.details).map(([question, answer]) =>
          `${question}: Student=${answer.student || "No answer"} | Reference=${answer.expectedDisplay || answer.expected || answer.rawExpected || "—"} | ${answer.correct ? "Correct" : "Needs correction"}`
        ).join("\n")
      : "No objective answers detected.",
    "",
    "AI FEEDBACK",
    smartMarkingResult?.feedback || "AI marking has not been run.",
    "",
    "CURRENT COMMENT / FEEDBACK",
    feedback || "No feedback yet.",
    "",
    "MARKING SUMMARY",
    smartMarkingResult
      ? JSON.stringify({
          level: currentReviewedResult.level,
          assignmentKey: currentReviewedResult.assignmentKey,
          objectiveScore: currentReviewedResult.objectiveScore,
          writingScore: schreibenMark === "" ? null : Number(schreibenMark),
          finalScore: displayedFinalScore,
          confidence: currentReviewedResult.confidence,
          status: currentReviewedResult.status,
        }, null, 2)
      : "AI marking has not been run.",
    "",
    "REVIEW WARNINGS",
    consistencyWarnings.join("\n") || "None",
  ].join("\n"));

  const handleCopyMarkingReport = async () => {
    try {
      await navigator.clipboard.writeText(markingReport);
      setReportFallbackVisible(false);
      success("Complete marking report copied.");
    } catch {
      setReportFallbackVisible(true);
      error("Could not copy automatically. The full report is shown below for manual copying.");
    }
  };

  return (
    <div className="marking-workspace">
      <header className="marking-workspace-header"><div><strong>{selectedStudent?.name || "Select a submission"}</strong><span>{selectedSubmission?.assignment || referenceEntry?.assignment || ""}</span></div></header>
      <div className="marking-stage-bar" aria-label="Marking workflow">
        {[
          [1, "Student work"],
          [2, "Mark with AI"],
          [3, "Review & save"],
        ].map(([stage, label]) => (
          <div
            key={stage}
            className={`marking-stage ${markingStage === stage ? "is-current" : markingStage > stage ? "is-complete" : ""}`}
          >
            <span>{stage}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
      {loading && <p role="status">Loading roster and submissions...</p>}
      <div className="marking-columns">
        <aside className="marking-column marking-queue" aria-label="Submission queue">
          <section className="marking-card marking-queue-card">
            <div className="marking-section-heading">
              <div>
                <h3>Submissions to mark</h3>
                <p>Only incoming work that still needs marking.</p>
              </div>
              <span className="marking-count-badge">{queueRows.length}</span>
            </div>
            <input
              aria-label="Search submissions"
              value={attemptSearch}
              onChange={(event) => setAttemptSearch(event.target.value)}
              placeholder="Search student, code or assignment"
            />
            <div className="marking-queue-list">
              {queueRows.map((row) => (
                <button
                  className="marking-queue-item"
                  type="button"
                  aria-pressed={(row.path || row.id) === (selectedSubmission?.path || selectedSubmission?.id)}
                  key={row.path || row.id}
                  disabled={autoMarking || savingScore || workflowSaving}
                  onClick={() => void handleSelectFromNotification(row)}
                >
                  <strong>{row.studentName || row.studentCode || "Student"}</strong>
                  <span>{row.assignment || row.assignmentId || "Unknown assignment"}</span>
                  <small>{row.markingStatus || row.status || "Pending"}{row.attempt ? ` · Attempt ${row.attempt}` : ""}</small>
                </button>
              ))}
              {!queueRows.length ? <p className="marking-empty">No submissions match this filter.</p> : null}
            </div>
          </section>
        </aside>
        <main className="marking-column marking-submission" aria-label="Submission and reference">
          <div className="marking-reference-work-grid">
            <section className="marking-card" id="marking-stage-work">
              <div className="marking-section-heading">
                <div>
                  <h3>Student work</h3>
                  <p>{selectedSubmission ? `${selectedSubmission.assignment || "Unknown assignment"} · ${selectedSubmission.status || "submitted"}` : "Select a submission from the queue."}</p>
                </div>
                <div className="marking-student-actions">
                  {selectedSubmission ? <SubmissionAttemptLabels submission={selectedSubmission} /> : null}
                  <button
                    className="marking-primary-action"
                    type="button"
                    onClick={handleAutoMark}
                    disabled={autoMarking || syncingAnswerKeys || savingScore || workflowSaving || loadingSubmissions || !selectedSubmission || aiMarkingBlockedByKey}
                  >
                    {autoMarking ? "Marking..." : smartMarkingResult ? "Re-run AI marking" : "Mark with AI"}
                  </button>
                </div>
              </div>
              {loadingSubmissions ? <p>Loading submission...</p> : selectedSubmission ? (
                <>
                  {submittedWorkFiles(selectedSubmission).length ? (
                    <div className="marking-file-links">
                      {submittedWorkFiles(selectedSubmission).map((file) => <a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>)}
                    </div>
                  ) : null}
                  {selectedSubmission.improvementSummary ? (
                    <details className="marking-compact-details">
                      <summary>Resubmission context</summary>
                      <p>{selectedSubmission.improvementSummary}</p>
                      {selectedSubmission.previousSubmissionText ? <pre>{selectedSubmission.previousSubmissionText}</pre> : null}
                    </details>
                  ) : null}
                  <textarea
                    readOnly
                    rows={14}
                    value={selectedSubmission.text || "No submission text available."}
                    onSelect={handleSelectSubmissionText}
                    aria-label="Student submitted work"
                  />
                  {selectedHighlight ? (
                    <div className="marking-inline-action">
                      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={handleAddHighlightToComment}>Add selection to comment</button>
                      <span>“{selectedHighlight}”</span>
                    </div>
                  ) : null}
                </>
              ) : <p className="marking-empty">No submission selected.</p>}
            </section>

            <section className="marking-card marking-reference-card">
              <div className="marking-section-heading">
                <div>
                  <h3>Reference</h3>
                  <p>The answer key used to compare this submission.</p>
                </div>
                <span className={`marking-key-pill marking-key-${answerKeyRegistryLoading ? "checking" : answerKeyRegistryFailed ? "error" : keyComparison}`}>
                  {answerKeyRegistryLoading
                    ? "Checking AI key..."
                    : answerKeyRegistryFailed
                      ? "Key check failed"
                      : keyComparison === "matched"
                        ? "Key matched"
                        : keyComparison === "different"
                          ? "Saved key active"
                          : "Key unavailable"}
                </span>
              </div>
              <div className="marking-reference-selected">
                <span>{automaticReferenceEntry ? "Matched automatically" : "Current reference"}</span>
                <strong>{referenceEntry ? formatReferenceAssignmentLabel(referenceEntry) : "No matching reference found"}</strong>
              </div>
              <details className="marking-reference-override">
                <summary>Change reference</summary>
                <select
                  aria-label="Reference answer"
                  disabled={autoMarking || savingScore || workflowSaving}
                  value={referenceAssignment}
                  onChange={(event) => setReferenceAssignment(event.target.value)}
                >
                  {referenceEntries.map((entry) => (
                    <option key={entry.assignment} value={entry.assignment}>{formatReferenceAssignmentLabel(entry)}</option>
                  ))}
                </select>
              </details>
              {answerKeyRegistryLoading ? (
                <div className="marking-inline-warning">
                  Checking the saved AI key before marking. Sync is not available until this check finishes.
                </div>
              ) : null}
              {answerKeyRegistryFailed ? (
                <div className="marking-inline-warning marking-key-sync-warning">
                  <div>
                    <strong>Could not check the saved AI key.</strong>
                    <p>{answerKeyRegistryError || "The answer-key registry could not be loaded."} Retry the check before marking.</p>
                  </div>
                  <button
                    type="button"
                    className="marking-sync-key-action"
                    onClick={() => void refreshAnswerKeyRegistry().catch(() => {})}
                    disabled={answerKeyRegistryLoading || syncingAnswerKeys || autoMarking || savingScore}
                  >
                    Retry key check
                  </button>
                </div>
              ) : null}
              {answerKeySyncNeeded ? (
                <div className="marking-inline-warning marking-key-sync-warning">
                  <div>
                    <strong>{keyComparison === "different" ? "Saved AI key is out of date." : "Saved AI key is missing."}</strong>
                    <p>The page reference is ready. Update the saved AI key here before running AI marking.</p>
                  </div>
                  <button
                    type="button"
                    className="marking-sync-key-action"
                    onClick={() => void handleSyncAnswerKeys()}
                    disabled={syncingAnswerKeys || autoMarking || savingScore}
                  >
                    {syncingAnswerKeys ? "Syncing answer keys..." : "Sync latest answer keys"}
                  </button>
                </div>
              ) : null}
              <div className="marking-desktop-expand-control">
                <button type="button" className="marking-compact-action" aria-expanded={showDesktopReference} aria-controls="marking-reference-answers" onClick={() => setShowDesktopReference((current) => !current)}>
                  {showDesktopReference ? "Hide answer key" : "View full answer key"}
                </button>
              </div>
              <div id="marking-reference-answers" className={`marking-reference-answers ${showDesktopReference ? "is-expanded" : ""}`}>
                <textarea aria-label="Current reference answers" value={formattedReferenceAnswers} readOnly rows={14} />
                {referenceEntry?.answer_url ? <a href={referenceEntry.answer_url} target="_blank" rel="noreferrer">Open answer source</a> : null}
              </div>
            </section>
          </div>

          <section className={`marking-card marking-objective-card ${showDesktopCorrections ? "is-expanded" : ""}`}>
            <div className="marking-section-heading">
              <div>
                <h3>Objective mapping</h3>
                <p className="marking-mobile-objective-summary">{showAllObjectiveAnswers ? "Showing every objective answer." : "Showing only wrong or unanswered questions."}</p>
                <p className="marking-desktop-objective-summary">{objectiveMarkingResult.totalCount
                  ? `${Math.max(0, objectiveMarkingResult.totalCount - objectiveMarkingResult.correctCount)} to review · ${objectiveMarkingResult.correctCount}/${objectiveMarkingResult.totalCount} correct`
                  : "Open to inspect any detected answers."}</p>
              </div>
              <div className="marking-objective-actions">
                <button type="button" className="marking-desktop-toggle marking-compact-action" aria-expanded={showDesktopCorrections} aria-controls="marking-objective-content" onClick={() => setShowDesktopCorrections((current) => !current)}>
                  {showDesktopCorrections ? "Hide corrections" : "View corrections"}
                </button>
                {objectiveMarkingResult.totalCount ? <strong>{objectiveMarkingResult.correctCount}/{objectiveMarkingResult.totalCount}</strong> : null}
                {objectiveMarkingResult.totalCount ? (
                  <button
                    type="button"
                    className="marking-compact-action"
                    onClick={() => setShowAllObjectiveAnswers((current) => !current)}
                  >
                    {showAllObjectiveAnswers ? "Show issues only" : "Show all answers"}
                  </button>
                ) : null}
              </div>
            </div>
            <div id="marking-objective-content" className={`marking-objective-content ${showDesktopCorrections ? "is-expanded" : ""}`}>
            {objectiveMarkingResult.totalCount ? (
              visibleObjectiveEntries.length ? (
                <div className="marking-table-scroll">
                  <table className="marking-objective-table">
                    <thead><tr><th>Question</th><th>Student</th><th>Reference</th><th>Result</th></tr></thead>
                    <tbody>
                      {visibleObjectiveEntries.map(([question, answer]) => (
                        <tr key={question} className={answer.correct ? "is-correct" : "is-wrong"}>
                          <td><strong>{question}</strong></td>
                          <td>{answer.student || "No answer"}</td>
                          <td>{answer.expectedDisplay || answer.expected || answer.rawExpected || "—"}</td>
                          <td>{answer.correct ? "Correct" : String(answer.student || answer.submitted || "").trim() ? "Needs correction" : "Not answered"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="marking-objective-clear">All objective answers are correct. Use “Show all answers” if you want to inspect them.</div>
              )
            ) : <p className="marking-empty">No objective answers were detected. Use the reference and AI marking for the writing task.</p>}
            </div>
          </section>
        </main>
        <aside className="marking-column marking-review" id="marking-stage-review" aria-label="Score review">
          <section className="marking-card marking-review-card">
            <div className="marking-section-heading">
              <div>
                <h3>AI feedback & score</h3>
                <p>Review the AI result, adjust the score if needed, then edit the comment before saving.</p>
              </div>
            </div>

            {consistencyWarnings.length ? (
              <div className="marking-inline-warning">
                <strong>Review before saving</strong>
                <ul>{consistencyWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                <label className="marking-check">
                  <input type="checkbox" checked={qualityAcknowledgement === qualitySignature} onChange={(event) => setQualityAcknowledgement(event.target.checked ? qualitySignature : "")} />
                  I checked these warnings against the student work.
                </label>
              </div>
            ) : null}

            {smartMarkingResult ? (
              <div className="marking-score-summary">
                <div><span>Objective</span><strong>{smartMarkingResult.objectiveTotal ? `${smartMarkingResult.objectiveCorrect}/${smartMarkingResult.objectiveTotal} · ${Math.round(smartMarkingResult.objectiveScore ?? 0)}%` : "—"}</strong></div>
                <div><span>Writing</span><strong>{formatWritingScore(smartMarkingResult)}</strong></div>
                <div><span>Final</span><strong>{displayedFinalScore}/100</strong></div>
                <div><span>Confidence</span><strong>{smartMarkingResult.confidence ?? "—"}</strong></div>
              </div>
            ) : null}

            {writingTask ? (
              <details className="marking-compact-details">
                <summary>Writing task points</summary>
                <p>{writingTask.taskText}</p>
                <ul>{writingTask.taskPoints.map((point) => <li key={point}>{point}</li>)}</ul>
              </details>
            ) : null}

            <div className="marking-score-fields">
              {writingExpected ? (
                <label>
                  Writing mark
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={schreibenMark}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === "") {
                        setSchreibenMark("");
                        setFinalScoreOverride(null);
                        return;
                      }
                      setSchreibenMark(String(Math.max(0, Math.min(100, Number(nextValue)))));
                      setFinalScoreOverride(null);
                    }}
                    placeholder="0–100"
                  />
                </label>
              ) : null}
              <label>
                Final score
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={finalScoreOverride === null ? displayedCalculatedFinalScore : finalScoreOverride}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue === "") {
                      setFinalScoreOverride("");
                      return;
                    }
                    setFinalScoreOverride(String(Math.max(0, Math.min(100, Number(nextValue)))));
                  }}
                />
              </label>
            </div>

            <label className="marking-feedback-field">
              Comment / feedback
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(stripMarkingEmojis(event.target.value))}
                rows={9}
                placeholder="AI feedback appears here. Edit it before saving or sharing."
              />
              <small>{feedbackWordCount(feedback)} words</small>
            </label>

            <button
              type="button"
              className="marking-secondary-action"
              disabled={!feedback.trim()}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(stripMarkingEmojis(feedback));
                  success("Feedback copied.");
                } catch {
                  error("Could not copy feedback.");
                }
              }}
            >
              Copy feedback
            </button>
            <div className="marking-desktop-save-actions">
              <button
                className="marking-primary-action"
                type="button"
                onClick={() => void handleSave(true)}
                disabled={!selectedSubmission || !feedback.trim() || savingScore || autoMarking || workflowSaving}
              >
                {savingScore ? "Saving..." : "Save & share feedback"}
              </button>
              <button
                type="button"
                onClick={() => void handleSave(false)}
                disabled={!selectedSubmission || !feedback.trim() || savingScore || autoMarking || workflowSaving}
              >
                Save only
              </button>
            </div>
            <details className="marking-desktop-more">
              <summary>More actions</summary>
              <button className="marking-report-action" type="button" disabled={!selectedSubmission} onClick={handleCopyMarkingReport}>Copy full report</button>
              <p>Includes student work, reference, answer mapping, feedback and scores for reporting issues.</p>
            </details>
          </section>
        </aside>
      </div>
      {selectedSubmission ? (
        <div className="marking-mobile-sticky-action" aria-label="Current marking action">
          {answerKeyRegistryLoading ? (
            <button className="marking-primary-action" type="button" disabled>
              Checking AI key...
            </button>
          ) : answerKeyRegistryFailed ? (
            <button
              className="marking-primary-action"
              type="button"
              onClick={() => void refreshAnswerKeyRegistry().catch(() => {})}
              disabled={answerKeyRegistryLoading || syncingAnswerKeys || autoMarking || savingScore}
            >
              Retry key check
            </button>
          ) : answerKeySyncNeeded ? (
            <button
              className="marking-primary-action"
              type="button"
              onClick={() => void handleSyncAnswerKeys()}
              disabled={syncingAnswerKeys || autoMarking || savingScore}
            >
              {syncingAnswerKeys ? "Syncing..." : "Sync AI key"}
            </button>
          ) : !smartMarkingResult ? (
            <button
              className="marking-primary-action"
              type="button"
              onClick={handleAutoMark}
              disabled={autoMarking || syncingAnswerKeys || savingScore || workflowSaving || loadingSubmissions || aiMarkingBlockedByKey}
            >
              {autoMarking ? "Marking..." : "Mark with AI"}
            </button>
          ) : (
            <>
              <div className="marking-mobile-sticky-score">
                <span>Final</span>
                <strong>{displayedFinalScore}/100</strong>
              </div>
              <button
                className="marking-primary-action"
                type="button"
                onClick={() => void handleSave(false)}
                disabled={!feedback.trim() || savingScore || autoMarking || workflowSaving}
              >
                {savingScore ? "Saving..." : "Save mark"}
              </button>
            </>
          )}
        </div>
      ) : null}
      <div className="marking-save-bar">
        <div className="marking-save-score">
          <span>Final score</span>
          <strong>{displayedFinalScore}/100</strong>
        </div>
        <button type="button" onClick={() => void handleSave(false)} disabled={!selectedSubmission || !feedback.trim() || savingScore || autoMarking || workflowSaving}>
          {savingScore ? "Saving..." : "Save mark"}
        </button>
        <button className="marking-primary-action" type="button" onClick={() => void handleSave(true)} disabled={!selectedSubmission || !feedback.trim() || savingScore || autoMarking || workflowSaving}>
          Save + share feedback
        </button>
        <button className="marking-report-action" type="button" disabled={!selectedSubmission} onClick={handleCopyMarkingReport}>
          Copy full report
        </button>
      </div>
      <p className="marking-report-help">Copy full report includes the reference, student work, objective mapping, AI feedback, current comment and score summary for bug reports.</p>
      {reportFallbackVisible ? (
        <label className="marking-report-fallback">
          Full report — select and copy manually
          <textarea readOnly rows={12} value={markingReport} />
        </label>
      ) : null}
    </div>
  );
}
