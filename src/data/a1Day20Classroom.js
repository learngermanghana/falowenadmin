// Day 20 classroom-only exercises. The current published A1-12.3 assignment
// is invitation to Julia and summer-course enquiry to Sprachakademie München.
// Use parallel classroom examples, not a ready-made answer to the workbook.
export const A1_DAY20_ASSIGNMENT="A1-12.3";
export const A1_DAY20_WORKBOOK="/campus/course/letter-writing-intro-german-a1-day-12-3";
export const A1_DAY20_REGISTER=[
 ["Anrede","Liebe Anna,","Sehr geehrte Damen und Herren,"],
 ["Frage","Kannst du …?","Können Sie …?"],
 ["Bitte","Kannst du mir helfen?","Können Sie mir bitte helfen?"],
 ["Dank","Vielen Dank für deine Hilfe.","Vielen Dank für Ihre Hilfe."],
 ["Grußformel","Liebe Grüße","Mit freundlichen Grüßen"],
];
export const A1_DAY20_STRUCTURE=[
 ["Anrede","Liebe Anna,","Passend zur Person"],
 ["Einleitung (wenn nötig)","ich hoffe, es geht dir gut.","Nicht als zusätzlicher Inhaltspunkt zählen"],
 ["Inhaltspunkt 1","Ich lade dich zum Essen ein.","Die erste Aufgabe beantworten"],
 ["Inhaltspunkt 2","Das Essen ist am Freitag um 19 Uhr bei mir.","Die zweite Aufgabe vollständig beantworten"],
 ["Inhaltspunkt 3","Kannst du bitte einen Salat mitbringen?","Die dritte Aufgabe beantworten"],
 ["Grußformel + Name","Liebe Grüße\nAma","Keine zusätzlichen Inhaltspunkte"],
];
export const A1_DAY20_MODELS={
 informal:{label:"Informell",situation:"Sie laden Ihre Freundin Anna zum Essen ein. Schreiben Sie ihr eine Nachricht.",points:["Laden Sie Anna ein.","Nennen Sie Tag, Uhrzeit und Ort.","Bitten Sie Anna, etwas zu essen mitzubringen."],greeting:"Liebe Anna,",intro:"",body:["ich lade dich zum Essen ein.","Wir essen am Freitag um 19 Uhr bei mir zu Hause.","Kannst du bitte einen Salat mitbringen?"],closing:"Liebe Grüße",name:"Ama"},
 formal:{label:"Formell",situation:"Sie möchten einen Englischkurs an einer Sprachschule besuchen. Schreiben Sie eine E-Mail.",points:["Sagen Sie, dass Sie sich für einen Englischkurs anmelden möchten.","Fragen Sie nach den Kurszeiten und Kosten.","Sagen Sie, wann Sie beginnen möchten."],greeting:"Sehr geehrte Damen und Herren,",intro:"",body:["ich möchte mich für einen Englischkurs anmelden.","Wann findet der Kurs statt und wie viel kostet er?","Ich möchte im August beginnen."],closing:"Mit freundlichen Grüßen",name:"Ama Mensah"},
};
export const A1_DAY20_TRANSFORM=[
 ["Laden Sie Ihre Freundin zum Essen ein.","Ich lade dich zum Essen ein.","du / dich"],
 ["Nennen Sie Tag, Uhrzeit und Ort.","Wir essen am Freitag um 19 Uhr bei mir zu Hause.","Alle drei Angaben gehören zu diesem Punkt."],
 ["Bitten Sie Ihre Freundin, etwas mitzubringen.","Kannst du bitte einen Salat mitbringen?","Informell: du."],
 ["Sagen Sie, dass Sie sich anmelden möchten.","Ich möchte mich für einen Englischkurs anmelden.","Ein kurzer vollständiger Satz."],
 ["Fragen Sie nach den Kurszeiten und Kosten.","Wann findet der Kurs statt und wie viel kostet er?","Beide Informationen erfragen."],
 ["Sagen Sie, wann Sie beginnen möchten.","Ich möchte im August beginnen.","Einen passenden Zeitpunkt nennen."],
 ["Gratulieren Sie Ihrer Freundin zum Geburtstag.","Alles Gute zum Geburtstag!","Eine weitere typische A1-Aufgabe."],
 ["Fragen Sie, ob Sie online bezahlen können.","Kann ich online bezahlen?","Eine weitere typische A1-Aufgabe."],
];
export const A1_DAY20_CONNECTORS=[
 ["und","Ich komme und bringe Kuchen mit.","Verbindet Informationen."],
 ["aber","Ich möchte kommen, aber ich muss arbeiten.","Zeigt einen Gegensatz."],
 ["denn","Ich kann nicht kommen, denn ich bin krank.","Normale Satzstellung: ich bin."],
 ["weil","Ich kann nicht kommen, weil ich krank bin.","Das konjugierte Verb steht am Ende."],
];
export const A1_DAY20_ERRORS=[
 ["Liebe Herr Müller,","Sehr geehrter Herr Müller,","Formell: Herr Müller."],
 ["Können du mir helfen?","Kannst du mir helfen?","du → kannst"],
 ["Wann der Kurs beginnt?","Wann beginnt der Kurs?","W-Wort + Verb + Subjekt"],
 ["Ich komme nicht, weil ich bin krank.","Ich komme nicht, weil ich krank bin.","weil → Verb am Ende"],
 ["Wie viel der Kurs kostet?","Wie viel kostet der Kurs?","W-Frage: kostet an Position 2 (nach Wie viel)."],
];
const q=(questionDe,answerDe,noteEn)=>({questionDe,answerDe,noteEn});
export const A1_DAY20_CHECKS=[
 q("Entschuldigen Sie sich bei einem Freund.","Es tut mir leid.","Accept a suitable apology."),
 q("Fragen Sie nach dem Preis eines Kurses.","Wie viel kostet der Kurs?","Accept another clear price question."),
 q("Sagen Sie Ihrer Freundin, dass Sie krank sind.","Ich bin krank.","Simple correct sentence is enough."),
 q("Bitten Sie einen Lehrer höflich um Hilfe.","Können Sie mir bitte helfen?","Formal Sie."),
 q("Bitten Sie um einen neuen Termin.","Können wir einen neuen Termin vereinbaren?","Accept a suitable appointment request."),
 q("Laden Sie einen Freund am Samstag ein.","Ich lade dich am Samstag zu meiner Party ein.","Informal dich."),
 q("Nennen Sie Tag, Uhrzeit und Ort einer Party.","Die Party ist am Sonntag um 16 Uhr bei mir.","All three details."),
 q("Bitten Sie eine Freundin, Getränke mitzubringen.","Kannst du bitte Getränke mitbringen?","Informal du."),
 q("Fragen Sie eine Sprachschule nach Kurszeiten.","Wann findet der Kurs statt?","Accept suitable course-time question."),
 q("Sagen Sie, wann Sie mit einem Kurs beginnen möchten.","Ich möchte im September beginnen.","Accept a suitable time preference."),
];
export const A1_DAY20_MOCKS={
 informal:{label:"Informell",situation:"Ihre Freundin lädt Sie am Samstag zum Essen ein. Schreiben Sie ihr.",points:["Bedanken Sie sich.","Fragen Sie nach der Uhrzeit.","Fragen Sie, was Sie mitbringen sollen."],greeting:"Liebe Anna,",body:["vielen Dank für deine Einladung zum Essen. Ich komme sehr gern am Samstag.","Um wie viel Uhr beginnt das Essen?","Was soll ich mitbringen?"],closing:"Liebe Grüße",name:"Ama"},
 formal:{label:"Formell",situation:"Sie möchten einen Termin beim Arzt vereinbaren. Schreiben Sie eine E-Mail an die Praxis.",points:["Sagen Sie, warum Sie schreiben.","Bitten Sie um einen Termin.","Fragen Sie nach der Uhrzeit."],greeting:"Sehr geehrte Damen und Herren,",body:["ich schreibe Ihnen, weil ich krank bin.","Ich brauche bitte einen Termin beim Arzt. Haben Sie morgen einen Termin frei?","Um wie viel Uhr kann ich kommen?"],closing:"Mit freundlichen Grüßen",name:"Ama Mensah"},
};
export const A1_DAY20_CHECKLIST=["Richtige Anrede","Alle drei Inhaltspunkte vollständig beantwortet","Du und Sie nicht gemischt","Verben an der richtigen Position","Passende Grußformel","Name geschrieben"];
const pages=[
 ["register","Einstieg","Formell oder informell?",4],
 ["structure","Briefaufbau","Der Aufbau eines Briefes",4],
 ["phrases","Redemittel","Wichtige Redemittel",4],
 ["understand","Aufgaben verstehen","Drei Inhaltspunkte erkennen",5],
 ["transform","Satztraining","Von der Aufgabe zum Satz",7],
 ["informal","Schreiben","Einen informellen Brief schreiben",5],
 ["formal","Schreiben","Einen formellen Brief schreiben",5],
 ["connectors","Grammatik","Sätze verbinden",4],
 ["errors","Fehler finden","Fehler korrigieren",5],
];
export function buildA1Day20ClassroomStages({workbookUrl=A1_DAY20_WORKBOOK,song}={}){
 const purpose={student:"Lies die Aufgabe. Schreibe zuerst einen eigenen Satz. Vergleiche danach.",teacher:"Use short clear A1 language. Show models only after the attempt. Accept any suitable response covering the actual content points. Connectors are helpful, not an extra required point."};
 return [
 ...pages.map(([step,kicker,title,suggestedMinutes],i)=>({id:"a1-day20-"+step,type:"a1-day20",step,kicker:String(i+1).padStart(2,"0")+" · "+kicker,title,suggestedMinutes,items:[{label:title}],teacherPurpose:purpose})),
 {id:"grammar-check",type:"check",kicker:"10 · Eine Frage pro Student",title:"Eine Aufgabe → ein eigener Satz",items:A1_DAY20_CHECKS,suggestedMinutes:4,teacherPurpose:purpose},
 {id:"a1-day20-mock",type:"a1-day20",step:"mock",kicker:"11 · Mini-Prüfung",title:"Eine Nachricht schreiben · ohne Hilfe",items:[{label:"Mini-Prüfung"}],suggestedMinutes:10,teacherPurpose:{student:"Schreibe ungefähr 30 Wörter und beantworte alle drei Punkte.",teacher:"Select one fresh task, then start the 10-minute writing round. Do not reveal model answers during writing."}},
 {id:"a1-day20-workbook",type:"a1-day20",step:"workbook",kicker:"12 · Checkliste und Workbook",title:"Ist mein Brief fertig?",items:[{label:"Workbook"}],suggestedMinutes:3,workbookUrl,hasMusic:Boolean(song),teacherPurpose:purpose},
 ];
}
