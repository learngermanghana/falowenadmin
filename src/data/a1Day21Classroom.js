// Classroom examples only: retain the published A1-13 four-part workbook and marking.
export const A1_DAY21_ASSIGNMENT="A1-13";
export const A1_DAY21_WORKBOOK="/campus/course/a1-day-21-weather-workbook";
export const A1_DAY21_WEATHER=[
 ["☀️","sonnig","Es ist sonnig.","The sun is shining."],
 ["☁️","bewölkt","Es ist bewölkt.","It is cloudy."],
 ["🌧️","Regen","Es regnet.","It is raining."],
 ["❄️","Schnee","Es schneit.","It is snowing."],
 ["💨","windig","Es ist windig.","It is windy."],
 ["🌫️","neblig","Es ist neblig.","It is foggy."],
 ["⛈️","Gewitter","Es gibt ein Gewitter.","There is a thunderstorm."],
 ["🌡️","heiß","Es ist heiß.","It is hot."],
 ["🧊","kalt","Es ist kalt.","It is cold."],
];
export const A1_DAY21_SEASONS=[
 ["🌷","der Frühling","Im Frühling ist es oft mild."],
 ["☀️","der Sommer","Im Sommer ist es oft warm."],
 ["🍂","der Herbst","Im Herbst ist es oft windig."],
 ["❄️","der Winter","Im Winter ist es oft kalt."],
];
export const A1_DAY21_FORECAST=[
 {day:"Montag",symbol:"🌧️",description:"Es regnet.",temperature:12},
 {day:"Dienstag",symbol:"☀️",description:"Es ist sonnig.",temperature:23},
 {day:"Mittwoch",symbol:"💨",description:"Es ist windig.",temperature:15},
 {day:"Donnerstag",symbol:"☁️",description:"Es ist bewölkt.",temperature:18},
 {day:"Freitag",symbol:"❄️",description:"Es schneit.",temperature:-2},
];
export const A1_DAY21_FORECAST_CHECKS=[
 ["An welchem Tag regnet es?",["Montag","Dienstag","Mittwoch"],0],
 ["Wie warm ist es am Dienstag?",["12 Grad","23 Grad","18 Grad"],1],
 ["An welchem Tag ist es windig?",["Donnerstag","Freitag","Mittwoch"],2],
 ["Wie ist das Wetter am Freitag?",["Es schneit.","Es ist sonnig.","Es regnet."],0],
 ["Welcher Tag ist am wärmsten?",["Montag","Dienstag","Freitag"],1],
];
export const A1_DAY21_FORMS=[
 ["Es ___ kalt.",["ist","regnet","sind"],0,"kalt ist ein Adjektiv."],
 ["Es ___ heute.",["ist regnet","regnet","regnen"],1,"regnet ist schon ein Verb."],
 ["Es ___ 24 Grad.",["hat","ist","sind"],2,"Es sind 24 Grad."],
 ["Es ___ stark.",["ist schneit","schneit","schneien"],1,"schneit ist ein Verb."],
 ["Es ___ windig.",["ist","sind","hat"],0,"windig ist ein Adjektiv."],
 ["Es ___ ein Gewitter.",["ist","gibt","sind"],1,"Es gibt + ein Gewitter."],
];
export const A1_DAY21_REASONS=[
 ["es / stark / regnet","Ich kann leider nicht kommen, weil es stark regnet."],
 ["es / heute / schneit","Ich kann nicht kommen, weil es heute schneit."],
 ["es / sehr / kalt / ist","Ich bleibe zu Hause, weil es sehr kalt ist."],
 ["es / ein Gewitter / gibt","Ich muss absagen, weil es ein Gewitter gibt."],
 ["mein Bus / wegen des Regens / nicht / fährt","Ich kann nicht kommen, weil mein Bus wegen des Regens nicht fährt."],
];
export const A1_DAY21_TIMES=[
 ["___ Sommer ist es oft warm.",["Im","Am","Um"],0,"im + Jahreszeit"],
 ["Wir treffen uns ___ Sonntag.",["im","am","um"],1,"am + Wochentag"],
 ["Wir treffen uns ___ 15 Uhr.",["im","am","um"],2,"um + Uhrzeit"],
 ["___ Dezember ist es oft kalt.",["Im","Am","Um"],0,"im + Monat"],
 ["Können wir uns ___ Samstag ___ 16 Uhr treffen?",["im / um","am / im","am / um"],2,"am + Tag, um + Uhrzeit"],
];
export const A1_DAY21_READING={
 title:"Wetter am Wochenende",
 text:"Am Samstag regnet es in der Stadt stark. Es sind 13 Grad. Am Nachmittag gibt es ein Gewitter. Am Sonntag ist es sonnig und warm. Es sind 22 Grad. Der Park ist am Sonntag geöffnet.",
 questions:[
 ["Am Samstag regnet es stark.",true],
 ["Am Samstag sind es 22 Grad.",false],
 ["Am Samstagnachmittag gibt es ein Gewitter.",true],
 ["Am Sonntag ist es sonnig.",true],
 ["Der Park ist am Sonntag geschlossen.",false],
 ],
};
const q=(questionDe,answerDe,noteEn)=>({questionDe,answerDe,noteEn});
export const A1_DAY21_CHECKS=[
 q("Wie ist das Wetter? ☀️","Es ist sonnig.","Accept a suitable sentence describing sunshine."),
 q("Wie ist das Wetter? 🌧️","Es regnet.","Use the weather verb without ist."),
 q("Wie ist das Wetter? ❄️","Es schneit.","Accept a correct snow description."),
 q("Sagen Sie die Temperatur: 25 °C.","Es sind 25 Grad.","Accept a clear temperature statement."),
 q("Korrigieren Sie: Es ist regnet.","Es regnet.","The conjugated verb is regnet."),
 q("Ergänzen Sie: ___ Winter ist es kalt.","Im Winter ist es kalt.","im + season."),
 q("Ergänzen Sie: Wir treffen uns ___ Sonntag ___ 15 Uhr.","Wir treffen uns am Sonntag um 15 Uhr.","am + day, um + exact time."),
 q("Sagen Sie, dass Sie leider nicht kommen können.","Ich kann leider nicht kommen.","A clear cancellation is enough."),
 q("Nennen Sie einen konkreten Wettergrund mit weil.","Ich kann nicht kommen, weil es stark regnet.","Accept another concrete weather reason and correct verb-final structure."),
 q("Schlagen Sie einen neuen Termin vor.","Können wir uns am Samstag um 16 Uhr treffen?","Accept a clear alternative meeting proposal."),
];
export const A1_DAY21_WRITING={
 situation:"Sie wollten am Samstag mit Ihrer Freundin Anna im Park spazieren gehen. Es gibt ein starkes Gewitter. Schreiben Sie Anna eine kurze Nachricht.",
 points:["Sagen Sie, dass Sie nicht kommen können.","Nennen Sie einen konkreten Wettergrund.","Schlagen Sie ein neues Treffen vor."],
 greeting:"Liebe Anna,",
 body:["leider kann ich heute nicht in den Park kommen.","Es gibt ein starkes Gewitter, und das Wetter ist sehr schlecht.","Können wir uns am Sonntag um 15 Uhr treffen?"],
 closing:"Liebe Grüße",name:"Ama",
};
const pages=[
 ["intro","Einstieg","Wie ist das Wetter heute?",3],
 ["vocab","Wortschatz","Neun Wetterwörter mit Bildern",5],
 ["forms","Grammatik","Es ist kalt oder es regnet?",5],
 ["seasons","Jahreszeiten","Jahreszeiten und Temperaturen",4],
 ["forecast","Wetterbericht","Den Wetterbericht verstehen",5],
 ["reasons","Grammatik","Warum? · Wettergründe mit weil",5],
 ["cancel","Schreiben","Leider kann ich nicht kommen",5],
 ["times","Neuer Termin","Einen neuen Termin vorschlagen",4],
 ["reading","Lesen","Wetter am Wochenende",5],
];
export function buildA1Day21ClassroomStages({workbookUrl=A1_DAY21_WORKBOOK,song}={}){
 const purpose={student:"Beschreibe das Wetter, antworte zuerst selbst und vergleiche danach.",teacher:"Use clear A1 examples. Let students produce their own sentences; accept a clear concrete weather reason without requiring weil in a complete message."};
 return [
 ...pages.map(([step,kicker,title,suggestedMinutes],i)=>({id:"a1-day21-"+step,type:"a1-day21",step,kicker:String(i+1).padStart(2,"0")+" · "+kicker,title,suggestedMinutes,items:[{label:title}],teacherPurpose:purpose})),
 {id:"a1-day21-music",type:"a1-day21",step:"music",kicker:"10 · Falowen Music",title:"Bina, tut mir leid · Hören",items:[{label:"Bina, tut mir leid"}],suggestedMinutes:5,hasMusic:Boolean(song),teacherPurpose:{student:"Höre zu. Welcher Wettergrund und welcher neue Termin werden genannt?",teacher:"Use the published recording and existing next-lyric activity. Never invent timing or claim an unavailable track is playing."}},
 {id:"grammar-check",type:"check",kicker:"11 · Eine Frage pro Student",title:"Wetter, Gründe und Termine",items:A1_DAY21_CHECKS,suggestedMinutes:5,teacherPurpose:purpose},
 {id:"a1-day21-writing",type:"a1-day21",step:"writing",kicker:"12 · Schreiben und Workbook",title:"Eine kurze Absage schreiben",items:[{label:"Schreiben"}],suggestedMinutes:9,workbookUrl,teacherPurpose:{student:"Schreibe eine Nachricht mit drei Inhaltspunkten. Prüfe die Briefform.",teacher:"Allow independent writing, reveal the parallel model after the attempt, then open the unchanged four-part workbook."}},
 ];
}
