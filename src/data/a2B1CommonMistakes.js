// Authored for each course topic. Classroom correction/reveal only: no forms,
// submissions, grading, generated examples, or shared placeholder exercises.
const entries = [
  ['A2-1.1', [
    ['Seit Montag ich arbeite hier.', 'Seit Montag arbeite ich hier.', 'Nach der Zeitangabe steht das Verb an zweiter Position.'],
    ['Ich freue mich, Sie kennenzulernen Sie.', 'Ich freue mich, Sie kennenzulernen.', 'Das Objekt „Sie“ steht vor dem Infinitiv und wird nicht wiederholt.'],
  ]],
  ['A2-1.2', [
    ['Die neue Kollegin hat kurze dunkel Haare.', 'Die neue Kollegin hat kurze dunkle Haare.', 'Vor „Haare“ braucht auch „dunkel“ eine Endung: dunkle.'],
    ['Er trägt einen schwarzer Rucksack.', 'Er trägt einen schwarzen Rucksack.', '„Einen Rucksack“ steht im Akkusativ: einen schwarzen Rucksack.'],
  ]],
  ['A2-1.3', [
    ['Das rote Fahrrad ist leichter wie das blaue.', 'Das rote Fahrrad ist leichter als das blaue.', 'Beim Komparativ steht „als“: leichter als.'],
    ['Das blaue Fahrrad ist genauso schnell als das rote.', 'Das blaue Fahrrad ist genauso schnell wie das rote.', 'Bei Gleichheit heißt es „genauso … wie“.'],
  ]],
  ['A2-2.4', [
    ['Wir treffen uns am siebzehn Uhr.', 'Wir treffen uns um siebzehn Uhr.', 'Für eine Uhrzeit verwenden wir „um“.'],
    ['Ich kann nicht kommen, weil ich muss arbeiten.', 'Ich kann nicht kommen, weil ich arbeiten muss.', 'Im weil-Satz steht das Modalverb am Ende.'],
  ]],
  ['A2-2.5', [
    ['Am Wochenende ich spiele Fußball.', 'Am Wochenende spiele ich Fußball.', 'Nach „Am Wochenende“ folgt das konjugierte Verb.'],
    ['Wir möchten zusammen zu spazieren gehen.', 'Wir möchten zusammen spazieren gehen.', 'Nach „möchten“ steht der Infinitiv ohne „zu“.'],
  ]],
  ['A2-3.6', [
    ['Das Sofa steht neben das Fenster.', 'Das Sofa steht neben dem Fenster.', 'Wo steht es? Ein Ort mit „neben“ verlangt den Dativ.'],
    ['Ich stelle die Lampe auf dem Tisch.', 'Ich stelle die Lampe auf den Tisch.', 'Wohin stelle ich sie? Das Ziel mit „auf“ verlangt den Akkusativ.'],
  ]],
  ['A2-3.7', [
    ['Ich suche eine Wohnung mit einen Balkon.', 'Ich suche eine Wohnung mit einem Balkon.', 'Nach „mit“ folgt der Dativ.'],
    ['Die Wohnung ist ab der erste November frei.', 'Die Wohnung ist ab dem ersten November frei.', 'Bei diesem Datum nach „ab“: dem ersten November.'],
  ]],
  ['A2-3.8', [
    ['Ich hätte gern ein Suppe.', 'Ich hätte gern eine Suppe.', '„Suppe“ ist feminin: eine Suppe.'],
    ['Können Sie mir bitte die Rechnung zu bringen?', 'Können Sie mir bitte die Rechnung bringen?', 'Nach „können“ steht der Infinitiv ohne „zu“.'],
  ]],
  ['A2-4.9', [
    ['Letzten Sommer habe ich nach Hamburg gefahren.', 'Letzten Sommer bin ich nach Hamburg gefahren.', 'Die Ortsveränderung mit „fahren“ bildet das Perfekt mit „sein“.'],
    ['Wir haben ein Museum gebesucht.', 'Wir haben ein Museum besucht.', 'Verben mit „be-“ bilden das Partizip ohne zusätzliches „ge-“.'],
  ]],
  ['A2-4.10', [
    ['Gestern wir haben die Altstadt besichtigt.', 'Gestern haben wir die Altstadt besichtigt.', 'Nach „Gestern“ steht „haben“ an zweiter Position.'],
    ['Wir sind mit dem Bus zum Museum gefahrt.', 'Wir sind mit dem Bus zum Museum gefahren.', 'Das Partizip von „fahren“ heißt „gefahren“.'],
  ]],
  ['A2-4.11', [
    ['Der Zug ist schneller wie der Bus.', 'Der Zug ist schneller als der Bus.', 'Ein Unterschied mit Komparativ wird mit „als“ verglichen.'],
    ['Ich fahre mit den Zug zur Arbeit.', 'Ich fahre mit dem Zug zur Arbeit.', '„Mit“ verlangt den Dativ: mit dem Zug.'],
  ]],
  ['A2-5.12', [
    ['Ich möchte eine Ärztin werden, weil ich will Menschen helfen.', 'Ich möchte eine Ärztin werden, weil ich Menschen helfen will.', 'Im Nebensatz steht das Modalverb „will“ am Ende.'],
    ['Für diesen Beruf muss ich viel zu lernen.', 'Für diesen Beruf muss ich viel lernen.', 'Nach „muss“ steht der Infinitiv ohne „zu“.'],
  ]],
  ['A2-5.13', [
    ['Ich interessiere mich an dieser Stelle.', 'Ich interessiere mich für diese Stelle.', 'Die Verbindung lautet „sich für etwas interessieren“.'],
    ['Können Sie mir sagen, wann beginnt die Arbeit?', 'Können Sie mir sagen, wann die Arbeit beginnt?', 'In der indirekten Frage steht das Verb am Ende.'],
  ]],
  ['A2-5.14', [
    ['Ich arbeite seit drei Jahre in einem Hotel.', 'Ich arbeite seit drei Jahren in einem Hotel.', '„Seit“ verlangt den Dativ; im Plural: drei Jahren.'],
    ['Nächstes Jahr ich möchte eine Ausbildung beginnen.', 'Nächstes Jahr möchte ich eine Ausbildung beginnen.', 'Nach der Zeitangabe steht das Verb an zweiter Position.'],
  ]],
  ['A2-6.15', [
    ['Ich spiele seit zwei Monate Basketball.', 'Ich spiele seit zwei Monaten Basketball.', '„Seit“ verlangt den Dativ: zwei Monaten.'],
    ['Basketball gefällt mich sehr.', 'Basketball gefällt mir sehr.', 'Die Person steht bei „gefallen“ im Dativ: mir.'],
  ]],
  ['A2-6.16', [
    ['Ich entspanne nach der Arbeit mich.', 'Ich entspanne mich nach der Arbeit.', 'Das Reflexivpronomen steht hier direkt nach dem Verb.'],
    ['Ich gehe spazieren, weil das hilft mir.', 'Ich gehe spazieren, weil das mir hilft.', 'Nach „weil“ steht „hilft“ am Ende.'],
  ]],
  ['A2-6.17', [
    ['Ich habe seit zwei Tagen einen starke Husten.', 'Ich habe seit zwei Tagen einen starken Husten.', 'Nach „einen“ bekommt das Adjektiv hier die Endung „-en“.'],
    ['Wie oft ich soll das Mittel nehmen?', 'Wie oft soll ich das Mittel nehmen?', 'In der direkten Frage steht das konjugierte Verb vor dem Subjekt.'],
  ]],
  ['A2-7.18', [
    ['Ich rufe an, weil meine Karte funktioniert nicht.', 'Ich rufe an, weil meine Karte nicht funktioniert.', 'Im weil-Satz steht „funktioniert“ am Ende.'],
    ['Können Sie bitte meine Karte zu sperren?', 'Können Sie bitte meine Karte sperren?', 'Nach „können“ steht der Infinitiv ohne „zu“.'],
    ['Ich habe meine Karte in meine Jacke gefunden.', 'Ich habe meine Karte in meiner Jacke gefunden.', 'Wo war die Karte? Der Ort steht hier im Dativ.'],
  ]],
  ['A2-7.19', [
    ['Ich bezahle bar denn mit Karte.', 'Ich bezahle bar oder mit Karte.', '„oder“ verbindet Alternativen; „denn“ leitet eine Begründung ein.'],
    ['Ich kaufe online, denn ist es bequem.', 'Ich kaufe online, denn es ist bequem.', 'Nach „denn“ bleibt die normale Hauptsatzstellung: Subjekt + Verb.'],
    ['Ich gehe ins Geschäft, denn ich die Schuhe anprobieren möchte.', 'Ich gehe ins Geschäft, denn ich möchte die Schuhe anprobieren.', '„denn“ verschiebt das finite Verb nicht ans Satzende – anders als „weil“.'],
  ]],
  ['A2-7.20', [
    ['Ich möchte die Jacke umtauschen, weil sie ist zu klein.', 'Ich möchte die Jacke umtauschen, weil sie zu klein ist.', 'Im weil-Satz steht „ist“ am Ende.'],
    ['Ich habe den Kassenbon mitgebringt.', 'Ich habe den Kassenbon mitgebracht.', 'Das Partizip von „mitbringen“ heißt „mitgebracht“.'],
  ]],
  ['A2-8.21', [
    ['Wir könnten am Samstag zum See zu fahren.', 'Wir könnten am Samstag zum See fahren.', 'Nach „könnten“ steht der Infinitiv ohne „zu“.'],
    ['Wenn es regnet, wir gehen ins Café.', 'Wenn es regnet, gehen wir ins Café.', 'Nach dem vorangestellten Nebensatz beginnt der Hauptsatz mit dem Verb.'],
  ]],
  ['A2-8.22', [
    ['Ich habe einen Termin um Montag.', 'Ich habe einen Termin am Montag.', 'Bei Wochentagen verwenden wir „am“.'],
    ['Am Donnerstag ich habe Zeit.', 'Am Donnerstag habe ich Zeit.', 'Nach „Am Donnerstag“ folgt das konjugierte Verb.'],
  ]],
  ['A2-9.23', [
    ['Ich fahre mit dem Bus, weil das ist bequem.', 'Ich fahre mit dem Bus, weil das bequem ist.', 'Im weil-Satz steht das Verb am Ende.'],
    ['Ich brauche dreißig Minuten für zur Arbeit.', 'Ich brauche dreißig Minuten zur Arbeit.', 'Für den Arbeitsweg genügt hier „zur Arbeit“; „für zur“ passt nicht.'],
  ]],
  ['A2-9.24', [
    ['Wir planen, im Sommer nach Hamburg fahren.', 'Wir planen, im Sommer nach Hamburg zu fahren.', 'Nach „planen“ folgt hier ein Infinitiv mit „zu“.'],
    ['Wir möchten in die Schweiz zu reisen.', 'Wir möchten in die Schweiz reisen.', 'Nach „möchten“ folgt der Infinitiv ohne „zu“.'],
  ]],
  ['A2-9.25', [
    ['Jeden Morgen ich stehe um sechs Uhr auf.', 'Jeden Morgen stehe ich um sechs Uhr auf.', 'Das konjugierte Verb steht an zweiter Position; „auf“ steht am Ende.'],
    ['Nach dem Frühstück ich fahre zur Arbeit.', 'Nach dem Frühstück fahre ich zur Arbeit.', 'Die Zeitangabe besetzt die erste Position; danach folgt das Verb.'],
  ]],
  ['A2-10.26', [
    ['Ich freue auf den Besuch.', 'Ich freue mich auf den Besuch.', '„Sich freuen“ braucht hier das Reflexivpronomen „mich“.'],
    ['Ich bin traurig, weil meine Freundin ist weggezogen.', 'Ich bin traurig, weil meine Freundin weggezogen ist.', 'Im weil-Satz steht das Hilfsverb am Ende.'],
  ]],
  ['A2-10.27', [
    ['Kannst du mir sagen, wann beginnt der Onlinekurs?', 'Kannst du mir sagen, wann der Onlinekurs beginnt?', 'Bei einer indirekten Frage steht das Verb am Ende.'],
    ['Ich habe dir gestern eine Nachricht geschreibt.', 'Ich habe dir gestern eine Nachricht geschrieben.', 'Das Partizip von „schreiben“ heißt „geschrieben“.'],
  ]],
  ['A2-10.28', [
    ['Nächstes Jahr ich werde eine Ausbildung machen.', 'Nächstes Jahr werde ich eine Ausbildung machen.', 'Nach der Zeitangabe steht „werde“ an zweiter Position.'],
    ['Ich hoffe, dass ich finde eine gute Stelle.', 'Ich hoffe, dass ich eine gute Stelle finde.', 'Im dass-Satz steht das konjugierte Verb am Ende.'],
  ]],
  ['B1-1.1', [
    ['Wenn ich mehr Zeit hätte, ich würde eine Weltreise machen.', 'Wenn ich mehr Zeit hätte, würde ich eine Weltreise machen.', 'Nach dem vorangestellten wenn-Satz folgt das konjugierte Verb des Hauptsatzes.'],
    ['Ich würde gern am Meer wohnen würde.', 'Ich würde gern am Meer wohnen.', '„Würde“ wird nicht am Satzende wiederholt; dort steht der Infinitiv.'],
  ]],
  ['B1-1.2', [
    ['Eine Freundin ist jemand, der ich vertrauen kann.', 'Eine Freundin ist jemand, dem ich vertrauen kann.', '„Vertrauen“ verlangt den Dativ: jemandem vertrauen.'],
    ['Ich freue mich darauf, meine Freunde wiedersehen.', 'Ich freue mich darauf, meine Freunde wiederzusehen.', 'Im Infinitiv mit „zu“ wird das trennbare Verb zu „wiederzusehen“.'],
  ]],
  ['B1-1.3', [
    ['Nachdem sie die Prüfung bestanden hatte, sie bekam die Stelle.', 'Nachdem sie die Prüfung bestanden hatte, bekam sie die Stelle.', 'Nach dem vorangestellten nachdem-Satz folgt das Verb des Hauptsatzes.'],
    ['Sie hat sich gut auf das Gespräch vorbereiten.', 'Sie hat sich gut auf das Gespräch vorbereitet.', 'Im Perfekt steht das Partizip „vorbereitet“, nicht der Infinitiv „vorbereiten“.'],
  ]],
  ['B1-2.4', [
    ['Ich suche eine Wohnung, die Miete nicht zu hoch ist.', 'Ich suche eine Wohnung, deren Miete nicht zu hoch ist.', 'Die Miete gehört zur Wohnung: „deren Miete“.'],
    ['Die Wohnung, die ich interessiere mich für, liegt zentral.', 'Die Wohnung, für die ich mich interessiere, liegt zentral.', 'Die Präposition steht vor dem Relativpronomen; das Verb steht am Ende.'],
  ]],
  ['B1-2.5', [
    ['Könnten Sie mir sagen, wie hoch sind die Nebenkosten?', 'Könnten Sie mir sagen, wie hoch die Nebenkosten sind?', 'Die indirekte Frage hat Verbendstellung.'],
    ['Ich würde gern wissen, ob ist die Küche vorhanden.', 'Ich würde gern wissen, ob die Küche vorhanden ist.', 'Nach „ob“ steht das konjugierte Verb am Ende.'],
  ]],
  ['B1-2.6', [
    ['Obwohl die Mieten hoch sind, ich wohne gern in der Stadt.', 'Obwohl die Mieten hoch sind, wohne ich gern in der Stadt.', 'Der obwohl-Satz besetzt die erste Position; danach folgt das Verb.'],
    ['Auf dem Land ist es ruhiger als wie in der Stadt.', 'Auf dem Land ist es ruhiger als in der Stadt.', 'Beim Komparativ steht nur „als“, nicht „als wie“.'],
  ]],
  ['B1-3.7', [
    ['Ich koche selbst, damit weniger Geld auszugeben.', 'Ich koche selbst, um weniger Geld auszugeben.', 'Bei gleichem Subjekt passt „um … zu“; „damit“ braucht einen vollständigen Nebensatz.'],
    ['Obwohl Fast Food praktisch ist, aber koche ich lieber selbst.', 'Obwohl Fast Food praktisch ist, koche ich lieber selbst.', '„Obwohl“ verbindet die Sätze bereits; ein zusätzliches „aber“ passt hier nicht.'],
  ]],
  ['B1-3.8', [
    ['Der Arzt empfiehlt mir, dass mehr zu schlafen.', 'Der Arzt empfiehlt mir, mehr zu schlafen.', 'Hier folgt eine Infinitivgruppe mit „zu“, ohne „dass“.'],
    ['Ich bewege mich regelmäßig, damit ich bleibe gesund.', 'Ich bewege mich regelmäßig, damit ich gesund bleibe.', 'Im damit-Satz steht das Verb am Ende.'],
  ]],
  ['B1-3.9', [
    ['Ich versuche, nach der Arbeit mein Handy ausschalten.', 'Ich versuche, nach der Arbeit mein Handy auszuschalten.', 'Nach „versuchen“ folgt ein Infinitiv mit „zu“: auszuschalten.'],
    ['Je länger ich arbeite, desto ich bin müder.', 'Je länger ich arbeite, desto müder bin ich.', 'Nach „desto“ folgen hier Komparativ und Verb: desto müder bin ich.'],
  ]],
  ['B1-4.10', [
    ['Seitdem ich weniger online bin, ich schlafe besser.', 'Seitdem ich weniger online bin, schlafe ich besser.', 'Nach dem seitdem-Satz beginnt der Hauptsatz mit dem Verb.'],
    ['Ich mache eine Pause, ohne mein Handy benutzen.', 'Ich mache eine Pause, ohne mein Handy zu benutzen.', 'Die Verbindung lautet „ohne … zu“ plus Infinitiv.'],
  ]],
  ['B1-4.11', [
    ['Wir lösen die Aufgabe, indem wir teilen die Rollen auf.', 'Wir lösen die Aufgabe, indem wir die Rollen aufteilen.', 'Im indem-Satz steht das trennbare Verb zusammen am Ende.'],
    ['Jeder im Team muss seine Ideen zu erklären.', 'Jeder im Team muss seine Ideen erklären.', 'Nach dem Modalverb „muss“ folgt der Infinitiv ohne „zu“.'],
  ]],
  ['B1-4.12', [
    ['Als wir im Wald waren, es begann zu regnen.', 'Als wir im Wald waren, begann es zu regnen.', 'Nach dem als-Satz folgt das Verb des Hauptsatzes.'],
    ['Wir nahmen eine Karte mit, um wir den Weg finden.', 'Wir nahmen eine Karte mit, um den Weg zu finden.', '„Um … zu“ hat hier kein eigenes Subjekt und ein Verb im Infinitiv.'],
  ]],
  ['B1-4.13', [
    ['Der Film handelt über eine Familie.', 'Der Film handelt von einer Familie.', 'Die feste Verbindung lautet „handeln von“ plus Dativ.'],
    ['Die Schauspielerin, die spielt die Hauptrolle, überzeugt mich.', 'Die Schauspielerin, die die Hauptrolle spielt, überzeugt mich.', 'Im Relativsatz steht das Verb am Ende.'],
  ]],
  ['B1-5.14', [
    ['Einerseits ist Online-Lernen flexibel, andererseits es fehlt der Kontakt.', 'Einerseits ist Online-Lernen flexibel, andererseits fehlt der Kontakt.', 'Nach „andererseits“ steht das konjugierte Verb an zweiter Position.'],
    ['Ich lerne besser, wenn ich kann Fragen direkt stellen.', 'Ich lerne besser, wenn ich Fragen direkt stellen kann.', 'Im wenn-Satz steht das Modalverb am Ende.'],
  ]],
  ['B1-5.15', [
    ['Im Homeoffice ich spare den Arbeitsweg.', 'Im Homeoffice spare ich den Arbeitsweg.', 'Nach der Ortsangabe steht das Verb an zweiter Position.'],
    ['Ich trenne Arbeit und Freizeit, indem ich schalte den Computer aus.', 'Ich trenne Arbeit und Freizeit, indem ich den Computer ausschalte.', 'Im indem-Satz steht „ausschalte“ zusammen am Ende.'],
  ]],
  ['B1-5.16', [
    ['Vor der Prüfung habe ich Angst zu Fehlern.', 'Vor der Prüfung habe ich Angst vor Fehlern.', 'Die Verbindung lautet „Angst vor“ plus Dativ.'],
    ['Ich atme ruhig, um ich mich besser konzentrieren kann.', 'Ich atme ruhig, damit ich mich besser konzentrieren kann.', 'Mit eigenem Subjekt und Modalverb verwenden wir hier „damit“.'],
  ]],
  ['B1-5.17', [
    ['Ich merke mir Wörter, indem ich wiederhole sie laut.', 'Ich merke mir Wörter, indem ich sie laut wiederhole.', 'Im indem-Satz steht das Verb am Ende.'],
    ['Es hilft mir, jeden Tag ein bisschen lernen.', 'Es hilft mir, jeden Tag ein bisschen zu lernen.', 'Nach „Es hilft mir“ folgt hier eine Infinitivgruppe mit „zu“.'],
  ]],
  ['B1-6.18', [
    ['Ich mache ein Praktikum, um ich Erfahrungen sammle.', 'Ich mache ein Praktikum, um Erfahrungen zu sammeln.', 'Bei gleichem Subjekt verwenden wir „um … zu“ ohne zweites Subjekt.'],
    ['Ich besuche einen Kurs, um meine Chancen verbessern.', 'Ich besuche einen Kurs, um meine Chancen zu verbessern.', 'Vor dem Infinitiv fehlt „zu“.'],
  ]],
  ['B1-6.19', [
    ['Ich bewerbe mich an die Stelle als Verkäufer.', 'Ich bewerbe mich um die Stelle als Verkäufer.', 'Die Verbindung lautet „sich um eine Stelle bewerben“.'],
    ['Könnten Sie mir sagen, welche Aufgaben gehören zur Stelle?', 'Könnten Sie mir sagen, welche Aufgaben zur Stelle gehören?', 'In der indirekten Frage steht das Verb am Ende.'],
  ]],
  ['B1-6.20', [
    ['Für diesen Beruf werden eine abgeschlossene Ausbildung verlangt.', 'Für diesen Beruf wird eine abgeschlossene Ausbildung verlangt.', 'Das Subjekt „eine abgeschlossene Ausbildung“ ist Singular; deshalb heißt es „wird“.'],
    ['Die Auszubildenden müssen eine Prüfung zu bestehen.', 'Die Auszubildenden müssen eine Prüfung bestehen.', 'Nach „müssen“ steht der Infinitiv ohne „zu“.'],
  ]],
  ['B1-7.21', [
    ['In einer WG ist es wichtig, dass jeder übernimmt Aufgaben.', 'In einer WG ist es wichtig, dass jeder Aufgaben übernimmt.', 'Im dass-Satz steht das Verb am Ende.'],
    ['Die Person, mit die ich zusammenwohne, ist zuverlässig.', 'Die Person, mit der ich zusammenwohne, ist zuverlässig.', '„Mit“ verlangt den Dativ: mit der Person.'],
  ]],
  ['B1-7.22', [
    ['Mir ist wichtig, dass mein Partner hört mir zu.', 'Mir ist wichtig, dass mein Partner mir zuhört.', 'Im dass-Satz steht das trennbare Verb zusammen am Ende.'],
    ['Wir sprechen offen, statt unsere Probleme ignorieren.', 'Wir sprechen offen, statt unsere Probleme zu ignorieren.', 'Die Infinitivgruppe lautet hier „statt … zu“.'],
  ]],
  ['B1-7.23', [
    ['Ich freue mich darüber, dich kennenzulernen dich.', 'Ich freue mich darüber, dich kennenzulernen.', 'Das Objekt „dich“ steht nur einmal vor dem Infinitiv.'],
    ['Wenn ich nervös bin, ich stelle einfache Fragen.', 'Wenn ich nervös bin, stelle ich einfache Fragen.', 'Nach dem wenn-Satz beginnt der Hauptsatz mit dem Verb.'],
  ]],
  ['B1-8.24', [
    ['Ich kaufe weniger, damit Müll zu vermeiden.', 'Ich kaufe weniger, um Müll zu vermeiden.', 'Bei gleichem Subjekt passt „um … zu“; „damit“ braucht einen vollständigen Nebensatz.'],
    ['Obwohl die Jacke noch gut ist, aber kauft er eine neue.', 'Obwohl die Jacke noch gut ist, kauft er eine neue.', '„Obwohl“ verbindet die Sätze; das zusätzliche „aber“ entfällt.'],
  ]],
  ['B1-8.25', [
    ['Die Ware, die ich habe bestellt, ist beschädigt.', 'Die Ware, die ich bestellt habe, ist beschädigt.', 'Im Relativsatz steht das Hilfsverb am Ende.'],
    ['Ich bitte Sie, mir den Kaufpreis erstatten.', 'Ich bitte Sie, mir den Kaufpreis zu erstatten.', 'Nach „bitten“ folgt hier eine Infinitivgruppe mit „zu“.'],
  ]],
  ['B1-9.26', [
    ['Unser Zug fiel aus, deshalb wir kamen zu spät.', 'Unser Zug fiel aus, deshalb kamen wir zu spät.', 'Nach „deshalb“ folgt das konjugierte Verb.'],
    ['Können Sie mir sagen, wo fährt der Ersatzbus ab?', 'Können Sie mir sagen, wo der Ersatzbus abfährt?', 'In der indirekten Frage steht das trennbare Verb zusammen am Ende.'],
  ]],
  ['B1-10.27', [
    ['Ich spare Strom, indem ich mache das Licht aus.', 'Ich spare Strom, indem ich das Licht ausmache.', 'Im indem-Satz steht das trennbare Verb zusammen am Ende.'],
    ['Wir nehmen eigene Taschen mit, um Plastik vermeiden.', 'Wir nehmen eigene Taschen mit, um Plastik zu vermeiden.', 'Die Verbindung lautet „um … zu“ plus Infinitiv.'],
  ]],
  ['B1-10.28', [
    ['Je öfter wir das Fahrrad nehmen, desto wir verbrauchen weniger Benzin.', 'Je öfter wir das Fahrrad nehmen, desto weniger Benzin verbrauchen wir.', 'Nach „desto“ stehen hier Vergleichsausdruck und Verb vor dem Subjekt.'],
    ['Wir fahren mit der Bahn, obwohl es dauert länger.', 'Wir fahren mit der Bahn, obwohl es länger dauert.', 'Im obwohl-Satz steht das Verb am Ende.'],
  ]],
];

export const A2_B1_COMMON_MISTAKES = Object.freeze(Object.fromEntries(entries.map(([key, rows]) => [key,
  Object.freeze(rows.map(([prompt, answer, note], index) => Object.freeze({
    id: `${key}-mistake-${index + 1}`, label: `Fehler ${index + 1}`, prompt, answer,
    answerLabel: 'So ist es richtig', note,
  }))),
])));

export function getA2B1CommonMistakes(assignmentId = '') {
  return A2_B1_COMMON_MISTAKES[String(assignmentId).trim().toUpperCase()] || [];
}
