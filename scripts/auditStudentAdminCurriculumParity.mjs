import { teachingSlides } from "../src/data/teachingSlides.js";
import { c2PresenterSlides } from "../src/data/c2PresenterSlides.js";
import {
  STRICT_PARITY_LEVELS,
  STUDENT_CURRICULUM_SOURCE_SHA,
  auditCurriculumParity,
} from "../src/data/studentCurriculumParity.js";

const LEARNER_REPO = "learngermanghana/falowenexamtrainer";
const EXPECTED_SOURCE_BLOBS = Object.freeze({
  "web/src/components/A2SituationIntroduction.jsx": "139e4f113d2a072cd199d2c958ecdb0d4d5f4446",
  "web/src/components/B1TopicIntroduction.js": "4ada05e34ef79a7749bf1aa1b4993f2ee3e20d48",
  "web/src/data/b2LessonContentAlignment.js": "fc35074feb098f36dc89dce9c001badf28a7a384",
  "web/src/components/C1TopicIntroduction.jsx": "c2c221a6c850c8ad1f689827d417d62e8910c664",
  "web/src/data/c1ContentRefresh.js": "a3fe7b8bcc28d5af9011dad0676e119d6f5d16bb",
  "web/src/data/c2TopicKnowledge.js": "6c39d126a82527566bb38fd14d2744e4beee8a1a",
  "web/src/data/c2ExamStandardContent.js": "10997bdf9974e0dc58cb8bacdbdb45f0fc6e29c9",
  "web/src/components/C1Day1To6GrammarNotes.js": "2894491bcdd034ee210f7b5d4539421552033767",
  "web/src/components/C1Day7ReisenGrammarNotes.js": "96fd017458ac225fa86ae377261610e604ba3819",
  "web/src/components/C1Day8To10GrammarNotes.js": "c3f52c2a9b25df7a1960a412bff0f2f10a517ce8",
  "web/src/components/C1Day11GrammarNotes.js": "9247d21bde0375b38d93d22be8949dc6a1409806",
  "web/src/components/C1Day12To14GrammarNotes.js": "501df092d3f692c92dbfe56e3247b29db3cce3d2",
  "web/src/components/C1Day15To17GrammarNotes.js": "0a447e3929bab4023cda22eba7247663e3c23285",
  "web/src/components/C1Day18To20GrammarNotes.js": "200d122f143567c8f7e5271d009a5e410d5a7191",
  "web/src/components/C1Day21To23GrammarNotes.js": "e8b274b6d4df8d332d1536388f6bead68c8e86d2",
  "web/src/components/C1Day24To26GrammarNotes.js": "4ff2972400888b4a3b7e47a763347eb2cbc400d7",
  "web/src/components/C1Day27To28GrammarNotes.js": "46458b0b54adab1273b8089885ec7992aca0b7d3",
});

async function currentBlobSha(path) {
  const url = `https://api.github.com/repos/${LEARNER_REPO}/contents/${path}?ref=main`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "falowenadmin-curriculum-parity-audit",
    },
  });
  if (!response.ok) {
    throw new Error(`Unable to inspect learner source ${path}: HTTP ${response.status}`);
  }
  const payload = await response.json();
  return payload.sha;
}

const sourceDrift = [];
for (const [path, expectedSha] of Object.entries(EXPECTED_SOURCE_BLOBS)) {
  const actualSha = await currentBlobSha(path);
  if (actualSha !== expectedSha) {
    sourceDrift.push({ path, expectedSha, actualSha });
  }
}

const paritySlides = [...teachingSlides.filter((slide) => String(slide.course || "").toUpperCase() !== "C2"), ...c2PresenterSlides];
const audit = auditCurriculumParity(paritySlides);
const strictMismatches = audit.filter(
  (item) => STRICT_PARITY_LEVELS.includes(item.level) && item.status !== "aligned",
);
const knownExceptions = audit.filter((item) => item.status === "known-exception");

console.log(`Learner curriculum snapshot: ${STUDENT_CURRICULUM_SOURCE_SHA}`);
console.log(`Audited ${audit.length} Admin lessons across A2-C2.`);
console.log(`Known explicit exceptions: ${knownExceptions.length}.`);

if (knownExceptions.length) {
  console.log("Known exceptions:");
  for (const item of knownExceptions) {
    console.log(`- ${item.level} Day ${item.day}: learner="${item.studentTitle}" admin="${item.adminTitle}"`);
  }
}

if (sourceDrift.length) {
  console.error("\nLearner curriculum source files changed. Refresh the Admin parity contract:");
  for (const item of sourceDrift) {
    console.error(`- ${item.path}: expected ${item.expectedSha}, current ${item.actualSha}`);
  }
}

if (strictMismatches.length) {
  console.error("\nUnexpected Student/Admin curriculum mismatches:");
  for (const item of strictMismatches) {
    console.error(`- ${item.level} Day ${item.day}: learner="${item.studentTitle}" admin="${item.adminTitle}"`);
  }
}

if (sourceDrift.length || strictMismatches.length) {
  process.exitCode = 1;
} else {
  console.log("\nCurriculum parity audit passed.");
}
