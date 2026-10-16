import { getPresenterReadingLesson } from "./presenterReadingLessons.js";

const A2_KNOWLEDGE = {
  "A2-1.1": {
    ...getPresenterReadingLesson("A2-1.1"),
    activity: {
      title: "Frage oder zu privat?",
      instruction: "Entscheidet gemeinsam, welche Fragen für den ersten Small Talk passen.",
      prompts: ["Was machst du am Wochenende?", "Wie viel Geld verdienst du?", "Wie war dein Weg hierher?"],
      modelItems: ["Passt: Was machst du am Wochenende?", "Zu privat am Anfang: Wie viel Geld verdienst du?", "Passt: Wie war dein Weg hierher?"],
    },
  },
  "A2-1.2": {
    ...getPresenterReadingLesson("A2-1.2"),
    activity: {
      title: "Beschreibung verbessern",
      instruction: "Macht aus einer einfachen Beschreibung eine genauere A2-Beschreibung.",
      prompts: ["Sie ist nett.", "Er ist groß.", "Sie trägt eine Jacke."],
      modelItems: ["Sie ist freundlich und hilft ihren Kollegen oft.", "Er ist groß und hat kurze dunkle Haare.", "Sie trägt eine blaue Jacke und eine schwarze Hose."],
    },
  },
  "A2-1.3": {
    ...getPresenterReadingLesson("A2-1.3"),
    activity: {
      title: "Sortiere den Vergleich",
      instruction: "Ordnet die drei Aussagen: Unterschied, Gleichheit oder höchster Grad.",
      prompts: ["Der Zug ist schneller als der Bus.", "Anna ist genauso groß wie Mia.", "Das Fahrrad ist am günstigsten."],
      modelItems: ["Unterschied → schneller als", "Gleichheit → genauso groß wie", "Höchster Grad → am günstigsten"],
    },
  },
  "A2-2.4": {
    ...getPresenterReadingLesson("A2-2.4"),
    activity: {
      title: "Informationslücke",
      instruction: "Partner A kennt Ort und Aktivität, Partner B kennt Zeit und Alternative. Findet einen gemeinsamen Plan.",
      prompts: ["A: Kino · vor dem Bahnhof", "B: 17 Uhr · 19 Uhr als Alternative", "Am Ende bestätigt ihr den kompletten Termin."],
      modelItems: ["Wollen wir ins Kino gehen?", "Treffen wir uns um 17 Uhr vor dem Bahnhof?", "17 Uhr passt nicht. Geht auch 19 Uhr?"],
    },
  },
  "A2-2.5": {
    ...getPresenterReadingLesson("A2-2.5"),
    activity: {
      title: "Real-Life-Wochenende",
      instruction: "Plant für zwei Personen einen freien Nachmittag, obwohl ihre Hobbys verschieden sind.",
      prompts: ["Person A: Sport + draußen", "Person B: Musik + Café", "Findet eine Aktivität, die beide akzeptieren."],
      modelItems: ["Wir könnten zuerst spazieren gehen und danach in ein Café gehen.", "Ich mache gern Sport, aber ich höre auch gern Musik.", "Am liebsten treffen wir uns am Samstag."],
    },
  },
  "A2-3.6": {
    ...getPresenterReadingLesson("A2-3.6"),
    activity: {
      title: "Position → Bewegung: Was ändert sich?",
      instruction: "Entscheide zuerst Position oder Bewegung. Sage dann Wo? oder Wohin?, nenne den Kasus und ändere erst danach den Artikel.",
      prompts: [
        "Das Sofa steht neben dem Fenster. Ist das Position oder Bewegung? Welche Frage passt: Wo? oder Wohin? Welcher Kasus?",
        "Jetzt Bewegung: Ich stelle das Sofa ___ Fenster. Welche Frage passt? Welcher Kasus? Was passiert mit dem Artikel?",
        "Die Bücher liegen auf dem Tisch. Wenn ich sie bewege: Ich lege die Bücher ___ Tisch. Was ändert sich?",
      ],
      modelItems: [
        "Position → Wo? → Dativ → neben dem Fenster.",
        "Bewegung → Wohin? → Akkusativ → neben das Fenster. dem → das.",
        "Position: auf dem Tisch. Bewegung: auf den Tisch. dem → den.",
      ],
    },
  },
  "A2-3.7": {
    ...getPresenterReadingLesson("A2-3.7"),
    activity: {
      title: "Wohnungsanzeige vervollständigen",
      instruction: "Partner A und Partner B haben unterschiedliche Informationen über dieselbe Wohnung. Merkt euch eure Informationen. Danach werden beide Karten geschlossen. Fragt euren Partner und ergänzt gemeinsam die vollständige Wohnungsanzeige.",
      roleCards: [
        {
          id: "A",
          title: "Rolle A · nur für Person A",
          content: "2 Zimmer · 650 € Kaltmiete · ruhige Lage · 3. Stock · frei ab 1. November",
          task: "Merke dir deine Informationen. Frage Partner B nach den Angaben, die dir fehlen."
        },
        {
          id: "B",
          title: "Rolle B · nur für Person B",
          content: "Balkon · Küche vorhanden · Haustiere erlaubt · Besichtigung am Freitag um 17 Uhr · 10 Minuten zur U-Bahn",
          task: "Merke dir deine Informationen. Frage Partner A nach den Angaben, die dir fehlen."
        }
      ],
      prompts: [
        "Wie viele Zimmer hat die Wohnung?",
        "Wie hoch ist die Kaltmiete?",
        "Wie ist die Lage und in welchem Stock liegt die Wohnung?",
        "Ab wann ist die Wohnung frei?",
        "Hat die Wohnung einen Balkon und eine Küche?",
        "Sind Haustiere erlaubt?",
        "Wann ist die Besichtigung?",
        "Wie weit ist es zur U-Bahn?"
      ],
      modelItems: [
        "Die Wohnung hat zwei Zimmer und kostet 650 € Kaltmiete.",
        "Sie liegt in ruhiger Lage im 3. Stock.",
        "Die Wohnung ist ab 1. November frei.",
        "Sie hat einen Balkon und eine Küche.",
        "Haustiere sind erlaubt.",
        "Die Besichtigung ist am Freitag um 17 Uhr.",
        "Zur U-Bahn sind es ungefähr zehn Minuten."
      ],
    },
  },
  "A2-3.8": {
    ...getPresenterReadingLesson("A2-3.8"),
    activity: {
      title: "Finde das Muster",
      instruction: "Ordnet die sechs Beispiele zu: Gericht, Getränk oder Beilage.",
      prompts: ["Gemüsesuppe", "Mineralwasser", "Kartoffeln", "Salat", "Apfelsaft", "Reis"],
      modelItems: ["Gericht → Gemüsesuppe / Salat", "Getränk → Mineralwasser / Apfelsaft", "Beilage → Kartoffeln / Reis"],
    },
  },
  "A2-4.9": {
    ...getPresenterReadingLesson("A2-4.9"),
    activity: {
      title: "Fehlerdetektiv",
      instruction: "Korrigiert die Urlaubssätze und erklärt kurz den Fehler.",
      prompts: ["Ich habe nach Berlin gefahren.", "Wir sind viele Fotos gemacht.", "Ich habe im Hotel geschlafen."],
      modelItems: ["Ich bin nach Berlin gefahren.", "Wir haben viele Fotos gemacht.", "Ich habe im Hotel geschlafen. ist korrekt."],
    },
  },
  "A2-4.10": {
    ...getPresenterReadingLesson("A2-4.10"),
    activity: {
      title: "Entdeckungstag in der Stadt",
      instruction: "Ordnet die Sätze nach Zeitform und bringt sie anschließend in eine sinnvolle Reihenfolge für einen kleinen Stadttag.",
      prompts: ["Ich war am Samstag in der Altstadt.", "Wir haben zuerst einen Markt besucht.", "Danach gingen wir in ein kleines Café."],
      modelItems: ["Präteritum → war", "Perfekt → haben ... besucht", "Präteritum → gingen"],
    },
  },
  "A2-4.11": {
    ...getPresenterReadingLesson("A2-4.11"),
    activity: {
      title: "Informationslücke · Verkehr",
      instruction: "Jede Person kennt nur einen Teil der Informationen. Entscheidet gemeinsam, welches Verkehrsmittel passt.",
      prompts: ["Bus: günstig, 55 Minuten", "Bahn: teurer, 25 Minuten", "Situation: wichtiger Termin um 8 Uhr"],
      modelItems: ["Für den Termin ist die Bahn besser, weil sie schneller ist.", "Der Bus ist günstiger, aber er dauert länger."],
    },
  },
  "A2-5.12": {
    ...getPresenterReadingLesson("A2-5.12"),
    activity: {
      title: "Berufsberatung · Welcher Beruf passt?",
      instruction: "Ihr arbeitet in einer Berufsberatung. Lest das Profil und empfehlt der Person einen passenden Beruf. Erklärt eure Wahl in 2–3 vollständigen Sätzen: Verwendet mindestens zwei Informationen und einen weil-Satz.",
      prompts: ["Die Person arbeitet gern mit Menschen.", "Sie ist geduldig und organisiert.", "Später möchte sie Verantwortung übernehmen."],
      modelItems: ["Ich empfehle den Beruf Lehrerin oder Lehrer.", "Dieser Beruf passt, weil die Person gern mit Menschen arbeitet und geduldig ist. Später kann sie in der Schule mehr Verantwortung übernehmen."],
    },
  },
  "A2-5.13": {
    ...getPresenterReadingLesson("A2-5.13"),
    activity: {
      title: "Antwort verstärken",
      instruction: "Macht aus jeder kurzen Aussage eine stärkere Interviewantwort mit einem Beispiel.",
      prompts: ["Ich bin zuverlässig.", "Ich arbeite gern im Team.", "Ich lerne schnell."],
      modelItems: ["Ich bin zuverlässig. In meinem letzten Praktikum war ich immer pünktlich und habe Aufgaben rechtzeitig beendet.", "Ich arbeite gern im Team, weil ich Informationen teile und andere unterstütze.", "Ich lerne schnell; neue Programme probiere ich selbst aus und frage gezielt nach."],
    },
  },
  "A2-5.14": {
    ...getPresenterReadingLesson("A2-5.14"),
    activity: {
      title: "Karriere-Coach · Was ist der nächste Schritt?",
      instruction: "Lest jeden Fall genau. Alle drei Möglichkeiten können helfen – aber welche passt JETZT am besten? Wählt eine Antwort, erklärt warum und bildet einen Satz mit „um ... zu“.",
      // Keep three actionable prompts for the A2 lesson contract; the presenter
      // renders the detailed, interactive decisionCases instead of duplicating them.
      prompts: ["Ama: Welche Fähigkeit fehlt für die Büroarbeit?", "Kojo: Wie kann er Gespräche mit Kunden üben?", "Sara: Wie kann sie sich auf die Teamleitung vorbereiten?"],
      modelItems: [
        "Ama besucht einen Computerkurs, um Tabellen am Computer zu bearbeiten.",
        "Kojo übt Kundengespräche, um beim Sprechen sicherer zu werden.",
        "Sara macht eine Weiterbildung, um später ein Team zu leiten.",
      ],
      decisionCases: [
        {
          id: "ama",
          name: "Ama · Büroassistenz",
          situation: "Ama möchte als Büroassistentin arbeiten. Sie hat schon einen guten Lebenslauf und ein Praktikum gemacht. Aber sie kann Tabellen am Computer noch nicht gut bearbeiten.",
          question: "Was sollte Ama zuerst machen?",
          options: [
            "Ein weiteres Praktikum im Büro machen.",
            "Einen Computerkurs für Tabellen besuchen.",
            "Ein Bewerbungstraining für Bürostellen besuchen.",
          ],
          correctIndex: 1,
          explanation: "Ein weiteres Praktikum oder Bewerbungstraining kann helfen. Ama hat aber schon Erfahrung und einen guten Lebenslauf. Sie muss zuerst die Arbeit mit Tabellen lernen.",
          model: "Ama besucht einen Computerkurs, um Tabellen am Computer zu bearbeiten.",
        },
        {
          id: "kojo",
          name: "Kojo · Verkauf",
          situation: "Kojo möchte im Verkauf arbeiten. Er kennt viele deutsche Wörter und kann gut schreiben. Aber Gespräche mit Kunden fallen ihm schwer. Er hat bald ein Vorstellungsgespräch.",
          question: "Welche Vorbereitung hilft Kojo jetzt am meisten?",
          options: [
            "Mehr Wörter über Produkte lernen.",
            "Seine schriftliche Bewerbung verbessern.",
            "Kundengespräche mit einem Partner üben.",
          ],
          correctIndex: 2,
          explanation: "Neue Wörter und eine bessere Bewerbung sind nützlich. Kojo kennt aber schon viele Wörter. Sein Problem ist das Sprechen mit Kunden, deshalb sollte er echte Gespräche üben.",
          model: "Kojo übt Kundengespräche, um beim Sprechen sicherer zu werden.",
        },
        {
          id: "sara",
          name: "Sara · Teamleitung",
          situation: "Sara arbeitet seit einem Jahr in einem Geschäft und kennt die Produkte gut. Später möchte sie ein Team leiten. Sie hat aber noch nie Arbeitspläne gemacht oder Aufgaben verteilt.",
          question: "Welcher nächste Schritt passt am besten zu Saras Ziel?",
          options: [
            "Eine Weiterbildung für Teamleitung machen.",
            "Einen Kurs über neue Produkte besuchen.",
            "Ein Bewerbungstraining für andere Geschäfte besuchen.",
          ],
          correctIndex: 0,
          explanation: "Produktwissen und Bewerbungen können für Saras Beruf nützlich sein. Für ihr Ziel fehlen ihr aber Kenntnisse über Arbeitspläne und die Arbeit mit einem Team.",
          model: "Sara macht eine Weiterbildung, um später ein Team zu leiten.",
        },
      ],
      transferPrompt: "Und du? Was machst du, um dein Berufsziel zu erreichen?",
      transferModel: "Ich lerne Deutsch, um später in Deutschland zu arbeiten.",
    },
  },
  "A2-6.15": {
    ...getPresenterReadingLesson("A2-6.15"),
    activity: {
      title: "Finde die wichtige Information",
      instruction: "Lest drei Sportpläne und entscheidet, welcher zum Ziel passt.",
      prompts: ["Ziel: Entspannung nach der Arbeit", "Plan A: jeden Tag intensives Wettkampftraining", "Plan B: dreimal pro Woche moderates Training mit Pausen"],
      modelItems: ["Plan B passt besser zum Ziel Entspannung.", "Regelmäßigkeit und Erholung sind wichtig."],
    },
  },
  "A2-6.16": {
    ...getPresenterReadingLesson("A2-6.16"),
    activity: {
      title: "Fehlerdetektiv · Reflexiv",
      instruction: "Korrigiert die Reflexivpronomen.",
      prompts: ["Ich entspanne sich am Abend.", "Du fühlst mich heute besser.", "Wir erholen uns am Wochenende."],
      modelItems: ["Ich entspanne mich am Abend.", "Du fühlst dich heute besser.", "Wir erholen uns am Wochenende. ist korrekt."],
    },
  },
  "A2-6.17": {
    ...getPresenterReadingLesson("A2-6.17"),
    activity: {
      title: "Sortiere die Apotheken-Sätze",
      instruction: "Ordnet die Aussagen: Problem beschreiben, Empfehlung erfragen oder Einnahme erklären.",
      prompts: ["Ich habe seit gestern Halsschmerzen.", "Können Sie mir etwas empfehlen?", "Sie müssen die Tabletten zweimal täglich nehmen."],
      modelItems: ["Problem", "Empfehlung", "Einnahme"],
    },
  },
  "A2-7.18": {
    ...getPresenterReadingLesson("A2-7.18"),
    activity: {
      title: "Informationslücke · Bank",
      instruction: "Kunde und Bank kennen unterschiedliche Informationen. Klärt gemeinsam den nächsten Schritt.",
      prompts: ["Kunde: möchte ein Konto eröffnen", "Bank: Termin am Dienstag, Reisepass nötig", "Kunde fragt zusätzlich nach Dauer oder Gebühren"],
      modelItems: ["Ich möchte ein Konto eröffnen.", "Welche Unterlagen muss ich mitbringen?", "Wie lange dauert der Termin?"],
    },
  },
  "A2-7.19": {
    ...getPresenterReadingLesson("A2-7.19"),
    activity: {
      title: "Real-Life-Entscheidung",
      instruction: "Wählt für die Situation eine Einkaufsform und begründet sie mit denn oder weil.",
      prompts: ["Du brauchst heute noch Schuhe für ein Vorstellungsgespräch.", "Online ist 15 € günstiger.", "Im Geschäft kannst du sie sofort anprobieren."],
      modelItems: ["Ich kaufe im Geschäft, denn ich brauche die Schuhe heute.", "Online ist günstiger, aber ich kann die Größe nicht sofort prüfen."],
    },
  },
  "A2-7.20": {
    ...getPresenterReadingLesson("A2-7.20"),
    activity: {
      title: "Mach es höflicher",
      instruction: "Formuliert die direkten Aussagen als höfliche Reklamation.",
      prompts: ["Geben Sie mir mein Geld zurück!", "Die Kopfhörer sind kaputt.", "Schicken Sie neue!"],
      modelItems: ["Könnten Sie mir bitte mein Geld zurückgeben?", "Ich möchte die Kopfhörer reklamieren, weil sie nicht funktionieren.", "Könnten Sie mir bitte Ersatz schicken?"],
    },
  },
  "A2-8.21": {
    ...getPresenterReadingLesson("A2-8.21"),
    activity: {
      title: "Mini-Wissensquiz · Bedingung",
      instruction: "Wählt wenn, falls oder ob und erklärt kurz warum.",
      prompts: ["Ich weiß nicht, ___ Anna kommt.", "___ das Wetter gut ist, gehen wir in den Park.", "___ es regnet, haben wir einen Plan B."],
      modelItems: ["ob", "wenn", "falls"],
    },
  },
  "A2-8.22": {
    ...getPresenterReadingLesson("A2-8.22"),
    activity: {
      title: "Welches Wort passt?",
      instruction: "Wählt aus drei Wörtern. Welches Wort passt in die Lücke?",
      prompts: [
        "Viele Menschen tragen zuerst feste ______ in einen Kalender ein. Wählt: Termine · Pflicht · Verfügbarkeit",
        "Mit können zeigt man die ______. Wählt: Pflicht · Verfügbarkeit · Termine",
        "Mit müssen zeigt man eine ______. Wählt: Verfügbarkeit · Pflicht · Termine",
        "Man sollte nicht jede Stunde ______. Wählt: verplanen · schützen · reduzieren",
      ],
      modelItems: ["Termine", "Verfügbarkeit", "Pflicht", "verplanen"],
    },
  },
  "A2-9.23": {
    ...getPresenterReadingLesson("A2-9.23"),
    activity: {
      title: "Fehlerdetektiv · Weg",
      instruction: "Korrigiert die Präposition oder den Artikel.",
      prompts: ["Ich fahre mit der Bus zur Arbeit.", "Ich gehe zu die Schule.", "Wir fahren nach Berlin."],
      modelItems: ["mit dem Bus", "zur Schule", "nach Berlin ist korrekt"],
    },
  },
  "A2-9.24": {
    ...getPresenterReadingLesson("A2-9.24"),
    activity: {
      title: "Urlaubsplan verbinden",
      instruction: "Verbindet die Ideen mit weil, wenn/falls oder um ... zu.",
      prompts: ["Ich fahre nach Hamburg. Ich möchte den Hafen sehen.", "Es regnet. Ich besuche ein Museum.", "Ich buche früh. Ich möchte Geld sparen."],
      modelItems: ["Ich fahre nach Hamburg, weil ich den Hafen sehen möchte.", "Wenn es regnet, besuche ich ein Museum. / Falls es regnet, besuche ich ein Museum.", "Ich buche früh, um Geld zu sparen."],
    },
  },
  "A2-9.25": {
    ...getPresenterReadingLesson("A2-9.25"),
    activity: {
      title: "Informationslücke · Tagesablauf",
      instruction: "Ihr rekonstruiert gemeinsam Annas ganzen Tag. Partner A kennt ihren stressigen Morgen und freien Abend. Partner B kennt ihre Mittagspause und ihren vollen Nachmittag. Fragt euch nach den fehlenden Zeiten und Aktivitäten.",
      roleCards: [
        {
          id: "A",
          title: "Rolle A · Annas Morgen und Abend",
          content: "Morgen: 06:30 aufstehen · 07:15 mit dem Bus zur Arbeit fahren · 08:00–12:00 arbeiten. Abend: ab 18:30 frei · zu Hause kochen · gegen 22:30 schlafen.",
          task: "Erzähl Partner B nur Morgen und Abend. Frage: Was macht Anna mittags und am Nachmittag?"
        },
        {
          id: "B",
          title: "Rolle B · Annas Mittag und Nachmittag",
          content: "Mittag: 12:30 Mittagspause · 13:00 weiterarbeiten. Nachmittag: 16:30 Feierabend · 17:00 ins Fitnessstudio gehen · bis 18:15 trainieren.",
          task: "Erzähl Partner A nur Mittag und Nachmittag. Frage: Was macht Anna morgens und abends?"
        }
      ],
      prompts: [
        "Ordnet Annas Tag von 06:30 bis 22:30.",
        "Benutzt mindestens zwei Zeitangaben.",
        "Benutzt mindestens ein trennbares Verb, zum Beispiel aufstehen oder weiterarbeiten.",
        "Verbindet die Informationen mit dann oder danach."
      ],
      modelItems: ["Um 6:30 Uhr steht Anna auf.", "Danach fährt sie zur Arbeit.", "Um 16:30 Uhr hat sie Feierabend.", "Abends ist sie ab 18:30 Uhr frei."],
    },
  },
  "A2-10.26": {
    ...getPresenterReadingLesson("A2-10.26"),
    activity: {
      title: "Situation → Gefühl → Reaktion",
      instruction: "Baut für jede Situation einen Satz mit wenn und ergänzt eine passende Reaktion.",
      prompts: ["Prüfung morgen", "gute Nachricht", "zu viel Arbeit"],
      modelItems: ["Wenn ich morgen eine Prüfung habe, bin ich nervös und lerne noch einmal.", "Wenn ich gute Nachrichten bekomme, bin ich froh.", "Wenn ich zu viel Arbeit habe, bin ich gestresst und mache eine Pause."],
    },
  },
  "A2-10.27": {
    ...getPresenterReadingLesson("A2-10.27"),
    activity: {
      title: "Verbinde mit dass",
      instruction: "Verbindet jeweils Meinung und Aussage zu einem Satz.",
      prompts: ["Ich finde. Messenger sind praktisch.", "Ich glaube. Soziale Medien haben Vorteile.", "Mir ist wichtig. Meine Daten sind sicher."],
      modelItems: ["Ich finde, dass Messenger praktisch sind.", "Ich glaube, dass soziale Medien Vorteile haben.", "Mir ist wichtig, dass meine Daten sicher sind."],
    },
  },
  "A2-10.28": {
    ...getPresenterReadingLesson("A2-10.28"),
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
