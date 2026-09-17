const makeTask = ({ title, lead = [], points = [], textType, register, recipient, sourcePath, sourceBlobSha }) => ({
  title,
  prompt: [...lead, ...(points.length ? ["", "Bearbeite diese Punkte:", ...points.map((point) => `- ${point}`)] : [])].join("\n"),
  taskPoints: points,
  textType,
  register,
  recipient,
  sourcePath,
  sourceBlobSha,
});

const VERIFIED_ASSIGNMENT_TASKS = Object.freeze({
  "A2-1.1": makeTask({
    title: "Small Talk · Brief an Felix: Arbeit und Familie",
    lead: ["Aufgabe: Schreibe Felix einen kurzen Brief über deine Arbeit und deine Familie."],
    points: [
      "Schreibe, warum du Felix schreibst.",
      "Erzähle etwas über deine Arbeit oder dein Studium.",
      "Erzähle etwas Neues über deine Familie.",
      "Verwende mindestens einen Grund mit weil oder denn.",
      "Frage Felix am Ende, wie es ihm geht und was bei ihm neu ist.",
    ],
    textType: "informal_email",
    register: "informal",
    recipient: "Felix",
    sourcePath: "web/src/components/A2Day2SmallTalkWorkbookEnhancedPage.js",
    sourceBlobSha: "3cf6fee96abfcf384563fbc0a5dde0583babe29a",
  }),
  "A2-1.2": makeTask({
    title: "Personen beschreiben · Brief an Felix: Mein Chef / Meine Chefin",
    lead: ["Aufgabe: Schreibe Felix einen kurzen Brief über deinen Chef oder deine Chefin."],
    points: [
      "Schreibe, warum du Felix schreibst.",
      "Beschreibe das Aussehen deines Chefs / deiner Chefin.",
      "Beschreibe Persönlichkeit und Verhalten bei der Arbeit.",
      "Sage, was dir gefällt oder was besser sein könnte.",
      "Frage Felix am Ende nach seinem Chef / seiner Chefin.",
    ],
    textType: "informal_email",
    register: "informal",
    recipient: "Felix",
    sourcePath: "web/src/components/A2Day2PersonenBeschreibenWorkbookPage.js",
    sourceBlobSha: "d4d7035de51808cdabe2b42db264e5aac4aad684",
  }),
  "A2-1.3": makeTask({
    title: "Dinge und Personen vergleichen · Brief an Felix: Meine Mutter und mein Vater",
    lead: ["Aufgabe: Schreibe Felix einen kurzen Brief. Beschreibe und vergleiche deine Mutter und deinen Vater."],
    points: [
      "Stelle deine Mutter und deinen Vater kurz vor.",
      "Vergleiche ihr Aussehen mit als oder genauso ... wie.",
      "Vergleiche ihren Charakter.",
      "Sage, was du an beiden besonders magst.",
      "Frage Felix am Ende nach seinen Eltern.",
    ],
    textType: "informal_email",
    register: "informal",
    recipient: "Felix",
    sourcePath: "web/src/components/A2Day3ComparisonsWorkbookPage.js",
    sourceBlobSha: "ea14d54363284845bca485b8e02913657185d609",
  }),
  "A2-2.4": makeTask({
    title: "Wo möchten wir uns treffen? · Formeller Brief",
    lead: ["Aufgabe: Schreiben Sie Herrn Felix Asadu einen kurzen Brief und laden Sie ihn zu einem gemeinsamen Wochenende ein."],
    points: [
      "Erklären Sie, warum Sie ihn einladen.",
      "Schlagen Sie eine Aktivität oder Veranstaltung vor.",
      "Fragen Sie, wann er Zeit hat und wo Sie sich treffen können.",
      "Fragen Sie, ob er etwas für das Essen oder die Aktivität mitbringen kann.",
    ],
    textType: "formal_letter",
    register: "formal",
    recipient: "Herr Felix Asadu",
    sourcePath: "web/src/components/A2Day4WoMoechtenWirUnsTreffenWorkbookPage.js",
    sourceBlobSha: "9d9be07e1b02551f3ecc4d9039d6cec668d711b8",
  }),
  "A2-2.5": makeTask({
    title: "Freizeit · E-Mail an Alex",
    lead: ["Aufgabe: Du möchtest mit deinem Freund Alex am Wochenende etwas unternehmen. Schreibe Alex eine kurze E-Mail."],
    points: [
      "Sage, dass du am Wochenende Zeit hast.",
      "Schreibe, dass du etwas zusammen machen möchtest.",
      "Frage, ob Alex am Wochenende frei ist.",
      "Frage, welche Aktivität er vorschlägt.",
      "Schlage selbst eine mögliche Aktivität vor.",
    ],
    textType: "informal_email",
    register: "informal",
    recipient: "Alex",
    sourcePath: "web/src/components/A2Day5FreizeitWorkbookPage.js",
    sourceBlobSha: "2011f033f06dae039968c6e11267a340603754b7",
  }),
  "A2-3.6": makeTask({
    title: "Möbel und Räume · E-Mail über ein neues Zimmer",
    lead: ["Aufgabe: Sie sind vor Kurzem umgezogen und möchten einer Freundin oder einem Freund von Ihrem neuen Zimmer erzählen. Schreiben Sie eine E-Mail."],
    points: [
      "Warum schreiben Sie?",
      "Beschreiben Sie Ihr Zimmer und die wichtigsten Möbel.",
      "Was gefällt Ihnen an Ihrem Zimmer besonders und warum?",
    ],
    textType: "informal_email",
    register: "informal",
    recipient: "Freundin oder Freund",
    sourcePath: "web/src/components/A2Day6MoebelRaeumeWorkbookPage.js",
    sourceBlobSha: "d659561da531970a563f3e179d4cf75226260ec5",
  }),
  "A2-3.7": makeTask({
    title: "Eine Wohnung suchen · E-Mail an den Vermieter",
    lead: ["Sie möchten eine Wohnung in einer bestimmten Stadt mieten. Schreiben Sie eine E-Mail an den Vermieter:"],
    points: [
      "Fragen Sie nach einer verfügbaren Wohnung.",
      "Geben Sie an, welche Kriterien für Sie wichtig sind (z. B. Größe, Lage, Preis).",
      "Fragen Sie nach den Mietbedingungen und der Möglichkeit, die Wohnung zu besichtigen.",
    ],
    textType: "formal_email",
    register: "formal",
    recipient: "Vermieter",
    sourcePath: "web/src/components/A2Day7WohnungSuchenWorkbookPage.js",
    sourceBlobSha: "8da1d4524ebd8e1eaba946d24deac1fe1d928315",
  }),
  "A2-3.8": makeTask({
    title: "Rezepte und Essen · E-Mail an ein Restaurant",
    lead: ["Situation: Sie möchten einen Tisch in einem Restaurant reservieren.", "Schreiben Sie eine E-Mail an das Restaurant:"],
    points: [
      "Fragen Sie nach einem freien Tisch.",
      "Geben Sie an, was für Sie wichtig ist (z. B. Datum, Uhrzeit, Anzahl der Personen).",
      "Fragen Sie nach dem Menü und den Preisen.",
    ],
    textType: "formal_email",
    register: "formal",
    recipient: "Restaurant",
    sourcePath: "web/src/components/A2Day8RezepteUndEssenWorkbookPage.js",
    sourceBlobSha: "49ec0fea1dae69f87ca6b5c77645d48bcbeef353",
  }),
  "B1-1.2": makeTask({
    title: "Freunde fürs Leben · E-Mail über einen Freund fürs Leben",
    lead: [
      "Schreiben Sie eine E-Mail über einen Freund fürs Leben.",
      "Sie haben einen Freund fürs Leben gefunden und möchten einer anderen Freundin darüber berichten.",
    ],
    points: [
      "Wie haben Sie sich kennengelernt?",
      "Warum ist diese Freundschaft besonders für Sie? Begründen Sie.",
      "Machen Sie einen Vorschlag für ein Treffen.",
    ],
    textType: "informal_email",
    register: "informal",
    recipient: "Freundin",
    sourcePath: "web/src/components/B1Day2FreundeFuersLebenWorkbookPage.js",
    sourceBlobSha: "e116b5dcb4f9b938383369ef9068e8bf2bddae94",
  }),
});

const normalize = (value = "") => String(value || "").trim().toUpperCase();

export const VERIFIED_ASSIGNMENT_TASK_COUNT = Object.keys(VERIFIED_ASSIGNMENT_TASKS).length;

export function getVerifiedAssignmentTask(assignmentId = "") {
  return VERIFIED_ASSIGNMENT_TASKS[normalize(assignmentId)] || null;
}

export function getVerifiedAssignmentTasks() {
  return Object.entries(VERIFIED_ASSIGNMENT_TASKS).map(([assignmentId, task]) => ({ assignmentId, ...task }));
}
