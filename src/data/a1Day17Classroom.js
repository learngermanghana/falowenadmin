// Dedicated A1 Day 17 presenter. Classroom practice only; the published
// A1-11 workbook and its versioned answer key are deliberately unchanged.
export const A1_DAY17_ASSIGNMENT = "A1-11";
export const A1_DAY17_WORKBOOK = "/campus/course/a1-day-17-instructions-and-directions-kapitel-11-workbook";

export const A1_DAY17_SIGNS = [
  { id:"smoking", icon:"🚬", sign:"Rauchen verboten", forbidden:true, sentence:"Rauchen ist verboten.", modal:"Man darf hier nicht rauchen.", request:"Bitte rauchen Sie hier nicht!" },
  { id:"phone", icon:"📱", sign:"Handys verboten", forbidden:true, sentence:"Handys sind verboten.", modal:"Man darf hier kein Handy benutzen.", request:"Bitte benutzen Sie hier kein Handy!" },
  { id:"dog", icon:"🐕", sign:"Hunde verboten", forbidden:true, sentence:"Hunde sind verboten.", modal:"Man darf hier keinen Hund mitbringen.", request:"Bitte bringen Sie hier keinen Hund mit!" },
  { id:"food", icon:"🍔", sign:"Essen verboten", forbidden:true, sentence:"Essen ist verboten.", modal:"Man darf hier nicht essen.", request:"Bitte essen Sie hier nicht!" },
  { id:"parking", icon:"P", sign:"Parken erlaubt", forbidden:false, sentence:"Parken ist erlaubt.", modal:"Man darf hier parken.", request:"Darf ich hier parken? – Ja, natürlich." },
  { id:"entry", icon:"⛔", sign:"Einfahrt verboten", forbidden:true, sentence:"Die Einfahrt ist verboten.", modal:"Man darf hier nicht hineinfahren.", request:"Bitte fahren Sie hier nicht hinein!" },
  { id:"photo", icon:"📷", sign:"Fotografieren verboten", forbidden:true, sentence:"Fotografieren ist verboten.", modal:"Man darf hier nicht fotografieren.", request:"Bitte fotografieren Sie hier nicht!" },
  { id:"dog-allowed", icon:"🐕", sign:"Hunde erlaubt", forbidden:false, sentence:"Hunde sind erlaubt.", modal:"Man darf hier einen Hund mitbringen.", request:"Darf ich meinen Hund mitbringen? – Ja." },
];
export const A1_DAY17_DIRECTIONS = [
  ["⬆","geradeaus","straight ahead"],["⬅","links","left"],["➡","rechts","right"],
  ["↪","abbiegen","to turn"],["🚶","überqueren","to cross"],["✋","warten","to wait"],
  ["＋","die Kreuzung","intersection"],["🚦","die Ampel","traffic light"],["🛣","die Straße","street"],["🚏","die Haltestelle","stop"],
];
export const A1_DAY17_IMPERATIVES = [
  ["geradeaus gehen","Gehen Sie bitte geradeaus!"],
  ["hier warten","Warten Sie bitte hier!"],
  ["rechts abbiegen","Biegen Sie rechts ab!"],
  ["die Tür öffnen","Öffnen Sie bitte die Tür!"],
  ["die Straße überqueren","Überqueren Sie die Straße!"],
  ["links abbiegen","Biegen Sie links ab!"],
];
export const A1_DAY17_READING = [
  ["smoking","Sie dürfen hier rauchen.",false,"Man darf hier nicht rauchen."],
  ["parking","Sie dürfen hier parken.",true,"Parken ist erlaubt."],
  ["phone","Sie dürfen hier telefonieren.",false,"Hier sind Handys verboten."],
  ["dog-allowed","Sie dürfen Ihren Hund mitbringen.",true,"Hunde sind erlaubt."],
  ["photo","Sie dürfen hier Fotos machen.",false,"Fotografieren ist verboten."],
];
export const A1_DAY17_SPEAKING = [
  { sign:"smoking", answer:"Bitte rauchen Sie hier nicht!", reaction:"Entschuldigung. Natürlich." },
  { sign:"photo", answer:"Bitte fotografieren Sie hier nicht!", reaction:"Ja, natürlich." },
  { sign:"phone", answer:"Bitte benutzen Sie hier kein Handy!", reaction:"Entschuldigung." },
  { icon:"🪟", label:"Fenster", answer:"Öffnen Sie bitte das Fenster!", reaction:"Ja, gern." },
  { icon:"🖊️", label:"Stift", answer:"Geben Sie mir bitte einen Stift! / Können Sie mir bitte einen Stift geben?", reaction:"Ja, natürlich. Hier, bitte." },
];
export const A1_DAY17_DIALOGUE = [
  ["A","Entschuldigung, wie komme ich zum Museum?"],
  ["B","Gehen Sie geradeaus und biegen Sie links ab."],
  ["A","Vielen Dank. Darf ich im Museum fotografieren?"],
  ["B","Nein, Fotografieren ist dort verboten."],
  ["A","Darf ich dort etwas trinken?"],
  ["B","Ja, aber bitte nur im Café."],
];
export const A1_DAY17_LISTENING = [
  ["Wohin möchte die Person?",["Museum","Bahnhof","Hotel"],"Museum"],
  ["Wohin soll die Person abbiegen?",["Links","Rechts"],"Links"],
  ["Darf man fotografieren?",["Ja","Nein"],"Nein"],
  ["Wo darf man trinken?",["Im Café","Überall im Museum"],"Im Café"],
  ["Was ist verboten?",["Fotografieren","Trinken im Café"],"Fotografieren"],
];
const q=(questionDe,answerDe,noteEn)=>({questionDe,answerDe,noteEn});
export const A1_DAY17_EXIT = [
  q("Fragen Sie höflich nach dem Bahnhof.","Entschuldigung, wie komme ich zum Bahnhof?","Accept any suitable polite question."),
  q("Geben Sie zwei Anweisungen: geradeaus, dann links.","Gehen Sie geradeaus. Biegen Sie links ab.","Verb + Sie; ab at the end."),
  q("🚭 Formulieren Sie eine höfliche Bitte und reagieren Sie.","Bitte rauchen Sie hier nicht! – Entschuldigung.","Accept a clear prohibition and relevant reaction."),
  q("🅿️ Fragen Sie, ob Sie hier parken dürfen.","Darf ich hier parken? – Ja, natürlich.","Darf + ich + rest + infinitive."),
  q("📷 Fotografieren verboten. Erklären Sie das Schild.","Man darf hier nicht fotografieren.","Also accept Fotografieren ist verboten."),
  q("🖊️ Bitten Sie um einen Stift und reagieren Sie.","Geben Sie mir bitte einen Stift! – Ja, gern. / Können Sie mir bitte einen Stift geben?","Accept a suitable polite request and response."),
];
const pages = [
  ["intro","Einstieg","Was sehen Sie?",3],
  ["directions","Wortschatz","Anweisungen und Richtungen",5],
  ["imperative","Grammatik","Imperativ mit Sie",5],
  ["practice","Quick Practice","Geben Sie Anweisungen",5],
  ["ask","Redemittel","Nach dem Weg fragen",4],
  ["map","Stadtplan","Beschreiben Sie den Weg",6],
  ["signs","Wortschatz","Verboten oder erlaubt?",5],
  ["permission","Grammatik","Verboten, erlaubt und dürfen",6],
  ["reading","Lesen","Richtig oder falsch?",5],
  ["speaking","Sprechen Teil 3","Bitten und reagieren",7],
  ["listening","Hören und Falowen Music","Anweisungen verstehen",5],
];
export function buildA1Day17ClassroomStages({workbookUrl=A1_DAY17_WORKBOOK,song}={}) {
  return [
    ...pages.map(([step,kicker,title,suggestedMinutes],i)=>({
      id:"a1-day17-"+step,type:"a1-day17",step,kicker:String(i+1).padStart(2,"0")+" · "+kicker,title,suggestedMinutes,
      items:[{label:title}],hasMusic:step==="listening" && Boolean(song),
      teacherPurpose:{student:"Erst selbst sprechen oder antworten, dann die Lösung öffnen.",teacher:step==="listening"?"Read the hidden dialogue twice without projecting the text. Use the published song as an optional extension.":"Model briefly, then ask learners to produce their own short formal instructions and responses."},
    })),
    {id:"exit-check",type:"check",kicker:"12 · Mini-Prüfung",title:"Sechs Aufgaben · ohne Hilfe",items:A1_DAY17_EXIT,exitCheck:true,workbookUrl,suggestedMinutes:4,
      teacherPurpose:{student:"Beantworten Sie die sechs Aufgaben ohne Hilfe.",teacher:"Use the existing student picker if available. Accept suitable alternative answers; reveal only after the attempt. Open the unchanged published A1-11 workbook afterwards."}},
  ];
}
