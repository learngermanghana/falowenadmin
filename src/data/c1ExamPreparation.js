// Optional post-course preparation; never add these sessions to the 28 scheduled assignments.
import { C1_EXAM_FORMAT } from "./c1AcademicCurriculum.js";
export const C1_PREPARATION_PATH = "/campus/course/c1-self-learning/exam-preparation";
export const C1_REVISION_SECTIONS = [
 {skill:"Lesen",strategy:"Lesen Sie zuerst die Aufgaben. Prüfen Sie Kollokationen, Rückbezüge und die genaue Position der Verfassenden; begründen Sie jede Korrektur mit einer Textstelle.",days:[1,5,9,13,17,21,25],pitfall:"Eine thematisch passende Aussage ist nicht automatisch die richtige Lösung."},
 {skill:"Hören",strategy:"Lesen Sie vor dem Hören die Aufgaben. Notieren Sie Schlüsselbegriffe, Sprecherwechsel, Einschränkungen und Zahlen. Teil 1 und 3 einmal (Teil 3 abschnittsweise), Teil 2 und 4 zweimal.",days:[2,6,10,14,18,22,26],pitfall:"Nicht allein auf identische Wörter reagieren; Paraphrasen und Negationen beachten."},
 {skill:"Schreiben",strategy:"Planen Sie vier Inhaltspunkte, Beispiele und logische Übergänge. Forumsbeitrag ca. 230 Wörter; formelle Nachricht ca. 120 Wörter. Kontrollieren Sie Register und Verbposition.",days:[4,8,12,16,20,24,28],pitfall:"Ein anspruchsvoller Ausdruck ersetzt keinen vollständigen Inhaltspunkt."},
 {skill:"Sprechen",strategy:"Üben Sie einen strukturierten Vortrag, kritische Nachfragen und eine echte Partnerdiskussion. Reagieren Sie auf Gegenargumente und begründen Sie ein Fazit.",days:[3,7,11,15,19,23,27],pitfall:"Kein auswendig gelernter Monolog in der Partnerdiskussion."}
];
export const C1_REVISION_GRAMMAR = [
 ["Partizipialattribute","Die Verfahren, die von Fachleuten geprüft wurden, sind verfügbar.","Die von Fachleuten geprüften Verfahren sind verfügbar.","Partizip II, Plural -en nach die."],
 ["Nominalstil / Verbalstil","Weil die Nachfrage steigt, müssen Betriebe investieren. (angesichts)","Angesichts der steigenden Nachfrage müssen Betriebe investieren.","angesichts + Genitiv."],
 ["Subjektive Modalverben","Vermutlich verändert die Reform den Arbeitsmarkt. (dürfte)","Die Reform dürfte den Arbeitsmarkt verändern.","dürfte markiert eine Vermutung."],
 ["Konjunktiv I","Die Expertin sagt: Die Maßnahme ist wirksam.","Die Expertin sagt, die Maßnahme sei wirksam.","sein → sei; fremde Aussage, kein eigener Beleg."],
 ["Passiversatzformen","Die Daten müssen geschützt werden. (sein + zu)","Die Daten sind zu schützen.","Notwendigkeit im Kontext."],
 ["Nomen-Verb-Verbindungen","Die Stadt unterstützt den Umweltschutz. (einen Beitrag leisten)","Die Stadt leistet einen Beitrag zum Umweltschutz.","einen Beitrag zu etwas leisten + Dativ."],
 ["Konnektoren","Die Kosten sind hoch. Das Projekt kann sich lohnen. (wenngleich)","Wenngleich die Kosten hoch sind, kann sich das Projekt lohnen.","Konzessiver Nebensatz mit Verbendstellung."]
];
export const C1_SIMULATION_MODULES = [
 {skill:"Lesen",minutes:C1_EXAM_FORMAT.Lesen.minutes,route:"/exams/lesen/c1/sample-1",description:"30 Aufgaben, 4 Teile. Wählen Sie ein bislang nicht bearbeitetes C1-Lesesample; Sample 1 ist der Einstieg. Nutzen Sie den dortigen Prüfungsmodus."},
 {skill:"Hören",minutes:C1_EXAM_FORMAT.Hören.minutes,route:"/exams/horen/c1/sample-1",description:"30 Aufgaben, 4 Teile. Prüfen Sie den Audiozugang vorher. Falls die Aufnahme bereits bekannt ist oder nicht abgespielt werden kann, verwenden Sie den offiziellen Modellsatz."},
 {skill:"Schreiben",minutes:C1_EXAM_FORMAT.Schreiben.minutes,description:"Zwei neue Falowen-Aufgaben: Forumsbeitrag (ca. 230 Wörter) und formelle Nachricht (ca. 120 Wörter). Richtwerte 50 und 25 Minuten."},
 {skill:"Sprechen",minutes:C1_EXAM_FORMAT.Sprechen.minutes,description:"Paarprüfung mit 20 Minuten Vorbereitung und ca. 20 Minuten Prüfungszeit. Zwei Themen zur Wahl pro Person, Vortrag mit Nachfragen und gemeinsame Diskussion."}
];
export const C1_SIMULATION_WRITING = [
 {title:"Teil 1 · Diskussionsbeitrag – Forschung und Gesellschaft",words:230,minutes:50,situation:"In einem Onlineforum diskutieren Sie, ob öffentlich finanzierte Forschungsergebnisse grundsätzlich frei zugänglich sein sollten.",points:["Erläutern Sie, warum der Zugang zu wissenschaftlichen Erkenntnissen für die Gesellschaft wichtig ist.","Begründen Sie anhand eines konkreten Beispiels einen Vorteil frei zugänglicher Forschungsergebnisse.","Gehen Sie auf mögliche Nachteile oder Grenzen ein.","Schlagen Sie eine Maßnahme vor, mit der sowohl der Zugang als auch berechtigte Schutzinteressen berücksichtigt werden können."]},
 {title:"Teil 2 · Formelle Nachricht – Weiterbildung",words:120,minutes:25,situation:"Ihr Arbeitgeber hat einen bereits zugesagten Weiterbildungskurs kurzfristig abgesagt. Schreiben Sie der Personalabteilung.",points:["Zeigen Sie Verständnis für die organisatorische Situation.","Erklären Sie, warum die Weiterbildung für Ihre Arbeit wichtig ist.","Erläutern Sie die Auswirkungen der Absage.","Schlagen Sie eine konkrete alternative Lösung vor."]}
];
export const C1_SIMULATION_SPEAKING = {
 preparationMinutes:20, minutes:20,
 topics:[
 {title:"A · Nachhaltiger Konsum",points:["Erläutern Sie die Bedeutung langlebiger Produkte.","Nennen Sie ein konkretes Beispiel für eine Maßnahme.","Wägen Sie Vorteile und Grenzen ab.","Bewerten Sie die Verantwortung von Unternehmen und Verbrauchenden."]},
 {title:"B · Digitalisierung der Bildung",points:["Erläutern Sie Chancen digitaler Lernangebote.","Beschreiben Sie ein konkretes Beispiel.","Gehen Sie auf Zugangsprobleme ein.","Schlagen Sie eine ergänzende Maßnahme vor."]},
 {title:"C · Stadtentwicklung und Teilhabe",points:["Erläutern Sie die Bedeutung zugänglicher öffentlicher Räume.","Beschreiben Sie ein konkretes Beispiel.","Wägen Sie unterschiedliche Interessen ab.","Schlagen Sie eine Maßnahme zur Verbesserung der Teilhabe vor."]},
 {title:"D · Mehrsprachigkeit am Arbeitsplatz",points:["Erläutern Sie Chancen sprachlicher Vielfalt.","Beschreiben Sie ein Beispiel aus der Arbeitswelt.","Gehen Sie auf Verständigungsprobleme ein.","Bewerten Sie eine geeignete betriebliche Maßnahme."]}
 ],
 discussion:"Sollten Arbeitgeber ihren Beschäftigten jedes Jahr verbindlich bezahlte Zeit für Weiterbildung zur Verfügung stellen? Tauschen Sie Argumente aus, gehen Sie auf Gegenargumente ein und ziehen Sie ein Fazit.",
 followups:["Unter welchen Bedingungen wäre Ihr Vorschlag besonders wirksam?","Welche Einwände müsste man berücksichtigen?"]
};
export const C1_SIMULATION_RUBRIC = {
 Schreiben:["Aufgabenbewältigung – Inhaltspunkte, Umfang, Register","Kohärenz – Aufbau und Verknüpfung","Wortschatz – Vielfalt und Präzision","Strukturen – grammatische und orthografische Korrektheit"],
 Sprechen:["Aufgabenbewältigung und Interaktion – Vortrag, Nachfragen, Diskussion","Flüssigkeit und Kohärenz – verständlich und zusammenhängend","Wortschatz und Strukturen – präzise und variabel","Aussprache – Verständlichkeit, Betonung und Intonation"]
};
export const C1_OFFICIAL_MODEL = "https://bfu.goethe.de/c1mod/";
export function c1SimulationResult(scores={}) {
 const values=C1_SIMULATION_MODULES.map(({skill})=>scores[skill]);
 const valid=values.map(v=>v!==null&&v!==undefined&&String(v).trim()!==""&&Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=100);
 return {complete:valid.every(Boolean),passed:valid.every(Boolean)&&values.every(v=>Number(v)>=C1_EXAM_FORMAT.passPerModule),modules:C1_SIMULATION_MODULES.map(({skill},i)=>({skill,score:valid[i]?Number(values[i]):null,passed:valid[i]?Number(values[i])>=C1_EXAM_FORMAT.passPerModule:null}))};
}
