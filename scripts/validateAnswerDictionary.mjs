import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { validateAnswerDictionary } from "../src/utils/answerKeyIntegrity.js";

const result = validateAnswerDictionary(answersDictionary);

console.log(`Validated ${result.assignmentCount} answer-key assignments.`);
if (result.warnings.length) {
  console.log(`Warnings (${result.warnings.length}):`);
  result.warnings.forEach((warning) => console.log(`- [${warning.code}] ${warning.assignment}: ${warning.message}`));
}
if (result.errors.length) {
  console.error(`Errors (${result.errors.length}):`);
  result.errors.forEach((error) => console.error(`- [${error.code}] ${error.assignment}: ${error.message}`));
  process.exitCode = 1;
} else {
  console.log("Answer-key integrity check passed with no blocking errors.");
}
