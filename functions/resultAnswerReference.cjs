function resultAnswerReference(reference, assignmentId) {
  if (!reference || String(reference.assignmentKey || "").toUpperCase() !== String(assignmentId || "").toUpperCase()) return null;
  const parts = (reference.referenceAnswerParts || []).flatMap(id => {
    const answers = (reference.parts?.[id]?.answers || []).flatMap(answer => {
      const text = String(answer.rawCorrectAnswer ?? "").trim();
      if (!text || /^(read|see|check) (the )?(comments?|instructions?)\b/i.test(text)) return [];
      return [{ question: String(answer.questionKey || answer.questionNumber), answer: text }];
    });
    return answers.length ? [{ id, answers }] : [];
  });
  return parts.length ? { assignmentId, revision: String(reference.coursebookRevision || reference.version || ""), parts } : null;
}

module.exports = { resultAnswerReference };
