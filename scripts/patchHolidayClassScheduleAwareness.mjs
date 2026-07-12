import { readFileSync, writeFileSync } from "node:fs";

const path = "functions/index.js";
const snippetUrl = new URL("./snippets/holidayClassScheduleAwareness.js.txt", import.meta.url);
let source = readFileSync(path, "utf8");

const helperMarker = "async function sendHolidayNoticeForDoc({ docRef, holiday, date, countryCode, noticeConfig }) {";
const helperBlock = readFileSync(snippetUrl, "utf8").trim();

if (!source.includes("sendHolidayNoticeWithClassSchedule")) {
  const index = source.indexOf(helperMarker);
  if (index === -1) throw new Error(`Could not find marker: ${helperMarker}`);
  source = `${source.slice(0, index)}${helperBlock}\n\n${source.slice(index)}`;
}

source = source.replaceAll("const result = await sendHolidayNoticeForDoc({", "const result = await sendHolidayNoticeWithClassSchedule({");

writeFileSync(path, source);
console.log("Holiday notices now derive all-active recipients from live class sessions on the holiday date.");