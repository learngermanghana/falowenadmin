import fs from "node:fs";

const dictionaryPath = new URL("../src/data/courseDictionary.js", import.meta.url);
const teacherSupportPath = new URL("../src/data/teacherSlideSupport.js", import.meta.url);

// Topics are source data, not a build-time replacement of a retired dictionary.
import { B2_CANONICAL_MUSIC_LESSONS } from "../src/data/b2CanonicalMusicCurriculum.js";
const dictionary = fs.readFileSync(dictionaryPath, "utf8");
if (B2_CANONICAL_MUSIC_LESSONS.length !== 28 ||
    !dictionary.includes("B2: Object.fromEntries(B2_CANONICAL_MUSIC_LESSONS.map")) {
  throw new Error("B2 dictionary must use the current canonical Course Book lessons");
}

let support = fs.readFileSync(teacherSupportPath, "utf8");
support = support.replace('const preferCurated = assignmentId === "B2-1.1";', "const preferCurated = false;");
fs.writeFileSync(teacherSupportPath, support);

console.log("B2 course dictionary synced to the new 28-day exam-domain curriculum.");
