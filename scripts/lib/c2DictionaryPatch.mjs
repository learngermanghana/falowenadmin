export function insertC2DictionaryEntries(source = "", c2CourseEntries = []) {
  const input = String(source || "");
  if (input.includes("  C2: {")) return input;

  const functionAnchor = "\nfunction dictionarySortValue(entry = {}) {";
  const functionIndex = input.indexOf(functionAnchor);
  if (functionIndex < 0) throw new Error("C2 dictionary function boundary missing");

  const dictionaryStart = input.indexOf("export const courseDictionary = {");
  const dictionaryCloseIndex = input.lastIndexOf("\n};", functionIndex);
  if (dictionaryStart < 0 || dictionaryCloseIndex < dictionaryStart) {
    throw new Error("C2 dictionary top-level closing boundary missing");
  }

  const entries = (Array.isArray(c2CourseEntries) ? c2CourseEntries : [])
    .map((entry) => `    ${JSON.stringify(entry.assignment_id)}: { assignment_id: ${JSON.stringify(entry.assignment_id)}, chapter: ${JSON.stringify(entry.chapter)}, de: ${JSON.stringify(entry.de)}, en: ${JSON.stringify(entry.en)} },`)
    .join("\n");

  const c2Block = `\n  C2: {\n${entries}\n  },`;
  return input.slice(0, dictionaryCloseIndex) + c2Block + input.slice(dictionaryCloseIndex);
}
