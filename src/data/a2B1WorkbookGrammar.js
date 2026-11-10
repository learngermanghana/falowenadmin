// Classroom summaries of the Campus Grammar tab, keyed by level and curriculum day.
// Source: falowenexamtrainer@d886181, web/src/components/A2B1WorkbookGrammarNotesContent.js.
// Each entry contains a title, rule/example pairs and one ungraded oral check.
const A2 = {
  1: ["weil, denn und deshalb", [
    ["weil · Grund", "Im Nebensatz mit weil steht das konjugierte Verb am Ende.", "Ich lerne Deutsch, weil ich in Berlin arbeite."],
    ["denn · Grund", "Nach denn bleibt die normale Hauptsatzstellung.", "Ich lerne Deutsch, denn ich arbeite in Berlin."],
    ["deshalb · Folge", "Beginnt der Hauptsatz mit deshalb, folgt direkt das konjugierte Verb.", "Ich arbeite in Berlin. Deshalb lerne ich Deutsch."],
  ], ["Verbinde mit weil: Ich bin müde. Ich habe wenig geschlafen.", "Ich bin müde, weil ich wenig geschlafen habe."]],
  3: ["Vergleiche mit wie und als", [
    ["Gleichheit", "genauso + Grundform des Adjektivs + wie", "Mia ist genauso groß wie Lea."],
    ["Unterschied", "Komparativ + als. Der Komparativ endet oft auf -er.", "Mia ist größer als Tom."],
    ["Höchste Stufe", "Verwende zum Beispiel am + Adjektiv mit -(e)sten. Merke: gut, besser, am besten.", "Lea läuft am schnellsten."],
  ], ["Vergleiche mit größer: Tom ist 1,70 m groß. Lea ist 1,80 m groß.", "Lea ist größer als Tom."]],
  4: ["Treffpunkt und Richtung · wo oder wohin?", [
    ["Wo? · Ort", "Bei Wechselpräpositionen steht der Ort im Dativ. an dem → am, in dem → im.", "Wir treffen uns am Bahnhof."],
    ["Wohin? · Ziel", "Bei Wechselpräpositionen steht das Ziel im Akkusativ. in das → ins.", "Wir gehen ins Kino."],
  ], ["Ergänze: Wir sind ___ Kino. Danach gehen wir ___ Café.", "Wir sind im Kino. Danach gehen wir ins Café."]],
  5: ["Trennbare Verben in der Freizeit", [
    ["Hauptsatz", "Das konjugierte Verb steht an Position 2. Die Vorsilbe steht am Ende.", "Am Wochenende gehe ich gern aus."],
    ["Mit Modalverb", "Das Modalverb steht an Position 2. Der ganze Infinitiv steht am Ende.", "Ich möchte heute Abend ausgehen."],
  ], ["Bilde einen Satz mit anrufen: Heute / ich / meine Freundin.", "Heute rufe ich meine Freundin an."]],
  6: ["Wechselpräpositionen bei Möbeln und Räumen", [
    ["Wo? · Dativ", "Für einen festen Ort steht der Dativ nach Präpositionen wie auf, an und neben.", "Die Lampe steht neben dem Sofa."],
    ["Wohin? · Akkusativ", "Für das Ziel der Bewegung steht der Akkusativ. Nutze zum Beispiel stellen, legen oder hängen.", "Ich stelle die Lampe neben das Sofa."],
  ], ["Ergänze: Das Buch liegt auf ___ Tisch. Ich lege es auf ___ Tisch.", "Das Buch liegt auf dem Tisch. Ich lege es auf den Tisch."]],
  7: ["Relativsätze · Nominativ und Akkusativ", [
    ["Bezugswort und Kasus", "Genus und Zahl kommen vom Nomen. Der Kasus hängt von der Rolle des Pronomens im Relativsatz ab.", "Das ist der Balkon, der mir gefällt."],
    ["Relativpronomen", "Nominativ: der, die, das, die. Akkusativ: den, die, das, die.", "Das ist der Balkon, den wir gesehen haben."],
    ["Satzbau", "Setze ein Komma vor den Relativsatz. Das konjugierte Verb steht am Ende.", "Ich suche eine Wohnung, die einen Balkon hat."],
  ], ["Verbinde: Das ist der Vermieter. Ich habe den Vermieter angerufen.", "Das ist der Vermieter, den ich angerufen habe."]],
  8: ["Höflich bestellen und bitten", [
    ["Wunsch", "Mit ich möchte + Akkusativ bestellst du höflich. Einen zusätzlichen Infinitiv setzt du ans Ende.", "Ich möchte einen Tee bestellen."],
    ["Bitte", "Eine höfliche Ja-/Nein-Frage beginnt mit Könnten Sie. Der Infinitiv steht am Ende.", "Könnten Sie mir bitte die Rechnung bringen?"],
    ["Problem", "Beginne mit Entschuldigung und erkläre das Problem kurz.", "Entschuldigung, die Suppe ist leider kalt."],
  ], ["Bitte höflich um die Speisekarte. Beginne mit Könnten Sie …", "Könnten Sie mir bitte die Speisekarte bringen?"]],
  9: ["Perfekt · Urlaub und Erlebnisse", [
    ["Satzklammer", "Im Hauptsatz steht haben oder sein an Position 2. Das Partizip II steht am Ende.", "Wir haben im Hotel übernachtet."],
    ["haben oder sein?", "Die meisten Verben bilden das Perfekt mit haben. Viele Verben der Ortsveränderung und bleiben verwenden sein.", "Wir sind nach Berlin gefahren."],
    ["Partizip II", "Viele regelmäßige Formen haben ge- und -t. Verben auf -ieren haben kein ge-.", "Ich habe am Strand fotografiert."],
  ], ["Setze ins Perfekt: Wir fahren nach Hamburg.", "Wir sind nach Hamburg gefahren."]],
  10: ["Präteritum · Vergangenes erzählen", [
    ["Regelmäßige Verben", "Das Präteritum regelmäßiger Verben bildet man mit dem Stamm und -te. Starke Verben ändern oft den Stamm.", "Ich besuchte ein Museum. Danach ging ich ins Café."],
    ["sein und haben", "Die Formen war und hatte sind auch im Gespräch häufig.", "Das Wetter war gut. Wir hatten viel Zeit."],
  ], ["Setze ins Präteritum: Die Stadt ist schön und wir haben Zeit.", "Die Stadt war schön und wir hatten Zeit."]],
  11: ["Verkehrsmittel vergleichen", [
    ["Komparativ", "Vergleiche zwei Verkehrsmittel mit Komparativ + als.", "Der Zug ist schneller als der Bus."],
    ["Superlativ", "Verwende am + -(e)sten für den höchsten Grad. Merke: viel, mehr, am meisten.", "Mit dem Fahrrad bin ich am günstigsten unterwegs."],
  ], ["Der Bus kostet weniger als das Taxi. Formuliere mit günstiger.", "Der Bus ist günstiger als das Taxi."]],
  12: ["Traumberuf · Modalverben, weil und dass", [
    ["Modalverben", "möchte und will drücken einen Wunsch aus, kann eine Fähigkeit. Der zweite Infinitiv steht am Ende.", "Ich möchte später als Ärztin arbeiten."],
    ["weil und dass", "weil nennt einen Grund. dass leitet etwa nach ich glaube eine Aussage ein. In beiden Nebensätzen steht das Verb am Ende.", "Ich möchte Ärztin werden, weil ich gern Menschen helfe. Ich glaube, dass der Beruf gut zu mir passt."],
  ], ["Verbinde: Ich möchte Koch werden. Ich koche gern. Verwende weil.", "Ich möchte Koch werden, weil ich gern koche."]],
  13: ["Modalverben im Präteritum", [
    ["Formen", "können → konnte, müssen → musste, wollen → wollte, dürfen → durfte, sollen → sollte.", "In meiner letzten Stelle musste ich früh anfangen."],
    ["Satzklammer", "Das konjugierte Modalverb steht an Position 2, der Infinitiv am Ende.", "Im Praktikum konnte ich im Team arbeiten."],
  ], ["Erzähle vom Praktikum im Präteritum: Ich muss Kunden beraten.", "Ich musste Kunden beraten."]],
  14: ["Ein Ziel ausdrücken · um … zu und damit", [
    ["Gleiches Subjekt", "Mit um … zu erklärst du den Zweck, wenn dieselbe Person beide Handlungen ausführt. Setze ein Komma vor um.", "Ich mache einen Kurs, um meine Chancen zu verbessern."],
    ["Anderes Subjekt", "Mit damit kannst du ein eigenes Subjekt nennen. Das konjugierte Verb steht am Ende.", "Meine Kollegin hilft mir, damit ich die Prüfung bestehe."],
  ], ["Verbinde mit um … zu: Ich lerne Deutsch. Ich möchte in Deutschland arbeiten.", "Ich lerne Deutsch, um in Deutschland zu arbeiten."]],
  15: ["seit + Dativ · Wie lange schon?", [
    ["seit · dauert bis heute", "Nach seit steht der Dativ. Für etwas, das noch andauert, verwenden wir das Präsens.", "Ich spiele seit einem Jahr Tennis."],
    ["vor · Zeitpunkt in der Vergangenheit", "Mit vor sagst du, wann etwas passiert ist.", "Vor einem Jahr habe ich mit Tennis angefangen."],
  ], ["Ergänze: Ich spiele ___ zwei Jahren Fußball. Ich habe ___ zwei Jahren angefangen.", "Ich spiele seit zwei Jahren Fußball. Ich habe vor zwei Jahren angefangen."]],
  16: ["Reflexive Verben · Wohlbefinden", [
    ["Pronomen", "Bei sich entspannen: ich → mich, du → dich, er/sie → sich, wir → uns, ihr → euch, sie/Sie → sich.", "Nach der Arbeit entspanne ich mich."],
    ["Mit Modalverb", "Das Reflexivpronomen bleibt im Satz. Der Infinitiv steht am Ende.", "Ich möchte mich heute ausruhen."],
  ], ["Ergänze das Pronomen: Wir möchten ___ am Wochenende erholen.", "Wir möchten uns am Wochenende erholen."]],
  17: ["Modalverben in der Apotheke", [
    ["können · Möglichkeit oder Bitte", "In der Ja-/Nein-Frage steht das Modalverb zuerst. Der Infinitiv steht am Ende.", "Können Sie mir etwas gegen Husten empfehlen?"],
    ["müssen und sollen", "müssen zeigt eine Notwendigkeit. sollen gibt zum Beispiel eine Empfehlung oder Anweisung wieder.", "Ich muss das Medikament täglich nehmen. Sie sollen viel trinken."],
  ], ["Frage nach einer Empfehlung mit sollen: Wie oft / ich / das Medikament nehmen?", "Wie oft soll ich das Medikament nehmen?"]],
  18: ["Höfliche Fragen und Bitten am Telefon", [
    ["Wunsch", "Mit ich möchte, ich hätte gern oder ich würde gern formulierst du einen höflichen Wunsch.", "Ich würde gern einen Termin vereinbaren."],
    ["Bitte und Frage", "Für eine Ja-/Nein-Frage steht Könnten Sie am Anfang. Bei einer W-Frage folgt das Verb auf das Fragewort.", "Könnten Sie mir bitte helfen? Wann kann ich vorbeikommen?"],
  ], ["Bitte höflich um einen Rückruf. Beginne mit Könnten Sie …", "Könnten Sie mich bitte zurückrufen?"]],
  19: ["Alternativen mit oder und Gründe mit denn", [
    ["oder · Auswahl", "oder verbindet Alternativen. Bei zwei Hauptsätzen bleibt die normale Wortstellung.", "Ich kaufe im Geschäft ein oder ich bestelle online."],
    ["entweder … oder", "Markiere zwei Alternativen. Gleiche Satzteile können einmal stehen.", "Ich kaufe entweder im Supermarkt oder auf dem Markt ein."],
    ["denn · Grund", "denn nennt einen Grund. Danach bleibt die Hauptsatzstellung.", "Ich kaufe auf dem Markt ein, denn das Obst ist frisch."],
  ], ["Ergänze oder oder denn: Ich kaufe hier ein, ___ die Preise sind gut.", "Ich kaufe hier ein, denn die Preise sind gut."]],
  20: ["Höflich reklamieren · Bitten und Gründe", [
    ["Problem erklären", "Mit weil steht das konjugierte Verb am Ende. Mit denn bleibt es im Hauptsatz an Position 2.", "Ich möchte das Gerät zurückgeben, weil es nicht funktioniert."],
    ["Lösung erfragen", "Könnten Sie …? und Ich hätte gern … helfen bei höflichen Bitten.", "Könnten Sie das Gerät bitte umtauschen?"],
  ], ["Bitte mit Könnten Sie um Hilfe und nenne den Grund mit weil.", "Könnten Sie mir bitte helfen? Ich reklamiere das Gerät, weil es nicht funktioniert."]],
  21: ["Wochenendpläne · wenn, falls und ob", [
    ["wenn und falls · Bedingung", "wenn nennt eine Bedingung. falls betont, dass etwas möglicherweise passiert. Das Verb steht am Ende des Nebensatzes.", "Falls es regnet, gehen wir ins Museum."],
    ["ob · indirekte Ja-/Nein-Frage", "ob leitet eine indirekte Frage ein. Das konjugierte Verb steht am Ende.", "Sag mir bitte, ob du am Samstag Zeit hast."],
  ], ["Formuliere mit ob: Hast du am Samstag Zeit? Ich möchte wissen, …", "Ich möchte wissen, ob du am Samstag Zeit hast."]],
  22: ["Die Woche planen · Präsens und Zeitangaben", [
    ["Zukunft im Präsens", "Eine klare Zeitangabe macht einen Plan im Präsens verständlich. Beginnt der Satz mit der Zeitangabe, folgt das konjugierte Verb.", "Am Montag arbeite ich bis 17 Uhr."],
    ["Pflicht und Möglichkeit", "Mit müssen oder können steht der zweite Infinitiv am Ende.", "Am Dienstag kann ich nach dem Kurs einkaufen."],
  ], ["Beginne mit Am Freitag: Ich muss bis 16 Uhr arbeiten.", "Am Freitag muss ich bis 16 Uhr arbeiten."]],
  23: ["Schul- und Arbeitsweg · mit + Dativ und Zielangaben", [
    ["Wie? · Verkehrsmittel", "mit + Dativ: mit dem Bus, mit der Bahn, mit dem Fahrrad. Bei nehmen steht das Verkehrsmittel im Akkusativ. Beim Gehen sagst du zu Fuß.", "Ich fahre mit dem Bus zur Arbeit. Ich nehme den Bus."],
    ["Wohin? · Ziel", "zu + Dativ: zum Bahnhof, zur Schule. nach bei Städten und Ländern ohne Artikel. in + Akkusativ beim Hineingehen.", "Ich fahre nach Berlin. Ich gehe ins Büro."],
    ["Satzstellung und Grund", "Nach einer Zeitangabe steht das Verb an Position 2. Im weil-Satz steht es am Ende.", "Jeden Morgen fahre ich mit dem Fahrrad zur Schule, weil es schnell ist."],
  ], ["Ergänze: Jeden Morgen fahre ich mit ___ Bahn ___ Arbeit.", "Jeden Morgen fahre ich mit der Bahn zur Arbeit."]],
  24: ["Urlaubspläne · Bedingung, Grund und Zweck", [
    ["wenn und falls", "Beide leiten eine Bedingung ein. Das konjugierte Verb steht am Ende des Nebensatzes.", "Falls es regnet, besuchen wir ein Museum."],
    ["weil · Grund", "Nenne den Grund mit weil. Das konjugierte Verb steht am Ende.", "Wir buchen früh, weil die Zimmer günstig sind."],
    ["um … zu · Zweck", "Für ein Ziel mit demselben Subjekt steht um nach dem Komma und zu vor dem Infinitiv.", "Wir fahren ans Meer, um uns zu erholen."],
  ], ["Verbinde mit um … zu: Wir fahren früh los. Wir möchten Stau vermeiden.", "Wir fahren früh los, um Stau zu vermeiden."]],
  25: ["Tagesablauf · Satzklammer und Zeit zuerst", [
    ["Trennbare Verben", "Im Hauptsatz steht die Vorsilbe am Ende. Das konjugierte Verb bleibt an Position 2, auch nach einer Zeitangabe.", "Um sieben Uhr stehe ich auf."],
    ["Reflexive Verben", "Wähle das passende Reflexivpronomen für das Subjekt.", "Danach ziehe ich mich an."],
  ], ["Beginne mit Um acht Uhr: Ich fange mit der Arbeit an.", "Um acht Uhr fange ich mit der Arbeit an."]],
  26: ["Gefühle ausdrücken · sich fühlen, weil und wenn", [
    ["sich fühlen", "Nutze das passende Reflexivpronomen und ein Adjektiv.", "Ich fühle mich heute nervös."],
    ["weil und wenn", "weil nennt den Grund, wenn die Situation. Das konjugierte Verb steht am Ende des Nebensatzes.", "Ich fühle mich ruhig, weil ich gut vorbereitet bin."],
    ["wenn-Satz zuerst", "Wenn der Nebensatz vorn steht, folgt das Verb des Hauptsatzes direkt nach dem Komma.", "Wenn ich Musik höre, fühle ich mich besser."],
  ], ["Beginne mit Wenn: Ich fühle mich glücklich. Ich sehe meine Freunde.", "Wenn ich meine Freunde sehe, fühle ich mich glücklich."]],
  27: ["Digitale Kommunikation · dass-Sätze", [
    ["Aussage oder Meinung", "Verwende dass zum Beispiel nach ich finde, ich denke oder ich glaube.", "Ich finde, dass Sprachnachrichten praktisch sind."],
    ["Satzbau", "Setze ein Komma vor dass. Das konjugierte Verb steht am Ende des Nebensatzes.", "Ich glaube, dass man online schnell antworten kann."],
  ], ["Verbinde mit dass: Ich denke. Videoanrufe sind praktisch.", "Ich denke, dass Videoanrufe praktisch sind."]],
  28: ["Zukunftspläne · Präsens, möchte und Futur I", [
    ["Zeitangabe + Präsens", "Eine klare Zeitangabe reicht häufig, um über die Zukunft zu sprechen.", "Nächstes Jahr mache ich einen Deutschkurs."],
    ["Wunsch oder Absicht", "Verwende möchte mit dem Infinitiv am Ende.", "Ich möchte später in Deutschland arbeiten."],
    ["Futur I", "Das konjugierte werden steht im Hauptsatz an Position 2, der Infinitiv am Ende.", "Ich werde nächstes Jahr eine Ausbildung beginnen."],
  ], ["Formuliere im Futur I: Ich mache nächstes Jahr einen Deutschkurs.", "Ich werde nächstes Jahr einen Deutschkurs machen."]],
};

