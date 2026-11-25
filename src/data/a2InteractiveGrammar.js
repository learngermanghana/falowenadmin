// Local, authored grammar teaching cards; page numbers are one-based.
const t=(title,headers,rows,example)=>({title,headers,rows,example});
const persons=["ich","du","er/sie/es","wir","ihr","sie/Sie"];
const v=(title,forms,example)=>t(title,["Person","Form"],persons.map((p,i)=>[p,forms[i]]),example);
const compare=(title,rows,example)=>t(title,["Form","Satzbau / Verwendung"],rows,example);
const articles=t("Artikel: Ort oder Ziel?",["Genus","Dativ · Wo?","Akkusativ · Wohin?"],[["m","dem","den"],["f","der","die"],["n","dem","das"],["Pl.","den (+ n)","die"]],"Das Buch liegt auf dem Tisch. Ich lege es auf den Tisch.");
const reflex=t("Reflexivpronomen · Akkusativ",["Person","Pronomen"],persons.map((p,i)=>[p,["mich","dich","sich","uns","euch","sich"][i]]),"Wir erholen uns.");
const modal=(title,forms,example)=>v(title,forms,example);
const relative=t("Relativpronomen",["Genus","Nominativ","Akkusativ"],[["m","der","den"],["f","die","die"],["n","das","das"],["Pl.","die","die"]],"Der Mann, den ich kenne, wohnt hier.");
const haben=v("haben · Präsens",["habe","hast","hat","haben","habt","haben"],"Wir haben ein Hotel gebucht.");
const sein=v("sein · Präsens",["bin","bist","ist","sind","seid","sind"],"Wir sind nach Berlin gefahren.");
const werden=v("werden · Präsens",["werde","wirst","wird","werden","werdet","werden"],"Wir werden nächstes Jahr reisen.");
const moechte=v("möchten · Konjunktiv II",["möchte","möchtest","möchte","möchten","möchtet","möchten"],"Wir möchten einen Kaffee bestellen.");
const koennen=v("können · Präsens",["kann","kannst","kann","können","könnt","können"],"Wir können morgen kommen.");
const muessen=v("müssen · Präsens",["muss","musst","muss","müssen","müsst","müssen"],"Wir müssen arbeiten.");
const sollen=v("sollen · Präsens",["soll","sollst","soll","sollen","sollt","sollen"],"Wir sollen viel trinken.");
const koennten=v("können · Konjunktiv II",["könnte","könntest","könnte","könnten","könntet","könnten"],"Könnten Sie mir helfen?");
const subordinators=compare("Nebensatz und Hauptsatz",[["weil","Grund · Verb am Ende"],["denn","Grund · Hauptsatzstellung"],["deshalb","Folge · Verb direkt danach"]],"Ich bin müde. Deshalb gehe ich ins Bett.");
const condition=compare("Bedingung oder Frage?",[["wenn/falls","Bedingung + Verb am Ende"],["ob","indirekte Ja-/Nein-Frage + Verb am Ende"]],"Wenn es regnet, bleibe ich zu Hause. Ich weiß nicht, ob es regnet.");
const comparisons=t("Steigerung",["Positiv","Komparativ","Superlativ"],[["schnell","schneller","am schnellsten"],["groß","größer","am größten"],["gut","besser","am besten"],["viel","mehr","am meisten"],["teuer","teurer","am teuersten"]],"Der Zug ist schneller als der Bus.");
const purpose=compare("Zweck ausdrücken",[["um … zu","gleiches Subjekt + zu + Infinitiv"],["damit","Subjekt + … + Verb am Ende"],["trennbar","auf + zu + stehen"]],"Ich übe, um mich vorzubereiten. Sie hilft mir, damit ich bestehe.");
export const A2_INTERACTIVE_GRAMMAR={
1:{1:[subordinators,compare("Verbposition vergleichen",[["weil","…, weil ich müde bin."],["denn","…, denn ich bin müde."],["deshalb","Deshalb bin ich müde."]],"Wo steht bin?")]},
2:{1:[t("Drei Entscheidungen",["Schritt","Beispiel"],[["Genus","der Mann"],["Kasus","Akkusativ nach sehen"],["Artikel + Endung","einen netten Mann"]],"Ich sehe einen netten Mann.")],2:[t("Nominativ · ein/kein",["Genus","Form"],[["m","ein netter Mann"],["f","eine nette Frau"],["n","ein nettes Kind"],["Pl.","keine netten Leute"]],"Ein netter Mann kommt.")],3:[t("Akkusativ · ein/kein",["Genus","Form"],[["m","einen netten Mann"],["f","eine nette Frau"],["n","ein nettes Kind"],["Pl.","keine netten Leute"]],"Ich sehe einen netten Mann.")],4:[compare("Mit oder ohne Endung",[["vor Nomen","ein freundlicher Mann"],["nach sein","Der Mann ist freundlich."]],"Ich sehe einen freundlichen Mann.")]},
3:{1:[comparisons,compare("wie oder als?",[["gleich","genauso + Adjektiv + wie"],["ungleich","Komparativ + als"],["höchster Grad","am + Superlativ"]],"Lea ist größer als Tom.")]},
4:{1:[articles],2:[t("Kurzformen",["Ort","Ziel"],[["am See","an den See"],["im Café","ins Café"],["am Meer","ans Meer"]],"Wir treffen uns am See. Wir fahren an den See.")]},
5:{1:[v("ausgehen · Präsens",["gehe aus","gehst aus","geht aus","gehen aus","geht aus","gehen aus"],"Wir gehen heute aus."),v("anrufen · Präsens",["rufe an","rufst an","ruft an","rufen an","ruft an","rufen an"],"Wir rufen dich an."),compare("Satzklammer",[["Hauptsatz","Heute rufe ich dich an."],["Modalverb","Ich möchte dich anrufen."]],"Vorsilbe am Ende oder ganzer Infinitiv.")]},
6:{1:[t("Wo? oder Wohin?",["Position","Platzwechsel"],[["steht","stellt"],["liegt","legt"],["hängt","hängt"]],"Die Lampe steht neben dem Sofa. Ich stelle sie neben das Sofa.")],2:[articles]},
7:{1:[relative],2:[compare("Relativsatz bilden",[["Subjekt","der Mann, der hier wohnt"],["Objekt","der Mann, den ich kenne"],["Perfekt","der Mann, den ich angerufen habe"]],"Das Verb steht am Ende.")]},
8:{1:[moechte,koennten,t("Bestellen · Akkusativ",["Artikel","Bestellung"],[["der Tee","einen Tee"],["die Suppe","eine Suppe"],["das Wasser","ein Wasser"]],"Ich hätte gern einen Tee.")]},
9:{1:[compare("Satzbau im Perfekt",[["Aussage","Wir haben ein Museum besucht."],["Ja/Nein","Habt ihr ein Museum besucht?"],["W-Frage","Was habt ihr besucht?"]],"Hilfsverb + Partizip II.")],2:[haben,sein],3:[t("Partizip II",["Infinitiv","Partizip II"],[["machen","gemacht"],["fahren","gefahren"],["ankommen","angekommen"],["besuchen","besucht"],["reservieren","reserviert"]],"Wir sind angekommen.")]},
10:{1:[compare("Perfekt oder Präteritum?",[["Perfekt","Ich habe die Stadt besucht."],["Präteritum","Ich besuchte die Stadt."],["häufig mündlich","Es war schön. Wir hatten Zeit."]],"Beide Formen erzählen Vergangenes.")],2:[]},
11:{1:[comparisons,compare("Verkehrsmittel vergleichen",[["gleich","genauso schnell wie"],["ungleich","schneller als"],["höchster Grad","am schnellsten"]],"Der Zug ist schneller als der Bus.")]},
12:{1:[moechte,koennen,v("wollen · Präsens",["will","willst","will","wollen","wollt","wollen"],"Wir wollen später arbeiten."),compare("weil oder dass?",[["weil","Grund: weil ich gern helfe."],["dass","Meinung: dass der Beruf passt."]],"Ich glaube, dass ich gut im Team arbeiten kann.")]},
13:{1:[modal("können · Präteritum",["konnte","konntest","konnte","konnten","konntet","konnten"],"Wir konnten helfen."),modal("müssen · Präteritum",["musste","musstest","musste","mussten","musstet","mussten"],"Wir mussten arbeiten."),modal("wollen · Präteritum",["wollte","wolltest","wollte","wollten","wolltet","wollten"],"Wir wollten lernen."),modal("dürfen · Präteritum",["durfte","durftest","durfte","durften","durftet","durften"],"Wir durften gehen."),modal("sollen · Präteritum",["sollte","solltest","sollte","sollten","solltet","sollten"],"Wir sollten helfen.")]},
14:{1:[purpose]},
15:{1:[t("seit oder vor?",["Form","Beispiel"],[["seit + Dativ","seit einem Monat"],["vor + Dativ","vor einer Woche"],["Plural","seit zwei Jahren"]],"Ich wohne seit einem Jahr hier. Vor einem Jahr bin ich umgezogen.")]},
16:{1:[reflex,v("sich erholen · Präsens",["erhole mich","erholst dich","erholt sich","erholen uns","erholt euch","erholen sich"],"Wir erholen uns am Wochenende.")],2:[v("sich ausruhen · Präsens",["ruhe mich aus","ruhst dich aus","ruht sich aus","ruhen uns aus","ruht euch aus","ruhen sich aus"],"Wir ruhen uns aus."),compare("Satzklammer",[["Präsens","Ich ruhe mich aus."],["Modalverb","Ich möchte mich ausruhen."],["Perfekt","Ich habe mich ausgeruht."]],"Das Reflexivpronomen bleibt im Mittelfeld.")]},
17:{1:[koennen,muessen,sollen,v("dürfen · Präsens",["darf","darfst","darf","dürfen","dürft","dürfen"],"Wir dürfen das Medikament nehmen.")]},
18:{1:[koennten,v("haben · Konjunktiv II",["hätte","hättest","hätte","hätten","hättet","hätten"],"Wir hätten gern einen Termin."),v("werden · Konjunktiv II",["würde","würdest","würde","würden","würdet","würden"],"Wir würden gern einen Termin vereinbaren.")]},
19:{1:[compare("Konnektoren",[["oder","Alternative: A oder B"],["entweder … oder","genau zwei Alternativen"],["denn","Grund · Hauptsatz"]],"Ich kaufe hier ein, denn es ist günstig.")]},
20:{1:[subordinators,koennten]},
21:{1:[condition]},
22:{1:[muessen,koennen,compare("Zeit zuerst",[["Position 1","Am Montag"],["Position 2","arbeite / muss"],["Rest","ich / ich arbeiten"]],"Am Montag muss ich arbeiten.")]},
23:{1:[t("Verkehrsmittel",["mit + Dativ","nehmen + Akkusativ"],[["mit dem Bus","den Bus nehmen"],["mit der Bahn","die Bahn nehmen"],["mit dem Fahrrad","das Fahrrad nehmen"]],"Ich fahre mit der Bahn.")],2:[compare("Ziele",[["zu + Dativ","zur Arbeit / zum Bahnhof"],["nach","nach Berlin / nach Hause"],["in + Akkusativ","ins Büro / in die Schweiz"]],"Wir fahren nach Berlin.")],3:[compare("Zeit, Dauer und Grund",[["Zeit","Um acht Uhr fahre ich los."],["Dauer","Ich brauche 20 Minuten."],["Grund","…, weil es günstig ist."]],"Jeden Morgen fahre ich mit dem Bus.")]},
24:{1:[condition,subordinators,purpose]},
25:{1:[v("aufstehen · Präsens",["stehe auf","stehst auf","steht auf","stehen auf","steht auf","stehen auf"],"Wir stehen um sieben Uhr auf."),reflex,v("sich anziehen · Präsens",["ziehe mich an","ziehst dich an","zieht sich an","ziehen uns an","zieht euch an","ziehen sich an"],"Danach ziehen wir uns an.")]},
26:{1:[reflex,v("sich fühlen · Präsens",["fühle mich","fühlst dich","fühlt sich","fühlen uns","fühlt euch","fühlen sich"],"Wir fühlen uns gut."),compare("Grund und Situation",[["weil","Ich bin froh, weil ich frei habe."],["wenn","Wenn ich frei habe, bin ich froh."]],"Verb am Ende des Nebensatzes.")]},
27:{1:[compare("dass-Sätze",[["Aussage","Ich denke, dass er online ist."],["Modalverb","Ich glaube, dass er antworten kann."],["Perfekt","Ich finde, dass er gut erklärt hat."]],"Das finite Verb steht am Ende.")]},
28:{1:[werden,moechte,compare("Zukunft ausdrücken",[["Präsens","Morgen lerne ich Deutsch."],["Wunsch","Ich möchte Deutsch lernen."],["Futur I","Ich werde Deutsch lernen."]],"werden + Infinitiv am Ende.")]}
};
export function grammarCards(assignmentId,stageId){
 const match=/^A2-\d+\.(\d+)$/i.exec(assignmentId||"");
 const page=/^workbook-grammar(?:-(\d+))?$/.exec(stageId||"");
 return match&&page?(A2_INTERACTIVE_GRAMMAR[Number(match[1])]?.[Number(page[1]||1)]||[]):[];
}
