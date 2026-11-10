// B1 Course Book grammar transfer. The tables describe fictional classroom scenarios.
const taskIds = ['recognise-rule', 'fix-error', 'build-sentence'];

function lab(day, title, context, columns, rows, tasks) {
  return {
    day, title, context, columns, rows,
    tasks: tasks.map(([label, prompt, hint, answer, criterion], index) => ({
      id: taskIds[index], label, prompt, hint, answer, criterion,
    })),
  };
}

const labs = [
  lab(1, 'Zukunftswerkstatt', 'Drei Personen erzählen im Kurs von früheren Erfahrungen und ihren nächsten Plänen.',
    ['Person', 'Erfahrung', 'Plan'], [['Mina', 'in Accra gearbeitet', 'nächstes Jahr Ausbildung in Köln'], ['Sam', 'einen Sprachkurs besucht', 'im Mai nach Berlin reisen'], ['Lea', 'allein nach Wien gereist', 'im Herbst in Wien studieren']], [
      ['Erfahrung berichten', 'Was hat Mina schon gemacht? Bilde einen Satz im Perfekt.', 'haben + Partizip II', 'Mina hat schon in Accra gearbeitet.', 'Hilfsverb und Partizip'],
      ['Zeitform korrigieren', 'Verbessere: Sam hat im Mai nach Berlin reisen. Die Reise liegt noch vor ihm.', 'Zukunftszeit + Präsens', 'Im Mai reist Sam nach Berlin.', 'Verb direkt nach der Zeitangabe'],
      ['Plan und Erfahrung verbinden', 'Erzähle von Leas Reise und anschließend von ihrem Plan.', 'sein im Perfekt · im Herbst', 'Lea ist schon allein nach Wien gereist. Im Herbst studiert sie dort.', 'Vergangenheit und Zukunft unterscheiden'],
    ]),
  lab(2, 'Freundschaft unter Beweis', 'Die Kursgruppe sammelt Beispiele dafür, was ihre Freundinnen und Freunde zuverlässig macht.',
    ['Person', 'Eigenschaft', 'Beispiel'], [['Ama', 'zuverlässig', 'hält ihre Versprechen'], ['Ben', 'geduldig', 'hört anderen zu'], ['Lea', 'hilfsbereit', 'hilft beim Umzug']], [
      ['Eine Person beschreiben', 'Beschreibe Ama mit eine + Adjektiv + Freundin.', 'eine + -e', 'Ama ist eine zuverlässige Freundin.', 'Adjektivendung -e'],
      ['Einen Grund richtig stellen', 'Korrigiere: Ben ist ein geduldiger Freund, weil er hört anderen zu.', 'weil · Verb ans Ende', 'Ben ist ein geduldiger Freund, weil er anderen zuhört.', 'zuhört am Ende'],
      ['Eigenschaft begründen', 'Erkläre mit weil, warum Lea eine gute Freundin ist. Verwende hilfsbereit.', 'eine hilfsbereite Freundin', 'Lea ist eine hilfsbereite Freundin, weil sie mir beim Umzug hilft.', 'Adjektivendung und Nebensatzstellung'],
    ]),
  lab(3, 'Drei Wege zum Erfolg', 'Für die Kurszeitung sollen drei berufliche Erfolgsgeschichten vorgestellt werden.',
    ['Person', 'Eigenschaft oder Team', 'Erfolg'], [['Mina', 'mutige Gründerin', 'eröffnet eine Bäckerei'], ['Emil', 'erfahrener Partner', 'startet ein Projekt'], ['Sara', 'kreatives Team', 'entwickelt eine Lern-App']], [
      ['Nominativ wählen', 'Wer eröffnet die Bäckerei? Beginne mit Eine …', 'eine + -e', 'Eine mutige Gründerin eröffnet die Bäckerei.', 'Subjekt mit korrekter Endung'],
      ['Akkusativ reparieren', 'Korrigiere: Emil findet ein erfahrener Partner.', 'einen + -en', 'Emil findet einen erfahrenen Partner.', 'maskuliner Akkusativ'],
      ['Zusammenarbeit beschreiben', 'Mit wem entwickelt Sara die App? Ergänze ein Adjektiv.', 'mit + Dativ', 'Sara entwickelt die App mit einem kreativen Team.', 'einem + -en'],
    ]),
  lab(4, 'Wohnungen im Vergleich', 'Drei Wohnungsanzeigen stehen zur Auswahl. Beschreibt die Angebote und wägt sie ab.',
    ['Wohnung', 'Lage', 'Ausstattung', 'Preis'], [['A', 'zentral', 'hell und ruhig', '900 Euro'], ['B', 'am Stadtrand', 'Balkon und Keller', '650 Euro'], ['C', 'zentral', 'kein Balkon, kein Keller', '720 Euro']], [
      ['Zwei Merkmale nennen', 'Beschreibe die Wohnung A mit sowohl … als auch.', 'zwei Adjektive parallel', 'Die Wohnung A ist sowohl hell als auch ruhig.', 'beide Merkmale und beide Konnektorteile'],
      ['Eine Verneinung reparieren', 'Korrigiere: Wohnung C hat weder einen Balkon oder einen Keller.', 'weder … noch', 'Wohnung C hat weder einen Balkon noch einen Keller.', 'weder mit noch verbinden'],
      ['Vor- und Nachteil abwägen', 'Empfiehl Wohnung B mit zwar … aber. Nutze Lage und Preis.', 'zwar … aber', 'Wohnung B liegt zwar am Stadtrand, aber sie ist am günstigsten.', 'beide Angaben sinnvoll gegeneinander abwägen'],
    ]),
  lab(5, 'Termine am Telefon', 'Eine Maklerin hat drei Besichtigungen eingetragen. Findet einen passenden Termin.',
    ['Wohnung', 'Termin', 'Status'], [['A', 'Dienstag, 16 Uhr', 'frei'], ['B', 'Freitag, 10 Uhr', 'noch unklar'], ['C', 'Samstag, 11 Uhr', 'frei']], [
      ['Höflich bitten', 'Bitte höflich um den Dienstagstermin für Wohnung A.', 'Könnten wir …?', 'Könnten wir Wohnung A am Dienstag um 16 Uhr besichtigen?', 'höfliche Frage mit Infinitiv'],
      ['Indirekte Frage korrigieren', 'Korrigiere: Können Sie mir sagen, ob ist der Freitagstermin frei?', 'ob + Verb am Ende', 'Können Sie mir sagen, ob der Freitagstermin frei ist?', 'indirekte Ja-/Nein-Frage'],
      ['Termin und Rückfrage kombinieren', 'Schlage Samstag vor und frage indirekt nach der Uhrzeit.', 'wäre · wann + Verb am Ende', 'Samstag wäre für mich gut. Könnten Sie mir sagen, wann die Besichtigung beginnt?', 'Vorschlag und indirekte W-Frage'],
    ]),
  lab(6, 'Umzug mit Prioritäten', 'Drei Orte kommen für einen Umzug infrage. Die Gruppe vergleicht Kosten, Lage und Verkehr.',
    ['Ort', 'Miete', 'Alltag'], [['Innenstadt', '950 Euro', 'laut, viele Busse'], ['Dorf', '560 Euro', 'ruhig, wenige Busse'], ['Kleinstadt', '700 Euro', 'ruhig, eigener Bahnhof']], [
      ['Zwei Orte vergleichen', 'Vergleiche die Miete im Dorf mit der Miete in der Innenstadt.', 'Komparativ + als', 'Die Miete im Dorf ist niedriger als in der Innenstadt.', 'korrekter Komparativ und Vergleich'],
      ['Einen Vorteil relativieren', 'Ergänze den Nachteil des Dorfs: Das Dorf ist zwar ruhig, …', 'zwar … aber', 'Das Dorf ist zwar ruhig, aber es fahren nur wenige Busse.', 'zwei gegensätzliche Fakten'],
      ['Einen Ort begründet empfehlen', 'Empfiehl die Kleinstadt. Verwende einen Relativsatz und nenne einen Grund.', 'eine Stadt, die … · weil', 'Ich empfehle die Kleinstadt, die einen eigenen Bahnhof hat, weil man dort gut mit dem Zug fahren kann.', 'Relativsatz und Grund mit korrekter Wortstellung'],
    ]),
  lab(7, 'Mittagessen mit Argumenten', 'Eine Gruppe entscheidet anhand der Speisekarte, was sie mittags essen möchte.',
    ['Gericht', 'Vorteil', 'Nachteil'], [['Pommes', 'günstiger Preis', 'hoher Salzgehalt'], ['Gemüsesuppe', 'frische Zutaten', 'lange Wartezeit'], ['Salat', 'kurze Wartezeit', 'hoher Preis']], [
      ['Grund mit Genitiv', 'Warum möchte eine Person keine Pommes? Verwende wegen.', 'wegen + des + -(e)s', 'Wegen des hohen Salzgehalts möchte sie keine Pommes.', 'Genitiv bei maskulinem Nomen'],
      ['Gegensatz korrekt bauen', 'Korrigiere: Trotz die lange Wartezeit bestelle ich die Suppe.', 'trotz + der', 'Trotz der langen Wartezeit bestelle ich die Suppe.', 'Artikel und Adjektiv im Genitiv'],
      ['Zwei Formen vergleichen', 'Empfiehl die Suppe wegen der Zutaten. Formuliere den Grund danach mit weil.', 'Genitivgruppe oder Nebensatz', 'Wegen der frischen Zutaten empfehle ich die Suppe. Ich empfehle sie, weil die Zutaten frisch sind.', 'gleiche Bedeutung in zwei Satzformen'],
    ]),
  lab(8, 'Rat, Pflicht oder Erlaubnis', 'Ein Kurs übt Sprachsituationen anhand fiktiver Regeln in einem Gesundheitszentrum.',
    ['Situation', 'Information', 'Sprechabsicht'], [['Termin', 'Versicherungskarte mitbringen', 'Pflicht'], ['Wartezimmer', 'Wasser trinken erlaubt', 'Erlaubnis'], ['Kursstress', 'mehr Pausen einplanen', 'Rat']], [
      ['Pflicht nennen', 'Was muss jemand zum Termin mitbringen?', 'müssen + Infinitiv', 'Man muss die Versicherungskarte mitbringen.', 'Modalverb und Infinitiv'],
      ['Erlaubnis korrigieren', 'Die Person sagt: Ich muss im Wartezimmer Wasser trinken. Drücke stattdessen Erlaubnis aus.', 'dürfen', 'Ich darf im Wartezimmer Wasser trinken.', 'passendes Modalverb für Erlaubnis'],
      ['Rat und Pflicht unterscheiden', 'Gib einen Rat bei Kursstress und erinnere anschließend an die Pflicht beim Termin.', 'solltest · musst', 'Du solltest mehr Pausen einplanen. Zum Termin musst du die Versicherungskarte mitbringen.', 'Rat und Pflicht klar unterscheiden'],
    ]),
  lab(9, 'Feierabend retten', 'Drei Personen probieren verschiedene Maßnahmen aus, um Beruf und Freizeit besser zu trennen.',
    ['Person', 'Maßnahme', 'Ziel oder Hürde'], [['Mia', 'Benachrichtigungen ausschalten', 'sich erholen'], ['Ben', 'feste Übergabe vereinbaren', 'Kollegin kann übernehmen'], ['Nora', 'Pause fest einplanen', 'viel Arbeit']], [
      ['Zweck nennen', 'Warum schaltet Mia ihre Benachrichtigungen aus? Verwende um … zu.', 'gleiches Subjekt', 'Mia schaltet ihre Benachrichtigungen aus, um sich zu erholen.', 'Zweck mit Infinitiv'],
      ['Unterschiedliche Subjekte beachten', 'Korrigiere: Ben vereinbart eine Übergabe, um seine Kollegin übernehmen zu können.', 'damit · Kollegin als Subjekt', 'Ben vereinbart eine Übergabe, damit seine Kollegin übernehmen kann.', 'damit-Satz mit eigenem Subjekt'],
      ['Methode trotz Hürde erklären', 'Erkläre mit obwohl und indem, wie Nora trotz ihrer Arbeit auf Pausen achtet.', 'Verb am Ende beider Nebensätze', 'Obwohl Nora viel Arbeit hat, achtet sie auf Pausen, indem sie diese fest einplant.', 'Gegensatz und Methode verbinden'],
    ]),
  lab(10, 'Digitale Gewohnheiten im Vergleich', 'Drei Personen vergleichen ihr Abendprogramm und wie sie danach schlafen.',
    ['Person', 'Bildschirmzeit', 'Schlaf'], [['Ada', '30 Minuten', '8 Stunden'], ['Leo', '90 Minuten', '7 Stunden'], ['Mara', '150 Minuten', '6 Stunden']], [
      ['Unterschied ausdrücken', 'Vergleiche Adas Bildschirmzeit mit Leos Bildschirmzeit.', 'weniger … als', 'Ada verbringt weniger Zeit am Bildschirm als Leo.', 'Ungleichheit mit als'],
      ['Gleichheit richtig ausdrücken', 'Korrigiere: Wenn Leo morgen 30 Minuten online ist, ist er genauso lange online als Ada heute.', 'genauso … wie', 'Wenn Leo morgen 30 Minuten online ist, ist er genauso lange online wie Ada heute.', 'Gleichheit mit wie'],
      ['Zusammenhang ausdrücken', 'Formuliere den Zusammenhang in dieser Tabelle mit je … desto.', 'je + Verb am Ende · desto + Verb danach', 'Je weniger Zeit diese Personen am Bildschirm verbringen, desto länger schlafen sie.', 'beide Komparative und Wortstellung'],
    ]),
  lab(11, 'Teamarbeit im Turnier', 'Drei Teams berichten, wie sie bei einer gemeinsamen Aufgabe zusammenarbeiten.',
    ['Team', 'Aktion', 'Ziel'], [['Rot', 'helfen sich gegenseitig', 'Aufgabe lösen'], ['Blau', 'hören sich gegenseitig zu', 'Missverständnisse vermeiden'], ['Grün', 'stimmen den Plan gemeinsam ab', 'Zeit sparen']], [
      ['Gegenseitigkeit erkennen', 'Was machen die Mitglieder von Team Rot? Verwende einander.', 'einander helfen', 'Die Mitglieder von Team Rot helfen einander.', 'einander bezeichnet beide Seiten'],
      ['Eine Form korrigieren', 'Korrigiere: Die Spieler hören miteinander zu.', 'einander zuhören', 'Die Spieler hören einander zu.', 'passende Form zum Verb'],
      ['Teamregeln formulieren', 'Formuliere zwei Regeln für Grün und Blau mit miteinander und einander.', 'miteinander sprechen · einander zuhören', 'Wir sprechen miteinander über den Plan und hören einander zu.', 'beide Ausdrücke passend verwenden'],
    ]),
  lab(12, 'Wanderung nacherzählen', 'Die Gruppe ordnet die Ereignisse eines Wandertages für ihren Reisebericht.',
    ['Zeit', 'Ereignis', 'Umstände'], [['8 Uhr', 'am Bahnhof losgehen', 'kalt'], ['11 Uhr', 'Pause machen', 'Regen'], ['15 Uhr', 'Aussichtspunkt erreichen', 'Regen hält an']], [
      ['Den Anfang erzählen', 'Was passierte um acht? Nenne auch das Wetter.', 'Perfekt mit sein · war', 'Um acht sind wir am Bahnhof losgegangen. Es war kalt.', 'passendes Hilfsverb und Präteritum'],
      ['Reihenfolge korrigieren', 'Korrigiere: Danach wir haben eine Pause gemacht.', 'danach + Verb an Position 2', 'Danach haben wir eine Pause gemacht.', 'Inversion nach danach'],
      ['Einen Gegensatz einbauen', 'Erzähle die letzte Etappe mit obwohl und nenne die Uhrzeit.', 'obwohl · Verb am Ende', 'Obwohl es weiter geregnet hat, haben wir um 15 Uhr den Aussichtspunkt erreicht.', 'Gegensatz und korrekte Satzstellung'],
    ]),
  lab(13, 'Redaktion der Filmkritik', 'Drei Filmkarten liefern Informationen für eine kurze Kritik im Kurs.',
    ['Film', 'Handlung', 'Drehort', 'Eindruck'], [['Die Reise', 'eine Musikerin sucht ihre Schwester', 'Berlin', 'spannend'], ['Nachts am Meer', 'ein Kind findet einen Brief', 'Hamburg', 'ruhig'], ['Der letzte Zug', 'zwei Freunde verpassen den Zug', 'Köln', 'witzig']], [
      ['Handlung zusammenfassen', 'Worum geht es in Die Reise? Verwende Präsens.', 'erzählt von …', 'Der Film erzählt von einer Musikerin, die ihre Schwester sucht.', 'Handlung im Präsens'],
      ['Drehort im Passiv nennen', 'Korrigiere: Nachts am Meer wurde in Hamburg drehen.', 'wurde + Partizip II', 'Nachts am Meer wurde in Hamburg gedreht.', 'Partizip im Präteritumpassiv'],
      ['Kritik begründen', 'Bewerte Der letzte Zug mit weil und ergänze den Drehort im Passiv.', 'weil · wurde … gedreht', 'Mir gefällt Der letzte Zug, weil er witzig ist. Der Film wurde in Köln gedreht.', 'Bewertung und Produktionsfakt trennen'],
    ]),
  lab(14, 'Zwei Wege zum Lernen', 'Ein Kurs vergleicht drei Unterrichtsformen und sucht eine gute Lösung für Berufstätige.',
    ['Form', 'Stärke', 'Grenze'], [['Präsenz', 'direkte Rückfragen', 'Anfahrt'], ['Online', 'freie Ortswahl', 'wenig persönlicher Kontakt'], ['Hybrid', 'beides möglich', 'mehr Technik nötig']], [
      ['Einen Kontrast formulieren', 'Vergleiche Präsenz und Online mit während.', 'während + Verb am Ende', 'Im Präsenzkurs kann man direkt nachfragen, während man online den Lernort frei wählen kann.', 'Kontrast und Verbendstellung'],
      ['Wortstellung korrigieren', 'Korrigiere: Hingegen man braucht im Hybridkurs mehr Technik.', 'hingegen + Verb', 'Hingegen braucht man im Hybridkurs mehr Technik.', 'Verb an zweiter Stelle'],
      ['Eine Form abwägen', 'Wäge den Onlinekurs mit einerseits und andererseits ab.', 'beide Seiten nennen', 'Einerseits kann man den Lernort frei wählen. Andererseits fehlt oft der persönliche Kontakt.', 'zwei Informationen aus der Tabelle'],
    ]),
  lab(15, 'Abläufe im Homeoffice', 'Ein verteiltes Team erklärt neuen Kolleginnen und Kollegen, wie seine Aufgaben organisiert werden.',
    ['Bereich', 'Vorgang', 'Vorgabe'], [['Dateien', 'online teilen', 'täglich'], ['Daten', 'verschlüsselt speichern', 'Pflicht'], ['Besprechungen', 'digital protokollieren', 'möglich']], [
      ['Vorgang beschreiben', 'Was passiert täglich mit den Dateien? Antworte im Passiv.', 'werden + Partizip II', 'Die Dateien werden täglich online geteilt.', 'Vorgangspassiv im Präsens'],
      ['Modalpassiv korrigieren', 'Korrigiere: Die Daten müssen verschlüsselt gespeichert.', 'Partizip II + werden', 'Die Daten müssen verschlüsselt gespeichert werden.', 'werden steht am Ende'],
      ['Zwei Abläufe erklären', 'Erkläre die Pflicht bei den Daten und die Möglichkeit bei Besprechungen.', 'müssen … werden · können … werden', 'Die Daten müssen verschlüsselt gespeichert werden. Besprechungen können digital protokolliert werden.', 'Pflicht und Möglichkeit im Passiv'],
    ]),
  lab(16, 'Ruhiger in die Prüfung', 'Drei Personen beschreiben, was sie vor einer Prüfung nervös macht und was ihnen helfen könnte.',
    ['Person', 'Problem', 'Strategie'], [['Mia', 'Angst vor Fehlern', 'laut üben'], ['Jonas', 'Zeitdruck', 'mit einem Timer üben'], ['Ada', 'spricht zu schnell', 'langsam atmen']], [
      ['Ursache nennen', 'Warum ist Mia nervös? Verwende weil.', 'Verb am Ende', 'Mia ist nervös, weil sie Angst vor Fehlern hat.', 'Grund und Verbendstellung'],
      ['Strategie sprachlich korrigieren', 'Korrigiere: Es hilft Ada, langsam atmen.', 'Es hilft, … zu + Infinitiv', 'Es hilft Ada, langsam zu atmen.', 'zu vor dem Infinitiv'],
      ['Ziel einer Strategie erklären', 'Erkläre, warum Jonas mit einem Timer übt, und gib Ada einen Rat.', 'um … zu · sollte', 'Jonas übt mit einem Timer, um sich an den Zeitdruck zu gewöhnen. Ada sollte langsam atmen.', 'Zweck und Rat unterscheiden'],
    ]),
  lab(17, 'Welche Lernmethode hilft?', 'Die Lerngruppe probiert drei Methoden aus und erklärt, wann und wofür sie nützlich sind.',
    ['Methode', 'Voraussetzung', 'Ziel'], [['Karteikarten', 'täglich wiederholen', 'Wörter behalten'], ['Laut lesen', 'langsam lesen', 'Aussprache verbessern'], ['Partnerarbeit', 'Fragen stellen', 'Partner erkennt Fehler']], [
      ['Bedingung nennen', 'Wann helfen Karteikarten? Beginne mit Wenn …', 'wenn · Verb am Ende', 'Wenn ich täglich wiederhole, behalte ich die Wörter besser.', 'Verb am Ende und Inversion nach dem Komma'],
      ['Eine Meinung korrigieren', 'Korrigiere: Ich glaube, dass lautes Lesen verbessert die Aussprache.', 'dass · Verb am Ende', 'Ich glaube, dass lautes Lesen die Aussprache verbessert.', 'Verbendstellung nach dass'],
      ['Ziele gegenüberstellen', 'Erkläre den Zweck von lautem Lesen mit um … zu und den Zweck deiner Fragen mit damit.', 'gleiche und unterschiedliche Subjekte', 'Ich lese laut, um meine Aussprache zu verbessern. Ich stelle Fragen, damit mein Partner seine Fehler erkennt.', 'passende Form für beide Zwecke'],
    ]),
  lab(18, 'Stationen zum Wunschberuf', 'Drei Personen bereiten sich mit unterschiedlichen Schritten auf ihren Wunschberuf vor.',
    ['Person', 'Schritt', 'Ziel'], [['Mina', 'Praktikum machen', 'Erfahrung sammeln'], ['Emil', 'Kurs besuchen', 'sich weiterbilden'], ['Lea', 'Gespräche üben', 'sich vorbereiten']], [
      ['Ziel mit Infinitiv erklären', 'Warum macht Mina ein Praktikum?', 'um … zu', 'Mina macht ein Praktikum, um Erfahrung zu sammeln.', 'Komma und Zweckgruppe'],
      ['Trennbares Verb korrigieren', 'Korrigiere: Emil besucht einen Kurs, um sich zu weiterbilden.', 'weiter + zu + bilden', 'Emil besucht einen Kurs, um sich weiterzubilden.', 'zu zwischen Vorsilbe und Stamm'],
      ['Vorbereitung erklären', 'Nenne Leas Schritt und Ziel. Verwende vorbereiten in der Zweckgruppe.', 'vor + zu + bereiten', 'Lea übt Gespräche, um sich auf die Bewerbung vorzubereiten.', 'trennbares Verb im Zweckinfinitiv'],
    ]),
  lab(19, 'Das Bewerbungsgespräch am Tisch', 'Eine Bewerberin möchte im Gespräch Fragen stellen und ihr Interesse begründen.',
    ['Thema', 'Wunsch oder Frage', 'Grund'], [['Team', 'Teamgröße erfahren', 'arbeitet gern mit anderen'], ['Aufgaben', 'Verantwortung übernehmen', 'hat Erfahrung'], ['Weiterbildung', 'nach Kursen fragen', 'möchte dazulernen']], [
      ['Höflich nachfragen', 'Frage die Personalchefin nach der Teamgröße.', 'Könnten Sie mir sagen …?', 'Könnten Sie mir sagen, wie groß Ihr Team ist?', 'formelle Anrede und indirekte Frage'],
      ['Wunsch höflich machen', 'Formuliere höflicher: Ich will Verantwortung übernehmen.', 'würde gern + Infinitiv', 'Ich würde gern Verantwortung übernehmen.', 'würde und Infinitiv'],
      ['Interesse begründen', 'Frage höflich nach Weiterbildung und begründe dein Interesse mit weil.', 'Sie · weil + Verb am Ende', 'Könnten Sie mir sagen, ob Sie Kurse anbieten? Ich frage, weil ich gern dazulernen möchte.', 'formelle Frage und vollständige Begründung'],
    ]),
  lab(20, 'Berufe anhand von Aufgaben erkennen', 'Die Gruppe ordnet Tätigkeiten und Anforderungen drei Berufen zu.',
    ['Beruf', 'Tätigkeit', 'Anforderung'], [['Pflegekraft', 'Patienten betreuen', 'geduldig sein'], ['Mechaniker', 'Fahrzeuge reparieren', 'sorgfältig arbeiten'], ['Erzieherin', 'Kinder begleiten', 'gut zuhören können']], [
      ['Beruf mit Relativsatz erklären', 'Beschreibe den Beruf Pflegekraft mit eine Person, die …', 'die + Verb am Ende', 'Eine Pflegekraft ist eine Person, die Patienten betreut.', 'Relativpronomen und Verbendstellung'],
      ['Anforderung korrigieren', 'Korrigiere: Als Mechaniker man muss sorgfältig arbeiten.', 'Verb an Position 2', 'Als Mechaniker muss man sorgfältig arbeiten.', 'Modalverb nach der Berufsangabe'],
      ['Eignung erklären', 'Beschreibe den Beruf Erzieherin und begründe, warum er zu dir passen könnte.', 'Relativsatz · weil', 'Eine Erzieherin ist eine Person, die Kinder begleitet. Der Beruf passt zu mir, weil ich gut zuhören kann.', 'Tätigkeit und begründete Eignung'],
    ]),
  lab(21, 'Wie möchten wir wohnen?', 'Drei Personen vergleichen Lebensformen und diskutieren ihre Vor- und Nachteile.',
    ['Wohnform', 'Vorteil', 'Nachteil'], [['allein', 'viel Ruhe', 'höhere Kosten'], ['Wohngemeinschaft', 'geteilte Kosten', 'wenig Privatsphäre'], ['mit Familie', 'Hilfe im Alltag', 'wenig Platz']], [
      ['Unterschied beschreiben', 'Vergleiche die Kosten beim Alleinwohnen und in einer WG mit während.', 'während + Verb am Ende', 'Allein hat man höhere Kosten, während man sie in einer WG teilen kann.', 'zwei Wohnformen kontrastieren'],
      ['Einen Gegensatz korrigieren', 'Korrigiere: Obwohl es gibt wenig Platz, hilft die Familie im Alltag.', 'obwohl · Verb ans Ende', 'Obwohl es wenig Platz gibt, hilft die Familie im Alltag.', 'Verbendstellung und Inversion'],
      ['Abwägen und entscheiden', 'Wäge die WG ab und entscheide, ob du dort wohnen möchtest.', 'einerseits … andererseits', 'Einerseits spart man in einer WG Geld. Andererseits hat man weniger Privatsphäre. Trotzdem würde ich es ausprobieren.', 'beide Seiten und begründete Entscheidung'],
    ]),
  lab(22, 'Absprachen für eine Beziehung', 'Drei Paare besprechen, welche Erwartungen ihnen im Alltag wichtig sind.',
    ['Thema', 'Erwartung', 'Situation'], [['Gespräch', 'einander zuhören', 'bei Streit'], ['Haushalt', 'Aufgaben fair teilen', 'bei viel Arbeit'], ['Freizeit', 'Pläne gemeinsam machen', 'am Wochenende']], [
      ['Erwartung mit dass formulieren', 'Was wünschst du dir bei einem Streit?', 'Ich wünsche mir, dass …', 'Ich wünsche mir, dass wir einander zuhören.', 'dass-Satz mit Verb am Ende'],
      ['Gegenseitigkeit korrigieren', 'Korrigiere: Wir hören miteinander zu.', 'einander zuhören', 'Wir hören einander zu.', 'passender reziproker Ausdruck'],
      ['Vereinbarung begründen', 'Formuliere eine Vereinbarung für viel Arbeit und begründe sie.', 'wenn · weil', 'Wenn wir viel Arbeit haben, teilen wir die Aufgaben fair, weil uns gegenseitige Hilfe wichtig ist.', 'Bedingung und Grund kombinieren'],
    ]),
  lab(23, 'Ein Treffen vereinbaren', 'Zwei Personen suchen einen Termin und möchten auf Vorschläge höflich reagieren.',
    ['Vorschlag', 'Zeit', 'Einschränkung'], [['Café', 'Freitagabend', 'eine Person arbeitet'], ['Spaziergang', 'Samstag', 'nur bei gutem Wetter'], ['Museum', 'Sonntag', 'beide haben Zeit']], [
      ['Höflichen Vorschlag machen', 'Schlage das Museum am Sonntag höflich vor.', 'könnten + Infinitiv', 'Wir könnten am Sonntag ins Museum gehen.', 'Konjunktiv II im Vorschlag'],
      ['Bedingung korrigieren', 'Korrigiere: Wenn das Wetter ist gut, könnten wir spazieren gehen.', 'wenn · Verb am Ende', 'Wenn das Wetter gut ist, könnten wir spazieren gehen.', 'Verbendstellung im Bedingungssatz'],
      ['Absagen und Alternative anbieten', 'Sage für Freitag ab und biete Sonntag als Alternative an.', 'zwar … aber · weil', 'Ich würde zwar gern ins Café gehen, aber am Freitag kann ich nicht, weil ich arbeiten muss. Am Sonntag könnten wir ins Museum gehen.', 'höfliche Absage und passender Ersatz'],
    ]),
  lab(24, 'Weniger Abfall im Alltag', 'Eine Gruppe sammelt Maßnahmen, mit denen sie beim Einkaufen und im Haushalt Abfall vermeiden kann.',
    ['Bereich', 'Maßnahme', 'Wirkung'], [['Obst', 'unverpackt kaufen', 'weniger Verpackung'], ['Elektronik', 'Geräte länger nutzen', 'weniger Elektroschrott'], ['Reparaturtreff', 'alte Geräte sammeln und reparieren', 'Geräte weiterverwenden']], [
      ['Methode erklären', 'Wie spart die Gruppe beim Obstkauf Verpackung?', 'indem · Verb am Ende', 'Die Gruppe spart Verpackung, indem sie Obst unverpackt kauft.', 'Methode mit indem'],
      ['Passiv korrigieren', 'Korrigiere: Im Reparaturtreff alte Geräte werden gesammelt.', 'werden an Position 2', 'Im Reparaturtreff werden alte Geräte gesammelt.', 'Vorgangspassiv mit richtiger Wortstellung'],
      ['Entwicklung und Prozess verbinden', 'Erkläre den Effekt längerer Gerätenutzung mit je … desto und beschreibe den Reparaturtreff im Passiv.', 'je länger … desto weniger · werden repariert', 'Je länger wir Geräte nutzen, desto weniger Elektroschrott entsteht. Im Reparaturtreff werden alte Geräte repariert.', 'Zusammenhang und Vorgang'],
    ]),
  lab(25, 'Kundendienst im Online-Shop', 'Drei Kundinnen und Kunden möchten eine Lösung für ihre Bestellungen finden.',
    ['Bestellung', 'Problem', 'Gewünschte Lösung'], [['Kopfhörer', 'beschädigt angekommen', 'Ersatz'], ['Jacke', 'falsche Größe', 'Rücksendung'], ['Buch', 'doppelt bezahlt', 'Erstattung']], [
      ['Eine Bedingung ausdrücken', 'Was machst du, falls die Kopfhörer beschädigt ankommen?', 'falls · Verb am Ende', 'Falls die Kopfhörer beschädigt ankommen, bitte ich um Ersatz.', 'Bedingung und passende Lösung'],
      ['Relativpronomen korrigieren', 'Korrigiere: Das ist der Kopfhörer, der ich bestellt habe.', 'den · direktes Objekt', 'Das ist der Kopfhörer, den ich bestellt habe.', 'maskuliner Akkusativ im Relativsatz'],
      ['Höflich reklamieren', 'Bitte um eine Bestätigung für die Erstattung des doppelt bezahlten Betrags.', 'Könnten Sie … · ob … erstattet wird', 'Könnten Sie mir bitte bestätigen, ob der doppelt bezahlte Betrag erstattet wird?', 'höfliche indirekte Frage im Passiv'],
    ]),
  lab(26, 'Reiseplan nach der Störung', 'Eine Reisegruppe rekonstruiert eine verpasste Verbindung und bittet am Schalter um Hilfe.',
    ['Zeit', 'Ereignis', 'Reaktion'], [['8.00 Uhr', 'Tickets prüfen', 'zum Bahnsteig gehen'], ['8.30 Uhr', 'Zug fährt ab', 'Gruppe kommt zu spät'], ['9.00 Uhr', 'Alternative suchen', 'am Schalter nachfragen']], [
      ['Zwei Ereignisse ordnen', 'Was prüfte die Gruppe, bevor sie zum Bahnsteig ging?', 'bevor · Verb am Ende', 'Bevor die Gruppe zum Bahnsteig ging, prüfte sie die Tickets.', 'späteres Ereignis im bevor-Satz'],
      ['Frühere Handlung korrigieren', 'Korrigiere: Nachdem der Zug hatte abgefahren, suchten wir eine Alternative.', 'sein → war · Verb am Ende', 'Nachdem der Zug abgefahren war, suchten wir eine Alternative.', 'Plusquamperfekt mit war'],
      ['Bei einer Störung um Hilfe bitten', 'Formuliere eine höfliche Frage für den Fall, dass auch der nächste Zug ausfällt.', 'falls · Könnten Sie …?', 'Falls der nächste Zug ausfällt, könnten Sie uns bitte eine andere Verbindung nennen?', 'Bedingung und höfliche Bitte'],
    ]),
  lab(27, 'Alltagsgewohnheiten ändern', 'Drei Personen stellen Ideen für einen umweltfreundlicheren Alltag vor.',
    ['Bereich', 'Neue Gewohnheit', 'Was sich ändert'], [['Energie', 'Licht ausschalten', 'Strom sparen'], ['Verkehr', 'Bus nehmen', 'Auto stehen lassen'], ['Einkaufen', 'unverpackt kaufen', 'Müll vermeiden']], [
      ['Methode mit indem', 'Wie kann man Strom sparen? Verwende indem.', 'indem · Verb am Ende', 'Man spart Strom, indem man das Licht ausschaltet.', 'Methode im Nebensatz'],
      ['Alternative korrigieren', 'Korrigiere: Ich nehme den Bus, statt ich fahre mit dem Auto.', 'statt … zu + Infinitiv', 'Ich nehme den Bus, statt mit dem Auto zu fahren.', 'gleiche handelnde Person und Infinitiv'],
      ['Absicht und vermiedene Handlung', 'Erkläre das Ziel beim Einkaufen und ergänze einen Satz mit ohne … zu.', 'um … zu · ohne … zu', 'Ich kaufe unverpackt ein, um Müll zu vermeiden. Ich komme nach Hause, ohne Einwegverpackungen mitzubringen.', 'Ziel und vermiedene Handlung unterscheiden'],
    ]),
  lab(28, 'Klimaplan für den Kurs', 'Ein Kurs bewertet drei Vorschläge, um seine Gewohnheiten klimafreundlicher zu machen.',
    ['Vorschlag', 'Wirkung', 'Hürde'], [['mehr Fahrrad fahren', 'weniger Abgase', 'weiter Weg'], ['Licht ausschalten', 'weniger Stromverbrauch', 'wird oft vergessen'], ['Dinge gemeinsam nutzen', 'weniger Neukäufe', 'Termine abstimmen']], [
      ['Zwei Veränderungen verbinden', 'Formuliere den Effekt von mehr Radfahrten mit je … desto.', 'je öfter · desto weniger', 'Je öfter wir mit dem Rad fahren, desto weniger Abgase entstehen.', 'beide Komparative und Wortstellung'],
      ['Gegensatz richtig bauen', 'Korrigiere: Der Weg ist weit. Trotzdem wir fahren mit dem Rad.', 'trotzdem + Verb', 'Der Weg ist weit. Trotzdem fahren wir mit dem Rad.', 'Verb direkt nach trotzdem'],
      ['Einen Vorschlag begründen', 'Schlage eine Lösung für das gemeinsam genutzte Material vor. Formuliere eine Bedingung.', 'Wenn …, könnten wir …', 'Wenn wir die Termine in einem Kalender abstimmen, könnten wir mehr Dinge gemeinsam nutzen.', 'Bedingung plus konkreter Vorschlag'],
    ]),
];

export function getB1ApplicationLab(day) {
  return labs[Number(day) - 1] || null;
}
