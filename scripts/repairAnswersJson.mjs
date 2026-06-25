import fs from "node:fs";

const filePath = new URL("../src/data/answers_dictionary.json", import.meta.url);
let source = fs.readFileSync(filePath, "utf8");

source = source
  .replace(
    '"Answer3": "B) Maria trägt oft eine schwarze Brille"\n        "Answer4"',
    '"Answer3": "B) Maria trägt oft eine schwarze Brille",\n        "Answer4"',
  )
  .replace(
    '"Answer4": "B) Jonas ist groß und sportlich"\n        "Answer5"',
    '"Answer4": "B) Jonas ist groß und sportlich",\n        "Answer5"',
  );

JSON.parse(source);
fs.writeFileSync(filePath, source);
console.log("answers_dictionary.json is valid JSON.");
