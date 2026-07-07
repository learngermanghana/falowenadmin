import { readFileSync, writeFileSync } from "node:fs";

function replaceRequired(text, oldBlock, newBlock, label) {
  if (!text.includes(oldBlock)) {
    throw new Error(`Could not find block for ${label}`);
  }
  return text.replace(oldBlock, newBlock);
}

function patchMarkingPage() {
  const path = "src/pages/MarkingPage.jsx";
  let text = readFileSync(path, "utf8");

  text = text.replace(
    'const [activeSubmissionTab, setActiveSubmissionTab] = useState("latest");',
    'const [activeSubmissionTab, setActiveSubmissionTab] = useState("notifications");',
  );

  text = text.replace(
    '    return exact || studentSubmissions[0];',
    '    return exact || null;',
  );

  const oldAssignmentEffect = `  useEffect(() => {
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
  ]);`;

  const newAssignmentEffect = `  useEffect(() => {
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
    setSchreibenMark("");
    setFinalScoreOverride(null);
    setSelectedHighlight("");
  }, [
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
  ]);`;

  text = replaceRequired(text, oldAssignmentEffect, newAssignmentEffect, "assignment id controlled by selected reference answer");

  text = text.replace("<h3>3) Load student submission</h3>", "<h3>3) Incoming work notifications</h3>");

  const oldTabButtons = `        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
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
        </div>`;

  const newTabInfo = `        <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
            Manual student/reference selection no longer pulls the student’s last submission. Use incoming notifications below to load real submitted work.
          </p>
          {activeSubmissionTab === "latest" ? (
            <button type="button" onClick={() => setActiveSubmissionTab("notifications")} style={{ justifySelf: "start" }}>
              Back to incoming notifications
            </button>
          ) : null}
        </div>`;

  text = replaceRequired(text, oldTabButtons, newTabInfo, "remove latest submission tab");

  const attemptSearchPattern = /\n        <div style=\{\{ marginBottom: 12, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" \}\}>\n          <label style=\{\{ display: "grid", gap: 5, fontSize: 13, fontWeight: 700 \}\}>\n            Find all submission attempts\n[\s\S]*?        <\/div>\n        \{loadingSubmissions \? \(\n          <p style=\{\{ margin: 0 \}\}>Loading submissions\.\.\.<\/p>\n        \) : activeSubmissionTab === "latest" \? \(/;
  if (!attemptSearchPattern.test(text)) {
    throw new Error("Could not remove all-attempt/latest loading block");
  }
  text = text.replace(attemptSearchPattern, '\n        {activeSubmissionTab === "latest" ? (');

  text = text.replace(
    '<p style={{ margin: 0 }}>No submission found yet for this student.</p>',
    '<p style={{ margin: 0 }}>No incoming submission loaded. Use Incoming notifications below when a student submits work.</p>',
  );

  writeFileSync(path, text);
}

function patchAssignmentId() {
  const path = "src/utils/assignmentId.js";
  let text = readFileSync(path, "utf8");
  text = text.replace(
    '  const topicText = String(topic || "");',
    '  const topicText = String(topic || "").replace(/^\\s*[A-Z]\\d\\s*[-:•·]?\\s*/i, "");',
  );
  writeFileSync(path, text);
}

patchMarkingPage();
patchAssignmentId();
console.log("Applied Falowen admin manual marking selection fix.");