const B1 = {
  1: ["Präsens und Perfekt · Träume und Erfahrungen", [
    ["Präsens", "Beschreibe die Gegenwart oder einen Plan mit einer klaren Zeitangabe.", "Nächstes Jahr mache ich eine Ausbildung."],
    ["Perfekt", "Für ein vergangenes Erlebnis steht haben oder sein an Position 2 und das Partizip II am Ende.", "Ich habe schon in einem anderen Land gearbeitet."],
  ], ["Erzähle im Perfekt: Ich reise zum ersten Mal allein.", "Ich bin zum ersten Mal allein gereist."]],
  2: ["Freundschaft · Adjektivendungen und weil-Sätze", [
    ["Adjektive vor Nomen", "Vor dem Nomen hat das Adjektiv eine Endung: ein guter Freund, eine gute Freundin, ein ehrliches Gespräch.", "Eine zuverlässige Freundin hilft mir immer."],
    ["Eigenschaften begründen", "Im weil-Satz steht das konjugierte Verb am Ende. Nach denn gilt Hauptsatzstellung. Nach deshalb folgt direkt das Verb.", "Ich mag meine Freundin, weil sie immer ehrlich ist."],
  ], ["Ergänze die Endung und verbinde mit weil: Lea ist eine zuverlässig___ Freundin. Sie hört gut zu.", "Lea ist eine zuverlässige Freundin, weil sie gut zuhört."]],
  3: ["Adjektivdeklination · Nominativ, Akkusativ und Dativ", [
    ["Nominativ", "Nach ein/eine: ein erfolgreicher Gründer, eine mutige Frau, ein kreatives Team.", "Ein kreatives Team hatte eine gute Idee."],
    ["Akkusativ", "In der männlichen Form steht einen mit -en am Adjektiv. Weibliche und neutrale Form bleiben wie im Nominativ.", "Sie gründete ein kleines Unternehmen und fand einen erfahrenen Partner."],
    ["Dativ", "Nach einem und einer hat das Adjektiv die Endung -en.", "Sie arbeitete mit einem erfahrenen Team."],
  ], ["Ergänze: Sie arbeitet mit ___ (ein / kreativ / Team).", "Sie arbeitet mit einem kreativen Team."]],
  4: ["Wohnungen vergleichen · zweiteilige Konnektoren", [
    ["Eigenschaften ergänzen", "sowohl … als auch und nicht nur … sondern auch verbinden gleichartige Satzteile.", "Die Wohnung ist sowohl hell als auch ruhig."],
    ["Vor- und Nachteile", "zwar … aber und einerseits … andererseits stellen zwei Seiten gegenüber.", "Die Wohnung ist zwar klein, aber sie liegt zentral."],
    ["Auswahl oder doppelte Verneinung", "entweder … oder bietet Alternativen. weder … noch verneint beide Punkte.", "Die Wohnung hat weder einen Balkon noch einen Keller."],
  ], ["Verbinde mit zwar … aber: Die Wohnung ist teuer. Sie liegt zentral.", "Die Wohnung ist zwar teuer, aber sie liegt zentral."]],
  5: ["Besichtigungstermin · Konjunktiv II und indirekte Fragen", [
    ["Höflich fragen oder vorschlagen", "Verwende könnten für eine Bitte, würde gern für einen Wunsch und wäre für einen Vorschlag.", "Könnten wir die Wohnung am Freitag besichtigen?"],
    ["Indirekte Fragen", "Beginne eine indirekte Ja-/Nein-Frage mit ob. Bei einer W-Frage bleibt das Fragewort. Das Verb steht am Ende.", "Könnten Sie mir sagen, wann die Besichtigung beginnt?"],
  ], ["Formuliere indirekt: Ist der Termin noch frei? Könnten Sie mir sagen, …?", "Könnten Sie mir sagen, ob der Termin noch frei ist?"]],
  6: ["Stadt oder Land · vergleichen und abwägen", [
    ["Vergleich", "Für Unterschiede verwendest du den Komparativ mit als.", "Auf dem Land ist es ruhiger als in der Stadt."],
    ["Grund und Gegensatz", "weil und da leiten Nebensätze ein. Nach denn bleibt Hauptsatzstellung. Mit zwar … aber wägt man ab.", "Die Stadt ist zwar lauter, aber man hat dort mehr Möglichkeiten."],
    ["Relativsatz", "Beschreibe einen Ort genauer. Das konjugierte Verb steht am Ende des Relativsatzes.", "Ich suche ein Dorf, das einen Bahnhof hat."],
  ], ["Verbinde mit zwar … aber: Das Dorf ist ruhig. Der Bus fährt selten.", "Das Dorf ist zwar ruhig, aber der Bus fährt selten."]],
  7: ["Genitiv · Gründe und Gegensätze mit wegen und trotz", [
    ["Artikel und Endungen", "Im Genitiv: des beim Maskulinum und Neutrum, der beim Femininum und im Plural. Männliche und neutrale Nomen bekommen häufig -(e)s.", "Der Geschmack des frischen Gemüses ist intensiv."],
    ["wegen · Grund", "Auf wegen folgt in der Standardsprache eine Genitivgruppe. Mit weil formulierst du den Grund als Nebensatz.", "Wegen des hohen Salzgehalts esse ich selten Fast Food."],
    ["trotz · Gegensatz", "Auf trotz folgt in der Standardsprache eine Genitivgruppe. Mit obwohl formulierst du den Gegensatz als Nebensatz.", "Trotz des günstigen Preises koche ich lieber selbst."],
  ], ["Formuliere mit wegen: Ich koche selbst, weil die Preise hoch sind.", "Wegen der hohen Preise koche ich selbst."]],
  8: ["Gesundheit · Modalverben für Rat und Regeln", [
    ["Satzklammer", "Im Hauptsatz steht das konjugierte Modalverb an Position 2. Der Infinitiv steht am Ende.", "Bei Fieber muss man sich ausruhen."],
    ["Bedeutung", "müssen zeigt Notwendigkeit, sollen einen Rat oder Auftrag, können eine Möglichkeit und dürfen eine Erlaubnis.", "Du solltest mehr Wasser trinken. Du darfst das Medikament nur einmal täglich nehmen."],
  ], ["Gib einen Rat mit sollte: mehr schlafen.", "Du solltest mehr schlafen."]],
  9: ["Work-Life-Balance · Zweck, Methode und Gegensatz", [
    ["Zweck", "um … zu passt bei gleichem Subjekt. Mit damit kannst du ein eigenes Subjekt nennen.", "Ich plane Pausen ein, um mich zu erholen."],
    ["Methode und Alternative", "indem nennt die Methode. statt … zu nennt eine Alternative, ohne … zu eine Handlung, die ausbleibt.", "Ich reduziere Stress, indem ich feste Pausen einplane."],
    ["Gegensatz", "obwohl leitet einen Nebensatz ein. Beginnt der Hauptsatz mit trotzdem, folgt das Verb.", "Obwohl ich viel arbeite, mache ich Pausen."],
  ], ["Erkläre die Methode mit indem: Ich reduziere Stress. Ich schalte Benachrichtigungen aus.", "Ich reduziere Stress, indem ich Benachrichtigungen ausschalte."]],
  10: ["Digitale Auszeit · Vergleiche und je … desto", [
    ["Gleichheit und Unterschied", "so … wie vergleicht Gleiches. Komparativ + als zeigt den Unterschied. Am + -(e)sten zeigt die höchste Stufe.", "Ein Spaziergang ist für mich entspannender als eine Stunde am Handy."],
    ["je … desto/umso", "In beiden Teilen steht ein Komparativ. Im je-Satz steht das Verb am Ende, nach der desto-Gruppe folgt das Verb.", "Je weniger Zeit ich online verbringe, desto besser schlafe ich."],
  ], ["Verbinde mit je … desto: Ich mache mehr Pausen. Ich bin konzentrierter.", "Je mehr Pausen ich mache, desto konzentrierter bin ich."]],
  11: ["Zusammenarbeit · einander und sich", [
    ["Gegenseitigkeit", "einander zeigt, dass zwei oder mehr Personen etwas gegenseitig tun. sich kann je nach Kontext reflexiv oder gegenseitig sein.", "Die Teammitglieder helfen einander."],
    ["Mit Präposition", "Präposition und einander werden zusammengeschrieben: miteinander, aufeinander, füreinander.", "Wir hören einander zu und achten aufeinander."],
  ], ["Ersetze sich gegenseitig: Die Spieler unterstützen sich gegenseitig.", "Die Spieler unterstützen einander."]],
  12: ["Naturerlebnisse · Vergangenes und Reihenfolge", [
    ["Erzählen", "Im Gespräch erzählst du Erlebnisse oft im Perfekt. Für sein und haben sind war und hatte üblich.", "Wir sind früh losgegangen. Es war noch dunkel."],
    ["Reihenfolge", "Beginne mit zuerst, dann oder danach. Das konjugierte Verb folgt direkt.", "Zuerst sind wir gewandert. Danach haben wir eine Pause gemacht."],
    ["Grund und Gegensatz", "Bei weil und obwohl steht das Verb am Ende. Bei deshalb und trotzdem am Satzanfang folgt direkt das Verb.", "Obwohl es geregnet hat, sind wir weitergegangen."],
  ], ["Verbinde mit obwohl: Es war kalt. Wir sind weitergewandert.", "Obwohl es kalt war, sind wir weitergewandert."]],
  13: ["Filmkritik · Präsens, Passiv und Begründung", [
    ["Handlung", "Beschreibe die Filmhandlung im Präsens.", "Der Film erzählt die Geschichte einer jungen Musikerin."],
    ["Produktion", "Im Vorgangspassiv steht werden mit dem Partizip II. Für die vergangene Produktion kannst du wurde verwenden.", "Der Film wurde in Berlin gedreht."],
    ["Bewertung", "Leite deine Meinung mit dass oder einen Grund mit weil ein. Das konjugierte Verb steht am Ende.", "Der Film gefällt mir, weil die Handlung spannend ist."],
  ], ["Formuliere im Passiv: Das Team drehte den Film in Berlin.", "Der Film wurde in Berlin gedreht."]],
  14: ["Lernformen vergleichen · während und hingegen", [
    ["während · Kontrast im Nebensatz", "Das konjugierte Verb steht im während-Satz am Ende.", "Im Präsenzkurs kann man direkt nachfragen, während man online flexibler lernt."],
    ["Kontrast im Hauptsatz", "Beginnt der Satz mit hingegen, folgt das Verb. Nach im Gegensatz zu steht der Dativ.", "Im Gegensatz zum Präsenzkurs ist der Onlinekurs ortsunabhängig."],
    ["Bewertung", "Mit einerseits … andererseits kannst du einen Vorteil und einen Nachteil abwägen.", "Einerseits spart man Zeit. Andererseits fehlt manchmal der persönliche Kontakt."],
  ], ["Verbinde mit während: Im Kurs fragt man direkt nach. Online lernt man flexibler.", "Im Kurs fragt man direkt nach, während man online flexibler lernt."]],
  15: ["Homeoffice · Passiv mit und ohne Modalverb", [
    ["Präsenspassiv", "Das Vorgangspassiv rückt den Vorgang in den Mittelpunkt: werden + Partizip II.", "Die Dateien werden online geteilt."],
    ["Passiv mit Modalverb", "Das Modalverb wird konjugiert. Am Ende stehen Partizip II und werden.", "Die Aufgaben müssen digital koordiniert werden."],
  ], ["Formuliere im Passiv: Das Team muss die Daten schützen.", "Die Daten müssen geschützt werden."]],
  16: ["Prüfungsangst · Gründe und Strategien ausdrücken", [
    ["Nebensätze", "Nutze weil für Gründe, dass für Aussagen und wenn für Situationen. Das konjugierte Verb steht am Ende.", "Viele sind nervös, weil sie Angst vor Fehlern haben."],
    ["Strategien und Rat", "Für Tipps passen sollten oder ein Ausdruck mit zu + Infinitiv.", "Du solltest Pausen machen. Es hilft, langsam zu atmen."],
    ["Zweck", "Nutze um … zu bei gleichem Subjekt und damit, wenn ein eigenes Subjekt nötig ist.", "Ich übe laut, um sicherer zu sprechen."],
  ], ["Nenne den Zweck mit um … zu: Ich übe mit einem Timer. Ich möchte ruhiger bleiben.", "Ich übe mit einem Timer, um ruhiger zu bleiben."]],
  17: ["Lernstrategien · Bedingungen, Ziele und Meinungen", [
    ["Bedingung und Begründung", "Mit wenn nennst du eine Bedingung, mit weil einen Grund und mit dass eine Aussage. Das Verb steht am Ende.", "Wenn ich Wörter regelmäßig wiederhole, merke ich sie mir besser."],
    ["Ziel und Strategie", "Nutze um … zu bei gleichem Subjekt oder damit mit eigenem Subjekt. Ein Infinitiv mit zu passt etwa nach Es hilft, …", "Ich wiederhole laut, um die Aussprache zu verbessern."],
  ], ["Beginne mit Wenn: Ich lerne besser. Ich mache regelmäßig Pausen.", "Wenn ich regelmäßig Pausen mache, lerne ich besser."]],
  18: ["Wege zum Wunschberuf · um … zu", [
    ["Zweck", "Mit um … zu sagst du, welches Ziel dieselbe Person verfolgt.", "Ich mache ein Praktikum, um Berufserfahrung zu sammeln."],
    ["Satzbau", "Setze ein Komma vor um. Bei trennbaren Verben steht zu zwischen Vorsilbe und Verbstamm.", "Ich besuche einen Kurs, um mich weiterzubilden."],
  ], ["Verbinde: Ich lerne Deutsch. Ich möchte meine Berufschancen verbessern.", "Ich lerne Deutsch, um meine Berufschancen zu verbessern."]],
  19: ["Vorstellungsgespräch · höflich und begründet sprechen", [
    ["Formelle Anrede", "Verwende Sie und die zugehörigen Formen Ihnen und Ihr.", "Könnten Sie mir sagen, wie groß Ihr Team ist?"],
    ["Konjunktiv II", "würde gern zeigt einen höflichen Wunsch. könnte zeigt eine Möglichkeit. wäre eignet sich für eine höfliche Einschätzung.", "Ich würde gern mehr Verantwortung übernehmen."],
    ["Begründung", "Bei weil und da steht das Verb am Ende. Beginnt ein Hauptsatz mit deshalb, folgt das Verb.", "Ich bewerbe mich, weil ich gern im Team arbeite."],
  ], ["Formuliere höflicher: Ich will mehr über die Stelle wissen.", "Ich würde gern mehr über die Stelle erfahren."]],
  20: ["Berufe beschreiben · Relativsätze und Anforderungen", [
    ["Relativsatz", "Beschreibe eine Person oder Aufgabe mit einem Relativsatz. Das Pronomen richtet sich nach dem Bezugswort und seiner Rolle im Relativsatz.", "Eine Pflegekraft ist eine Person, die Patientinnen und Patienten betreut."],
    ["Anforderungen und Eignung", "Mit müssen und können beschreibst du Anforderungen. Mit weil begründest du, ob ein Beruf zu dir passt.", "Als Mechaniker muss man sorgfältig arbeiten. Der Beruf passt zu mir, weil ich gern praktisch arbeite."],
  ], ["Verbinde: Das ist ein Beruf. Der Beruf erfordert Geduld.", "Das ist ein Beruf, der Geduld erfordert."]],
  21: ["Lebensformen vergleichen · Kontraste und Abwägungen", [
    ["während und obwohl", "während stellt einen Unterschied dar, obwohl einen unerwarteten Gegensatz. In beiden Nebensätzen steht das Verb am Ende.", "Manche leben gern allein, während andere eine Wohngemeinschaft bevorzugen."],
    ["Zweiteilige Konnektoren", "Mit zwar … aber und einerseits … andererseits nennst du beide Seiten.", "Allein zu wohnen ist zwar ruhig, aber es kann teuer sein."],
  ], ["Verbinde mit obwohl: Die Wohnung ist klein. Die Familie fühlt sich wohl.", "Obwohl die Wohnung klein ist, fühlt sich die Familie wohl."]],
  22: ["Beziehungen · Erwartungen und Gegenseitigkeit", [
    ["dass und Relativsätze", "Mit dass formulierst du eine Erwartung. Ein Relativsatz beschreibt eine Person genauer. Das Verb steht am Ende.", "Ich wünsche mir, dass wir offen reden. Ich mag Menschen, die ehrlich sind."],
    ["Gegenseitigkeit", "einander und sich gegenseitig zeigen, dass beide etwas tun.", "In einer guten Beziehung hört man einander zu."],
    ["Gründe und Bedingungen", "weil nennt einen Grund, wenn eine Bedingung. Das Verb steht im Nebensatz am Ende.", "Wenn beide offen sprechen, finden sie leichter eine Lösung."],
  ], ["Verbinde mit dass: Mir ist wichtig. Wir hören einander zu.", "Mir ist wichtig, dass wir einander zuhören."]],
  23: ["Erstes Date · höflich vorschlagen und reagieren", [
    ["Vorschlag", "Mit könnten oder würden klingt ein Vorschlag höflich. Ein zusätzlicher Infinitiv steht am Ende.", "Wir könnten uns im Café treffen."],
    ["Grund und Bedingung", "weil und da nennen einen Grund. wenn nennt eine Bedingung. Das konjugierte Verb steht am Ende des Nebensatzes.", "Wenn du am Samstag Zeit hast, könnten wir spazieren gehen."],
    ["Höflicher Gegensatz", "Mit zwar … aber kannst du höflich ablehnen und eine Alternative anbieten.", "Ich habe am Freitag zwar keine Zeit, aber am Samstag könnte ich."],
  ], ["Schlage höflich einen Spaziergang vor, falls die andere Person am Sonntag Zeit hat. Beginne mit Wenn …", "Wenn du am Sonntag Zeit hast, könnten wir spazieren gehen."]],
  24: ["Nachhaltiger Konsum · Methode, Vergleich und Passiv", [
    ["Methode", "indem und dadurch, dass erklären, wie etwas erreicht wird. Das konjugierte Verb steht am Ende.", "Wir sparen Müll, indem wir Mehrwegflaschen benutzen."],
    ["Entwicklung", "je … desto verbindet zwei Veränderungen. Das Verb steht im je-Satz am Ende.", "Je länger wir Geräte nutzen, desto weniger Abfall entsteht."],
    ["Prozess", "Bilde das Vorgangspassiv mit werden + Partizip II.", "Alte Geräte werden gesammelt und repariert."],
  ], ["Erkläre mit indem: Wir sparen Verpackung. Wir kaufen unverpacktes Obst.", "Wir sparen Verpackung, indem wir unverpacktes Obst kaufen."]],
  25: ["Online einkaufen · Bedingungen, Relativsätze und Passiv", [
    ["wenn und falls", "Leite Bedingungen mit wenn oder falls ein. Das konjugierte Verb steht am Ende.", "Falls das Paket beschädigt ankommt, kontaktiere ich den Shop."],
    ["Relativsätze", "Beschreibe einen Shop oder Artikel mit einem Relativsatz. Wähle den Kasus nach der Rolle des Pronomens.", "Das ist der Artikel, den ich online bestellt habe."],
    ["Regel und Reklamation", "Formuliere Regeln im Passiv. Bitte mit Könnten Sie …? höflich um eine Lösung.", "Der Betrag wird zurückerstattet. Könnten Sie mir bitte eine Bestätigung schicken?"],
  ], ["Verbinde: Das ist der Shop. Der Shop bietet kostenlose Rücksendungen an.", "Das ist der Shop, der kostenlose Rücksendungen anbietet."]],
  26: ["Reiseprobleme · Reihenfolge und Plusquamperfekt", [
    ["bevor und nachdem", "bevor leitet das spätere Ereignis ein, nachdem das frühere. Das konjugierte Verb steht im Nebensatz am Ende.", "Bevor wir losfuhren, überprüften wir die Tickets."],
    ["Frühere Vergangenheit", "Das Plusquamperfekt besteht aus hatte oder war + Partizip II und zeigt, was vorher passiert war.", "Nachdem der Zug abgefahren war, suchten wir eine andere Verbindung."],
    ["Notfall und Bitte", "Mit falls nennst du eine Bedingung. Mit Könnten Sie …? bittest du höflich um Hilfe.", "Falls der Anschluss ausfällt, könnten Sie uns bitte eine andere Verbindung nennen?"],
  ], ["Beginne mit Nachdem: Der Flug fiel aus. Wir buchten ein Hotel.", "Nachdem der Flug ausgefallen war, buchten wir ein Hotel."]],
  27: ["Umweltfreundlicher Alltag · indem, statt, ohne und um … zu", [
    ["indem · Methode", "indem zeigt, wie du etwas erreichst. Das konjugierte Verb steht am Ende.", "Ich spare Energie, indem ich das Licht ausschalte."],
    ["statt … zu und ohne … zu", "statt … zu zeigt eine Alternative. ohne … zu zeigt, was du dabei vermeidest.", "Ich repariere das Gerät, statt ein neues zu kaufen. Ich fahre zur Arbeit, ohne das Auto zu benutzen."],
    ["um … zu · Ziel", "Nutze um … zu, wenn dieselbe Person handelt und das Ziel verfolgt.", "Ich kaufe unverpackt ein, um Müll zu vermeiden."],
  ], ["Bilde einen Satz mit statt … zu: Ich nehme den Bus. Ich fahre nicht mit dem Auto.", "Ich nehme den Bus, statt mit dem Auto zu fahren."]],
  28: ["Klimafreundlich leben · Folgen, Kontraste und Vorschläge", [
    ["je … desto", "Stelle zwei Entwicklungen mit Komparativen gegenüber. Im je-Satz steht das Verb am Ende.", "Je öfter wir das Rad nehmen, desto weniger Abgase entstehen."],
    ["obwohl, trotzdem und wenn", "obwohl zeigt einen Gegensatz, wenn eine Bedingung. Beginnt ein Hauptsatz mit trotzdem, folgt das Verb.", "Obwohl der Weg weit ist, fährt sie mit dem Rad."],
    ["Vorschläge", "Mit könnten oder sollten schlägst du eine realistische Maßnahme vor.", "Wir könnten mehr Wege mit dem Fahrrad zurücklegen."],
  ], ["Verbinde mit je … desto: Wir sparen mehr Energie. Wir verursachen weniger Emissionen.", "Je mehr Energie wir sparen, desto weniger Emissionen verursachen wir."]],
};

