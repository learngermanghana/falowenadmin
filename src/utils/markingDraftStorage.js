export async function tryStoreMarkingDraft(write, collectionName) {
  try {
    await write();
    return null;
  } catch (error) {
    if (!["permission-denied", "firestore/permission-denied"].includes(error?.code)) throw error;
    return `Firestore denied access to ${collectionName}.`;
  }
}
