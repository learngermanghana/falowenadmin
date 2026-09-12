import fs from "node:fs";

const pickerPath = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
let picker = fs.readFileSync(pickerPath, "utf8");

const oldState = '  const [selectedClassId, setSelectedClassId] = useState(() => safeStorageGet(LAST_CLASS_KEY));';
const newState = `  const [selectedClassId, setSelectedClassId] = useState(() => {\n    const params = new URLSearchParams(window.location.search);\n    return params.get("className") || params.get("classId") || safeStorageGet(LAST_CLASS_KEY);\n  });`;

if (!picker.includes('return params.get("className") || params.get("classId") || safeStorageGet(LAST_CLASS_KEY);')) {
  if (!picker.includes(oldState)) throw new Error("Presenter selected class context anchor changed");
  picker = picker.replace(oldState, newState);
}

fs.writeFileSync(pickerPath, picker);

const participationPath = new URL("../src/pages/ClassParticipationPage.jsx", import.meta.url);
let participation = fs.readFileSync(participationPath, "utf8");
const oldRequested = `          const requestedClassId = new URLSearchParams(window.location.search).get("classId") || "";\n          const requested = active.find((entry) => classIdOf(entry) === requestedClassId);`;
const newRequested = `          const params = new URLSearchParams(window.location.search);\n          const requestedClassId = params.get("classId") || "";\n          const requestedClassName = params.get("className") || "";\n          const requested = active.find((entry) => {\n            const aliases = [entry.id, entry.classId, entry.name, entry.className, classIdOf(entry)]\n              .map((value) => clean(value))\n              .filter(Boolean);\n            return aliases.includes(requestedClassId) || aliases.includes(requestedClassName);\n          });`;

if (participation.includes(oldRequested)) {
  participation = participation.replace(oldRequested, newRequested);
}

fs.writeFileSync(participationPath, participation);
console.log("Presenter Live Classes context is preferred over the last-used class.");
