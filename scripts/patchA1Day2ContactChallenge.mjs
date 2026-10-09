// Legacy build-chain entry point. The historical patch inserted a telephone
// conversation under A1-2, but the live A1-2 lesson is Day 4 German numbers.
// Do not manufacture an unrelated dialogue or rewrite published slide data.
import { getA1Days1To5UnderstandingChecks } from "../src/data/a1Days1To5Understanding.js";

const day4 = getA1Days1To5UnderstandingChecks("A1-2") || [];
if (day4.length !== 11) {
  throw new Error("A1 Day 4 needs ten numbers checks and one exit check.");
}
const language = day4.map((item) => item.questionDe + " " + item.answerDe).join(" ");
if (!/sechzehn|sech/i.test(language) || !/zweitausendvierzig/.test(language)
  || /telefonnummer|adresse|kurzen dialog/i.test(language)) {
  throw new Error("A1 Day 4 understanding checks must match the number-building lesson.");
}
console.log("A1 Day 4 understanding checks now match the published numbers workbook.");
