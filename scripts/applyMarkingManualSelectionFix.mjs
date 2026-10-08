/* eslint-disable no-regex-spaces */
import { readFileSync, writeFileSync } from "node:fs";

function replaceRequired(text, oldBlock, newBlock, label) {
  if (text.includes(newBlock)) return text;
  if (!text.includes(oldBlock)) {
    throw new Error(`Could not find block for ${label}`);
  }
  return text.replace(oldBlock, newBlock);
}

function patchMarkingPage() {
  const path = "src/pages/MarkingPage.jsx";
  let text = readFileSync(path, "utf8");

  const simplifiedWorkspace = (text.includes('<h3>Submissions</h3>') || text.includes('<h3>Submissions to mark</h3>'))
    && text.includes('aria-label="Reference answer"')
    && text.includes('<h3>Objective mapping</h3>');

  text = text.replace(
    'const [activeSubmissionTab, setActiveSubmissionTab] = useState("latest");',
    'const [activeSubmissionTab, setActiveSubmissionTab] = useState("notifications");',
  );

  // Never let a manually selected reference silently fall back to another
  // submission from the same student.
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
    setFeedback("");
    setSaveReceipt(null);
    setSchreibenMark("");
    setFinalScoreOverride(null);
    setSelectedHighlight("");
  }, [
    reviewIdentity,
    selectedStudent?.level,
    referenceEntry?.level,
    referenceEntry?.assignment,
    selectedSubmission?.assignment,
    selectedSubmission?.assignmentId,
    selectedSubmission?.assignmentKey,
  ]);`;

  const simplifiedAssignmentEffect = `  useEffect(() => {
    const submissionAssignment = selectedSubmission?.assignment || "";
    const nextAssignment = submissionAssignment || referenceEntry?.assignment || "";
    const submissionAssignmentId = selectedSubmission?.assignmentId || selectedSubmission?.assignmentKey || "";
    const level = selectedStudent?.level || referenceEntry?.level || inferLevel(nextAssignment);

    setAssignmentValue(nextAssignment);
    setAssignmentIdValue(submissionAssignmentId || buildAssignmentId(level, nextAssignment));
    setSmartMarkingResult(null);
    setFeedback("");
    setSchreibenMark("");
    setFinalScoreOverride(null);
    setSelectedHighlight("");
  }, [
    reviewIdentity,
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
    setFeedback("");
    setSchreibenMark("");
    setFinalScoreOverride(null);
    setSelectedHighlight("");
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
  ]);`;

  const enhancedAssignmentEffect = newAssignmentEffect.replace(
    '    setSelectedHighlight("");',
    '    setSelectedHighlight("");\n    setShowAllObjectiveAnswers(false);',
  );

  const legacyNewAssignmentEffect = newAssignmentEffect.replace(
    '    setFeedback("");\n    setSchreibenMark("");',
    '    setFeedback("");\n    setSaveReceipt(null);\n    setSchreibenMark("");',
  );

  if (text.includes(enhancedAssignmentEffect)) {
    // The focused marking UI also resets its issue-only objective view whenever
    // the selected submission/reference changes. The assignment-id fix is
    // already present, so there is nothing else to patch.
  } else if (text.includes(simplifiedAssignmentEffect)) {
    text = text.replace(simplifiedAssignmentEffect, newAssignmentEffect);
  } else if (text.includes(oldAssignmentEffect)) {
    text = text.replace(oldAssignmentEffect, legacyNewAssignmentEffect);
  } else if (!text.includes(newAssignmentEffect) && !text.includes(legacyNewAssignmentEffect)) {
    throw new Error("Could not find block for assignment id controlled by selected reference answer");
  }

  // The simplified marking workspace already replaces the old latest/notification
  // tabs with one submission queue. Legacy UI rewrites are unnecessary there.
  if (!simplifiedWorkspace) {
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
    if (attemptSearchPattern.test(text)) {
      text = text.replace(attemptSearchPattern, '\n        {activeSubmissionTab === "latest" ? (');
    } else if (!text.includes('{activeSubmissionTab === "latest" ? (')) {
      throw new Error("Could not remove all-attempt/latest loading block");
    }

    text = text.replace(
      '<p style={{ margin: 0 }}>No submission found yet for this student.</p>',
      '<p style={{ margin: 0 }}>No incoming submission loaded. Use Incoming notifications below when a student submits work.</p>',
    );
  }

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

function patchDashboardPage() {
  const path = "src/pages/DashboardPage.jsx";
  let text = readFileSync(path, "utf8");

  const oldAnalyticsQueue = `    const classBreakdown = groupTopClasses(students);
    const workQueue = incomingAssignments.length + pendingTutorReviewsCount + grammarIssueReports.length;
    return {
      totalStudents,
      activeStudents,
      paidStudents,
      studentsWithBalance,
      totalBalance,
      classBreakdown,
      workQueue,
      paymentRate: pct(paidStudents, totalStudents),
      activeRate: pct(activeStudents, totalStudents),
    };`;

  const newAnalyticsQueue = `    const classBreakdown = groupTopClasses(students);
    const incomingQueue = incomingAssignments.length;
    const adminAttentionQueue = pendingTutorReviewsCount + grammarIssueReports.length;
    const operationalQueue = incomingQueue + adminAttentionQueue;
    return {
      totalStudents,
      activeStudents,
      paidStudents,
      studentsWithBalance,
      totalBalance,
      classBreakdown,
      incomingQueue,
      adminAttentionQueue,
      operationalQueue,
      workQueue: incomingQueue,
      paymentRate: pct(paidStudents, totalStudents),
      activeRate: pct(activeStudents, totalStudents),
    };`;

  text = replaceRequired(text, oldAnalyticsQueue, newAnalyticsQueue, "dashboard queue breakdown");

  const oldHeroQueue = `        <div className="hero-score-card">
          <span>Operational queue</span>
          <strong>{analytics.workQueue}</strong>
          <p>{analytics.workQueue === 0 ? "No urgent admin work pending." : "items need attention"}</p>
        </div>`;

  const newHeroQueue = `        <div className="hero-score-card">
          <span>Incoming work</span>
          <strong>{analytics.incomingQueue}</strong>
          <p>
            {analytics.incomingQueue === 0
              ? analytics.adminAttentionQueue
                ? \`No incoming work. \${analytics.adminAttentionQueue} other admin item\${analytics.adminAttentionQueue === 1 ? "" : "s"} need attention.\`
                : "No incoming submitted work pending."
              : \`\${analytics.incomingQueue} submitted item\${analytics.incomingQueue === 1 ? "" : "s"} waiting for marking.\`}
          </p>
        </div>`;

  text = replaceRequired(text, oldHeroQueue, newHeroQueue, "dashboard incoming-work hero card");

  writeFileSync(path, text);
}

patchMarkingPage();
patchAssignmentId();
patchDashboardPage();
console.log("Applied Falowen admin manual marking and dashboard queue fixes.");
