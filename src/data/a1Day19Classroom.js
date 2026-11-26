// Classroom practice only. The A1-5.9 timed tutor-marked workbook is unchanged.
export const A1_DAY19_ASSIGNMENT="A1-5.9";
export const A1_DAY19_WORKBOOK="/campus/course/verboten-erlaubt-5-9";
export const A1_DAY19_INTRO_FIELDS=[["Name","Ich heiße …"],["Alter","Ich bin … Jahre alt."],["Land","Ich komme aus …"],["Wohnort","Ich wohne in …"],["Sprachen","Ich spreche …"],["Beruf","Ich bin … von Beruf."],["Hobby","Mein Hobby ist …"]];
export const A1_DAY19_INTRO_MODEL="Ich heiße Ama. Ich bin 24 Jahre alt. Ich komme aus Ghana. Ich wohne in Accra. Ich spreche Englisch und ein bisschen Deutsch. Ich bin Lehrerin von Beruf. Mein Hobby ist Musik.";
export const A1_DAY19_SPELLING=[["Mensah","M – E – N – S – A – H"],["Schmidt","S – C – H – M – I – D – T"],["Müller","M – Ü – L – L – E – R"],["Kofi","K – O – F – I"],["Weber","W – E – B – E – R"]];
export const A1_DAY19_NUMBERS=[["0123 456 789","null eins zwei drei · vier fünf sechs · sieben acht neun"],["15","fünfzehn"],["50","fünfzig"],["73","dreiundsiebzig"],["2026","zweitausendsechsundzwanzig"],["18:30","achtzehn Uhr dreißig / halb sieben abends"]];
const topic=(theme,word,question,answer)=>({theme,word,question,answer});
export const A1_DAY19_TOPIC_CARDS=[
 topic("Essen und Trinken","Frühstück","Was essen Sie zum Frühstück?","Ich esse Brot und Eier."),
 topic("Essen und Trinken","Kaffee","Trinken Sie gern Kaffee?","Ja, ich trinke gern Kaffee."),
 topic("Freizeit","Sport","Welchen Sport machen Sie gern?","Ich spiele gern Fußball."),
 topic("Freizeit","Musik","Welche Musik hören Sie gern?","Ich höre gern Popmusik."),
 topic("Familie","Geschwister","Haben Sie Geschwister?","Ja, ich habe zwei Brüder."),
 topic("Wohnen","Wohnung","Wie viele Zimmer hat Ihre Wohnung?","Meine Wohnung hat drei Zimmer."),
 topic("Einkaufen","Preis","Was kostet das Brot?","Das Brot kostet zwei Euro."),
 topic("Reisen","Bus","Fahren Sie oft mit dem Bus?","Ja, ich fahre jeden Tag mit dem Bus."),
 topic("Arbeit","Arbeitszeit","Wann beginnen Sie mit der Arbeit?","Ich beginne um acht Uhr."),
 topic("Wochenende","Kino","Gehen Sie am Wochenende ins Kino?","Nein, ich bleibe zu Hause."),
 topic("Deutsch lernen","Kurs","Wann beginnt Ihr Deutschkurs?","Er beginnt um sechs Uhr."),
 topic("Urlaub","Hotel","Wo übernachten Sie im Urlaub?","Ich übernachte in einem Hotel."),
];
const picture=(id,symbol,label,request,reaction,forbidden=false)=>({id,symbol,label,request,reaction,forbidden});
export const A1_DAY19_OBJECT_CARDS=[
 picture("pen","🖊️","Stift","Können Sie mir bitte einen Stift geben?","Ja, gern. Hier, bitte."),
 picture("window","🪟","Fenster","Öffnen Sie bitte das Fenster!","Ja, natürlich."),
 picture("water","🥛","Glas Wasser","Können Sie mir bitte ein Glas Wasser bringen?","Ja, gern."),
 picture("door","🚪","Tür","Schließen Sie bitte die Tür!","Ja, natürlich."),
 picture("chair","🪑","Stuhl","Können Sie mir bitte einen Stuhl bringen?","Ja, gern."),
 picture("book","📖","Buch","Können Sie mir bitte das Buch geben?","Natürlich. Hier, bitte."),
 picture("clock","🕒","Uhr","Können Sie mir bitte sagen, wie spät es ist?","Es ist drei Uhr."),
 picture("map","🗺️","Stadtplan","Können Sie mir bitte den Stadtplan zeigen?","Ja, natürlich."),
];
export const A1_DAY19_SIGN_CARDS=[
 picture("smoke","🚬","Rauchen verboten","Bitte rauchen Sie hier nicht!","Entschuldigung.",true),
 picture("camera","📷","Fotografieren verboten","Bitte fotografieren Sie hier nicht!","Ja, natürlich.",true),
 picture("phone","📱","Handys verboten","Bitte benutzen Sie hier kein Handy!","Entschuldigung.",true),
 picture("food","🍔","Essen verboten","Bitte essen Sie hier nicht!","Ja, natürlich.",true),
 picture("parking","P","Parken verboten","Bitte parken Sie hier nicht!","Entschuldigung.",true),
];
export const A1_DAY19_REACTIONS=[
 ["Können Sie mir bitte einen Stift geben?","Ja, gern. Hier, bitte.","Tut mir leid, ich habe keinen Stift."],
 ["Öffnen Sie bitte das Fenster!","Ja, natürlich.","Tut mir leid, das geht leider nicht."],
 ["Bitte rauchen Sie hier nicht!","Entschuldigung.","Natürlich. Ich rauche hier nicht."],
 ["Können Sie mir bitte helfen?","Ja, gern.","Tut mir leid, ich habe gerade keine Zeit."],
];
const performance=(questionDe,answerDe,noteEn,conceptLabel)=>({questionDe,answerDe,noteEn,conceptLabel,responseMode:"performance"});
export const A1_DAY19_LIVE_CHECKS=[
 performance("Teil 1: Stellen Sie sich kurz vor (Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby).",A1_DAY19_INTRO_MODEL,"Accept the learner's own facts; clear, complete introduction.","Teil 1"),
 performance("Teil 1: Buchstabieren Sie den Nachnamen Weber.","W – E – B – E – R","Listen for clear German letter names.","Teil 1"),
 performance("Teil 1: Sagen Sie diese Übungsnummer auf Deutsch: 0123 456 789.","null eins zwei drei · vier fünf sechs · sieben acht neun","Accept clear digit groups; no personal number needed.","Teil 1"),
 ...A1_DAY19_TOPIC_CARDS.slice(0,6).map(c=>performance("Teil 2 · Thema "+c.theme+" · Karte: "+c.word+". Stellen Sie eine Frage und beantworten Sie die Partnerfrage.",c.question+" – "+c.answer,"Accept any relevant A1 question and a suitable answer to the actual partner question.","Teil 2")),
 ...A1_DAY19_OBJECT_CARDS.slice(0,3).map(c=>performance("Teil 3 · "+c.symbol+" · Formulieren Sie eine höfliche Bitte und reagieren Sie.",c.request+" – "+c.reaction,"Accept a suitable polite request and natural relevant response; do not require exact wording.","Teil 3")),
 ...A1_DAY19_SIGN_CARDS.slice(0,2).map(c=>performance("Teil 3 · 🚫 "+c.symbol+" · Formulieren Sie eine höfliche Bitte und reagieren Sie.",c.request+" – "+c.reaction,"A polite negative request and suitable reaction count.","Teil 3")),
];
export const A1_DAY19_MOCK_SETS=[
 {name:"A",spelling:["Fischer","F – I – S – C – H – E – R"],number:["0170 234 567","null eins sieben null · zwei drei vier · fünf sechs sieben"],topics:[topic("Einkaufen","Bäckerei","Wo kaufen Sie Brot?","Ich kaufe Brot in der Bäckerei."),topic("Freizeit","Schwimmen","Schwimmen Sie gern?","Ja, sehr gern.")],pictures:[picture("ticket","🎫","Fahrkarte","Können Sie mir bitte eine Fahrkarte geben?","Ja, gern."),picture("dog","🐕","Hunde verboten","Bitte bringen Sie hier keinen Hund mit!","Entschuldigung.",true)]},
 {name:"B",spelling:["Bauer","B – A – U – E – R"],number:["0120 987 654","null eins zwei null · neun acht sieben · sechs fünf vier"],topics:[topic("Wohnen","Garten","Haben Sie einen Garten?","Ja, wir haben einen kleinen Garten."),topic("Reisen","Zug","Wann fährt der Zug?","Er fährt um neun Uhr.")],pictures:[picture("bag","👜","Tasche","Können Sie mir bitte die Tasche geben?","Natürlich. Hier, bitte."),picture("drink","🥤","Trinken verboten","Bitte trinken Sie hier nicht!","Entschuldigung.",true)]},
 {name:"C",spelling:["Klein","K – L – E – I – N"],number:["0160 321 987","null eins sechs null · drei zwei eins · neun acht sieben"],topics:[topic("Essen und Trinken","Obst","Welches Obst essen Sie gern?","Ich esse gern Äpfel."),topic("Familie","Kinder","Haben Sie Kinder?","Nein, ich habe keine Kinder.")],pictures:[picture("key","🔑","Schlüssel","Können Sie mir bitte den Schlüssel geben?","Ja, natürlich."),picture("bike","🚲","Radfahren verboten","Bitte fahren Sie hier nicht Fahrrad!","Entschuldigung.",true)]},
 {name:"D",spelling:["Wolf","W – O – L – F"],number:["0150 876 123","null eins fünf null · acht sieben sechs · eins zwei drei"],topics:[topic("Arbeit","Pause","Wann machen Sie Pause?","Um zwölf Uhr."),topic("Wochenende","Besuch","Besuchen Sie am Wochenende Freunde?","Ja, ich besuche meine Freunde.")],pictures:[picture("umbrella","☂️","Regenschirm","Können Sie mir bitte den Regenschirm geben?","Ja, gern."),picture("ice","🍦","Eis essen verboten","Bitte essen Sie hier kein Eis!","Entschuldigung.",true)]},
];
export const A1_DAY19_READINESS=[
 ["Aufgabe erfüllt","Task completion: answers or forms exactly what the task asks for."],
 ["Frage gebildet","Question formation: forms a clear W-question or yes/no question."],
 ["Passend geantwortet","Answer relevance: answers the actual question."],
 ["Flüssig gesprochen","Fluency: responds without a long pause and continues after small mistakes."],
 ["Verständlich gesprochen","Clarity: pronunciation and sentence structure are clear enough for A1."],
 ["Interagiert","Interaction: listens, makes polite requests, and responds appropriately."],
];
const pages=[
 ["map","Prüfungsformat","Die drei Teile der A1-Sprechprüfung",3],
 ["intro","Teil 1","Sich vorstellen",5],
 ["spelling","Teil 1","Buchstabieren",4],
 ["numbers","Teil 1","Zahlen und Telefonnummern",4],
 ["questions","Teil 2","Fragen bilden",5],
 ["topic-cards","Teil 2","Themenkarten",5],
 ["objects","Teil 3","Bitten mit Bildkarten",5],
 ["signs","Teil 3","Verbotsschilder",5],
 ["reactions","Teil 3","Natürlich reagieren",5],
];
export function buildA1Day19ClassroomStages({workbookUrl=A1_DAY19_WORKBOOK,song}={}){
 const purpose={student:"Sprechen Sie zuerst selbst. Öffnen Sie das Beispiel erst danach.",teacher:"Let students speak in short turns. Accept alternative understandable answers that fulfil the task."};
 return [
 ...pages.map(([step,kicker,title,suggestedMinutes],i)=>({id:"a1-day19-"+step,type:"a1-day19",step,kicker:String(i+1).padStart(2,"0")+" · "+kicker,title,suggestedMinutes,items:[{label:title}],teacherPurpose:purpose})),
 {id:"grammar-check",type:"check",kicker:"10 · Live-Sprechen",title:"Eine Sprechaufgabe pro Student",items:A1_DAY19_LIVE_CHECKS,suggestedMinutes:5,teacherPurpose:{student:"Bearbeiten Sie die Sprechaufgabe ohne Hilfe.",teacher:"Use the existing picker. Mark task fulfilment and intelligibility, not memorised wording."}},
 {id:"a1-day19-mock",type:"a1-day19",step:"mock",kicker:"11 · Mini-Prüfung",title:"Teil 1 → Teil 2 → Teil 3 · ohne Hilfe",items:[{label:"Mini-Prüfung"}],suggestedMinutes:10,teacherPurpose:{student:"Sprechen Sie ohne Musterantworten.",teacher:"Choose a fresh set. Run two short five-minute pair rounds; rotate roles. This is classroom practice, not an official Goethe score."}},
 {id:"a1-day19-workbook",type:"a1-day19",step:"workbook",kicker:"12 · Abschluss",title:"Prüfungsbereitschaft und Workbook",items:[{label:"Workbook"}],suggestedMinutes:4,workbookUrl,hasMusic:Boolean(song),teacherPurpose:purpose},
 ].map((stage) => ({ ...stage, examReadiness: true }));
}
