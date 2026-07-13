import { readFileSync, writeFileSync } from "node:fs";

const path = "functions/index.js";
const marker = "student_delete_runtime_v2";
let source = readFileSync(path, "utf8");

if (source.includes(marker)) {
  console.log("Student deletion runtime fixes are present in functions/index.js.");
  process.exit(0);
}

function replaceRequired(before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Could not patch ${label}: expected source was not found.`);
  }
  source = source.replace(before, after);
}

replaceRequired(
  `const studentDeleteAppsScriptUrlSecret = defineSecret("STUDENT_DELETE_APPS_SCRIPT_URL");
const studentDeleteSyncSecret = defineSecret("STUDENT_DELETE_SYNC_SECRET");
`,
  "",
  "optional student deletion secrets",
);

replaceRequired(
  `function uniqueNonEmpty(values = []) {
  return [...new Set(values.map(cleanIdentifier).filter(Boolean))];
}
`,
  `function uniqueNonEmpty(values = []) {
  return [...new Set(values.map(cleanIdentifier).filter(Boolean))];
}

// student_delete_runtime_v2
function addStudentDeletionWarning(summary, step, error) {
  const message = error?.message || String(error || "Unknown cleanup error");
  summary.warnings = Array.isArray(summary.warnings) ? summary.warnings : [];
  summary.warnings.push({ step, message });
  console.warn("student_delete_cleanup_warning", { step, message });
}
`,
  "student deletion warning helper",
);

replaceRequired(
  `async function deleteMatchingCollectionDocs(collectionId, fieldNames, values, summary) {
  for (const fieldName of fieldNames) {
    for (const value of values) {
      await deleteQuerySnapshot(
        db.collection(collectionId).where(fieldName, "==", value),
        summary,
        collectionId,
      );
    }
  }
}
`,
  `async function deleteMatchingCollectionDocs(collectionId, fieldNames, values, summary) {
  for (const fieldName of fieldNames) {
    for (const value of values) {
      try {
        await deleteQuerySnapshot(
          db.collection(collectionId).where(fieldName, "==", value),
          summary,
          collectionId,
        );
      } catch (error) {
        addStudentDeletionWarning(summary, \`${collectionId}.${fieldName}\`, error);
      }
    }
  }
}
`,
  "collection cleanup error handling",
);

replaceRequired(
  `async function deleteMatchingCollectionGroupDocs(collectionId, fieldNames, values, summary) {
  for (const fieldName of fieldNames) {
    for (const value of values) {
      await deleteQuerySnapshot(
        db.collectionGroup(collectionId).where(fieldName, "==", value),
        summary,
        \`${collectionId}/*\`,
      );
    }
  }
}
`,
  `async function deleteMatchingCollectionGroupDocs(collectionId, fieldNames, values, summary) {
  for (const fieldName of fieldNames) {
    for (const value of values) {
      try {
        await deleteQuerySnapshot(
          db.collectionGroup(collectionId).where(fieldName, "==", value),
          summary,
          \`${collectionId}/*\`,
        );
      } catch (error) {
        addStudentDeletionWarning(summary, \`${collectionId}/*.${fieldName}\`, error);
      }
    }
  }
}
`,
  "collection-group cleanup error handling",
);

replaceRequired(
  `async function deleteKnownNestedSubmissionScopes(studentCodeValues, summary) {
  const levelValues = ["A1", "A2", "B1", "a1", "a2", "b1"];
  for (const level of levelValues) {
    for (const code of studentCodeValues) {
      const scopeRef = db.doc(\`submissions/${level}/${code}\`);
      await db.recursiveDelete(scopeRef).catch(() => undefined);
      summary.deleted += 1;
      summary.collections["submissions/nested-scope"] = (summary.collections["submissions/nested-scope"] || 0) + 1;
    }
  }
}
`,
  `async function deleteKnownNestedSubmissionScopes(studentCodeValues, summary) {
  const levelValues = ["A1", "A2", "B1", "a1", "a2", "b1"];
  for (const level of levelValues) {
    for (const rawCode of studentCodeValues) {
      const code = cleanIdentifier(rawCode);
      if (!code || code.includes("/")) continue;
      try {
        // submissions/{level}/{studentCode} is a collection path (three segments), not a document path.
        const scopeRef = db.collection("submissions").doc(level).collection(code);
        const directDocs = await scopeRef.get();
        if (directDocs.empty) continue;
        await db.recursiveDelete(scopeRef);
        summary.deleted += directDocs.size;
        summary.collections["submissions/nested-scope"] = (summary.collections["submissions/nested-scope"] || 0) + directDocs.size;
      } catch (error) {
        addStudentDeletionWarning(summary, \`submissions/${level}/${code}\`, error);
      }
    }
  }
}
`,
  "nested submission collection cleanup",
);

replaceRequired(
  `  const appsScriptUrl = String(studentDeleteAppsScriptUrlSecret.value() || process.env.STUDENT_DELETE_APPS_SCRIPT_URL || "").trim();
  const syncSecret = String(studentDeleteSyncSecret.value() || process.env.STUDENT_DELETE_SYNC_SECRET || "").trim();
`,
  `  const studentDeleteConfig = runtimeConfig.student_delete || runtimeConfig.studentDelete || {};
  const appsScriptUrl = String(studentDeleteConfig.apps_script_url || studentDeleteConfig.appsScriptUrl || process.env.STUDENT_DELETE_APPS_SCRIPT_URL || "").trim();
  const syncSecret = String(studentDeleteConfig.sync_secret || studentDeleteConfig.syncSecret || process.env.STUDENT_DELETE_SYNC_SECRET || "").trim();
`,
  "optional Google Sheets deletion configuration",
);

replaceRequired(
  `    const summary = { deleted: 0, collections: {}, attendanceSessionMapsUpdated: 0, authUsersDeleted: [] };
`,
  `    const summary = { deleted: 0, collections: {}, attendanceSessionMapsUpdated: 0, authUsersDeleted: [], warnings: [] };
`,
  "deletion summary warnings",
);

replaceRequired(
  `    await removeStudentFromAttendanceMaps(allValues, summary);
`,
  `    await removeStudentFromAttendanceMaps(allValues, summary).catch((error) => {
      addStudentDeletionWarning(summary, "attendance-session-maps", error);
    });
`,
  "attendance cleanup warning handling",
);

replaceRequired(
  `    const sheet = await deleteStudentRowsFromSheet({ studentId, studentCode, email, student });
    if (sheet.attempted && !sheet.success) {
      return res.status(502).json({ ok: false, error: sheet.message, firestore: summary, sheet });
    }
    return res.json({ ok: true, firestore: summary, sheet });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Student account deletion failed" });
  }
`,
  `    const sheet = await deleteStudentRowsFromSheet({ studentId, studentCode, email, student }).catch((error) => ({
      attempted: true,
      success: false,
      message: error?.message || "Google Sheet cleanup failed.",
    }));
    if (sheet.attempted && !sheet.success) {
      addStudentDeletionWarning(summary, "google-sheets", sheet.message || "Google Sheet cleanup failed.");
    }
    const warningCount = summary.warnings.length;
    const message = warningCount
      ? \`Student account deletion completed with ${warningCount} cleanup warning(s).\`
      : "Student account deletion completed successfully.";
    return res.json({ ok: true, message, firestore: summary, sheet });
  } catch (e) {
    const message = e?.message || "Student account deletion failed";
    return res.status(500).json({ ok: false, error: message, message });
  }
`,
  "successful partial cleanup response",
);

source = source.replace(
  `    studentDeleteAppsScriptUrlSecret,
    studentDeleteSyncSecret,
`,
  "",
);

writeFileSync(path, source);
console.log("Student deletion now uses valid Firestore paths and returns actionable cleanup results.");
