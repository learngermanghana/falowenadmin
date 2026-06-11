export function calculateFinalScore(objectivePercentage, schreibenMark = "") {
  const objectiveScore = Number(objectivePercentage);
  const safeObjectiveScore = Number.isFinite(objectiveScore) ? objectiveScore : 0;

  if (schreibenMark === "" || schreibenMark === null || schreibenMark === undefined) {
    return safeObjectiveScore;
  }

  const writingScore = Number(schreibenMark);
  if (!Number.isFinite(writingScore)) return safeObjectiveScore;

  return Math.round((safeObjectiveScore + writingScore) / 2);
}
