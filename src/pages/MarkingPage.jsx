import { useCallback, useEffect, useMemo, useState } from "react";
import answersDictionary from "../data/answers_dictionary.json";
import { MARKING_FEEDBACK_TEMPLATES } from "../data/markingFeedbackTemplates.js";
import { createMarkingJob, deleteSubmission, fetchSubmissions, hideSubmissionFromQueue, importAnswerDictionary, loadAnswerKey, loadAnswerKeyRegistry, loadRoster, loadSubmissions, markSubmissionWithAI, saveMarkingResult, saveScoreRow, updateMarkingWorkflowStatus } from "../services/markingService.js";
import { buildAssignmentId } from "../utils/assignmentId.js";
import { computeObjectiveScore } from "../utils/objectiveMarking.js";
import { calculateFinalScore } from "../utils/finalScore.js";
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
  const badgeStyle = { border: "1px solid #f59e0b", background: "#fffbeb", color: "#92400e", borderRadius: 999, padding: "2px 7px", fontSize: 11, fontWeight: 700 };
  return (
    <span style={{ display: "inline-flex", gap: 5, flexWrap: "wrap", marginLeft: 6 }}>
      {isResubmission ? <span style={badgeStyle}>Resubmission</span> : null}
      {submission.attempt ? <span style={badgeStyle}>Attempt {submission.attempt}</span> : null}
      {submission.previousScore !== null && submission.previousScore !== undefined ? <span style={badgeStyle}>Previous score: {submission.previousScore}</span> : null}
    </span>
  );
}

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function objectivePercentFromResult(objectiveResult = {}) {
  const total = Number(objectiveResult.totalCount || 0);
  if (!total) return 0;
  return (Number(objectiveResult.correctCount || 0) / total) * 100;
}

function getObjectiveAssignmentId(...candidates) {
  for (const candidate of candidates) {
    const assignmentId = inferAssignmentId(candidate);
    if (assignmentId) return assignmentId;
  }
  return "";
}

function getMaxWritingScore(result = {}) {
  const candidates = [
    result.maxWritingScore,
    result.writingMaxScore,
    result.maxWritingPoints,
    result.writingMaxPoints,
    result.rubricMaxScore,
    result.writingRubricMax,
    result.ai?.maxWritingScore,
    result.ai?.writingMaxScore,
    ...(Array.isArray(result.parts)
      ? result.parts
        .filter((part) => String(part?.partType || "").toLowerCase() === "writing")
        .flatMap((part) => [part.maxScore, part.maxPoints, part.total, part.totalPoints])
      : []),
  ];

  const explicitMax = candidates.find((value) => Number.isFinite(Number(value)) && Number(value) > 0);
  if (explicitMax) return Number(explicitMax);

  const writingScore = Number(result.writingScore);
  if (Number.isFinite(writingScore) && writingScore > 0 && writingScore <= 50) return 50;
  return 100;
}

function writingScoreToPercent(writingScore, maxWritingScore = 100) {
  const numericScore = Number(writingScore);
  const numericMax = Number(maxWritingScore);
  if (!Number.isFinite(numericScore)) return 0;
  if (!Number.isFinite(numericMax) || numericMax <= 0) return clampPercent(numericScore);
  return clampPercent((numericScore / numericMax) * 100);
}