export const A2_B1_WORKBOOK_GRAMMAR = { A2, B1 };

// Day 2 follows the workbook's sequence. Each group fits one teaching slide.
export const A2_DAY_2_ADJECTIVE_GRAMMAR = [
  ["Adjektivendungen 1 · So findest du die Endung", [
    ["1 · Schau auf das Nomen", "Lerne das Nomen mit seinem Artikel: der Mann, die Frau, das Kind, die Personen.", "der Mann + freundlich → ein freundlicher Mann"],
    ["2 · Bestimme den Kasus", "Das Subjekt steht im Nominativ. Das direkte Objekt nach sehen steht im Akkusativ.", "Ein freundlicher Mann winkt. Ich sehe einen freundlichen Mann."],
    ["3 · Setze die Endung ein", "Bei ein + maskulin im Nominativ zeigt -er den Unterschied zu ein + neutral mit -es. Bei einen steht das Adjektiv auf -en.", "ein netter Mann · ein nettes Kind · einen netten Mann"],
  ], []],
  ["Adjektivendungen 2 · Nominativ", [
    ["Maskulin · ein + -er", "der Mann → ein freundlicher Mann", "Ein freundlicher Mann hilft mir."],
    ["Feminin · eine + -e", "die Frau → eine sportliche Frau", "Eine sportliche Frau läuft im Park."],
    ["Neutral · ein + -es", "das Kind → ein kleines Kind", "Ein kleines Kind spielt im Garten."],
    ["Plural · keine + -en", "die Personen → keine unbekannten Personen", "Keine unbekannten Personen sind hier."],
  ], []],
  ["Adjektivendungen 3 · Akkusativ", [
    ["Maskulin · einen + -en", "den Mann → einen freundlichen Mann. Hier ändern sich Artikel und Endung.", "Ich sehe einen freundlichen Mann."],
    ["Feminin · eine + -e", "die Frau → eine sportliche Frau", "Ich sehe eine sportliche Frau."],
    ["Neutral · ein + -es", "das Kind → ein kleines Kind", "Ich sehe ein kleines Kind."],
    ["Plural · keine + -en", "die Personen → keine unbekannten Personen", "Ich sehe keine unbekannten Personen."],
  ], []],
  ["Adjektivendungen 4 · Gemeinsam üben", [
    ["Merksatz", "In dieser Übersicht ändern sich beim Wechsel vom Nominativ zum Akkusativ nur die maskuline Form von ein und die Adjektivendung.", "Ein sportlicher Mann kommt. Ich sehe einen sportlichen Mann."],
  ], [
    ["Ergänze: ___ (ein / freundlich / Mann) wohnt hier.", "Ein freundlicher Mann wohnt hier."],
    ["Ergänze: Ich sehe ___ (ein / sportlich / Mann) im Park.", "Ich sehe einen sportlichen Mann im Park."],
    ["Ergänze: Sie trifft ___ (eine / nett / Frau) und sieht ___ (ein / klein / Kind).", "Sie trifft eine nette Frau und sieht ein kleines Kind."],
  ]],
];
