// A1 Day 18: classroom-only practice. The published workbook and marking stay unchanged.
export const A1_DAY18_ASSIGNMENT = "A1-12.1";
export const A1_DAY18_WORKBOOK = "/campus/course/two-case-prepositions-wechselpraepositionen-day-18?view=workbook";
export const A1_DAY18_PREPOSITIONS = [
 ["in","inside","in der Tasche","in die Tasche"],["auf","on","auf dem Tisch","auf den Tisch"],
 ["unter","under","unter dem Bett","unter das Bett"],["über","above","über dem Sofa","über das Sofa"],
 ["neben","next to","neben dem Fenster","neben das Fenster"],["vor","in front of","vor der Tür","vor die Tür"],
 ["hinter","behind","hinter dem Schrank","hinter den Schrank"],["an","against / at","an der Wand","an die Wand"],
 ["zwischen","between","zwischen den Stühlen","zwischen die Stühle"],
];
export const A1_DAY18_ARTICLES = [
 ["der Tisch","dem","den","auf dem Tisch","auf den Tisch"],
 ["die Wand","der","die","an der Wand","an die Wand"],
 ["das Bett","dem","das","unter dem Bett","unter das Bett"],
 ["die Stühle (Plural)","den (+n)","die","zwischen den Stühlen","zwischen die Stühle"],
];
export const A1_DAY18_VERBS = [
 ["liegen → legen","Das Buch liegt auf dem Tisch.","Ich lege das Buch auf den Tisch.","book"],
 ["stehen → stellen","Die Flasche steht auf dem Tisch.","Ich stelle die Flasche auf den Tisch.","bottle"],
 ["sitzen → sich setzen","Ich sitze auf dem Stuhl.","Ich setze mich auf den Stuhl.","person"],
 ["hängen → hängen","Das Bild hängt an der Wand.","Ich hänge das Bild an die Wand.","picture"],
];
export const A1_DAY18_TRANSFORM = [
 ["Das Handy liegt auf dem Bett.","Ich lege das Handy auf das Bett.","liegen → legen · dem → das"],
 ["Die Flasche steht auf dem Tisch.","Ich stelle die Flasche auf den Tisch.","stehen → stellen · dem → den"],
 ["Das Bild hängt an der Wand.","Ich hänge das Bild an die Wand.","hängen → hängen · der → die"],
 ["Ich sitze auf dem Sofa.","Ich setze mich auf das Sofa.","sitzen → sich setzen · dem → das"],
 ["Die Tasche liegt unter dem Stuhl.","Ich lege die Tasche unter den Stuhl.","liegen → legen · dem → den"],
 ["Der Stuhl steht neben dem Fenster.","Ich stelle den Stuhl neben das Fenster.","stehen → stellen · dem → das"],
];
export const A1_DAY18_ARTICLE_QUIZ = [
 ["Das Buch liegt auf ___ Tisch.",["der","dem","den"],"dem","Wo? Dativ · der Tisch → dem Tisch"],
 ["Ich lege das Buch auf ___ Tisch.",["dem","den","das"],"den","Wohin? Akkusativ · der Tisch → den Tisch"],
 ["Das Bild hängt an ___ Wand.",["die","den","der"],"der","Wo? Dativ · die Wand → der Wand"],
 ["Ich hänge das Bild an ___ Wand.",["der","die","dem"],"die","Wohin? Akkusativ · die Wand → die Wand"],
 ["Die Schuhe stehen unter ___ Bett.",["dem","das","den"],"dem","Wo? Dativ · das Bett → dem Bett"],
 ["Ich stelle die Schuhe unter ___ Bett.",["dem","den","das"],"das","Wohin? Akkusativ · das Bett → das Bett"],
 ["Der Hund sitzt zwischen ___ Stühlen.",["die","den","dem"],"den","Wo? Dativ Plural · den Stühlen"],
 ["Ich stelle den Tisch zwischen ___ Stühle.",["den","die","der"],"die","Wohin? Akkusativ Plural · die Stühle"],
];
export const A1_DAY18_ERRORS = [
 ["Das Buch liegt auf den Tisch.","Das Buch liegt auf dem Tisch.","Wo? Dativ."],
 ["Ich stelle die Flasche auf dem Tisch.","Ich stelle die Flasche auf den Tisch.","Wohin? Akkusativ."],
 ["Das Bild hängt an die Wand.","Das Bild hängt an der Wand.","Wo? Dativ."],
 ["Ich gehe in der Küche. (Ziel: Küche)","Ich gehe in die Küche.","Wohin? Akkusativ; movement within the kitchen would be dative."],
 ["Ich sitze auf den Stuhl.","Ich sitze auf dem Stuhl.","Wo? Dativ."],
];
export const A1_DAY18_ROOM = [
 ["Wo ist das Bett?","Das Bett steht neben dem Schrank."],
 ["Wo ist die Lampe?","Die Lampe steht auf dem Nachttisch."],
 ["Wo ist der Stuhl?","Der Stuhl steht vor dem Schreibtisch."],
 ["Wo ist das Buch?","Das Buch liegt auf dem Schreibtisch."],
 ["Wo ist die Tasche?","Die Tasche liegt unter dem Stuhl."],
 ["Wohin stellen Sie die Lampe? (Tisch)","Ich stelle die Lampe auf den Schreibtisch."],
 ["Wohin legen Sie das Buch? (Bett)","Ich lege das Buch auf das Bett."],
];
const q=(questionDe,answerDe,noteEn)=>({questionDe,answerDe,noteEn});
export const A1_DAY18_STUDENT_CHECKS = [
 q("Wohin legst du dein Handy? (Tisch)","Ich lege mein Handy auf den Tisch.","Destination: accusative."),
 q("Wo liegt dein Handy? (Tisch)","Mein Handy liegt auf dem Tisch.","Location: dative."),
 q("Wohin stellst du deine Schuhe? (Bett)","Ich stelle meine Schuhe unter das Bett.","Destination: accusative neuter."),
 q("Wo stehen deine Schuhe? (Bett)","Meine Schuhe stehen unter dem Bett.","Location: dative neuter."),
 q("Wohin gehst du? (Küche)","Ich gehe in die Küche.","Destination: accusative feminine."),
 q("Wo bist du? (Küche)","Ich bin in der Küche.","Location: dative feminine."),
 q("Ändere zu Wohin?: Das Bild hängt an der Wand.","Ich hänge das Bild an die Wand.","Same verb, different subject and case."),
 q("Ändere zu Wo?: Ich stelle den Stuhl neben das Fenster.","Der Stuhl steht neben dem Fenster.","stellen → stehen; das → dem."),
 q("Ergänze: Die Katze sitzt zwischen ___ Stühlen.","zwischen den Stühlen","Dative plural: den plus noun ending n where required."),
 q("Ich laufe im Park. Wo oder Wohin? Welcher Fall?","Wo? Dativ (im = in dem).","Movement within a place is not automatically accusative."),
];
export const A1_DAY18_EXIT = [
 q("Ich lege das Buch auf ___ Tisch.","den","Wohin? Akkusativ."),
 q("Das Buch liegt auf ___ Tisch.","dem","Wo? Dativ."),
 q("Ich hänge das Bild an ___ Wand.","die","Wohin? Akkusativ."),
 q("Das Bild hängt an ___ Wand.","der","Wo? Dativ."),
 q("Ich gehe in ___ Schule.","die","Wohin? Akkusativ."),
 q("Ich bin in ___ Schule.","der","Wo? Dativ."),
];
const pages=[
 ["intro","Einstieg","Wo oder Wohin?",4],
 ["prepositions","Wortschatz","Die neun Wechselpräpositionen",5],
 ["rule","Grammatik","Die wichtigste Regel",5],
 ["articles","Grammatik","Wie ändern sich die Artikel?",5],
 ["verbs","Grammatik","Die wichtigsten Verbpaare",6],
 ["transform","Satztraining","Sätze verändern",8],
 ["compare","Vergleich","Alle neun Präpositionen",4],
 ["quiz","Quick Practice","Welcher Artikel?",5],
 ["room","Bildbeschreibung","Mein Zimmer",6],
 ["errors","Fehler korrigieren","Was ist falsch?",4],
];
export function buildA1Day18ClassroomStages({workbookUrl=A1_DAY18_WORKBOOK,song}={}){
 return [
  ...pages.map(([step,kicker,title,suggestedMinutes],i)=>({
   id:"a1-day18-"+step,type:"a1-day18",step,title,kicker:String(i+1).padStart(2,"0")+" · "+kicker,suggestedMinutes,items:[{label:title}],
   teacherPurpose:{student:"Entscheide zuerst: Wo oder Wohin? Bilde dann einen vollständigen Satz.",teacher:"Focus on the change in meaning, verb and article; reveal only after learners attempt. Motion within a location can still take dative."},
  })),
  {id:"grammar-check",type:"check",kicker:"11 · Eine Frage pro Student",title:"Wo oder Wohin? · Einzelcheck",items:A1_DAY18_STUDENT_CHECKS,suggestedMinutes:5},
  {id:"exit-check",type:"a1-day18",step:"exit",kicker:"12 · Mini-Prüfung und Workbook",title:"Sechs Aufgaben ohne Hilfe",items:A1_DAY18_EXIT,exitCheck:true,workbookUrl,suggestedMinutes:3,hasMusic:Boolean(song)},
 ];
}
