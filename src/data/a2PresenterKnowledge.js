const A2_KNOWLEDGE = {
  "A2-1.1": {
    title: "Small Talk öffnet Gespräche",
    textDe: "Small Talk ist ein kurzes, freundliches Gespräch über sichere Alltagsthemen. Typisch sind Arbeit, Freizeit, Wetter, Wochenende oder der Weg zu einem Ort. Mit einer unbekannten Person beginnt man meistens neutral und höflich. Gute Small-Talk-Fragen sind offen genug für eine kurze Antwort, aber nicht zu privat. Nach der ersten Antwort hilft eine kleine Rückfrage, damit das Gespräch natürlich weitergeht.",
    checks: ["Welche Themen passen gut zu Small Talk?", "Warum sind sehr private Fragen am Anfang oft ungeeignet?", "Finde im Text ein Wort, das „friendly“ bedeutet."],
    activity: {
      title: "Frage oder zu privat?",
      instruction: "Entscheidet gemeinsam, welche Fragen für den ersten Small Talk passen.",
      prompts: ["Was machst du am Wochenende?", "Wie viel Geld verdienst du?", "Wie war dein Weg hierher?"],
      modelItems: ["Passt: Was machst du am Wochenende?", "Zu privat am Anfang: Wie viel Geld verdienst du?", "Passt: Wie war dein Weg hierher?"],
    },
  },
  "A2-1.2": {
    title: "Menschen klar beschreiben",
    textDe: "Eine gute Personenbeschreibung nennt nicht nur Aussehen. Sie kann auch Kleidung, Charakter und Verhalten verbinden. Statt viele einzelne Adjektive aufzuzählen, ist ein konkretes Beispiel oft stärker: „Er ist hilfsbereit, weil er neuen Kollegen alles erklärt.“ Bei unbekannten Personen sollte man sachlich bleiben und keine negativen Vermutungen über Charakter oder Herkunft machen.",
    checks: ["Welche vier Bereiche kann eine Personenbeschreibung enthalten?", "Warum ist ein Beispiel oft besser als eine lange Adjektivliste?", "Welche Beschreibung ist sachlicher: Verhalten beschreiben oder etwas vermuten?"],
    activity: {
      title: "Beschreibung verbessern",
      instruction: "Macht aus einer einfachen Beschreibung eine genauere A2-Beschreibung.",
      prompts: ["Sie ist nett.", "Er ist groß.", "Sie trägt eine Jacke."],
      modelItems: ["Sie ist freundlich und hilft ihren Kollegen oft.", "Er ist groß und hat kurze dunkle Haare.", "Sie trägt eine blaue Jacke und eine schwarze Hose."],
    },
  },
  "A2-1.3": {
    title: "Vergleichen braucht ein Kriterium",
    textDe: "Ein Vergleich ist klarer, wenn man zuerst sagt, was man vergleicht: Preis, Größe, Geschwindigkeit, Komfort oder Qualität. Zwei Dinge vergleicht man oft mit Komparativ + als: „Der Zug ist schneller als der Bus.“ Bei Gleichheit steht so/genauso + Adjektiv + wie. Wenn etwas innerhalb einer Gruppe den höchsten Grad hat, benutzt man häufig den Superlativ.",
    checks: ["Nenne zwei mögliche Vergleichskriterien.", "Welche Struktur benutzt man für zwei unterschiedliche Dinge?", "Wann braucht man wie statt als?"],
    activity: {
      title: "Sortiere den Vergleich",
      instruction: "Ordnet die drei Aussagen: Unterschied, Gleichheit oder höchster Grad.",
      prompts: ["Der Zug ist schneller als der Bus.", "Anna ist genauso groß wie Mia.", "Das Fahrrad ist am günstigsten."],
      modelItems: ["Unterschied → schneller als", "Gleichheit → genauso groß wie", "Höchster Grad → am günstigsten"],
    },
  },
  "A2-2.4": {
    title: "Ein Treffen braucht vier Informationen",
    textDe: "Damit eine Verabredung funktioniert, müssen beide Personen denselben Plan verstehen. Meist braucht man Aktivität, Ort, Uhrzeit und eine Bestätigung. Wenn ein Termin nicht passt, ist eine konkrete Alternative besser als nur „Nein“. Bei Orten ist außerdem wichtig, zwischen Position und Richtung zu unterscheiden: Man trifft sich im Café, aber man geht ins Café.",
    checks: ["Welche vier Informationen braucht eine klare Verabredung?", "Was sollte man nach einer Absage anbieten?", "Warum sind im Café und ins Café nicht gleich?"],
    activity: {
      title: "Informationslücke",
      instruction: "Partner A kennt Ort und Aktivität, Partner B kennt Zeit und Alternative. Findet einen gemeinsamen Plan.",
      prompts: ["A: Kino · vor dem Bahnhof", "B: 17 Uhr · 19 Uhr als Alternative", "Am Ende bestätigt ihr den kompletten Termin."],
      modelItems: ["Wollen wir ins Kino gehen?", "Treffen wir uns um 17 Uhr vor dem Bahnhof?", "17 Uhr passt nicht. Geht auch 19 Uhr?"],
    },
  },
  "A2-2.5": {
    title: "Freizeit zeigt Gewohnheiten und Vorlieben",
    textDe: "Über Freizeit spricht man oft mit Häufigkeit und persönlicher Bewertung. Wörter wie oft, manchmal, selten, jedes Wochenende oder zweimal pro Woche machen eine Antwort genauer. Mit gern, lieber und am liebsten kann man Vorlieben abstufen. Eine gute A2-Antwort verbindet deshalb Aktivität, Häufigkeit und einen einfachen Grund.",
    checks: ["Welche Wörter zeigen Häufigkeit?", "Wie kann man eine stärkere Vorliebe ausdrücken?", "Welche drei Teile machen eine Freizeit-Antwort genauer?"],
    activity: {
      title: "Real-Life-Wochenende",
      instruction: "Plant für zwei Personen einen freien Nachmittag, obwohl ihre Hobbys verschieden sind.",
      prompts: ["Person A: Sport + draußen", "Person B: Musik + Café", "Findet eine Aktivität, die beide akzeptieren."],
      modelItems: ["Wir könnten zuerst spazieren gehen und danach in ein Café gehen.", "Ich mache gern Sport, aber ich höre auch gern Musik.", "Am liebsten treffen wir uns am Samstag."],
    },
  },
  "A2-3.6": {
    title: "Wo? und Wohin? verändern den Kasus",
    textDe: "In einem Raum kann man beschreiben, wo Möbel stehen und wohin man sie bewegt. Bei einer festen Position fragt man Wo? und benutzt mit Wechselpräpositionen den Dativ: „Der Tisch steht an der Wand.“ Bei einer Bewegung zu einem neuen Ziel fragt man Wohin? und benutzt den Akkusativ: „Ich stelle den Tisch an die Wand.“ Die Präposition bleibt gleich; die Bedeutung entscheidet über den Kasus.",
    checks: ["Welche Frage benutzt man bei einer festen Position?", "Welche Frage zeigt Bewegung zu einem Ziel?", "Finde im Text ein Dativ- und ein Akkusativbeispiel."],
    activity: {
      title: "Bewege die Möbel",
      instruction: "Verwandle jede Position in eine Bewegung. Die Präposition bleibt, aber der Kasus verändert sich.",
      prompts: ["Das Sofa steht neben dem Fenster.", "Die Bücher liegen auf dem Tisch.", "Der Schrank steht an der Wand."],
      modelItems: ["Ich stelle das Sofa neben das Fenster.", "Ich lege die Bücher auf den Tisch.", "Ich stelle den Schrank an die Wand."],
    },
  },
  "A2-3.7": {
    title: "Wohnungsanzeigen richtig lesen",
    textDe: "Bei einer Wohnung sind nicht nur Zimmerzahl und Lage wichtig. In Anzeigen stehen oft Kaltmiete, Nebenkosten, Warmmiete und Kaution. Die Warmmiete enthält normalerweise die Kaltmiete plus bestimmte Nebenkosten, aber nicht automatisch alle persönlichen Kosten. Vor einer Besichtigung sollte man deshalb wichtige Bedingungen prüfen und konkrete Fragen vorbereiten.",
    checks: ["Welche Kostenbegriffe nennt der Text?", "Warum sollte man vor der Besichtigung Fragen vorbereiten?", "Welche Miete ist normalerweise höher: Kaltmiete oder Warmmiete?"],
    activity: {
      title: "Mini-Anzeigencheck",
      instruction: "Lest die Angaben und entscheidet, welche zwei Informationen noch fehlen.",
      prompts: ["2 Zimmer · 650 € Kaltmiete", "ruhige Lage · Balkon", "Besichtigung am Freitag"],
      modelItems: ["Zum Beispiel: Wie hoch sind die Nebenkosten?", "Wie hoch ist die Kaution?", "Ab wann ist die Wohnung frei?"],
    },
  },
  "A2-3.8": {
    title: "Rezepte brauchen Reihenfolge",
    textDe: "Ein Rezept muss so klar sein, dass eine andere Person die Schritte in der richtigen Reihenfolge ausführen kann. Deshalb helfen Wörter wie zuerst, dann, danach und zum Schluss. Für direkte Anweisungen benutzt man oft den Imperativ. Die Form hängt davon ab, ob man du, ihr oder Sie anspricht. Zutaten und Mengen sind wichtig, aber ohne klare Reihenfolge bleibt ein Rezept schwer verständlich.",
    checks: ["Welche vier Wörter ordnen Kochschritte?", "Warum ist die Reihenfolge wichtig?", "Welche drei Anredeformen nennt der Text?"],
    activity: {
      title: "Finde das Muster",
      instruction: "Ordnet die drei Kochanweisungen nach Anrede: du, ihr oder Sie.",
      prompts: ["Schneide die Zwiebel klein.", "Schneidet die Tomaten.", "Schneiden Sie bitte das Brot."],
      modelItems: ["du → Schneide ...", "ihr → Schneidet ...", "Sie → Schneiden Sie ..."],
    },
  },
  "A2-4.9": {
    title: "Erlebnisse werden als Geschichte verständlich",
    textDe: "Wenn man von einem vergangenen Urlaub erzählt, helfen Zeitangaben und eine klare Reihenfolge. Im gesprochenen Deutsch wird für viele abgeschlossene Handlungen das Perfekt benutzt. Die meisten Verben bilden es mit haben; viele Verben der Bewegung oder Zustandsänderung benutzen sein. Das Partizip steht normalerweise am Ende des Hauptsatzes. So entsteht aus einzelnen Informationen eine kleine Geschichte.",
    checks: ["Welche Zeitform ist im gesprochenen Deutsch für viele vergangene Handlungen typisch?", "Welche Verben benutzen oft sein?", "Wo steht das Partizip im Hauptsatz?"],
    activity: {
      title: "Fehlerdetektiv",
      instruction: "Korrigiert die Urlaubssätze und erklärt kurz den Fehler.",
      prompts: ["Ich habe nach Berlin gefahren.", "Wir sind viele Fotos gemacht.", "Ich habe im Hotel geschlafen."],
      modelItems: ["Ich bin nach Berlin gefahren.", "Wir haben viele Fotos gemacht.", "Ich habe im Hotel geschlafen. ist korrekt."],
    },
  },
  "A2-4.10": {
    title: "Vergangenheit klingt nicht immer gleich",
    textDe: "Im Deutschen können Perfekt und Präteritum über Vergangenes sprechen. Im Alltag ist das Perfekt sehr häufig, aber einige Präteritumformen hört und liest man ständig, besonders war und hatte. Auch ging, kam, fuhr, sah und fand sind wichtig. Für A2 ist nicht nötig, jedes starke Verb aktiv zu beherrschen. Wichtiger ist, häufige Formen zu erkennen und einige sicher zu benutzen.",
    checks: ["Welche zwei Präteritumformen sind besonders wichtig?", "Muss man auf A2 jedes starke Verb aktiv können?", "Nenne eine weitere Form aus dem Text."],
    activity: {
      title: "Sortiere die Vergangenheit",
      instruction: "Ordnet die Aussagen: Perfekt oder Präteritum.",
      prompts: ["Ich war letztes Jahr in Berlin.", "Wir haben ein Museum besucht.", "Danach ging ich essen."],
      modelItems: ["Präteritum → war", "Perfekt → haben ... besucht", "Präteritum → ging"],
    },
  },
  "A2-4.11": {
    title: "Das beste Verkehrsmittel hängt vom Ziel ab",
    textDe: "Ein Verkehrsmittel ist nicht immer allgemein „besser“. Für eine Entscheidung können Preis, Zeit, Komfort, Entfernung und Umwelt wichtig sein. In einer großen Stadt ist die Bahn manchmal schneller, auf dem Land kann ein Auto praktischer sein. Ein guter Vergleich nennt deshalb mindestens zwei Kriterien und erklärt, warum eines davon für die konkrete Situation wichtiger ist.",
    checks: ["Welche fünf Kriterien nennt der Text?", "Warum gibt es nicht immer ein bestes Verkehrsmittel?", "Was sollte ein guter Vergleich erklären?"],
    activity: {
      title: "Informationslücke · Verkehr",
      instruction: "Jede Person kennt nur einen Teil der Informationen. Entscheidet gemeinsam, welches Verkehrsmittel passt.",
      prompts: ["Bus: günstig, 55 Minuten", "Bahn: teurer, 25 Minuten", "Situation: wichtiger Termin um 8 Uhr"],
      modelItems: ["Für den Termin ist die Bahn besser, weil sie schneller ist.", "Der Bus ist günstiger, aber er dauert länger."],
    },
  },
  "A2-5.12": {
    title: "Ein Traumberuf braucht mehr als einen Namen",
    textDe: "Wer über einen Traumberuf spricht, kann Aufgaben, Fähigkeiten und persönliche Gründe verbinden. „Ich möchte Ärztin werden“ ist ein Start, aber eine stärkere Antwort erklärt auch, was man in diesem Beruf macht und warum er zur eigenen Person passt. Ausbildung, Erfahrung, Arbeitszeiten und Entwicklungsmöglichkeiten können ebenfalls wichtig sein.",
    checks: ["Welche drei Bereiche sollte man bei einem Traumberuf erklären?", "Warum ist nur der Berufsname nicht genug?", "Welche praktischen Faktoren nennt der Text?"],
    activity: {
      title: "Berufsberatung",
      instruction: "Ordnet der Person einen Beruf zu und begründet eure Wahl mit zwei Informationen.",
      prompts: ["arbeitet gern mit Menschen", "ist geduldig und organisiert", "möchte später Verantwortung übernehmen"],
      modelItems: ["Zum Beispiel Pflege, Medizin, Unterricht oder Beratung.", "Der Beruf passt, weil die Person gern mit Menschen arbeitet und geduldig ist."],
    },
  },
  "A2-5.13": {
    title: "Im Vorstellungsgespräch zählen Beispiele",
    textDe: "Im Vorstellungsgespräch wirken konkrete Beispiele oft stärker als allgemeine Aussagen. Statt nur „Ich bin zuverlässig“ zu sagen, kann man kurz erklären, wann man Verantwortung übernommen hat. Eine gute Antwort bleibt positiv, ehrlich und nicht zu lang. Bei einer Schwäche ist es hilfreich zu zeigen, wie man daran arbeitet. Außerdem sollte man die Firma und die Stelle vorher kennen.",
    checks: ["Warum sind konkrete Beispiele hilfreich?", "Wie kann man über eine Schwäche sprechen?", "Was sollte man vor dem Gespräch kennen?"],
    activity: {
      title: "Antwort verstärken",
      instruction: "Macht aus jeder kurzen Aussage eine stärkere Interviewantwort mit einem Beispiel.",
      prompts: ["Ich bin zuverlässig.", "Ich arbeite gern im Team.", "Ich lerne schnell."],
      modelItems: ["Ich bin zuverlässig. In meinem letzten Praktikum war ich immer pünktlich und habe Aufgaben rechtzeitig beendet.", "Ich arbeite gern im Team, weil ich Informationen teile und andere unterstütze.", "Ich lerne schnell; neue Programme probiere ich selbst aus und frage gezielt nach."],
    },
  },
  "A2-5.14": {
    title: "Karriere entwickelt sich in Schritten",
    textDe: "Eine berufliche Entwicklung besteht oft aus mehreren Schritten. Menschen sammeln Erfahrung, lernen neue Fähigkeiten, wechseln Aufgaben oder machen eine Weiterbildung. Nicht jede Karriere verläuft geradlinig. Wichtig ist, ein nächstes realistisches Ziel zu kennen und zu überlegen, welche Kenntnisse oder Erfahrungen dafür noch fehlen. Auch private Ziele können berufliche Entscheidungen beeinflussen.",
    checks: ["Welche Möglichkeiten beruflicher Entwicklung nennt der Text?", "Verläuft jede Karriere geradlinig?", "Was sollte man für das nächste Ziel prüfen?"],
    activity: {
      title: "Mini-Wissensquiz",
      instruction: "Entscheidet: richtig oder falsch. Begründet jede Antwort mit dem Text.",
      prompts: ["Eine Karriere muss immer geradlinig sein.", "Weiterbildung kann ein Karriereschritt sein.", "Private Ziele können berufliche Entscheidungen beeinflussen."],
      modelItems: ["Falsch.", "Richtig.", "Richtig."],
    },
  },
  "A2-6.15": {
    title: "Sport besteht aus mehr als Leistung",
    textDe: "Sport kann verschiedene Ziele haben: Gesundheit, Spaß, Wettbewerb, Gemeinschaft oder Entspannung. Deshalb trainieren Menschen unterschiedlich. Wer für einen Wettkampf trainiert, braucht oft einen anderen Plan als jemand, der sich nach der Arbeit bewegen möchte. Regelmäßigkeit, passende Belastung und Erholung gehören zusammen. Auch ein Lieblingssport kann sich verändern, wenn Zeit, Gesundheit oder Interessen anders werden.",
    checks: ["Welche fünf Ziele kann Sport haben?", "Warum trainieren nicht alle Menschen gleich?", "Welche drei Dinge gehören laut Text zusammen?"],
    activity: {
      title: "Finde die wichtige Information",
      instruction: "Lest drei Sportpläne und entscheidet, welcher zum Ziel passt.",
      prompts: ["Ziel: Entspannung nach der Arbeit", "Plan A: jeden Tag intensives Wettkampftraining", "Plan B: dreimal pro Woche moderates Training mit Pausen"],
      modelItems: ["Plan B passt besser zum Ziel Entspannung.", "Regelmäßigkeit und Erholung sind wichtig."],
    },
  },
  "A2-6.16": {
    title: "Erholung ist aktiv planbar",
    textDe: "Wohlbefinden bedeutet nicht, dass man immer entspannt sein muss. Stress gehört zum Alltag, aber Erholung kann bewusst geplant werden. Schlaf, Bewegung, Pausen, soziale Kontakte und ruhige Aktivitäten helfen vielen Menschen. Wichtig ist, auf eigene Signale zu achten. Wer merkt, dass er sich schlecht fühlt, kann beschreiben, was los ist und was ihm normalerweise hilft.",
    checks: ["Welche Dinge können bei der Erholung helfen?", "Bedeutet Wohlbefinden, immer entspannt zu sein?", "Was sollte man bei sich selbst beobachten?"],
    activity: {
      title: "Fehlerdetektiv · Reflexiv",
      instruction: "Korrigiert die Reflexivpronomen.",
      prompts: ["Ich entspanne sich am Abend.", "Du fühlst mich heute besser.", "Wir erholen uns am Wochenende."],
      modelItems: ["Ich entspanne mich am Abend.", "Du fühlst dich heute besser.", "Wir erholen uns am Wochenende. ist korrekt."],
    },
  },
  "A2-6.17": {
    title: "In der Apotheke zählt genaue Information",
    textDe: "In einer Apotheke sollte man ein Problem möglichst konkret beschreiben: Welche Beschwerden hat man, seit wann und wie stark sind sie? Danach kann man nach einer Empfehlung fragen und erklären, welche Medikamente man schon nimmt. Bei der Einnahme sind Menge, Häufigkeit und Zeitpunkt wichtig. Bei starken oder ungewöhnlichen Beschwerden ersetzt die Apotheke jedoch keinen Arzt.",
    checks: ["Welche Informationen sollte man zu Beschwerden nennen?", "Welche drei Punkte sind bei der Einnahme wichtig?", "Wann sollte man nicht nur zur Apotheke gehen?"],
    activity: {
      title: "Sortiere die Apotheken-Sätze",
      instruction: "Ordnet die Aussagen: Problem beschreiben, Empfehlung erfragen oder Einnahme erklären.",
      prompts: ["Ich habe seit gestern Halsschmerzen.", "Können Sie mir etwas empfehlen?", "Sie müssen die Tabletten zweimal täglich nehmen."],
      modelItems: ["Problem", "Empfehlung", "Einnahme"],
    },
  },
  "A2-7.18": {
    title: "Ein Banktelefonat braucht Vorbereitung",
    textDe: "Am Telefon fehlen Gestik und Dokumente auf dem Tisch des Gesprächspartners. Deshalb sollte man sein Anliegen klar nennen und wichtige Informationen bereithalten. Bei Bankfragen können Kontotyp, Termin, benötigte Unterlagen oder Gebühren relevant sein. Persönliche Sicherheitsdaten sollte man nur über sichere und bekannte Kanäle weitergeben. Am Ende hilft es, den nächsten Schritt kurz zu bestätigen.",
    checks: ["Warum muss man am Telefon besonders klar sein?", "Welche Informationen können bei einem Bankgespräch wichtig sein?", "Was sollte man mit sensiblen Daten tun?"],
    activity: {
      title: "Informationslücke · Bank",
      instruction: "Kunde und Bank kennen unterschiedliche Informationen. Klärt gemeinsam den nächsten Schritt.",
      prompts: ["Kunde: möchte ein Konto eröffnen", "Bank: Termin am Dienstag, Reisepass nötig", "Kunde fragt zusätzlich nach Dauer oder Gebühren"],
      modelItems: ["Ich möchte ein Konto eröffnen.", "Welche Unterlagen muss ich mitbringen?", "Wie lange dauert der Termin?"],
    },
  },
  "A2-7.19": {
    title: "Einkaufen ist eine Entscheidung",
    textDe: "Beim Einkaufen entscheiden Menschen nicht nur zwischen Produkten, sondern auch zwischen online und im Geschäft, bar und mit Karte, neu und gebraucht. Preis ist wichtig, aber auch Qualität, Bequemlichkeit, Beratung und Rückgabe. Eine gute Entscheidung hängt vom konkreten Bedarf ab. Wer seine Gründe nennt, kann verschiedene Möglichkeiten klarer vergleichen und unnötige Käufe leichter vermeiden.",
    checks: ["Welche Kaufentscheidungen nennt der Text?", "Welche Kriterien gibt es außer dem Preis?", "Warum hilft es, eigene Gründe zu nennen?"],
    activity: {
      title: "Real-Life-Entscheidung",
      instruction: "Wählt für die Situation eine Einkaufsform und begründet sie mit denn oder weil.",
      prompts: ["Du brauchst heute noch Schuhe für ein Vorstellungsgespräch.", "Online ist 15 € günstiger.", "Im Geschäft kannst du sie sofort anprobieren."],
      modelItems: ["Ich kaufe im Geschäft, denn ich brauche die Schuhe heute.", "Online ist günstiger, aber ich kann die Größe nicht sofort prüfen."],
    },
  },
  "A2-7.20": {
    title: "Eine Reklamation ist sachlich, nicht aggressiv",
    textDe: "Bei einer Reklamation hilft eine klare Reihenfolge: Produkt oder Problem nennen, kurz erklären, was nicht stimmt, und eine konkrete Lösung wünschen. Höfliche Sprache erhöht die Chance auf ein ruhiges Gespräch. Man kann zum Beispiel um Umtausch, Reparatur, Ersatz oder Rückzahlung bitten. Belege und wichtige Daten sollte man bereithalten, wenn sie für den Kauf relevant sind.",
    checks: ["Welche drei Schritte hat eine klare Reklamation?", "Welche Lösungen nennt der Text?", "Warum sind Belege manchmal wichtig?"],
    activity: {
      title: "Mach es höflicher",
      instruction: "Formuliert die direkten Aussagen als höfliche Reklamation.",
      prompts: ["Geben Sie mir mein Geld zurück!", "Die Kopfhörer sind kaputt.", "Schicken Sie neue!"],
      modelItems: ["Könnten Sie mir bitte mein Geld zurückgeben?", "Ich möchte die Kopfhörer reklamieren, weil sie nicht funktionieren.", "Könnten Sie mir bitte Ersatz schicken?"],
    },
  },
  "A2-8.21": {
    title: "Ein Plan braucht manchmal Plan B",
    textDe: "Ein Wochenendplan funktioniert nicht immer genau wie gedacht. Wetter, Öffnungszeiten oder andere Personen können etwas verändern. Deshalb ist es praktisch, Bedingungen und Alternativen auszudrücken. Mit wenn oder falls kann man sagen, was unter einer Bedingung passiert. Mit ob spricht man über eine offene Ja-Nein-Frage: Man weiß noch nicht, ob etwas passiert.",
    checks: ["Warum ist ein Plan B nützlich?", "Wofür benutzt man wenn oder falls?", "Was drückt ob aus?"],
    activity: {
      title: "Mini-Wissensquiz · Bedingung",
      instruction: "Wählt wenn, falls oder ob und erklärt kurz warum.",
      prompts: ["Ich weiß nicht, ___ Anna kommt.", "___ das Wetter gut ist, gehen wir in den Park.", "___ es regnet, haben wir einen Plan B."],
      modelItems: ["ob", "wenn", "falls"],
    },
  },
  "A2-8.22": {
    title: "Eine Wochenplanung braucht freie Zeit",
    textDe: "Viele Menschen tragen zuerst feste Termine in einen Kalender ein. Danach planen sie Arbeit, Lernen, Einkaufen und Freizeit. Für feste Pläne in naher Zukunft benutzt Deutsch sehr oft das Präsens, wenn die Zeit klar ist: „Morgen treffe ich meine Freundin.“ Mit können zeigt man Verfügbarkeit, mit müssen eine Pflicht. Es ist sinnvoll, nicht jede Stunde zu verplanen, damit man bei Änderungen flexibel bleibt.",
    checks: ["Was trägt man zuerst in den Kalender ein?", "Welche Zeitform ist für feste nahe Zukunftspläne häufig?", "Warum sollte man nicht jede Stunde verplanen?"],
    activity: {
      title: "Entdecke die Wortstellung",
      instruction: "Vergleicht die Sätze und formuliert die Regel für ein Zeitwort am Satzanfang.",
      prompts: ["Ich arbeite am Dienstag bis 17 Uhr.", "Am Dienstag arbeite ich bis 17 Uhr.", "Morgen treffe ich meine Freundin."],
      modelItems: ["Das konjugierte Verb bleibt auf Position 2.", "Nach der Zeitangabe kommt deshalb oft direkt das Verb."],
    },
  },
  "A2-9.23": {
    title: "Der Arbeitsweg verbindet Verkehr und Ziel",
    textDe: "Beim Weg zur Schule oder Arbeit nennt man oft Verkehrsmittel, Ziel und Dauer. Nach mit steht der Dativ: mit dem Bus, mit der Bahn. Für Personen oder konkrete Ziele benutzt man häufig zu: zur Arbeit, zum Arzt. Bei Städten und Ländern ohne Artikel steht oft nach: nach Berlin, nach Ghana. Zu Fuß ist eine feste Form ohne Artikel.",
    checks: ["Welcher Kasus steht nach mit?", "Wann benutzt man häufig zu?", "Welche Präposition passt vor Berlin?"],
    activity: {
      title: "Fehlerdetektiv · Weg",
      instruction: "Korrigiert die Präposition oder den Artikel.",
      prompts: ["Ich fahre mit der Bus zur Arbeit.", "Ich gehe zu die Schule.", "Wir fahren nach Berlin."],
      modelItems: ["mit dem Bus", "zur Schule", "nach Berlin ist korrekt"],
    },
  },
  "A2-9.24": {
    title: "Reiseziele haben unterschiedliche Präpositionen",
    textDe: "Bei Reisezielen hängt die Präposition davon ab, wie der Ortsname gebraucht wird. Vor vielen Städten und Ländern ohne Artikel steht nach: nach Italien, nach Accra. Länder mit Artikel brauchen oft in + Akkusativ: in die Schweiz, in die Türkei. Für Meer, See oder bestimmte Orte benutzt man häufig an oder in. Eine Reiseplanung verbindet Ziel, Transport, Unterkunft, Aktivitäten und Vorbereitung.",
    checks: ["Wann benutzt man oft nach?", "Warum heißt es in die Schweiz?", "Welche fünf Teile kann eine Reiseplanung enthalten?"],
    activity: {
      title: "Sortiere die Reiseziele",
      instruction: "Ordnet die Ziele zu nach, in oder an.",
      prompts: ["Berlin", "die Schweiz", "das Meer"],
      modelItems: ["nach Berlin", "in die Schweiz", "ans Meer"],
    },
  },
  "A2-9.25": {
    title: "Ein Tagesablauf wird durch Zeitwörter klar",
    textDe: "Ein Tagesablauf ist leichter zu verstehen, wenn Handlungen geordnet werden. Zeitangaben wie morgens, um sieben Uhr, danach und abends zeigen die Reihenfolge. Bei trennbaren Verben steht der konjugierte Teil im Hauptsatz auf Position 2 und die Vorsilbe am Ende: „Ich stehe um sieben Uhr auf.“ Beginnt der Satz mit einer Zeitangabe, bleibt das Verb trotzdem auf Position 2.",
    checks: ["Welche Wörter helfen bei der Reihenfolge?", "Wo steht die Vorsilbe bei einem trennbaren Verb?", "Was passiert mit dem Verb nach einer Zeitangabe am Satzanfang?"],
    activity: {
      title: "Informationslücke · Tagesablauf",
      instruction: "Partner A kennt Morgen und Abend, Partner B Mittag und Nachmittag. Baut gemeinsam einen ganzen Tagesablauf.",
      prompts: ["Benutzt mindestens zwei Zeitangaben.", "Benutzt ein trennbares Verb.", "Verbindet die Informationen mit dann oder danach."],
      modelItems: ["Morgens stehe ich um 7 Uhr auf.", "Danach fahre ich zur Arbeit.", "Abends sehe ich fern."],
    },
  },
  "A2-10.26": {
    title: "Gefühle haben oft einen Auslöser",
    textDe: "Gefühle entstehen häufig in einer bestimmten Situation. Man kann deshalb nicht nur sagen „Ich bin nervös“, sondern auch den Auslöser nennen: „Ich bin nervös, wenn ich eine Prüfung habe.“ Ein wenn-Satz verbindet Situation und Reaktion. Das konjugierte Verb steht im Nebensatz am Ende. So kann man Gefühle, Gründe und typische Reaktionen genauer beschreiben.",
    checks: ["Was kann man zusätzlich zum Gefühl nennen?", "Wo steht das Verb im wenn-Nebensatz?", "Welche zwei Informationen verbindet ein wenn-Satz hier?"],
    activity: {
      title: "Situation → Gefühl → Reaktion",
      instruction: "Baut für jede Situation einen Satz mit wenn und ergänzt eine passende Reaktion.",
      prompts: ["Prüfung morgen", "gute Nachricht", "zu viel Arbeit"],
      modelItems: ["Wenn ich morgen eine Prüfung habe, bin ich nervös und lerne noch einmal.", "Wenn ich gute Nachrichten bekomme, bin ich froh.", "Wenn ich zu viel Arbeit habe, bin ich gestresst und mache eine Pause."],
    },
  },
  "A2-10.27": {
    title: "Digitale Kommunikation braucht Klarheit",
    textDe: "E-Mail, Messenger und soziale Medien sind schnell, aber ohne Stimme und Gesicht können Nachrichten leicht anders verstanden werden. Deshalb helfen ein klarer Betreff, kurze Absätze und eine passende Anrede. Persönliche Daten sollte man bewusst teilen. Wenn man seine Meinung erklärt, kann man mit dass einen ganzen Gedanken anschließen: „Ich finde, dass kurze Nachrichten praktisch sind.“",
    checks: ["Warum können digitale Nachrichten missverstanden werden?", "Was macht eine Nachricht klarer?", "Wo steht das Verb im dass-Satz?"],
    activity: {
      title: "Verbinde mit dass",
      instruction: "Verbindet jeweils Meinung und Aussage zu einem Satz.",
      prompts: ["Ich finde. Messenger sind praktisch.", "Ich glaube. Soziale Medien haben Vorteile.", "Mir ist wichtig. Meine Daten sind sicher."],
      modelItems: ["Ich finde, dass Messenger praktisch sind.", "Ich glaube, dass soziale Medien Vorteile haben.", "Mir ist wichtig, dass meine Daten sicher sind."],
    },
  },
  "A2-10.28": {
    title: "Zukunftspläne brauchen konkrete nächste Schritte",
    textDe: "Über die Zukunft kann man im Deutschen oft mit Präsens plus Zeitangabe sprechen. Futur I mit werden + Infinitiv macht Zukunft oder Prognose besonders sichtbar: „Nächstes Jahr werde ich Deutsch weiterlernen.“ Gute Zukunftspläne sind konkreter als Wünsche. Sie nennen ein Ziel und möglichst einen nächsten Schritt, zum Beispiel regelmäßig sprechen, einen Kurs beginnen oder Unterlagen vorbereiten.",
    checks: ["Welche zwei Möglichkeiten nennt der Text für Zukunft?", "Wie bildet man Futur I?", "Was macht einen Zukunftsplan konkreter?"],
    activity: {
      title: "Mini-Wissensquiz · Zukunft",
      instruction: "Entscheidet, welcher Satz korrekt ist, und erklärt die Futur-I-Struktur.",
      prompts: ["Nächstes Jahr ich werde Deutsch lernen.", "Nächstes Jahr werde ich Deutsch lernen.", "Ich werde nächstes Jahr Deutsch lernen werde."],
      modelItems: ["Korrekt: Nächstes Jahr werde ich Deutsch lernen.", "werden steht konjugiert auf Position 2; der Infinitiv steht am Ende."],
    },
  },
};

export function getA2PresenterKnowledge(assignmentId = "") {
  return A2_KNOWLEDGE[String(assignmentId || "").trim().toUpperCase()] || null;
}

export function getA2FocusedPractice(assignmentId = "") {
  return getA2PresenterKnowledge(assignmentId)?.activity || null;
}

export const A2_PRESENTER_KNOWLEDGE_ASSIGNMENTS = Object.freeze(Object.keys(A2_KNOWLEDGE));
