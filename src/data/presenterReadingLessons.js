// Authored reading content is independent of the later grammar/speaking activities.
// Each check includes its evidence, so changing a passage cannot leave an old key.
function lesson(id, title, sentences, purpose, checks) {
  return [id, {
    title, textDe: sentences.join(" "), readingPurpose: purpose,
    checks: checks.map(([question]) => question),
    answers: checks.map(([, answer, evidence]) => `${answer} Beleg: ${/^\d+$/.test(String(evidence).trim()) ? "Satz" : "Sätze"} ${evidence}.`),
    evidence: checks.map(([, , evidence]) => evidence),
  }];
}

export const PRESENTER_READING_LESSONS = Object.fromEntries([
  lesson("A2-1.1", "Eine Pause mit einer neuen Kollegin", [
    "Ama arbeitet seit Montag in einem Hotel und kennt ihre Kollegin Lea noch kaum.",
    "In der Pause fragt Lea nach Amas Weg zur Arbeit und erzählt von ihrem Wochenende.",
    "Ama antwortet gern, möchte aber noch nicht über ihr Gehalt sprechen.",
    "Lea wechselt das Thema und fragt nach einem guten Café in der Nähe.",
    "Nach der Pause verabreden sie sich für einen Kaffee am Freitag."
  ], "Findet heraus: Wie entsteht ein freundlicher Kontakt?", [
    ["Was steht im Mittelpunkt: Arbeitsregeln oder ein erstes Kennenlernen?", "Ein erstes Kennenlernen; die beiden sprechen über Alltagsthemen.", "1–2"],
    ["Worüber möchte Ama noch nicht sprechen?", "Über ihr Gehalt; andere Themen sind für sie in Ordnung.", "3"],
    ["Ama möchte überhaupt kein Gespräch führen. Stimmt das?", "Nein: Sie antwortet gern und verabredet sich zum Kaffee. Nur das Gehalt ist ihr zu privat.", "3–5"]
  ]),
  lesson("A2-1.2", "Wer holt den Gast ab?", [
    "Hallo Ben, bitte hole morgen unsere neue Kollegin Nora am Bahnhof ab.",
    "Sie ist groß, hat kurze dunkle Haare und trägt eine grüne Jacke.",
    "Auf dem Foto hat sie einen roten Koffer, aber morgen bringt sie nur einen schwarzen Rucksack mit.",
    "Nora hilft neuen Mitarbeitern oft bei Computerproblemen.",
    "Ihr Zug kommt um zehn Uhr an, und sie wartet vor der Bäckerei."
  ], "Findet die Informationen, mit denen Ben Nora erkennen kann.", [
    ["Warum bekommt Ben diese Nachricht?", "Er soll Nora am Bahnhof abholen und erkennen können.", "1–2"],
    ["Wo wartet Nora?", "Vor der Bäckerei am Bahnhof, nach ihrer Ankunft um zehn Uhr.", "5"],
    ["Ben kann Nora auch ohne den roten Koffer erkennen. Stimmt das?", "Ja: Haare, Größe, grüne Jacke und der Treffpunkt helfen ihm; morgen hat sie einen schwarzen Rucksack.", "2–3, 5"]
  ]),
  lesson("A2-1.3", "Welches Fahrrad passt?", [
    "Kojo braucht ein Fahrrad für seinen täglichen Weg zum Kurs.",
    "Das blaue Fahrrad kostet weniger als das rote, ist aber schwerer.",
    "Das rote Fahrrad ist genauso schnell wie das blaue und hat einen bequemeren Sattel.",
    "Kojo muss das Fahrrad jeden Abend in den dritten Stock tragen.",
    "Er wählt deshalb das rote, obwohl es mehr kostet."
  ], "Findet das entscheidende Kaufkriterium.", [
    ["Geht es vor allem um ein Rennrad oder ein Fahrrad für den Alltag?", "Um ein Alltagsfahrrad für den täglichen Kursweg.", "1"],
    ["Welches Fahrrad ist günstiger?", "Das blaue kostet weniger, ist dafür aber schwerer.", "2"],
    ["Kojo kann das rote Fahrrad in Raten bezahlen. Steht das im Text?", "Das ist nicht angegeben: Der Text nennt Preisunterschiede und Kojos Wahl, aber keine Zahlungsbedingungen.", "2–5"]
  ]),
  lesson("A2-2.4", "Ein Treffen mit Änderung", [
    "Hallo Sara, wollen wir am Samstag um siebzehn Uhr ins Kino gehen?",
    "Ich muss bis achtzehn Uhr arbeiten; die Vorstellung um neunzehn Uhr würde passen.",
    "Gut, dann treffen wir uns um halb sieben vor dem Bahnhof und gehen gemeinsam zum Kino.",
    "Die Karten kaufe ich vorher online.",
    "Bitte warte vor dem Bahnhof, nicht direkt am Kino."
  ], "Findet den endgültigen Treffpunkt und die Zeit.", [
    ["Worum geht es: eine Absage ohne Alternative oder eine neue Verabredung?", "Um eine neue Verabredung; die spätere Vorstellung passt trotz der Arbeit.", "2–3"],
    ["Wann treffen sich die beiden?", "Um halb sieben, also um achtzehn Uhr dreißig.", "3"],
    ["Die beiden treffen sich um neunzehn Uhr vor dem Kino. Stimmt das?", "Nein: Neunzehn Uhr ist der Filmbeginn; Treffpunkt ist vorher der Bahnhof.", "2–3, 5"]
  ]),
  lesson("A2-2.5", "Ein freier Nachmittag", [
    "Mia spielt fast jeden Samstag Fußball, aber dieses Wochenende ist der Platz geschlossen.",
    "Ihr Freund Ben geht lieber ins Café als zum Sport.",
    "Mia schlägt einen Spaziergang am See und danach einen Cafébesuch vor.",
    "Ben findet den Plan gut, weil beide etwas Passendes machen können.",
    "Sie treffen sich diesmal am Sonntag, denn am Samstag besucht Ben seine Mutter."
  ], "Findet heraus, wie die beiden verschiedene Interessen verbinden.", [
    ["Was ist die Hauptidee: Beide ändern ihre Hobbys oder finden einen gemeinsamen Plan?", "Sie finden einen gemeinsamen Plan, der zu beiden passt.", "2–4"],
    ["Warum treffen sie sich am Sonntag?", "Ben besucht am Samstag seine Mutter; deshalb wählen sie Sonntag.", "5"],
    ["Der gemeinsame Plan berücksichtigt beide Interessen. Stimmt das?", "Ja: Der Spaziergang passt zu Mias Interesse an Bewegung, der Cafébesuch zu Bens Vorliebe.", "1–4"]
  ]),
  lesson("A2-3.6", "Das Sofa kommt ans Fenster", [
    "Als Lea nach Hause kommt, steht das Sofa neben der Tür.",
    "Dort ist es dunkel, deshalb stellt sie das Sofa neben das Fenster.",
    "Ihre Lampe steht schon auf dem kleinen Tisch und bleibt dort.",
    "Lea legt die Bücher auf das Regal, denn auf dem Sofa möchte sie sitzen.",
    "Am Abend liest sie am Fenster, ohne noch etwas umzustellen."
  ], "Unterscheidet: Was wird umgestellt und was bleibt stehen?", [
    ["Warum verändert Lea ihr Wohnzimmer?", "Neben der Tür ist es dunkel; am Fenster möchte sie besser lesen können.", "1–2, 5"],
    ["Welcher Gegenstand bleibt an seinem Platz?", "Die Lampe bleibt auf dem kleinen Tisch stehen.", "3"],
    ["Das Sofa steht am Ende noch neben der Tür. Richtig?", "Nein: Es stand zuerst dort, wird aber neben das Fenster gestellt.", "1–2"]
  ]),
  lesson("A2-3.7", "Eine Wohnung mit Zusatzkosten", [
    "Die helle Zweizimmerwohnung liegt zehn Minuten vom Bahnhof entfernt.",
    "Die Kaltmiete beträgt sechshundert Euro, dazu kommen hundertzwanzig Euro Nebenkosten.",
    "Strom und Internet bezahlt der Mieter extra.",
    "Eine Küche ist vorhanden, Haustiere sind nach Absprache möglich.",
    "Die Besichtigung ist am Freitag; einziehen kann man erst ab Dezember."
  ], "Prüft, was die Wohnung tatsächlich kostet und ab wann sie frei ist.", [
    ["Welche Information ist für das monatliche Budget besonders wichtig?", "Zur Kaltmiete kommen Nebenkosten sowie extra Strom und Internet hinzu.", "2–3"],
    ["Ab wann kann man einziehen?", "Erst ab Dezember; Freitag ist nur der Besichtigungstermin.", "5"],
    ["Mit siebenhundertzwanzig Euro sind alle Kosten bezahlt. Stimmt das?", "Nein: Das ist Kaltmiete plus Nebenkosten; Strom und Internet kommen noch dazu.", "2–3"]
  ]),
  lesson("A2-3.8", "Eine Bestellung im Restaurant", [
    "Sara bestellt eine Gemüsesuppe als Vorspeise und Fisch als Hauptgericht.",
    "Zum Fisch gehören Kartoffeln; Reis kostet extra.",
    "Sie fragt nach einer Soße ohne Milch, weil sie Milch nicht verträgt.",
    "Der Kellner bietet ihr eine Tomatensoße an und bringt Mineralwasser.",
    "Ein Dessert bestellt Sara heute nicht."
  ], "Findet heraus, welche Bestellung zu Saras Bedürfnissen passt.", [
    ["Was klärt Sara außer der Auswahl ihres Essens?", "Sie klärt, ob es eine Soße ohne Milch gibt, weil sie Milch nicht verträgt.", "3–4"],
    ["Welche Beilage ist beim Fisch schon dabei?", "Kartoffeln sind dabei; Reis müsste Sara extra bezahlen.", "2"],
    ["Sara braucht eine Änderung beim Essen, aber keine andere Beilage. Stimmt das?", "Ja: Sie fragt nach einer Soße ohne Milch. Eine Änderung der Kartoffeln verlangt sie nicht.", "2–4"]
  ]),
  lesson("A2-4.9", "Ein Urlaub mit Umweg", [
    "Letzten Sommer sind Ama und ihre Schwester mit dem Zug nach Hamburg gefahren.",
    "Am ersten Tag hat es stark geregnet, deshalb haben sie ein Museum besucht.",
    "Für den nächsten Morgen hatten sie eine Hafenfahrt geplant.",
    "Die Fahrt ist ausgefallen, aber sie haben am Hafen viele Fotos gemacht.",
    "Trotz der Änderungen hat ihnen der kurze Urlaub gefallen."
  ], "Vergleicht die Pläne mit dem, was tatsächlich passiert ist.", [
    ["Wie bewerten die beiden den Urlaub am Ende?", "Positiv: Trotz Regen und ausgefallener Fahrt hat er ihnen gefallen.", "2, 4–5"],
    ["Was haben sie am ersten Tag gemacht?", "Wegen des Regens haben sie ein Museum besucht.", "2"],
    ["Die beiden bekommen das Geld für die Hafenfahrt zurück. Ist das sicher?", "Das bleibt offen: Die Fahrt fällt aus, aber eine Rückzahlung wird nicht erwähnt.", "3–5"]
  ]),
  lesson("A2-4.10", "Ein neuer Blick auf die Stadt", [
    "Am Samstag war Kojo zum ersten Mal in der Altstadt.",
    "Zuerst hat er einen Markt besucht, auf dem früher sein Onkel gearbeitet hatte.",
    "Danach ging er zum Rathaus, aber die Führung war schon ausgebucht.",
    "Eine Mitarbeiterin zeigte ihm stattdessen einen kostenlosen Stadtplan.",
    "Damit fand er einen kleinen Park, den er vorher nicht kannte."
  ], "Findet heraus, was Kojo trotz der ausgefallenen Führung entdeckt.", [
    ["Verläuft Kojos Stadttag genau nach Plan?", "Nein: Die Führung ist ausgebucht; mit einem Stadtplan entdeckt er stattdessen einen Park.", "3–5"],
    ["Wer hat früher auf dem Markt gearbeitet?", "Sein Onkel hatte dort gearbeitet, nicht Kojo selbst.", "2"],
    ["Kojo hat das Rathaus bei einer Führung kennengelernt. Richtig?", "Nein: Die Führung war bereits ausgebucht; er bekommt nur einen Stadtplan.", "3–4"]
  ]),
  lesson("A2-4.11", "Schnell, aber nicht bis zur Tür", [
    "Lea muss am Montag zu einem Termin am Stadtrand.",
    "Der Zug fährt nur zwanzig Minuten, aber vom Bahnhof muss sie noch eine halbe Stunde laufen.",
    "Der Bus braucht vierzig Minuten und hält direkt vor dem Gebäude.",
    "Eine Taxifahrt wäre kürzer, kostet aber fast dreißig Euro.",
    "Lea nimmt den Bus, weil sie Geld sparen und rechtzeitig ankommen möchte."
  ], "Vergleicht den ganzen Weg statt nur der Fahrzeit.", [
    ["Warum passt der Bus zu Leas Entscheidung?", "Er hält direkt am Ziel und ist günstiger als ein Taxi.", "3–5"],
    ["Wie lange dauert der Weg mit Zug und anschließendem Fußweg insgesamt?", "Fünfzig Minuten: zwanzig Minuten Fahrt plus dreißig Minuten zu Fuß.", "2"],
    ["Der Bus braucht bis zum Gebäude weniger Zeit als Zug und Fußweg zusammen. Richtig?", "Ja: Der Bus braucht vierzig Minuten, Zug und Fußweg zusammen fünfzig Minuten.", "2–3"]
  ]),
  lesson("A2-5.12", "Ein Praktikum vor der Entscheidung", [
    "Ama möchte gern mit Menschen arbeiten und interessiert sich für den Beruf der Pflegekraft.",
    "Ihre Tante erzählt ihr, dass der Beruf auch körperlich anstrengend ist.",
    "Ama macht deshalb zuerst ein zweiwöchiges Praktikum in einem Pflegeheim.",
    "Dort gefallen ihr die Gespräche, aber das frühe Aufstehen findet sie schwierig.",
    "Sie möchte nach dem Praktikum mit einer Berufsberaterin über die Ausbildung sprechen."
  ], "Findet heraus, warum Ama den Beruf erst ausprobiert.", [
    ["Wozu macht Ama das Praktikum?", "Sie möchte den Beruf kennenlernen, bevor sie sich für eine Ausbildung entscheidet.", "2–3, 5"],
    ["Was findet sie im Praktikum schwierig?", "Das frühe Aufstehen; die Gespräche gefallen ihr dagegen.", "4"],
    ["Ama wird nach dem Praktikum sicher eine Pflegeausbildung beginnen. Ist das sicher?", "Das ist noch offen: Sie möchte erst mit einer Berufsberaterin über die Ausbildung sprechen.", "5"]
  ]),
  lesson("A2-5.13", "Mehr als ein gutes Zeugnis", [
    "Kojo bewirbt sich als Verkäufer und bringt gute Schulzeugnisse mit.",
    "Im Gespräch fragt die Chefin, wie er mit einem unzufriedenen Kunden umgehen würde.",
    "Kojo erzählt von einem Kunden im Praktikum, dem er ruhig zugehört und dann geholfen hat.",
    "Die Chefin interessiert sich besonders für dieses Beispiel.",
    "Eine Zusage bekommt er noch nicht; am Freitag erhält er eine Rückmeldung."
  ], "Findet heraus, was die Chefin über Kojo erfahren möchte.", [
    ["Was interessiert die Chefin neben den Zeugnissen?", "Wie Kojo in einer konkreten Situation mit einem Kunden handelt.", "2–4"],
    ["Wann soll Kojo eine Rückmeldung erhalten?", "Am Freitag; im Gespräch bekommt er noch keine Zusage.", "5"],
    ["Weil die Chefin sein Beispiel gut findet, hat Kojo die Stelle sicher. Richtig?", "Nein: Interesse ist keine Zusage; die Entscheidung steht noch aus.", "4–5"]
  ]),
  lesson("A2-5.14", "Ein Kurs für den nächsten Schritt", [
    "Sara arbeitet im Verkauf und möchte später im Büro arbeiten.",
    "Sie kennt die Kunden gut, kann aber Tabellen am Computer noch nicht sicher bearbeiten.",
    "Ein Abendkurs soll ihr helfen, diese Fähigkeit zu lernen.",
    "Ihr Chef ändert ihren Dienstplan, damit sie dienstags am Kurs teilnehmen kann.",
    "Nach dem Kurs möchte sie sich intern bewerben; eine Bürostelle ist ihr noch nicht versprochen."
  ], "Findet heraus, welche konkrete Hürde Sara überwinden möchte.", [
    ["Wozu besucht Sara den Kurs?", "Sie möchte Tabellen sicher bearbeiten können und sich auf Büroarbeit vorbereiten.", "1–3"],
    ["Wie unterstützt der Chef sie?", "Er ändert den Dienstplan, damit sie dienstags teilnehmen kann.", "4"],
    ["Der Kurs hilft Sara bei einer konkreten fehlenden Fähigkeit. Stimmt das?", "Ja: Sie möchte gerade das Bearbeiten von Tabellen lernen, das sie noch nicht sicher kann.", "2–3"]
  ]),
  lesson("A2-6.15", "Sport ohne Wettkampf", [
    "Ben möchte sich mehr bewegen, hat aber keine Lust auf Wettkämpfe.",
    "Im Sportverein gibt es eine Laufgruppe ohne Zeitmessung.",
    "Die Gruppe trifft sich zweimal pro Woche; Anfänger können zwischendurch gehen.",
    "Ben probiert am Mittwoch ein kostenloses Training aus.",
    "Erst danach entscheidet er, ob er Mitglied werden möchte."
  ], "Prüft, ob das Angebot zu Ben passt.", [
    ["Was sucht Ben: Wettbewerb oder Bewegung ohne Leistungsdruck?", "Bewegung ohne Leistungsdruck; Wettkämpfe interessieren ihn nicht.", "1–3"],
    ["Wie oft trifft sich die Laufgruppe?", "Zweimal pro Woche; Mittwoch ist Bens Probetraining.", "3–4"],
    ["Ben möchte nach dem Probetraining sicher Mitglied werden. Kann man das schon sagen?", "Nein, das ist noch offen: Er entscheidet erst nach dem kostenlosen Probetraining.", "4–5"]
  ]),
  lesson("A2-6.16", "Eine Pause, die wirklich hilft", [
    "Nach der Arbeit sieht Mia oft lange Videos und fühlt sich danach noch müde.",
    "Diese Woche legt sie ihr Handy nach dem Abendessen für eine Stunde weg.",
    "Sie geht spazieren und trifft manchmal eine Nachbarin.",
    "Am Donnerstag bleibt sie wegen des Regens zu Hause und hört Musik.",
    "Sie merkt, dass sie sich auch ohne Bildschirm gut entspannen kann."
  ], "Findet heraus, was Mia an ihrer Erholung verändert.", [
    ["Welche Veränderung probiert Mia aus?", "Sie verbringt nach dem Abendessen eine Stunde ohne Handy und sucht andere Erholung.", "1–3"],
    ["Warum geht sie am Donnerstag nicht spazieren?", "Wegen des Regens; sie hört stattdessen zu Hause Musik.", "4"],
    ["Mia benutzt ihr Handy jetzt überhaupt nicht mehr. Stimmt das?", "Nein: Sie legt es nur für eine Stunde nach dem Abendessen weg.", "2"]
  ]),
  lesson("A2-6.17", "Eine Nachfrage in der Apotheke", [
    "Kojo geht in die Apotheke, weil er seit zwei Tagen Husten hat.",
    "Die Apothekerin fragt, ob er noch andere Beschwerden hat und Medikamente nimmt.",
    "Kojo zeigt ihr die Packung eines Mittels, das er bereits zu Hause hat.",
    "Bevor sie etwas empfiehlt, prüft sie die Angaben auf der Packung.",
    "Kojo wartet und kauft noch nichts."
  ], "Findet heraus, warum die Apothekerin zuerst nachfragt.", [
    ["Was macht die Apothekerin vor einer Empfehlung?", "Sie sammelt Informationen zu Beschwerden und dem vorhandenen Medikament.", "2–4"],
    ["Wie lange hat Kojo schon Husten?", "Seit zwei Tagen; das ist der Grund für seinen Besuch.", "1"],
    ["Die Apothekerin möchte wissen, was Kojo schon verwendet. Richtig?", "Ja: Sie fragt nach Medikamenten und prüft die Packung seines vorhandenen Mittels.", "2–4"]
  ]),
  lesson("A2-7.18", "Die Karte bleibt gesperrt", [
    "Ama findet ihre Bankkarte nicht und ruft sofort bei der Bank an.",
    "Ein Mitarbeiter sperrt die Karte und fragt nach ihrer Adresse für eine Ersatzkarte.",
    "Später findet Ama die alte Karte in ihrer Jacke.",
    "Die Bank erklärt am Telefon, dass diese Karte trotzdem gesperrt bleibt.",
    "Ama wartet auf die neue Karte und fragt, wie sie bis dahin Geld abheben kann."
  ], "Achtet darauf, was sich durch den Fund der Karte ändert.", [
    ["Warum ruft Ama zuerst bei der Bank an?", "Sie hält ihre Karte für verloren und möchte sie sperren lassen.", "1–2"],
    ["Wo findet sie die alte Karte?", "In ihrer Jacke, nachdem sie bereits gesperrt wurde.", "2–3"],
    ["Nach dem Fund kann Ama die alte Karte wieder benutzen. Stimmt das?", "Nein: Laut Bank bleibt die alte Karte trotz des Funds gesperrt.", "4"]
  ]),
  lesson("A2-7.19", "Günstig gekauft?", [
    "Ben sieht im Internet einen Wasserkocher für zwanzig Euro.",
    "Im Geschäft kostet dasselbe Modell fünfundzwanzig Euro.",
    "Beim Onlineangebot kommen jedoch sechs Euro Versandkosten dazu.",
    "Ben kann das Gerät im Geschäft sofort mitnehmen und dort bei Fragen Hilfe bekommen.",
    "Er kauft es deshalb noch am selben Nachmittag im Geschäft in seiner Straße."
  ], "Vergleicht den Endpreis der beiden Angebote.", [
    ["Warum entscheidet sich Ben für das Geschäft?", "Dort ist der Gesamtpreis niedriger, und er kann das Gerät sofort mitnehmen.", "2–5"],
    ["Was kostet das Onlineangebot einschließlich Versand?", "Sechsundzwanzig Euro: zwanzig Euro plus sechs Euro Versand.", "1, 3"],
    ["Das Onlineangebot ist sechs Euro günstiger als das Geschäft. Richtig?", "Nein: Mit Versand kostet es einen Euro mehr als im Geschäft.", "1–3"]
  ]),
  lesson("A2-7.20", "Die falsche Größe", [
    "Sara hat eine blaue Jacke in Größe vierzig bestellt.",
    "Geliefert wird dieselbe Farbe, aber in Größe sechsunddreißig.",
    "Sie schreibt dem Geschäft eine Nachricht mit Bestellnummer und einem Foto des Etiketts.",
    "Sie möchte die richtige Größe erhalten, keine andere Farbe.",
    "Das Geschäft antwortet, dass es die Bestellung prüft und sich am nächsten Tag meldet."
  ], "Findet genau heraus, was an der Lieferung falsch ist.", [
    ["Was ist Saras Anliegen?", "Sie möchte die bestellte Jacke in der richtigen Größe erhalten.", "1–4"],
    ["Welche Nachweise schickt sie?", "Die Bestellnummer und ein Foto des Größenetiketts.", "3"],
    ["Sara möchte dieselbe Farbe behalten und nur die Größe ändern. Richtig?", "Ja: Die Farbe wurde richtig geliefert; Sara verlangt ausdrücklich keine andere Farbe.", "1–4"]
  ]),
  lesson("A2-8.21", "Ein Plan für Regen", [
    "Am Sonntag möchte unsere Gruppe am See picknicken.",
    "Wenn es trocken bleibt, treffen wir uns um zwölf Uhr am Bootshaus.",
    "Bei Regen gehen wir stattdessen ins Stadtmuseum und treffen uns erst um dreizehn Uhr dort.",
    "Am Samstagabend schreibt die Organisatorin den endgültigen Plan in den Gruppenchat.",
    "Bitte kauft vorher noch keine Eintrittskarten."
  ], "Unterscheidet die beiden Pläne und ihre Bedingungen.", [
    ["Warum nennt die Nachricht zwei Treffpunkte?", "Der Treffpunkt hängt vom Wetter ab: See bei trockenem Wetter, Museum bei Regen.", "2–3"],
    ["Wann wird der endgültige Plan bekannt gegeben?", "Am Samstagabend im Gruppenchat, also vor dem Ausflug.", "4"],
    ["Bei Regen trifft sich die Gruppe um zwölf Uhr im Museum. Richtig?", "Nein: Im Museum beginnt das Treffen erst um dreizehn Uhr.", "3"]
  ]),
  lesson("A2-8.22", "Nicht jede freie Stunde ist frei", [
    "Mia arbeitet montags und mittwochs bis sechzehn Uhr.",
    "Direkt danach braucht sie eine Stunde für den Heimweg und das Essen.",
    "Den Deutschkurs hat sie deshalb auf Dienstagabend gelegt.",
    "Freitags plant sie bewusst keinen festen Termin ein.",
    "Diese Zeit nutzt sie für Erholung oder Dinge, die unter der Woche liegen geblieben sind."
  ], "Findet heraus, warum Mia Zeit zwischen Terminen lässt.", [
    ["Was ist Mia bei ihrer Wochenplanung wichtig?", "Sie berücksichtigt Wege, Essen und freie Zeit zusätzlich zu festen Terminen.", "2–5"],
    ["Wann findet ihr Deutschkurs statt?", "Am Dienstagabend, nicht direkt nach der Arbeit am Montag.", "3"],
    ["Mia kann montags schon um sechzehn Uhr zu Hause lernen. Richtig?", "Nein: Nach Arbeitsende braucht sie noch eine Stunde für Heimweg und Essen.", "1–2"]
  ]),
  lesson("A2-9.23", "Ein anderer Arbeitsweg", [
    "Kojos Firma zieht im November in ein Gebäude außerhalb der Innenstadt.",
    "Bisher konnte er zu Fuß zur Arbeit gehen.",
    "Vom Bahnhof fährt jetzt ein Bus direkt zum neuen Büro, aber nur jede halbe Stunde.",
    "Kojo testet die Verbindung schon vor dem Umzug.",
    "Er merkt, dass er einen früheren Zug nehmen muss, damit er den passenden Bus erreicht."
  ], "Findet die neue Schwierigkeit auf Kojos Arbeitsweg.", [
    ["Warum muss Kojo seinen Arbeitsweg neu planen?", "Seine Firma zieht um; der neue Standort ist außerhalb der Innenstadt.", "1–2"],
    ["Wie oft fährt der Bus zum Büro?", "Nur jede halbe Stunde, weshalb der Anschluss wichtig ist.", "3"],
    ["Ein früherer Zug kann Kojo helfen, rechtzeitig zum Büro zu kommen. Stimmt das?", "Ja: Mit dem früheren Zug erreicht er den passenden Bus zum neuen Büro.", "3–5"]
  ]),
  lesson("A2-9.24", "Urlaub mit einer Bedingung", [
    "Ama und Lea möchten im August ans Meer fahren.",
    "Lea bekommt ihren Urlaub aber erst nächste Woche bestätigt.",
    "Sie suchen deshalb ein Zimmer, das sie kostenlos stornieren können.",
    "Ein günstigeres Angebot ohne Stornierung lassen sie liegen.",
    "Erst wenn Lea frei bekommt, buchen sie die Zugtickets."
  ], "Findet heraus, warum der günstigste Preis nicht entscheidet.", [
    ["Was ist den beiden bei der Unterkunft besonders wichtig?", "Kostenlose Stornierung, weil Leas Urlaub noch nicht bestätigt ist.", "2–4"],
    ["Wann buchen sie die Zugtickets?", "Erst nach der Bestätigung, dass Lea Urlaub bekommt.", "5"],
    ["Das stornierbare Zimmer kostet insgesamt mehr als die beiden bezahlen können. Steht das fest?", "Das bleibt offen: Ein anderes Angebot ist günstiger, aber ihr Budget wird nicht genannt.", "3–4"]
  ]),
  lesson("A2-9.25", "Annas geänderter Tagesablauf", [
    "Früher ist Anna um sieben Uhr aufgestanden und ohne Frühstück zur Arbeit gefahren.",
    "Seit einem Monat beginnt ihre Schicht erst um neun Uhr.",
    "Jetzt frühstückt sie zu Hause, bevor sie das Haus verlässt.",
    "Mittags isst sie weiterhin mit ihren Kollegen.",
    "Nach der Arbeit geht sie nur dienstags zum Sport; an den anderen Tagen fährt sie direkt heim."
  ], "Vergleicht Annas früheren und heutigen Alltag.", [
    ["Was hat sich durch die spätere Schicht verändert?", "Anna frühstückt jetzt zu Hause, bevor sie zur Arbeit fährt.", "1–3"],
    ["Was ist beim Mittagessen gleich geblieben?", "Sie isst weiterhin mit ihren Kollegen zusammen.", "4"],
    ["Anna macht nach jeder Schicht Sport. Stimmt das?", "Nein: Nur dienstags geht sie zum Sport; sonst fährt sie direkt nach Hause.", "5"]
  ]),
  lesson("A2-10.26", "Erleichtert nach der Nachricht", [
    "Vor dem ersten Kurstag ist Sara nervös, weil sie niemanden kennt.",
    "Im Gruppenchat liest sie, dass mehrere Teilnehmer auch neu sind.",
    "Das beruhigt sie, aber vor dem Sprechen hat sie noch etwas Angst.",
    "Als ihre Partnerin freundlich nachfragt, traut sie sich zu antworten.",
    "Nach der Stunde ist sie erleichtert und möchte wiederkommen."
  ], "Achtet darauf, wie Saras Gefühle sich verändern.", [
    ["Wie entwickelt sich Saras Stimmung?", "Sie ist zuerst nervös und nach der Stunde erleichtert.", "1, 5"],
    ["Was hilft ihr beim ersten Antworten?", "Ihre Partnerin fragt freundlich nach; dadurch traut sie sich zu sprechen.", "4"],
    ["Sara wird sicherer, obwohl sie anfangs noch Angst hat. Richtig?", "Ja: Sie traut sich zu antworten und möchte nach der Stunde wiederkommen.", "3–5"]
  ]),
  lesson("A2-10.27", "Eine Nachricht an die falsche Gruppe", [
    "Ben möchte seinem Freund eine neue Telefonnummer schicken.",
    "Aus Versehen sendet er sie in den Chat seines ganzen Sportvereins.",
    "Er löscht die Nachricht sofort und erklärt kurz den Fehler.",
    "Eine Kollegin sagt, dass sie die Nummer vorher bereits gesehen hat.",
    "Ben prüft deshalb beim nächsten Mal zuerst den Empfänger."
  ], "Findet heraus, was das Löschen einer Nachricht nicht sicher rückgängig macht.", [
    ["Was ist Bens Problem?", "Er sendet eine private Telefonnummer an eine ganze Gruppe statt an seinen Freund.", "1–2"],
    ["Was möchte er beim nächsten Mal zuerst prüfen?", "Den Empfänger, bevor er die Nachricht abschickt.", "5"],
    ["Alle Mitglieder des Sportvereins haben die Nummer gesehen. Ist das sicher?", "Das ist nicht geklärt: Eine Kollegin hat sie gesehen; über die anderen Personen steht nichts im Text.", "3–4"]
  ]),
  lesson("A2-10.28", "Ein Ziel mit kleinen Schritten", [
    "Kojo möchte nächstes Jahr eine Ausbildung beginnen.",
    "Dafür braucht er bessere Deutschkenntnisse und vollständige Bewerbungsunterlagen.",
    "Ab Montag wird er zweimal pro Woche mit einer Lerngruppe üben.",
    "Seinen Lebenslauf hat er schon geschrieben, aber die Zeugnisse muss er noch übersetzen lassen.",
    "Einen Ausbildungsplatz hat er bisher nicht."
  ], "Trennt Ziel, Vorbereitung und bereits Erledigtes.", [
    ["Worum geht es hauptsächlich?", "Um Kojos Vorbereitung auf eine Ausbildung, die er nächstes Jahr beginnen möchte.", "1–4"],
    ["Welche Unterlage hat er bereits vorbereitet?", "Den Lebenslauf; die Zeugnisübersetzungen fehlen noch.", "4"],
    ["Kojo beginnt am Montag sicher seine Ausbildung. Richtig?", "Nein: Am Montag beginnt das Üben; einen Ausbildungsplatz hat er noch nicht.", "3, 5"]
  ]),
  lesson("B1-1.1", "Vom Cockpit in die Werkstatt", [
    "Als Jugendlicher wollte Ben Pilot werden, weil er Reisen mit Freiheit verband.",
    "Während eines Schulpraktikums in einer Werkstatt entdeckte er jedoch, wie gern er technische Probleme löst.",
    "Er entschied sich für eine Ausbildung zum Mechatroniker, obwohl seine Familie zunächst überrascht war.",
    "Heute reist er weiterhin gern, möchte aber nicht ständig beruflich unterwegs sein.",
    "Seinen früheren Traum betrachtet er deshalb als Ausgangspunkt und nicht als gescheiterten Plan."
  ], "Erkennt, warum Ben seinen früheren Berufswunsch heute anders bewertet.", [
    ["Was verändert Bens Berufsentscheidung?", "Die praktische Erfahrung zeigt ihm ein Interesse, das sein früherer Traum noch nicht berücksichtigt hatte.", "2–3"],
    ["Warum möchte Ben heute kein ständiges berufliches Reisen?", "Er reist zwar gern, möchte aber nicht ständig für den Beruf unterwegs sein.", "4"],
    ["Bens heutige Entscheidung passt zu Erfahrungen, die er als Jugendlicher noch nicht hatte. Belegt?", "Ja: Erst im Praktikum entdeckt er seine Freude am technischen Problemlösen und wählt danach die Ausbildung.", "1–3"]
  ]),
  lesson("B1-1.2", "Zuverlässig trotz einer Absage", [
    "Als Ama umzieht, verspricht ihr Freund Kojo, am Samstag beim Tragen zu helfen.",
    "Am Freitag muss er wegen einer unerwarteten Arbeitsschicht absagen.",
    "Er informiert Ama sofort, organisiert einen anderen Helfer und bringt ihr am Abend Umzugskartons.",
    "Ama ist zunächst enttäuscht, findet sein Verhalten am Ende aber zuverlässig.",
    "Für sie bedeutet Freundschaft nicht, immer verfügbar zu sein, sondern Verantwortung für Zusagen zu übernehmen."
  ], "Prüft, woran Ama Zuverlässigkeit festmacht.", [
    ["Welche Vorstellung von Freundschaft vertritt Ama?", "Verantwortung für Zusagen ist ihr wichtiger als ständige Verfügbarkeit; Kojo kümmert sich trotz Absage.", "3–5"],
    ["Was verhindert Kojos Hilfe am Samstag?", "Eine unerwartete Arbeitsschicht; die Absage erfolgt schon am Freitag.", "2"],
    ["Behauptung: Wer absagt, kann sich nicht zuverlässig verhalten. Passt das zum Text?", "Nein: Kojo informiert früh und organisiert Ersatz. Gerade diese Reaktion bewertet Ama positiv.", "3–5"]
  ]),
  lesson("B1-1.3", "Der Laden öffnet später", [
    "Lea wollte ihren kleinen Laden im Mai eröffnen, doch eine Reparatur verzögerte den Start.",
    "Während sie wartete, verkaufte sie einige Produkte online und sammelte Rückmeldungen von Kunden.",
    "Eine Freundin half ihr bei den Fotos, während Lea selbst die Bestellungen bearbeitete.",
    "Im Juli konnte sie eröffnen und hatte durch den Onlineverkauf bereits erste Stammkunden.",
    "Sie sagt heute, die Verzögerung sei schwierig gewesen, habe ihr aber auch beim Testen des Angebots geholfen."
  ], "Unterscheidet Hindernis, Reaktion und Ergebnis.", [
    ["Welche Rolle spielt die Verzögerung für Leas Erfolg?", "Sie erschwert den Start, schafft aber auch Zeit, das Angebot online zu testen und Kunden zu gewinnen.", "1–2, 4–5"],
    ["Welche Aufgabe übernimmt Leas Freundin?", "Sie hilft bei den Produktfotos; die Bestellungen bearbeitet Lea selbst.", "3"],
    ["Kann man ableiten, dass die Reparatur für den Erfolg notwendig war?", "Nein: Der Text zeigt einen Nutzen der Wartezeit, beweist aber nicht, dass Erfolg ohne Reparatur unmöglich gewesen wäre.", "2, 5"]
  ]),
  lesson("B1-2.4", "Der Balkon verliert", [
    "Sara und Ben suchen eine Wohnung und wünschen sich zunächst einen Balkon sowie ein zusätzliches Arbeitszimmer.",
    "Eine zentrale Wohnung ohne Balkon liegt innerhalb ihres Budgets und nahe an Saras Arbeitsstelle.",
    "Eine größere Wohnung am Stadtrand bietet beides, würde aber höhere Fahrtkosten verursachen.",
    "Weil Ben überwiegend im Büro arbeitet, halten sie ein eigenes Arbeitszimmer schließlich für verzichtbar.",
    "Sie wählen die zentrale Wohnung und möchten den Park in der Nähe als Ausgleich nutzen."
  ], "Erkennt, welche Prioritäten die Entscheidung verändern.", [
    ["Was entscheidet stärker als die ursprüngliche Wunschliste?", "Budget, Fahrtkosten und der tatsächliche Bedarf an einem Arbeitszimmer beeinflussen die Wahl.", "2–4"],
    ["Welchen Nachteil hat die größere Wohnung zusätzlich zur Entfernung?", "Sie verursacht höhere Fahrtkosten; mehr Platz ist also nicht das einzige Kriterium.", "3"],
    ["Die beiden verzichten bewusst auf Wünsche, um wichtigere Bedürfnisse zu erfüllen. Belegt?", "Ja: Sie gewichten Kosten, Lage und tatsächlichen Platzbedarf stärker als Balkon und zusätzliches Zimmer.", "1–5"]
  ]),
  lesson("B1-2.5", "Eine Besichtigung mit offener Frage", [
    "Bei einer Wohnungsbesichtigung gefällt Nora besonders die helle Küche.",
    "Auf ihre Frage nach den Nebenkosten nennt der Vermieter nur den Betrag des vergangenen Jahres.",
    "Ob die Heizkosten inzwischen gestiegen sind, kann er ihr beim Termin noch nicht sagen.",
    "Nora bittet deshalb höflich um eine aktuelle Aufstellung und notiert die übrigen Angaben.",
    "Sie möchte erst entscheiden, wenn sie die Gesamtkosten mit denen einer zweiten Wohnung vergleichen kann."
  ], "Erkennt, welche Information Nora vor einer Entscheidung noch fehlt.", [
    ["Warum entscheidet Nora trotz des guten Eindrucks noch nicht?", "Die aktuellen Gesamtkosten sind ungeklärt; sie möchte Angebote auf einer verlässlichen Grundlage vergleichen.", "2–5"],
    ["Auf welchen Zeitraum bezieht sich der genannte Nebenkostenbetrag?", "Auf das vergangene Jahr, nicht auf eine bestätigte aktuelle Berechnung.", "2–3"],
    ["Behauptung: Der Vermieter bestätigt höhere Heizkosten. Belegt, widerlegt oder nicht geklärt?", "Nicht geklärt: Er kann noch nicht sagen, ob sie gestiegen sind. Unsicherheit ist keine Bestätigung.", "3"]
  ]),
  lesson("B1-2.6", "Mehr Platz, längere Wege", [
    "Nach der Geburt ihres zweiten Kindes zieht eine Familie von der Innenstadt in ein Dorf.",
    "Die Eltern freuen sich über mehr Platz und einen Garten, vermissen aber die kurzen Wege.",
    "Während der Vater meist von zu Hause arbeitet, fährt die Mutter täglich mit dem Auto zur Arbeit.",
    "Ohne ihr zweites Auto wäre der Alltag schwierig, da der Bus abends selten fährt.",
    "Die Familie ist mit dem Umzug zufrieden, hält das Dorfleben aber nicht für jede Lebenssituation für besser."
  ], "Erkennt Vorteil und Voraussetzung derselben Entscheidung.", [
    ["Wie bewertet die Familie das Dorfleben?", "Für ihre Situation positiv, jedoch mit Einschränkungen durch längere Wege und die Abhängigkeit vom Auto.", "2–5"],
    ["Wer pendelt täglich zur Arbeit?", "Die Mutter fährt täglich mit dem Auto; der Vater arbeitet meist zu Hause.", "3"],
    ["Welche Voraussetzung macht die Zufriedenheit leichter nachvollziehbar?", "Die Familie verfügt über zwei Autos und teilweise Homeoffice. Diese Möglichkeiten hat nicht jede Familie.", "3–4"]
  ]),
  lesson("B1-3.7", "Zwei Mittagessen im Vergleich", [
    "In der Kantine diskutieren Lea und Ben darüber, ob selbst gekochtes Essen immer gesünder ist.",
    "Ben bringt einen großen Auflauf mit viel Käse mit, während Lea einen gekauften Salat mit Bohnen isst.",
    "Lea weist darauf hin, dass Zutaten und Portionsgröße mehr verraten als die Herkunft des Essens.",
    "Ben ergänzt, dass er den Auflauf normalerweise mit Gemüse kombiniert und nicht täglich isst.",
    "Beide stellen fest, dass ein einzelnes Mittagessen noch wenig über die gesamten Essgewohnheiten aussagt."
  ], "Prüft, welche Schlussfolgerungen die Beispiele tatsächlich erlauben.", [
    ["Welche gemeinsame Schlussfolgerung ziehen die beiden?", "Ein einzelnes Gericht oder das Etikett selbst gekocht reicht zur Bewertung der gesamten Ernährung nicht aus.", "3–5"],
    ["Welche zusätzliche Information gibt Ben über seinen Auflauf?", "Er isst ihn nicht täglich und kombiniert ihn normalerweise mit Gemüse.", "4"],
    ["Bens Zusatzinformation macht ein pauschales Urteil über den Auflauf schwieriger. Belegt?", "Ja: Häufigkeit und Kombination mit Gemüse ergänzen das Einzelbeispiel; die gesamten Gewohnheiten bleiben wichtig.", "2–5"]
  ]),
  lesson("B1-3.8", "Ein Tipp ist keine Verpflichtung", [
    "Im Betrieb hängt ein neues Angebot für Bewegungspausen aus.",
    "Die Teilnahme ist freiwillig, und die Übungen können im Sitzen oder im Stehen gemacht werden.",
    "In einer Nachricht schreibt Ben trotzdem, dass jetzt alle jeden Morgen mitmachen müssen.",
    "Die Organisatorin korrigiert ihn: Das Angebot soll Bewegung erleichtern, ersetzt aber keine individuelle Beratung.",
    "Wer unsicher ist, ob eine Übung passt, soll dies vor der Teilnahme klären."
  ], "Unterscheidet Angebot, Empfehlung und behauptete Pflicht.", [
    ["Welches Missverständnis muss die Organisatorin korrigieren?", "Ben macht aus einem freiwilligen Angebot eine Pflicht für alle.", "2–4"],
    ["Welche zwei Varianten der Übungen werden angeboten?", "Übungen im Sitzen oder im Stehen; die Teilnahme bleibt freiwillig.", "2"],
    ["Kann man ableiten, dass jede Übung für jede Person geeignet ist?", "Nein: Bei Unsicherheit soll die Eignung vorher geklärt werden; das Angebot ersetzt keine individuelle Beratung.", "4–5"]
  ]),
  lesson("B1-3.9", "Feierabend mit Ausnahmen", [
    "Amas Team darf seine Arbeitszeiten flexibel gestalten, doch Nachrichten kommen oft noch spät am Abend.",
    "Ama schaltet Benachrichtigungen aus, befürchtet aber, wichtige Informationen zu verpassen.",
    "Im Teamgespräch vereinbaren alle, dass gewöhnliche Anfragen bis zum nächsten Arbeitstag warten können.",
    "Für echte dringende Fälle wird ein gesonderter Kontaktweg eingerichtet.",
    "Erst durch diese gemeinsame Regel kann Ama ihre persönliche Feierabendgrenze entspannt einhalten."
  ], "Findet heraus, warum eine persönliche Strategie allein nicht ausreicht.", [
    ["Was verbessert Amas Situation entscheidend?", "Eine gemeinsame Regel ergänzt ihre persönliche Strategie und klärt die Erwartung an Erreichbarkeit.", "2–5"],
    ["Wie werden dringende Fälle behandelt?", "Dafür gibt es einen gesonderten Kontaktweg; gewöhnliche Anfragen können warten.", "3–4"],
    ["Behauptung: Nach Feierabend darf niemand mehr Kontakt aufnehmen. Stimmt das?", "Nein: Die Regel unterscheidet gewöhnliche Nachrichten von echten dringenden Fällen.", "3–4"]
  ]),
  lesson("B1-4.10", "Offline mit einer Ausnahme", [
    "Lea möchte abends weniger Zeit am Smartphone verbringen und probiert eine Woche lang eine neue Regel aus.",
    "Ab einundzwanzig Uhr legt sie das Gerät in den Flur, lässt Anrufe ihrer pflegebedürftigen Mutter aber zu.",
    "Nach drei Tagen schläft sie subjektiv ruhiger, kann jedoch noch nicht sagen, ob allein die Regel dafür verantwortlich ist.",
    "Am Wochenende passt sie die Zeit an, weil sie spät von einer Veranstaltung zurückkommt.",
    "Sie will die Regel beibehalten, solange sie zu ihrem Alltag passt."
  ], "Prüft, wie sicher Leas Beobachtung und wie streng ihre Regel ist.", [
    ["Welche Haltung zur digitalen Auszeit zeigt Lea?", "Sie setzt eine alltagstaugliche Grenze mit begründeten Ausnahmen, statt völlig auf Erreichbarkeit zu verzichten.", "2, 4–5"],
    ["Welche Anrufe bleiben möglich?", "Die Anrufe ihrer pflegebedürftigen Mutter sind ausdrücklich erlaubt.", "2"],
    ["Leas Regel erlaubt Ausnahmen, ohne ihr Ziel aufzugeben. Belegt?", "Ja: Sie bleibt für ihre Mutter erreichbar und passt die Uhrzeit an, behält aber die Bildschirmgrenze grundsätzlich bei.", "2, 4–5"]
  ]),
  lesson("B1-4.11", "Klare Rollen, gemeinsame Hilfe", [
    "Ein Kursteam soll bis Freitag eine Präsentation fertigstellen und verteilt zuerst die Aufgaben.",
    "Kojo recherchiert, Sara gestaltet die Folien und Ben prüft die Sprache.",
    "Als Kojo eine wichtige Quelle nicht findet, arbeiten die anderen kurz mit ihm daran, ohne ihre eigenen Rollen aufzugeben.",
    "Bei der Probe kritisiert Ben eine unklare Folie und erklärt genau, welche Information fehlt.",
    "Sara ändert die Folie, weil sie die Kritik als Hilfe an der gemeinsamen Aufgabe versteht."
  ], "Erkennt, wie Rollenverteilung und Kooperation zusammenpassen.", [
    ["Was zeigt die Zusammenarbeit des Teams?", "Klare Zuständigkeiten schließen gegenseitige Hilfe nicht aus; Kritik bleibt auf die Aufgabe bezogen.", "2–5"],
    ["Wer ist ursprünglich für die Sprache zuständig?", "Ben prüft die Sprache; Sara gestaltet die Folien und Kojo recherchiert.", "2"],
    ["Behauptung: Bens Kritik richtet sich gegen Saras Persönlichkeit. Belegt?", "Nein: Er benennt eine fehlende Information auf einer Folie und damit ein konkretes Problem der Aufgabe.", "4–5"]
  ]),
  lesson("B1-4.12", "Die Brücke nach dem Regen", [
    "Bevor die Wandergruppe losging, hatte sie die Wettervorhersage geprüft und leichten Regen erwartet.",
    "Während sie durch den Wald wanderte, wurde der Regen jedoch deutlich stärker.",
    "Als die Gruppe die Brücke erreichte, sah sie, dass Wasser über den Weg floss.",
    "Sie kehrte deshalb um und erreichte die Schutzhütte, nachdem der Regen bereits nachgelassen hatte.",
    "Obwohl das Ziel nah gewesen war, waren alle froh über die vorsichtige Entscheidung."
  ], "Findet den Wendepunkt und seine Folge.", [
    ["Welches Ereignis verändert den Verlauf der Wanderung entscheidend?", "Das Wasser am Weg bei der Brücke führt zur Entscheidung umzukehren.", "3–4"],
    ["Wann lässt der Regen im Verhältnis zur Ankunft nach?", "Schon vor der Ankunft an der Schutzhütte hat der Regen nachgelassen.", "4"],
    ["Behauptung: Die Gruppe hatte sich nicht über das Wetter informiert. Stimmt das?", "Nein: Sie hatte die Vorhersage geprüft; der Regen fiel stärker aus als erwartet.", "1–2"]
  ]),
  lesson("B1-4.13", "Langsam, aber überzeugend", [
    "Der Film begleitet eine junge Frau, die nach vielen Jahren in ihr Heimatdorf zurückkehrt.",
    "In der ersten Hälfte passiert wenig, und einige Landschaftsszenen wirken auf mich zu lang.",
    "Die Gespräche mit ihrem Vater zeigen jedoch überzeugend, wie schwierig ihre Beziehung geworden ist.",
    "Besonders eine stille Szene am Küchentisch erklärt mehr als die ausführliche Rückblende davor.",
    "Ich empfehle den Film Menschen, die ruhige Familiengeschichten mögen, würde ihn aber nicht als spannenden Thriller bezeichnen."
  ], "Trennt Filminhalt, Bewertung und begründete Empfehlung.", [
    ["Wie fällt die Bewertung insgesamt aus?", "Eingeschränkt positiv: Die Beziehung überzeugt, obwohl die Erzählweise teilweise zu langsam wirkt.", "2–5"],
    ["Welche Szene wird als besonders aussagekräftig hervorgehoben?", "Die stille Szene am Küchentisch erklärt für den Verfasser besonders viel.", "4"],
    ["Die Kritik kann zugleich einen Schwachpunkt nennen und den Film empfehlen. Belegt?", "Ja: Die langsamen Szenen werden kritisiert, die Beziehung überzeugt dennoch und führt zu einer gezielten Empfehlung.", "2–5"]
  ]),
  lesson("B1-5.14", "Online vorbereiten, gemeinsam klären", [
    "Ein Sprachkurs verlegt die Erklärung neuer Inhalte in kurze Videos, die vor dem Unterricht angesehen werden können.",
    "Sara schätzt, dass sie schwierige Stellen mehrmals abspielen kann.",
    "Kojo hat zu Hause selten Ruhe und versteht manche Inhalte erst beim direkten Nachfragen im Kurs.",
    "Die Lehrerin behält deshalb die Videos bei, plant aber am Stundenanfang Zeit für offene Fragen ein.",
    "Die Lernenden nutzen so dieselben Materialien, brauchen jedoch unterschiedliche Unterstützung."
  ], "Erkennt, warum der Kurs beide Lernformen verbindet.", [
    ["Warum entscheidet sich die Lehrerin für eine Kombination?", "Die Videos bieten Wiederholung, während direkte Rückfragen andere Bedürfnisse auffangen.", "2–5"],
    ["Welche Schwierigkeit hat Kojo bei der Vorbereitung?", "Er hat zu Hause selten Ruhe und braucht teilweise direkten Austausch.", "3"],
    ["Behauptung: Gleiche Materialien führen automatisch zu gleichen Lernbedingungen. Passt das?", "Nein: Saras und Kojos Erfahrungen zeigen unterschiedliche Bedingungen und Unterstützungsbedarfe.", "2–3, 5"]
  ]),
  lesson("B1-5.15", "Zu Hause und trotzdem erreichbar", [
    "Ben spart durch Homeoffice täglich eine Stunde Fahrtzeit und kann sein Kind nachmittags früher abholen.",
    "Gleichzeitig beantwortet er Arbeitsnachrichten oft noch nach dem Abendessen, weil sein Team unterschiedliche Zeiten nutzt.",
    "Er schlägt eine gemeinsame Kernzeit und eine klare Regel für Antworten außerhalb dieser Zeit vor.",
    "Seine Chefin unterstützt einen vierwöchigen Versuch, möchte anschließend aber Rückmeldungen des ganzen Teams sammeln.",
    "Ben hofft auf bessere Grenzen, ohne die Flexibilität aufgeben zu müssen."
  ], "Findet den Konflikt zwischen Flexibilität und Abgrenzung.", [
    ["Was möchte Ben mit seinem Vorschlag erreichen?", "Er möchte die Vorteile des Homeoffice behalten und zugleich Erwartungen an Erreichbarkeit klären.", "1–3, 5"],
    ["Wie lange soll die neue Regel zunächst ausprobiert werden?", "Vier Wochen; anschließend sollen Rückmeldungen des Teams ausgewertet werden.", "4"],
    ["Behauptung: Die Chefin hat die Regel schon dauerhaft eingeführt. Stimmt das?", "Nein: Sie unterstützt zunächst einen Versuch mit anschließender Auswertung.", "4"]
  ]),
  lesson("B1-5.16", "Gut vorbereitet, trotzdem nervös", [
    "Obwohl Ama die Übungsaufgaben sicher löst, bekommt sie vor mündlichen Prüfungen Angst.",
    "Sie befürchtet, dass jeder kleine Fehler automatisch zum Durchfallen führt.",
    "Ihre Lehrerin erklärt die Bewertungskriterien und übt mit ihr kurze Prüfungssituationen.",
    "Nach mehreren Versuchen ist Ama noch aufgeregt, kann aber trotz eines Fehlers weitersprechen.",
    "Für sie bedeutet Fortschritt nun, mit der Nervosität umgehen zu können, statt überhaupt keine Angst mehr zu haben."
  ], "Erkennt, was sich verbessert, obwohl die Nervosität bleibt.", [
    ["Welches Problem steht im Mittelpunkt?", "Amas Angst vor der Bewertung, obwohl sie Übungsaufgaben fachlich sicher lösen kann.", "1–2"],
    ["Was tut die Lehrerin außer dem Üben?", "Sie erklärt die Bewertungskriterien und macht die Anforderungen verständlicher.", "3"],
    ["Fortschritt ist im Text auch mit verbleibender Nervosität möglich. Belegt?", "Ja: Ama ist weiterhin aufgeregt, kann aber trotz eines Fehlers weitersprechen und bewertet das als Fortschritt.", "4–5"]
  ]),
  lesson("B1-5.17", "Bekannt, aber nicht abrufbar", [
    "Kojo liest seine Vokabelliste jeden Abend und erkennt beim Lesen fast alle Wörter wieder.",
    "Im Gespräch fallen ihm dieselben Wörter jedoch oft nicht ein.",
    "Eine Lernpartnerin empfiehlt ihm, die Liste kurz zu schließen und Wörter aus dem Gedächtnis abzurufen.",
    "Zusätzlich vereinbaren sie zweimal pro Woche ein kurzes Gespräch über bekannte Themen.",
    "Nach zwei Wochen muss Kojo noch nachdenken, findet passende Wörter aber schneller als vorher."
  ], "Unterscheidet Wiedererkennen und selbstständiges Abrufen.", [
    ["Warum ändert Kojo seine Lernmethode?", "Wörter beim Lesen wiederzuerkennen reicht ihm für das selbstständige Sprechen nicht aus.", "1–2"],
    ["Wie oft sprechen die Lernpartner miteinander?", "Zweimal pro Woche über bereits bekannte Themen.", "4"],
    ["Behauptung: Nach zwei Wochen spricht Kojo ohne jede Wortsuche. Belegt?", "Nein: Er muss noch nachdenken, findet die Wörter aber schneller; Verbesserung bedeutet hier keine Fehlerfreiheit.", "5"]
  ]),
  lesson("B1-6.18", "Ein Ziel, mehrere Voraussetzungen", [
    "Sara möchte später ein Team in einem Hotel leiten und hat bereits mehrere Jahre Erfahrung im Service.",
    "In Stellenausschreibungen bemerkt sie, dass neben Erfahrung häufig Kenntnisse in Personalplanung verlangt werden.",
    "Sie besucht deshalb einen Abendkurs, um diese Lücke gezielt zu schließen.",
    "Ihr Arbeitgeber lässt sie zusätzlich bei der Dienstplanung mitarbeiten, damit sie das Gelernte praktisch anwenden kann.",
    "Eine Beförderung ist damit nicht garantiert, aber Sara kann sich nun auf passendere Stellen bewerben."
  ], "Erkennt, welche Lücke Sara gezielt schließt.", [
    ["Warum reicht Saras bisherige Erfahrung für ihr Ziel nicht allein aus?", "Viele ausgeschriebene Stellen verlangen zusätzlich Kenntnisse in Personalplanung.", "1–3"],
    ["Wie ergänzt der Arbeitgeber den Abendkurs?", "Er ermöglicht praktische Mitarbeit an der Dienstplanung.", "4"],
    ["Behauptung: Der Kurs garantiert Sara die Teamleitung. Stimmt das?", "Nein: Er verbessert ihre Bewerbungsmöglichkeiten, garantiert aber keine Beförderung.", "5"]
  ]),
  lesson("B1-6.19", "Eine ehrliche Antwort im Gespräch", [
    "Im Vorstellungsgespräch wird Ben gefragt, ob er schon ein großes Team geleitet hat.",
    "Er erklärt, dass er bisher nur zwei Praktikanten betreut hat, und beschreibt seine konkreten Aufgaben.",
    "Außerdem nennt er einen Konflikt, bei dem er zunächst zu spät reagiert und danach regelmäßige Gespräche eingeführt hat.",
    "Die Personalchefin fragt genauer nach dieser Veränderung, statt das Gespräch abzubrechen.",
    "Ben weiß nach dem Termin noch nicht, ob er die Stelle bekommt, findet seine Antworten aber ehrlich und nachvollziehbar."
  ], "Prüft, wie Ben begrenzte Erfahrung glaubwürdig darstellt.", [
    ["Was kennzeichnet Bens Antworten?", "Er beschreibt seine tatsächliche Erfahrung und zeigt an einem Fehler, was er verändert hat.", "2–3"],
    ["Wie viele Praktikanten hat er betreut?", "Zwei Praktikanten; ein großes Team hat er noch nicht geleitet.", "2"],
    ["Ben versucht, einen früheren Fehler als Lernprozess nachvollziehbar zu machen. Belegt?", "Ja: Er nennt seine zunächst späte Reaktion und die danach eingeführten regelmäßigen Gespräche.", "3"]
  ]),
  lesson("B1-6.20", "Nicht jede Anforderung ist Pflicht", [
    "In einer Anzeige sucht eine Firma eine Mitarbeiterin für den Kundenservice.",
    "Sehr gute Deutschkenntnisse und Erfahrung im Kundenkontakt werden vorausgesetzt, Kenntnisse einer zweiten Fremdsprache sind dagegen nur erwünscht.",
    "Lea erfüllt die ersten beiden Anforderungen, spricht aber keine weitere Fremdsprache sicher.",
    "Sie bewirbt sich trotzdem und erklärt anhand ihrer bisherigen Arbeit, wie sie schwierige Kundenanfragen gelöst hat.",
    "Ob sie eingeladen wird, steht noch nicht fest; die Anzeige schließt ihre Bewerbung jedoch nicht aus."
  ], "Unterscheidet notwendige und zusätzliche Qualifikationen.", [
    ["Warum ist Leas Bewerbung trotz einer fehlenden Fähigkeit nachvollziehbar?", "Sie erfüllt die vorausgesetzten Anforderungen; die zweite Fremdsprache ist lediglich erwünscht.", "2–3"],
    ["Womit belegt Lea ihre Erfahrung?", "Mit Beispielen zur Lösung schwieriger Kundenanfragen aus ihrer bisherigen Arbeit.", "4"],
    ["Behauptung: Weil Lea die Pflichtanforderungen erfüllt, muss die Firma sie einladen. Belegt?", "Nein: Die Bewerbung ist möglich, eine Einladung wird aber nicht garantiert.", "5"]
  ]),
  lesson("B1-7.21", "Günstiger wohnen hat seinen Preis", [
    "Nach dem Studienbeginn zieht Ama in eine Wohngemeinschaft, weil ein eigenes Apartment zu teuer wäre.",
    "Sie teilt Küche und Bad mit zwei anderen Personen und spart dadurch monatlich Geld.",
    "Nach einigen Wochen entstehen Konflikte über Gäste und die Reinigung der gemeinsamen Räume.",
    "Die drei vereinbaren feste Aufgaben und sprechen Besuche vorher ab, behalten aber jeweils ihr eigenes Zimmer als privaten Bereich.",
    "Ama bleibt in der Wohnung, obwohl sie weiterhin manchmal mehr Ruhe vermisst."
  ], "Erkennt, welche Abwägung hinter Amas Entscheidung steht.", [
    ["Wie bewertet Ama ihre Wohnform am Ende?", "Sie bleibt wegen der Vorteile, obwohl Regeln die Konflikte nur teilweise lösen und ihr manchmal Ruhe fehlt.", "2–5"],
    ["Welche Bereiche werden geteilt?", "Küche und Bad sind gemeinsam; die einzelnen Zimmer bleiben private Bereiche.", "2, 4"],
    ["Behauptung: Nach der Vereinbarung gibt es für Ama keine Nachteile mehr. Stimmt das?", "Nein: Sie vermisst weiterhin manchmal mehr Ruhe, entscheidet sich aber trotzdem fürs Bleiben.", "5"]
  ]),
  lesson("B1-7.22", "Erwartungen in einer Partnerschaft", [
    "Leila und Tom haben sich über eine Dating-App kennengelernt und sind seit drei Monaten ein Paar.",
    "Leila möchte die Wochenenden oft gemeinsam verbringen, während Tom auch Zeit für seine Freunde braucht.",
    "Als Tom zwei Treffen kurzfristig absagt, glaubt Leila zunächst, dass ihm die Beziehung nicht wichtig ist.",
    "In einem ruhigen Gespräch erklären beide ihre Erwartungen und vereinbaren, gemeinsame Termine früher abzusprechen.",
    "Sie sind sich einig, dass Online-Dating neue Kontakte ermöglicht, eine Beziehung, in der man einander vertraut und respektiert, aber mehr braucht als schöne Profile."
  ], "Erkennt unterschiedliche Erwartungen an eine Partnerschaft und bewertet die Grenzen des Online-Datings.", [
    ["Welche unterschiedlichen Erwartungen haben Leila und Tom?", "Leila möchte oft gemeinsame Wochenenden verbringen, Tom braucht auch Zeit für seine Freunde.", "2"],
    ["Warum zweifelt Leila zunächst an Toms Interesse, und wie lösen sie das Problem?", "Tom sagt Treffen kurzfristig ab; sie klären ihre Erwartungen in einem Gespräch und sprechen Termine künftig früher ab.", "3–4"],
    ["Wie beurteilen die beiden Online-Dating und die Werte in einer Beziehung?", "Eine Dating-App kann das Kennenlernen erleichtern; für eine Partnerschaft sind Vertrauen und gegenseitiger Respekt wichtiger als schöne Profile.", "1, 5"]
  ]),
  lesson("B1-7.23", "Ein erstes Treffen ohne Druck", [
    "Lea und Ben verabreden sich nach einigen Nachrichten zum ersten Mal in einem Café.",
    "Lea sagt vorher, dass sie nur eine Stunde Zeit hat, weil sie danach eine Freundin trifft.",
    "Ben akzeptiert das und fragt beim Treffen nach ihren Interessen, ohne auf sehr privaten Antworten zu bestehen.",
    "Als die Stunde vorbei ist, verabschieden sie sich freundlich und vereinbaren noch keinen neuen Termin.",
    "Lea schreibt später, dass sie das Gespräch angenehm fand und über ein weiteres Treffen nachdenken möchte."
  ], "Unterscheidet freundliches Interesse und eine feste Zusage.", [
    ["Was macht das Treffen für Lea angenehm?", "Ben respektiert ihre Zeitgrenze und drängt sie nicht zu privaten Antworten.", "2–3, 5"],
    ["Warum ist das Treffen von Anfang an zeitlich begrenzt?", "Lea hat danach bereits eine Verabredung mit einer Freundin.", "2"],
    ["Behauptung: Ein zweites Treffen ist bereits vereinbart. Belegt?", "Nein: Lea äußert Interesse, möchte aber noch darüber nachdenken; einen Termin gibt es nicht.", "4–5"]
  ]),
  lesson("B1-8.24", "Neu kaufen oder reparieren?", [
    "Saras Waschmaschine funktioniert nach acht Jahren nicht mehr zuverlässig, und sie überlegt, ein sparsameres Modell zu kaufen.",
    "Eine Werkstatt stellt fest, dass nur ein kleines Teil ersetzt werden muss.",
    "Sara vergleicht deshalb nicht nur Stromverbrauch und Preis, sondern auch Material und Aufwand für die Herstellung einer neuen Maschine.",
    "Da die Reparatur bezahlbar ist, lässt Sara die Maschine reparieren und nutzt sie danach weiter.",
    "Für sie ist ein neues Produkt nicht automatisch nachhaltiger, nur weil es im Betrieb weniger Energie verbraucht."
  ], "Erkennt, welche zusätzlichen Faktoren Saras Entscheidung beeinflussen.", [
    ["Warum entscheidet Sara sich für eine Reparatur?", "Ein kleines Teil reicht aus, die Reparatur ist bezahlbar und vermeidet zunächst eine Neuanschaffung.", "2–4"],
    ["Welche Faktoren berücksichtigt sie neben Verbrauch und Preis?", "Material und Aufwand der Herstellung eines neuen Geräts fließen in den Vergleich ein.", "3"],
    ["Behauptung: Das sparsamste Neugerät ist laut Text immer die nachhaltigste Wahl. Stimmt das?", "Nein: Sara betrachtet auch die Herstellung und die Möglichkeit, das alte Gerät weiter zu nutzen.", "3–5"]
  ]),
  lesson("B1-8.25", "Die Lieferung ist noch nicht da", [
    "Ben bestellt Kopfhörer bei einem Onlineshop und speichert Bestellbestätigung sowie Zahlungsbeleg.",
    "Nach einer Woche zeigt die Sendungsverfolgung zugestellt an, doch Ben hat kein Paket erhalten.",
    "Er fragt zuerst im Haushalt und bei den Nachbarn nach, findet die Lieferung aber nicht.",
    "Anschließend schreibt er dem Shop mit Bestellnummer und einer sachlichen Beschreibung des Problems.",
    "Der Shop kündigt eine Prüfung an; ob Ben Ersatz oder eine Rückzahlung erhält, ist noch offen."
  ], "Trennt dokumentierte Angaben von ungeklärten Ergebnissen.", [
    ["Was ist der Widerspruch in Bens Fall?", "Die Sendungsverfolgung meldet eine Zustellung, während Ben kein Paket erhalten hat.", "2–3"],
    ["Welche Unterlagen hat Ben aufbewahrt?", "Bestellbestätigung und Zahlungsbeleg; in seiner Nachricht nennt er außerdem die Bestellnummer.", "1, 4"],
    ["Die Anzeige zugestellt beweist im Text nicht, dass Ben das Paket persönlich erhalten hat. Belegt?", "Ja: Trotz dieser Anzeige hat Ben kein Paket, und auch seine Nachfrage im Haushalt und bei Nachbarn bleibt erfolglos.", "2–3"]
  ]),
  lesson("B1-9.26", "Anschluss verpasst, Plan geändert", [
    "Wegen einer Zugverspätung verpasst eine Reisegruppe ihren Anschluss zum Flughafen.",
    "Ein Taxi wäre am schnellsten, übersteigt aber das gemeinsame Budget.",
    "Die Gruppe prüft eine andere Bahnverbindung und informiert gleichzeitig die Fluggesellschaft über die erwartete Ankunft.",
    "Ein Mitarbeiter erklärt, welche Möglichkeiten bestehen, bestätigt jedoch noch keine kostenlose Umbuchung.",
    "Die Reisenden nehmen die alternative Bahn und bewahren ihre Belege auf, um den Verlauf später nachvollziehen zu können."
  ], "Erkennt Entscheidung, Einschränkung und noch offene Folgen.", [
    ["Wie geht die Gruppe mit dem Problem um?", "Sie prüft eine bezahlbare Alternative, informiert die Fluggesellschaft und dokumentiert den Verlauf.", "2–5"],
    ["Warum nimmt die Gruppe kein Taxi?", "Es wäre zwar am schnellsten, kostet aber mehr als das gemeinsame Budget zulässt.", "2"],
    ["Behauptung: Eine kostenlose Umbuchung ist sicher. Stimmt das?", "Nein: Der Mitarbeiter erklärt nur Möglichkeiten; eine kostenlose Umbuchung ist noch nicht bestätigt.", "4"]
  ]),
  lesson("B1-10.27", "Ein kleiner Weg mit großer Hürde", [
    "Ama möchte für kurze Einkäufe häufiger das Fahrrad statt des Autos nutzen.",
    "Seit vor dem Supermarkt sichere Fahrradständer stehen, fällt ihr diese Entscheidung leichter.",
    "Für schwere Einkäufe fährt sie weiterhin gelegentlich mit dem Auto, versucht aber mehrere Besorgungen zu verbinden.",
    "Sie berichtet nicht von einem völlig autofreien Alltag, sondern von einer schrittweisen Veränderung.",
    "Ihre Nachbarn interessieren sich für die Idee, wünschen sich aber zusätzlich einen sicheren Radweg."
  ], "Erkennt kleine Veränderungen und ihre praktischen Voraussetzungen.", [
    ["Wie beschreibt der Text Amas Veränderung?", "Als schrittweise Verringerung von Autofahrten, nicht als vollständigen Verzicht.", "1–4"],
    ["Was erleichtert ihr die Nutzung des Fahrrads?", "Sichere Fahrradständer vor dem Supermarkt erleichtern das Abstellen.", "2"],
    ["Kann man ableiten, dass Motivation allein für alle Nachbarn ausreicht?", "Nein: Die Nachbarn wünschen zusätzlich einen sicheren Radweg; die Bedingungen spielen ebenfalls eine Rolle.", "5"]
  ]),
  lesson("B1-10.28", "Eine Alternative muss erreichbar sein", [
    "Die Stadt möchte mehr Menschen zum Umstieg auf Bus und Bahn bewegen und startet eine Werbekampagne.",
    "Viele Beschäftigte am Stadtrand finden die Idee gut, können den Bus nach ihrer Spätschicht aber nicht mehr nutzen.",
    "Eine Bürgergruppe fordert deshalb spätere Verbindungen und bezahlbare Tickets statt nur weiterer Plakate.",
    "Die Stadt verlängert zunächst auf einer Linie probeweise den Betrieb und sammelt Daten zur Nutzung.",
    "Ob das Angebot dauerhaft ausgeweitet wird, soll nach dem Versuch entschieden werden."
  ], "Erkennt den Unterschied zwischen Aufforderung und nutzbarer Alternative.", [
    ["Was kritisiert die Bürgergruppe hauptsächlich?", "Werbung allein schafft keine nutzbare Alternative; Verbindungen und Preise müssen zum Alltag passen.", "2–3"],
    ["Wie reagiert die Stadt zunächst?", "Sie testet längere Betriebszeiten auf einer Linie und erfasst deren Nutzung.", "4"],
    ["Die Stadt möchte zunächst Erfahrungen sammeln, bevor sie über eine Ausweitung entscheidet. Belegt?", "Ja: Sie erfasst die Nutzung einer probeweise verlängerten Linie und entscheidet erst nach dem Versuch.", "4–5"]
  ]),

]);

export function getPresenterReadingLesson(assignmentId = "") {
  return PRESENTER_READING_LESSONS[String(assignmentId || "").trim().toUpperCase()] || null;
}
