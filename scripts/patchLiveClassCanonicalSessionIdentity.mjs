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

patchFile(new URL("../src/services/liveClassManualRescheduleService.js", import.meta.url), (source) => {
  source = source.replaceAll(
    "payload.classId || session.classId || session.classRecordId",
    "payload.classId || session.classRecordId || session.classId",
  );
  return source;
});

patchFile(new URL("../src/services/liveClassSessionDirectService.js", import.meta.url), (source) => {
  source = source.replaceAll(
    "payload.classId || session.classId || session.classRecordId",
    "payload.classId || session.classRecordId || session.classId",
  );
  return source;
});

console.log("Live Class session changes now prefer the canonical class record ID over legacy display-name classId values.");
