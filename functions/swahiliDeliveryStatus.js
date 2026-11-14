// Delivery can finish after a tutor saves a newer review for the same lesson.
async function updateSwahiliDeliveryStatus(db, reviewRef, reviewedAt, fields) {
  await db.runTransaction(async (tx) => {
    const latest = await tx.get(reviewRef);
    if (latest.data()?.reviewedAt?.isEqual?.(reviewedAt)) {
      tx.set(reviewRef, fields, { merge: true });
    }
  });
}

module.exports = { updateSwahiliDeliveryStatus };
