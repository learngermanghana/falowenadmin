import fs from "node:fs";

function patchFile(path, transform) {
  const source = fs.readFileSync(path, "utf8");
  const next = transform(source);
  fs.writeFileSync(path, next);
}

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchLiveClassCanonicalSessionIdentity.mjs`);
  return source.replace(before, after);
}

function preferFirestoreDocumentId(source) {
  const replacements = [
    ["{ id: item.id, ...item.data() }", "{ ...item.data(), id: item.id }"],
    ["{ id: snap.id, ...snap.data() }", "{ ...snap.data(), id: snap.id }"],
    ["{ id: sessionSnap.id, ...sessionSnap.data() }", "{ ...sessionSnap.data(), id: sessionSnap.id }"],
    ["{ id: classSnap.id, ...classSnap.data() }", "{ ...classSnap.data(), id: classSnap.id }"],
    ["{ id: latestClassSnap.id, ...latestClassSnap.data() }", "{ ...latestClassSnap.data(), id: latestClassSnap.id }"],
    ["{ id: snapshot.id, ...snapshot.data() }", "{ ...snapshot.data(), id: snapshot.id }"],
  ];
  return replacements.reduce((next, [before, after]) => next.replaceAll(before, after), source);
}

patchFile(new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url), (source) => {
  source = replaceOnce(
    source,
    "      classId: session.classId || session.classRecordId || dashboard?.klass?.id || selectedClassId,",
    "      classId: dashboard?.klass?.id || dashboard?.klass?.classRecordId || selectedClassId || session.classRecordId || session.classId,",
    "session-change canonical class identity",
  );
  source = replaceOnce(
    source,
    "      const classId = sessionChange.classId || dashboard?.klass?.id || selectedClassId;",
    "      const classId = dashboard?.klass?.id || dashboard?.klass?.classRecordId || selectedClassId || sessionChange.classId;",
    "session-change submit canonical class identity",
  );
  return source;
});

patchFile(new URL("../src/services/liveClassCompatibilityServiceBase.js", import.meta.url), (source) => (
  preferFirestoreDocumentId(source)
));

patchFile(new URL("../src/services/liveClassManualRescheduleService.js", import.meta.url), (source) => {
  source = source.replaceAll(
    "payload.classId || session.classId || session.classRecordId",
    "payload.classId || session.classRecordId || session.classId",
  );
  return preferFirestoreDocumentId(source);
});

patchFile(new URL("../src/services/liveClassSessionDirectService.js", import.meta.url), (source) => {
  source = source.replaceAll(
    "payload.classId || session.classId || session.classRecordId",
    "payload.classId || session.classRecordId || session.classId",
  );
  return preferFirestoreDocumentId(source);
});

patchFile(new URL("../src/services/liveClassServiceBase.js", import.meta.url), (source) => (
  preferFirestoreDocumentId(source)
));

console.log("Live Class session changes now prefer canonical class records and Firestore document IDs over legacy stored identity fields.");