function formatWritingScore(result = {}) {
  if (result.writingScore === null || result.writingScore === undefined) return "—";
  const maxWritingScore = getMaxWritingScore(result);
  const writingPercent = writingScoreToPercent(result.writingScore, maxWritingScore);
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

function mergeObjectiveScore(result = {}, objectiveResult = {}) {
  const objectivePercent = objectivePercentFromResult(objectiveResult);
  const writingPercent = writingScoreToPercent(result.writingScore, getMaxWritingScore(result));
  const hasObjective = Number(objectiveResult.totalCount || 0) > 0;
  const hasWriting = result.writingScore !== null && result.writingScore !== undefined && Number.isFinite(Number(result.writingScore));

  let finalScore;
  if (hasObjective && hasWriting) {
    finalScore = Math.round((objectivePercent + writingPercent) / 2);
  } else if (hasObjective) {
    finalScore = Math.round(objectivePercent);
  } else {
    finalScore = Math.round(writingPercent || Number(result.finalScore ?? result.score ?? 0));
  }

  return {
    ...result,
    score: finalScore,
    finalScore,
    objectiveCorrect: objectiveResult.correctCount,
    objectiveTotal: objectiveResult.totalCount,
    objectiveDetails: objectiveResult.details,
    objectiveScore: objectivePercent,
    writingScore: result.writingScore ?? null,
    writingScorePercent: hasWriting ? writingPercent : null,
    maxWritingScore: getMaxWritingScore(result),
    aiOriginalScore: result.aiOriginalScore ?? result.finalScore ?? result.score ?? null,
    aiOriginalFeedback: result.aiOriginalFeedback ?? result.feedback ?? "",
  };
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
  const [allSubmissionAttempts, setAllSubmissionAttempts] = useState([]);
  const [attemptSearch, setAttemptSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [referenceAssignment, setReferenceAssignment] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(REFERENCE_ASSIGNMENT_STORAGE_KEY) || "";
  });
  const [referenceQuery, setReferenceQuery] = useState("");
  const [schreibenMark, setSchreibenMark] = useState("");
  const [finalScoreOverride, setFinalScoreOverride] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState("");
  const [assignmentValue, setAssignmentValue] = useState("");
  const [assignmentIdValue, setAssignmentIdValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedFeedbackTemplateId, setSelectedFeedbackTemplateId] = useState(MARKING_FEEDBACK_TEMPLATES[0].id);
  const [saveReceipt, setSaveReceipt] = useState(null);
  const [savingScore, setSavingScore] = useState(false);
  const [autoMarking, setAutoMarking] = useState(false);
  const [deletingSubmissionPath, setDeletingSubmissionPath] = useState("");
  const [activeSubmissionTab, setActiveSubmissionTab] = useState("latest");
  const [smartMarkingResult, setSmartMarkingResult] = useState(null);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [answerKeyRegistry, setAnswerKeyRegistry] = useState([]);
  const [loadingAnswerKeys, setLoadingAnswerKeys] = useState(false);
  const [importingAnswerKeys, setImportingAnswerKeys] = useState(false);
  const [answerImportSummary, setAnswerImportSummary] = useState(null);

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
    setLoadingAnswerKeys(true);
    try {
      setAnswerKeyRegistry(await loadAnswerKeyRegistry());
    } catch (err) {
      error(err?.message || "Failed to load answer key registry");
    } finally {
      setLoadingAnswerKeys(false);
    }
  }, [error]);

  useEffect(() => {
    refreshAnswerKeyRegistry();
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
      return;
    }

    (async () => {
      setLoadingSubmissions(true);
      try {
        const submissionRows = await fetchSubmissions(selectedStudent.level, selectedStudent.studentCode);
        setSubmissions(submissionRows);
      } catch (err) {
        error(err?.message || "Failed to load student submissions");
      } finally {
        setLoadingSubmissions(false);
      }
    })();
  }, [roster, selectedStudentId, error]);

  useEffect(() => {
    let cancelled = false;

    const loadLatestSubmissions = async () => {
      setLoadingNotifications(true);
      try {
        const [rows, allAttempts] = await Promise.all([loadSubmissions(), loadSubmissions({ includeMarked: true })]);
        if (!cancelled) {
          setSubmissionNotifications(rows);
          setAllSubmissionAttempts(allAttempts);
        }
      } catch (err) {
        if (!cancelled) error(err?.message || "Failed to load submission notifications");
      } finally {
        if (!cancelled) setLoadingNotifications(false);
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

  const filteredStudents = useMemo(() => {
    if (!query.trim()) return roster;
    const q = normalize(query);
    return roster.filter((row) => normalize(row.name).includes(q) || normalize(row.studentCode).includes(q) || normalize(row.level).includes(q));
  }, [query, roster]);

  const selectedStudent = useMemo(() => {
    return roster.find((row) => row.id === selectedStudentId) || null;
  }, [roster, selectedStudentId]);

  const referenceEntry = useMemo(() => {
    return referenceEntries.find((entry) => entry.assignment === referenceAssignment) || null;
  }, [referenceAssignment, referenceEntries]);

  const filteredAttempts = useMemo(() => {
    if (!attemptSearch.trim()) return [];
    const search = normalize(attemptSearch);
    return allSubmissionAttempts.filter((row) => [row.studentCode, row.studentName, row.assignmentId, row.assignmentKey, row.assignment]
      .some((value) => normalize(value).includes(search)));
  }, [allSubmissionAttempts, attemptSearch]);

  const filteredReferenceEntries = useMemo(() => {
    if (!referenceQuery.trim()) return referenceEntries;
    const q = normalize(referenceQuery);
    return referenceEntries.filter((entry) => {
      const assignment = normalize(entry.assignment);
      const level = normalize(entry.level);
      const referenceText = normalize(entry.reference || "");
      const topicDe = normalize(entry.de || "");
      const topicEn = normalize(entry.en || "");
      return assignment.includes(q) || level.includes(q) || referenceText.includes(q) || topicDe.includes(q) || topicEn.includes(q);
    });
  }, [referenceEntries, referenceQuery]);

  const formattedReferenceAnswers = useMemo(() => {
    if (referenceEntry?.reference) return referenceEntry.reference;
    const lines = flattenAnswers(referenceEntry?.answers);
    return lines.join("\n");
  }, [referenceEntry]);

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
    return exact || studentSubmissions[0];
  }, [studentSubmissions, referenceAssignment, referenceEntries]);

  const selectedSubmission = latestSubmission;

  useEffect(() => {
    const submissionAssignment = selectedSubmission?.assignment || "";
    const nextAssignment = submissionAssignment || referenceEntry?.assignment || "";
    const submissionAssignmentId = selectedSubmission?.assignmentId || selectedSubmission?.assignmentKey || "";
    const level = selectedStudent?.level || referenceEntry?.level || inferLevel(nextAssignment);

    setAssignmentValue(nextAssignment);
    setAssignmentIdValue(submissionAssignmentId || buildAssignmentId(level, nextAssignment));
    setSmartMarkingResult(null);
    setSchreibenMark("");
    setFinalScoreOverride(null);
    setSelectedHighlight("");
  }, [
    selectedStudent?.level,
    referenceEntry?.level,
    referenceEntry?.assignment,
    selectedSubmission?.assignment,
    selectedSubmission?.assignmentId,
    selectedSubmission?.assignmentKey,
  ]);

  const latestNotifications = useMemo(() => submissionNotifications.slice(0, 60), [submissionNotifications]);

  const combinedReferenceAndSubmission = useMemo(() => {
    const referenceText = (formattedReferenceAnswers || "No reference answer available.").trim();
    const submissionText = (selectedSubmission?.text || "No student submission available.").trim();
    const improvementSummary = (selectedSubmission?.improvementSummary || "").trim();
    const previousSubmissionText = (selectedSubmission?.previousSubmissionText || "").trim();

    const resubmissionContext = [];
    if (improvementSummary) {
      resubmissionContext.push(`Resubmission improvement summary\n${improvementSummary}`);
    }
    if (previousSubmissionText) {
      resubmissionContext.push(`Previous submission\n${previousSubmissionText}`);
    }

    const contextBlock = resubmissionContext.length ? `\n\n${resubmissionContext.join("\n\n")}` : "";

    return `Reference Answer\n${referenceText}\n\nStudent Submission\n${submissionText}${contextBlock}`;
  }, [formattedReferenceAnswers, selectedSubmission]);

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
    return computeObjectiveScore(objectiveAssignmentId, selectedSubmission?.text || "");
  }, [objectiveAssignmentId, selectedSubmission?.text]);

  const objectiveScorePercent = objectivePercentFromResult(objectiveMarkingResult);
  const objectiveWrongRows = useMemo(() => objectiveWrongAnswerRows(objectiveMarkingResult.details), [objectiveMarkingResult.details]);
  const calculatedFinalScore = calculateFinalScore(objectiveScorePercent, schreibenMark);
  const finalScore = finalScoreOverride === null || finalScoreOverride === ""
    ? calculatedFinalScore
    : Number(finalScoreOverride);
  const displayedCalculatedFinalScore = Number.isInteger(calculatedFinalScore)
    ? calculatedFinalScore
    : Number(calculatedFinalScore.toFixed(2));
  const displayedFinalScore = Number.isInteger(finalScore) ? finalScore : Number(finalScore.toFixed(2));

  const handleDeleteSubmission = async (submission) => {
    if (!submission?.path) {
      error("Could not delete submission: missing document path.");
      return;
    }

    const confirmed = window.confirm("Delete this submission permanently? This cannot be undone.");
    if (!confirmed) return;

    try {
      setDeletingSubmissionPath(submission.path);
      await deleteSubmission(submission.path);
      setSubmissions((prev) => prev.filter((row) => row.path !== submission.path));
      setSubmissionNotifications((prev) => prev.filter((row) => row.path !== submission.path));
      setAllSubmissionAttempts((prev) => prev.filter((row) => row.path !== submission.path));
      success("Submission deleted.");
    } catch (err) {
      error(err?.message || "Failed to delete submission.");
    } finally {
      setDeletingSubmissionPath("");
    }
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

    setSubmissions(freshRows);
    setSelectedStudentId(matchingStudent.id);
    setQuery("");
    setActiveSubmissionTab("latest");

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

  const handleImportAnswerDictionary = async () => {
    try {
      setImportingAnswerKeys(true);
      const summary = await importAnswerDictionary(answersDictionary);
      setAnswerImportSummary(summary);
      await refreshAnswerKeyRegistry();
      success(`Imported ${summary.importedCount} of ${summary.totalAssignments} answer key assignments into Firestore (${summary.failedCount} failed).`);
    } catch (err) {
      error(err?.message || "Failed to import answer dictionary.");
    } finally {
      setImportingAnswerKeys(false);
    }
  };

  const handleCopyCombined = async () => {
    try {
      await navigator.clipboard.writeText(combinedReferenceAndSubmission);
      success("Combined reference and submission copied.");
    } catch {
      error("Could not copy combined text. Please copy manually.");
    }
  };


  const handleAutoMark = async () => {
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
      const deterministicObjective = computeObjectiveScore(deterministicAssignmentId, submissionText);
      const aiResult = await markSubmissionWithAI({
        referenceEntry: registryEntry,
        submission: { ...selectedSubmission, assignmentKey: registryEntry?.assignmentKey || selectedSubmission.assignmentKey },
        submissionText,
      });
      const result = mergeObjectiveScore(aiResult, deterministicObjective);
      setSmartMarkingResult(result);
      setSchreibenMark(result.writingScore === null || result.writingScore === undefined
        ? ""
        : String(writingScoreToPercent(result.writingScore, getMaxWritingScore(result))));
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
      error(err?.message || "Failed to auto-mark submission.");
    } finally {
      setAutoMarking(false);
    }
  };

  const handleApproveAndSend = async () => {
    if (!selectedSubmission || !smartMarkingResult) {
      error("Run AI marking before approving feedback.");
      return;
    }

    try {
      setWorkflowSaving(true);
      await updateMarkingWorkflowStatus({
        submissionId: selectedSubmission.id,
        submissionPath: selectedSubmission.path,
        status: "sent",
        sentToStudent: true,
      });
      setSmartMarkingResult((current) => current ? { ...current, status: "sent" } : current);
      success("Feedback approved and marked as sent to student.");
    } catch (err) {
      error(err?.message || "Failed to approve and send feedback.");
    } finally {
      setWorkflowSaving(false);
    }
  };

  const handleSendFeedbackToStudent = async () => {
    await handleApproveAndSend();
  };

  const handleNeedsTutorReview = async () => {
    if (!selectedSubmission) {
      error("Load a submission before sending it to tutor review.");
      return;
    }

    try {
      setWorkflowSaving(true);
      await updateMarkingWorkflowStatus({
        submissionId: selectedSubmission.id,
        submissionPath: selectedSubmission.path,
        status: "needs_review",
        sentToStudent: false,
      });
      setSmartMarkingResult((current) => current ? { ...current, status: "needs_review" } : current);
      success("Submission moved to tutor review queue.");
    } catch (err) {
      error(err?.message || "Failed to update tutor review status.");
    } finally {
      setWorkflowSaving(false);
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

  const handleInsertTemplate = () => {
    const template = MARKING_FEEDBACK_TEMPLATES.find((item) => item.id === selectedFeedbackTemplateId);
    if (!template) return;

    setFeedback((current) => {
      const trimmedCurrent = current.trim();
      if (!trimmedCurrent) return template.text;
      return `${trimmedCurrent}\n\n${template.text}`;
    });
  };

  const handleSave = async () => {
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
      const currentFeedback = feedback.trim();
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
        allowDuplicate: true,
        forceSheetDedupeId: true,
        markingDetails: {
          objectiveScore: currentObjectiveScore,
          objectiveCorrect: currentObjectiveResult.correctCount,
          objectiveTotal: currentObjectiveResult.totalCount,
          objectiveDetails: currentObjectiveResult.details,
          writingScore: currentWritingScore,
          writingScorePercent: currentWritingScore,
          maxWritingScore: 100,
          finalScore: currentScore,
        },
      });
      setSaveReceipt(receipt);

      if (selectedSubmission?.id || selectedSubmission?.path) {
        await saveMarkingResult({
          submissionId: selectedSubmission.id,
          submissionPath: selectedSubmission.path,
          result: {
            ...(smartMarkingResult || {}),
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
            aiOriginalScore,
            aiOriginalFeedback: smartMarkingResult?.aiOriginalFeedback ?? smartMarkingResult?.feedback ?? "",
          },
          status: "marked",
          sentToStudent: false,
        });
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
      if (err?.receipt) {
        setSaveReceipt(err.receipt);
      }
      error(err?.message || "Failed to save score");
    } finally {
      setSavingScore(false);
    }
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      <h2>Student Work Marking</h2>
      <p style={{ marginTop: -8, opacity: 0.8 }}>
        Smart flow: AI marks every submission. Objective parts still receive the Firestore answer key as source-of-truth context; missing keys are sent to tutor review instead of guessed.
      </p>

      {loading && <p>Loading roster and submissions...</p>}

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <details>
          <summary style={{ cursor: "pointer" }}>
            <span style={{ fontSize: "1.17em", fontWeight: 700 }}>Answer Keys</span>
            <span style={{ marginLeft: 8, fontSize: 13, opacity: 0.75 }}>
              {loadingAnswerKeys ? "Loading..." : `${answerKeyRegistry.length} keys`}
            </span>
          </summary>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              Firestore source of truth: <code>answerKeyRegistry/{"{assignment_id}"}</code>. AI marks every submission and uses these objective keys as required marking context.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={handleImportAnswerDictionary} disabled={importingAnswerKeys}>
                {importingAnswerKeys ? "Importing..." : "Import Answer Dictionary"}
              </button>
              <button type="button" onClick={refreshAnswerKeyRegistry} disabled={loadingAnswerKeys}>Refresh keys</button>
            </div>
            {answerImportSummary ? (
              <div style={{ border: "1px solid #d8e2ef", background: "#f8fbff", borderRadius: 8, padding: 10, fontSize: 13 }}>
                <strong>Last import validation</strong>
                <div>Imported: <b>{answerImportSummary.importedCount}</b> · Failed: <b>{answerImportSummary.failedCount}</b> · Total assignments: <b>{answerImportSummary.totalAssignments}</b></div>
                <div>Sample keys: {answerImportSummary.sampleImportedKeys?.length ? answerImportSummary.sampleImportedKeys.join(", ") : "—"}</div>
                {answerImportSummary.warnings?.length ? (
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {answerImportSummary.warnings.slice(0, 10).map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                ) : <div>No warnings for missing assignment_id or answers.</div>}
              </div>
            ) : null}
            {loadingAnswerKeys ? <p style={{ margin: 0 }}>Loading answer keys...</p> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Assignment key</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Title</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Level</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Format</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Parts</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Answers</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Links</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Load status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answerKeyRegistry.slice(0, 80).map((entry) => {
                      const parts = Object.entries(entry.parts || {}).map(([partKey, part]) => ({ partId: part?.partId || partKey, ...part }));
                      const answerCount = Number(entry.totalAnswers || parts.reduce((sum, part) => sum + Number(part.answerCount || part.answers?.length || 0), 0));
                      const loadStatus = answerCount > 0 ? `Loaded ${entry.importedAt ? new Date(entry.importedAt).toLocaleString() : ""}`.trim() : "No parsed answers";
                      return (
                        <tr key={entry.id || entry.assignmentKey}>
                          <td style={{ borderBottom: "1px solid #eee", padding: 6 }}><code>{entry.assignmentKey}</code></td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{entry.title || "—"}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{entry.level || "—"}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{entry.format || "—"}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{parts.map((part) => part.partId).join(", ") || "—"}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{answerCount}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>
                            {entry.answerUrl ? <a href={entry.answerUrl} target="_blank" rel="noreferrer">answer</a> : "—"}
                            {entry.sheetUrl ? <> · <a href={entry.sheetUrl} target="_blank" rel="noreferrer">sheet</a></> : null}
                          </td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{loadStatus}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </details>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3>1) Pick a student</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <input
            placeholder="Search by student name/code/level"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ minWidth: 280 }}
          />
          <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} style={{ minWidth: 320 }}>
            <option value="">Select student...</option>
            {filteredStudents.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name || "(No name)"} · {row.studentCode || "No code"} · {row.level || "No level"}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3>2) Pick a reference answer</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="Search reference answers by assignment/level"
            value={referenceQuery}
            onChange={(e) => setReferenceQuery(e.target.value)}
          />
          <select value={referenceAssignment} onChange={(e) => setReferenceAssignment(e.target.value)}>
            {filteredReferenceEntries.map((entry) => (
              <option key={entry.assignment} value={entry.assignment}>
                {formatReferenceAssignmentLabel(entry)}
              </option>
            ))}
          </select>
          {!filteredReferenceEntries.length && (
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>No reference answers match your search.</p>
          )}
          <textarea value={formattedReferenceAnswers} readOnly rows={10} />
          {referenceEntry?.answer_url && (
            <a href={referenceEntry.answer_url} target="_blank" rel="noreferrer">
              Open answer source
            </a>
          )}
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3>3) Load student submission</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setActiveSubmissionTab("latest")}
            style={{ fontWeight: activeSubmissionTab === "latest" ? 700 : 400 }}
          >
            Latest submission
          </button>
          <button
            onClick={() => setActiveSubmissionTab("notifications")}
            style={{ fontWeight: activeSubmissionTab === "notifications" ? 700 : 400 }}
          >
            Incoming notifications
          </button>
        </div>
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
          <label style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 700 }}>
            Find all submission attempts
            <input
              value={attemptSearch}
              onChange={(event) => setAttemptSearch(event.target.value)}
              placeholder="Search student code/name or assignment ID"
            />
          </label>
          {attemptSearch.trim() ? (
            <div style={{ display: "grid", gap: 6, marginTop: 8, maxHeight: 260, overflow: "auto" }}>
              {filteredAttempts.map((row) => (
                <div key={`attempt-${row.path || row.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: 6 }}>
                  <div style={{ fontSize: 12 }}>
                    <b>{row.studentName || "Unknown student"}</b> ({row.studentCode || "No code"}) · {row.assignment || "Unknown assignment"}
                    {row.assignmentId ? <> · ID: <code>{row.assignmentId}</code></> : null} · {row.createdAt?.toLocaleString() || "Unknown time"}
                    <SubmissionAttemptLabels submission={row} />
                  </div>
                  <button type="button" onClick={() => void handleSelectFromNotification(row)}>Load</button>
                </div>
              ))}
              {!filteredAttempts.length ? <span style={{ fontSize: 12 }}>No attempts match this search.</span> : null}
            </div>
          ) : <span style={{ display: "block", marginTop: 5, fontSize: 12, opacity: 0.75 }}>Includes marked, failed, pending, and resubmitted attempts.</span>}
        </div>
        {loadingSubmissions ? (
          <p style={{ margin: 0 }}>Loading submissions...</p>
        ) : activeSubmissionTab === "latest" ? (
          selectedSubmission ? (
            <>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                Assignment: <b>{selectedSubmission.assignment || "Unknown"}</b>
                {selectedSubmission.assignmentId ? <> · ID: <code>{selectedSubmission.assignmentId}</code></> : null}
                {" · "}Status: {selectedSubmission.status || "submitted"} · Submitted: {selectedSubmission.createdAt?.toLocaleString() || "Unknown"}
                <SubmissionAttemptLabels submission={selectedSubmission} />
              </div>
              {selectedSubmission.improvementSummary ? (
                <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Resubmission improvement summary</div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{selectedSubmission.improvementSummary}</div>
                </div>
              ) : null}
              {selectedSubmission.previousSubmissionText ? (
                <details style={{ marginBottom: 8 }}>
                  <summary style={{ cursor: "pointer", fontSize: 13 }}>View previous submission text</summary>
                  <textarea readOnly rows={6} value={selectedSubmission.previousSubmissionText} style={{ marginTop: 8 }} />
                </details>
              ) : null}
              <textarea
                readOnly
                rows={8}
                value={selectedSubmission.text || "No submission text available."}
                onSelect={handleSelectSubmissionText}
                aria-label="Student submitted work"
              />
              {selectedHighlight ? (
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={handleAddHighlightToComment}>Add Highlight to Comment</button>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Selected: “{selectedHighlight}”</span>
                </div>
              ) : null}
            </>
          ) : (
            <p style={{ margin: 0 }}>No submission found yet for this student.</p>
          )
        ) : activeSubmissionTab === "notifications" ? (
          loadingNotifications ? (
            <p style={{ margin: 0 }}>Loading notifications...</p>
          ) : latestNotifications.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {latestNotifications.map((row) => (
                <div key={row.path || row.id} style={{ border: "1px solid #e1e1e1", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 13 }}>
                    <b>{row.studentName || "Unknown student"}</b> ({row.studentCode || "No code"}) · {row.level || "No level"}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <b>{row.assignment || "Unknown assignment"}</b> · {row.status || "submitted"} · {row.createdAt?.toLocaleString() || "Unknown time"}
                    {row.assignmentId ? <> · ID: <code>{row.assignmentId}</code></> : null}
                    <SubmissionAttemptLabels submission={row} />
                  </div>
                  <div style={{ fontSize: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span>Marking: <b>{row.markingStatus || "pending"}</b></span>
                    {row.finalScore !== null && row.finalScore !== undefined ? <span>Final score: <b>{row.finalScore}</b></span> : null}
                    {row.aiConfidence !== null && row.aiConfidence !== undefined ? <span>AI confidence: <b>{row.aiConfidence}</b></span> : null}
                  </div>
                  {row.improvementSummary ? (
                    <div style={{ fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: 6 }}>
                      <b>Improvement summary:</b> {row.improvementSummary}
                    </div>
                  ) : null}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <button onClick={() => void handleSelectFromNotification(row)}>Load for marking</button>
                    <button
                      onClick={() => handleDeleteSubmission(row)}
                      disabled={deletingSubmissionPath === row.path}
                    >
                      {deletingSubmissionPath === row.path ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>No incoming submissions found yet.</p>
          )
        ) : null}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3>4) Combined reference + student answer</h3>
        <p style={{ marginTop: 0, fontSize: 13, opacity: 0.8 }}>
          Use this combined block for quick copy/paste into external marking tools.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          <textarea readOnly rows={12} value={combinedReferenceAndSubmission} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopyCombined}>Copy combined text</button>
          </div>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3>5) Enter score and feedback</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {smartMarkingResult ? (
            <div style={{ border: "1px solid #bfdbfe", borderRadius: 8, padding: 10, background: "#eff6ff", display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, fontSize: 13 }}>
                <span>Detected level: <b>{smartMarkingResult.level}</b></span>
                <span>Detected assignment: <b>{smartMarkingResult.assignmentKey || "Unknown"}</b></span>
                <span>Objective score: <b>{smartMarkingResult.objectiveTotal ? `${smartMarkingResult.objectiveCorrect}/${smartMarkingResult.objectiveTotal} → ${Math.round(smartMarkingResult.objectiveScore ?? 0)}%` : "—"}</b></span>
                <span>Writing score: <b>{formatWritingScore(smartMarkingResult)}</b></span>
                <span>Current final score: <b>{displayedFinalScore}</b></span>
                <span>AI confidence: <b>{smartMarkingResult.confidence}</b></span>
                <span>Status: <b>{smartMarkingResult.status}</b></span>
              </div>
              <div style={{ fontSize: 13 }}>
                <b>Detected parts:</b> {smartMarkingResult.detectedParts?.map((part) => part.summary || `${part.partId}: ${part.answerCount ?? part.total ?? "—"} ${part.partType || "answers"} found${part.correct !== undefined ? `, ${part.correct} correct, ${part.wrong ?? 0} wrong` : ""}`).join(", ") || "None"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={handleAutoMark} disabled={autoMarking || workflowSaving}>Re-run AI marking</button>
                <button type="button" onClick={handleApproveAndSend} disabled={workflowSaving}>Approve and send</button>
                <button type="button" onClick={handleSendFeedbackToStudent} disabled={workflowSaving}>Send feedback to student</button>
                <button type="button" onClick={handleNeedsTutorReview} disabled={workflowSaving}>Mark as needs tutor review</button>
              </div>
            </div>
          ) : null}
          {objectiveMarkingResult.totalCount > 0 ? (
            <div style={{ fontSize: 13, color: "#1f2937", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: 8 }}>
              Deterministic objective score for {objectiveAssignmentId}: <b>{objectiveMarkingResult.correctCount}/{objectiveMarkingResult.totalCount} → {Math.round(objectiveScorePercent)}%</b>
            </div>
          ) : null}
          {objectiveWrongRows.length > 0 ? (
            <div style={{ border: "1px solid #fecaca", borderRadius: 8, overflow: "hidden", background: "#fff7ed" }}>
              <div style={{ padding: 8, fontSize: 13, fontWeight: 700, color: "#7f1d1d" }}>Wrong objective answers</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 6, borderTop: "1px solid #fed7aa", borderBottom: "1px solid #fed7aa" }}>Question</th>
                      <th style={{ textAlign: "left", padding: 6, borderTop: "1px solid #fed7aa", borderBottom: "1px solid #fed7aa" }}>Student</th>
                      <th style={{ textAlign: "left", padding: 6, borderTop: "1px solid #fed7aa", borderBottom: "1px solid #fed7aa" }}>Correct</th>
                      <th style={{ textAlign: "left", padding: 6, borderTop: "1px solid #fed7aa", borderBottom: "1px solid #fed7aa" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objectiveWrongRows.map((row) => (
                      <tr key={row.question}>
                        <td style={{ padding: 6, borderBottom: "1px solid #ffedd5" }}>{row.question}</td>
                        <td style={{ padding: 6, borderBottom: "1px solid #ffedd5" }}>{row.student || "—"}</td>
                        <td style={{ padding: 6, borderBottom: "1px solid #ffedd5" }}>{row.expected || row.rawExpected || "—"}</td>
                        <td style={{ padding: 6, borderBottom: "1px solid #ffedd5" }}>Wrong</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : objectiveMarkingResult.totalCount > 0 ? (
            <div style={{ fontSize: 13, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: 8 }}>
              No wrong objective answers detected.
            </div>
          ) : null}
          <label>
            Schreiben Mark (out of 100)
            <input
              type="number"
              min={0}
              max={100}
              value={schreibenMark}
              onChange={(e) => {
                const nextValue = e.target.value;
                if (nextValue === "") {
                  setSchreibenMark("");
                  setFinalScoreOverride(null);
                  return;
                }

                setSchreibenMark(String(Math.max(0, Math.min(100, Number(nextValue)))));
                setFinalScoreOverride(null);
              }}
              placeholder="Enter writing score"
            />
          </label>
          <div style={{ padding: 12, borderRadius: 8, border: "2px solid #2563eb", background: "#eff6ff", display: "grid", gap: 6 }}>
            <label style={{ fontSize: 18, fontWeight: 700 }}>
              Final Score (editable)
              <input
                type="number"
                min={0}
                max={100}
                value={finalScoreOverride === null ? displayedCalculatedFinalScore : finalScoreOverride}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (nextValue === "") {
                    setFinalScoreOverride("");
                    return;
                  }

                  setFinalScoreOverride(String(Math.max(0, Math.min(100, Number(nextValue)))));
                }}
              />
            </label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {finalScoreOverride !== null && finalScoreOverride !== ""
                ? `Manual final score override. Calculated score: ${displayedCalculatedFinalScore}.`
                : schreibenMark === ""
                  ? "Using Objective Percentage only because Schreiben Mark is empty."
                  : `Rounded average of Objective Percentage (${Number(objectiveScorePercent.toFixed(2))}) and Schreiben Mark (${schreibenMark}).`}
            </div>
            {finalScoreOverride !== null ? (
              <button type="button" onClick={() => setFinalScoreOverride(null)} style={{ justifySelf: "start" }}>
                Use calculated score ({displayedCalculatedFinalScore})
              </button>
            ) : null}
          </div>
          <label>
            Comments / Feedback
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={8}
              style={{ fontSize: "1rem", lineHeight: 1.6, minHeight: 180 }}
              placeholder="Write clear, actionable feedback for the student..."
            />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "grid", gap: 4 }}>
              Comment template
              <select
                value={selectedFeedbackTemplateId}
                onChange={(e) => setSelectedFeedbackTemplateId(e.target.value)}
              >
                {MARKING_FEEDBACK_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={handleInsertTemplate}>Insert template</button>
          </div>
          <label>
            Assignment
            <input value={assignmentValue} onChange={(e) => setAssignmentValue(e.target.value)} />
          </label>
          <label>
            Assignment ID (loaded from submission when available; editable)
            <input value={assignmentIdValue} onChange={(e) => setAssignmentIdValue(e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAutoMark} disabled={autoMarking || !selectedSubmission}>
              {autoMarking ? "AI marking..." : "Run AI marking"}
            </button>
            <button onClick={() => { setSchreibenMark(""); setFinalScoreOverride(null); setFeedback(""); setSelectedHighlight(""); }}>Reset</button>
          </div>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3>6) Save to Google Sheets (and optionally Firestore)</h3>
        <p style={{ marginTop: 0, fontSize: 13, opacity: 0.8 }}>
          Saves row headers: studentcode, name, assignment, score, comments, date, level, link, assignment_id.
        </p>
        <button onClick={handleSave} disabled={loading || savingScore}>{savingScore ? "Saving..." : "Save Final Score"}</button>
        {savingScore && <p style={{ marginTop: 8, fontSize: 13 }}>Saving score, please wait...</p>}
        {saveReceipt && (
          <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 8, padding: 10, background: "#fafafa", display: "grid", gap: 8 }}>
            <div style={{ fontSize: 13 }}>
              <b>Save receipt:</b> {saveReceipt.row.name} · {saveReceipt.row.assignment} · ID: <code>{saveReceipt.row.assignment_id || "—"}</code>
            </div>
            <div style={{ fontSize: 13 }}>
              Google Sheets: <b>{saveReceipt.sheet.success ? "Success" : "Failed"}</b>
              <div style={{ opacity: 0.85 }}>{saveReceipt.sheet.message}</div>
            </div>
            <div style={{ fontSize: 13 }}>
              Firestore mirror: <b>{saveReceipt.firestore.success ? "Success" : "Failed"}</b>
              <div style={{ opacity: 0.85 }}>{saveReceipt.firestore.message}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
