import fs from "node:fs";

const target = new URL("../src/data/a1PresenterUnderstandingChecks.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const marker = '  "A1-2": [';
if (!source.includes(marker)) {
  const anchor = "const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {\n";
  if (!source.includes(anchor)) throw new Error("A1 presenter override anchor missing.");

  const block = `const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
  "A1-2": [
    check("Wie fragst du einen Freund nach seiner Telefonnummer?", "Zum Beispiel: Wie ist deine Telefonnummer?"),
    check("Wie fragst du eine Person höflich nach ihrer Telefonnummer?", "Zum Beispiel: Wie ist Ihre Telefonnummer?"),
    check("Wie sagst du deine Telefonnummer in einem ganzen Satz?", "Zum Beispiel: Meine Telefonnummer ist 024 123 4567."),
    check("Wie fragst du einen Freund nach seiner Adresse?", "Zum Beispiel: Wie ist deine Adresse?"),
    check("Wie fragst du höflich nach einer Adresse?", "Zum Beispiel: Wie ist Ihre Adresse?"),
    check("Wie sagst du deine Adresse in einem ganzen Satz?", "Zum Beispiel: Meine Adresse ist Bahnhofstraße 12."),
    check("Welche Nummer gehört zum Telefon und welche zum Haus? Erkläre mit einem Beispiel.", "Zum Beispiel: 024 123 4567 ist die Telefonnummer; 12 ist die Hausnummer."),
    check("Dein Partner sagt eine Telefonnummer zu schnell. Was kannst du sagen?", "Zum Beispiel: Bitte noch einmal. / Bitte langsamer."),
    check("Du hast die Nummer nicht verstanden. Wie kannst du nachfragen?", "Zum Beispiel: Wie bitte? Können Sie die Telefonnummer bitte wiederholen?"),
    check("Mache einen kurzen Dialog: Frage nach Telefonnummer und Adresse und antworte.", "Zum Beispiel: Wie ist deine Telefonnummer? – Meine Telefonnummer ist ... Wie ist deine Adresse? – Meine Adresse ist ..."),
    check("Gib ohne Notizen deine Telefonnummer und deine Adresse in zwei vollständigen Sätzen an.", "Zum Beispiel: Meine Telefonnummer ist ... Meine Adresse ist ...", "Final practical check for the lesson."),
  ],
`;

  source = source.replace(anchor, block);
  fs.writeFileSync(target, source, "utf8");
}

console.log("A1 Day 2 class challenge now visibly tests telephone numbers and addresses.");
