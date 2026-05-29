import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { db, storage } from "../firebase.js";
import { normalizeAnswerDictionary, safeRegistryId, validateAnswerDictionary } from "../utils/answerKeyNormalizer.js";

export const DEFAULT_ANSWER_KEY_MANIFEST_URL =
  "https://raw.githubusercontent.com/learngermanghana/falowenadmin/main/src/data/answers_dictionary.json";

function checksumForText(text = "") {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return `c${Math.abs(hash).toString(16)}`;
}

function toJson(value) {
  return JSON.stringify(value, null, 2);
}

async function uploadJson(path, value) {
  if (!storage) {
    throw new Error("Firebase Storage is not configured. Check VITE_FIREBASE_STORAGE_BUCKET.");
  }

  const body = toJson(value);
  const fileRef = ref(storage, path);
  await uploadString(fileRef, body, "raw", {
    contentType: "application/json; charset=utf-8",
    customMetadata: {
      source: "github-answer-key-sync",
    },
  });
  const downloadUrl = await getDownloadURL(fileRef).catch(() => "");
  return { path, downloadUrl, bytes: body.length, checksum: checksumForText(body) };
}

async function fetchManifest(manifestUrl = DEFAULT_ANSWER_KEY_MANIFEST_URL) {
  const response = await fetch(manifestUrl, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Failed to load GitHub answer manifest (${response.status})`);
  }
  return response.json();
}

export async function syncAnswerKeysFromGitHub({ manifestUrl = DEFAULT_ANSWER_KEY_MANIFEST_URL } = {}) {
  const dictionary = await fetchManifest(manifestUrl);
  const validation = validateAnswerDictionary(dictionary);
  const normalizedEntries = normalizeAnswerDictionary(dictionary);
  const now = new Date().toISOString();
  const version = now.replace(/[-:.TZ]/g, "").slice(0, 14);

  const manifestStorage = await uploadJson("answer-keys/_manifest/latest.json", {
    source: "github",
    manifestUrl,
    syncedAt: now,
    version,
    totalAssignments: normalizedEntries.length,
    validation,
    assignments: normalizedEntries.map((entry) => ({
      assignmentKey: entry.assignmentKey,
      title: entry.title,
      level: entry.level,
      format: entry.format,
      expectedParts: entry.expectedParts,
      answerLayout: entry.answerLayout,
      totalAnswers: entry.totalAnswers,
    })),
  });

  const results = await Promise.allSettled(normalizedEntries.map(async (entry) => {
    const safeAssignmentKey = safeRegistryId(entry.assignmentKey);
    const activeStoragePath = `answer-keys/${safeAssignmentKey}/active.json`;
    const versionStoragePath = `answer-keys/${safeAssignmentKey}/versions/${version}.json`;
    const storagePayload = {
      ...entry,
      syncedAt: now,
      version,
      source: "github",
      manifestUrl,
    };

    const [activeUpload, versionUpload] = await Promise.all([
      uploadJson(activeStoragePath, storagePayload),
      uploadJson(versionStoragePath, storagePayload),
    ]);

    const existing = await getDoc(doc(db, "answerKeyRegistry", safeAssignmentKey));
    await setDoc(doc(db, "answerKeyRegistry", safeAssignmentKey), {
      assignmentKey: entry.assignmentKey,
      title: entry.title,
      level: entry.level,
      format: entry.format,
      answerUrl: entry.answerUrl,
      sheetUrl: entry.sheetUrl,
      rawAnswers: entry.rawAnswers,
      parts: entry.parts,
      expectedParts: entry.expectedParts,
      answerLayout: entry.answerLayout,
      totalAnswers: entry.totalAnswers,
      storagePath: activeStoragePath,
      activeStoragePath,
      activeDownloadUrl: activeUpload.downloadUrl,
      versionStoragePath,
      latestVersion: version,
      checksum: versionUpload.checksum,
      source: "github-sync",
      manifestUrl,
      manifestStoragePath: manifestStorage.path,
      syncedAt: now,
      updatedAt: now,
      importedAt: now,
      createdAt: existing.exists() ? existing.data()?.createdAt || now : now,
    }, { merge: true });

    return {
      assignmentKey: entry.assignmentKey,
      activeStoragePath,
      versionStoragePath,
      expectedParts: entry.expectedParts,
      totalAnswers: entry.totalAnswers,
    };
  }));

  const imported = results
    .map((result, index) => result.status === "fulfilled" ? normalizedEntries[index].assignmentKey : "")
    .filter(Boolean);
  const failed = results
    .map((result, index) => result.status === "rejected" ? {
      assignmentKey: normalizedEntries[index]?.assignmentKey || "unknown",
      reason: result.reason?.message || String(result.reason || "Sync failed"),
    } : null)
    .filter(Boolean);

  await setDoc(doc(db, "answerKeySyncRuns", version), {
    version,
    source: "github",
    manifestUrl,
    manifestStoragePath: manifestStorage.path,
    syncedAt: now,
    totalAssignments: normalizedEntries.length,
    importedCount: imported.length,
    failedCount: failed.length,
    failed,
    warnings: validation.warnings,
  }, { merge: true });

  return {
    version,
    manifestUrl,
    manifestStoragePath: manifestStorage.path,
    totalAssignments: normalizedEntries.length,
    importedCount: imported.length,
    failedCount: failed.length,
    sampleImportedKeys: imported.slice(0, 8),
    warnings: validation.warnings,
    failed,
  };
}
