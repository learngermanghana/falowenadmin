import { getC2TopicFoundation } from "./c2TopicFoundations.js";

// A2/B1/B2 classroom foundations mirror the student Falowen curriculum.
// C1 is keyed to the current Admin presenter topics because its lesson sequence differs from the learner-side C1 sequence.
// Student source snapshot: bafaffbb5fee47a0b9b4effa040dc69cf052f5fa
// Keep this file aligned whenever the learner-side A2/B1/B2/C1 foundation copy changes.
const A2_SITUATIONS = Object.freeze({
  1: {
    title: "Small Talk",
    intro: "Small Talk sind kurze, einfache Gespräche im Alltag. Du begrüßt eine Person, stellst eine kleine Frage und reagierst kurz auf die Antwort.",
    example: "Du triffst eine neue Person im Kurs: „Hallo, wie geht es dir? Woher kommst du?“",
  },
  2: {
    title: "Personen beschreiben",
    intro: "Wenn du eine Person beschreibst, sprichst du über Aussehen, Charakter oder Beziehung zu dir. Wähle nur die Informationen, die für die Situation wichtig sind.",
    example: "Du beschreibst einen Freund: „Er ist groß, ruhig und sehr hilfsbereit.“",
  },
  3: {
    title: "Dinge und Personen vergleichen",
    intro: "Beim Vergleichen zeigst du, was gleich, ähnlich oder unterschiedlich ist. Du brauchst dafür zwei Personen oder Dinge und ein klares Merkmal.",
    example: "Du vergleichst zwei Wohnungen: „Die erste Wohnung ist größer, aber die zweite ist günstiger.“",
  },
  4: {
    title: "Wo möchten wir uns treffen?",
    intro: "Bei einer Verabredung müssen Ort, Zeit und Aktivität zusammenpassen. Du machst einen Vorschlag und reagierst auf den Vorschlag der anderen Person.",
    example: "Du sagst: „Treffen wir uns um 17 Uhr vor dem Bahnhof?“",
  },
  5: {
    title: "Freizeit",
    intro: "Bei Freizeitgesprächen sagst du, was du gern machst, wann du es machst und mit wem. Ein konkretes Beispiel macht deine Antwort natürlicher.",
    example: "Du sagst: „Am Samstag spiele ich Fußball mit meinen Freunden.“",
  },
  6: {
    title: "Möbel und Räume",
    intro: "Wenn du über eine Wohnung sprichst, beschreibst du Räume, Möbel und ihre Position. Wichtig ist: Wo ist etwas, und wohin kommt es?",
    example: "Du beschreibst dein Zimmer: „Der Tisch steht neben dem Fenster.“",
  },
  7: {
    title: "Eine Wohnung suchen",
    intro: "Bei der Wohnungssuche beschreibst du, welche Wohnung du brauchst und welche Merkmale wichtig sind. Dazu gehören Größe, Lage, Preis und Ausstattung.",
    example: "Du suchst: „Ich brauche eine Wohnung, die zwei Zimmer und einen Balkon hat.“",
  },
  8: {
    title: "Rezepte und Essen",
    intro: "Bei einem Rezept erklärst du Schritte in einer klaren Reihenfolge. Du sagst, was jemand tun soll und welche Zutaten gebraucht werden.",
    example: "Du erklärst: „Schneide zuerst die Tomaten und gib dann das Salz dazu.“",
  },
  9: {
    title: "Urlaub und Erlebnisse",
    intro: "Wenn du von einem Urlaub erzählst, berichtest du über etwas, das schon passiert ist. Du nennst Ort, Aktivitäten und besondere Erlebnisse.",
    example: "Du erzählst: „Letztes Jahr bin ich nach Berlin gefahren und habe viele Museen besucht.“",
  },
  10: {
    title: "Tourismus und traditionelle Feste",
    intro: "Bei diesem Thema erzählst du über frühere Erlebnisse, Feste oder Traditionen. Wichtig ist, was passiert ist und wie du die Situation erlebt hast.",
    example: "Du erzählst: „Als Kind ging ich jedes Jahr mit meiner Familie zu diesem Fest.“",
  },
  11: {
    title: "Verkehrsmittel vergleichen",
    intro: "Beim Vergleich von Verkehrsmitteln sprichst du über Preis, Geschwindigkeit, Komfort oder Umwelt. Wähle ein klares Kriterium für deinen Vergleich.",
    example: "Du sagst: „Die Bahn ist schneller als der Bus, aber der Bus ist günstiger.“",
  },
  12: {
    title: "Mein Traumberuf",
    intro: "Beim Traumberuf sagst du, welchen Beruf du möchtest, warum er zu dir passt und welche Fähigkeiten du dafür brauchst.",
    example: "Du sagst: „Ich möchte Ärztin werden, weil ich Menschen helfen möchte.“",
  },
  13: {
    title: "Vorstellungsgespräch",
    intro: "Im Vorstellungsgespräch sprichst du über deine Erfahrung, Fähigkeiten und frühere Aufgaben. Antworten sollten kurz, konkret und passend zur Stelle sein.",
    example: "Du erklärst: „In meiner letzten Arbeit musste ich oft mit Kunden sprechen.“",
  },
  14: {
    title: "Beruf und Karriere",
    intro: "Bei Beruf und Karriere sprichst du über Ziele und darüber, warum du etwas lernst oder tust. Der Zweck einer Handlung ist dabei besonders wichtig.",
    example: "Du sagst: „Ich lerne Deutsch, um später in Deutschland zu arbeiten.“",
  },
  15: {
    title: "Mein Lieblingssport",
    intro: "Beim Thema Sport sagst du, welchen Sport du machst, wie lange schon und warum er dir gefällt. Eine Zeitangabe macht die Antwort genauer.",
    example: "Du sagst: „Ich spiele seit drei Jahren Tennis.“",
  },
  16: {
    title: "Wohlbefinden und Entspannung",
    intro: "Beim Wohlbefinden sprichst du über Stress, Entspannung und Gewohnheiten, die dir guttun. Du beschreibst auch, was dir hilft oder worunter du leidest.",
    example: "Du sagst: „Ich erhole mich am Wochenende von der Arbeit.“",
  },
  17: {
    title: "In die Apotheke gehen",
    intro: "In der Apotheke beschreibst du kurz dein gesundheitliches Problem und fragst nach einem Medikament oder Rat.",
    example: "Du hast seit gestern Husten und fragst: „Was soll ich nehmen?“",
  },
  18: {
    title: "Die Bank anrufen",
    intro: "Bei einem Bankanruf sagst du zuerst den Grund des Anrufs und stellst danach eine höfliche Frage oder Bitte.",
    example: "Du hast deine Karte verloren und fragst: „Könnten Sie meine Karte bitte sperren?“",
  },
  19: {
    title: "Einkaufen – wo und wie?",
    intro: "Beim Einkaufen sprichst du über Ort, Produkt, Preis oder Qualität. Du kannst eine Alternative nennen oder erklären, warum du etwas kaufst.",
    example: "Du sagst: „Ich kaufe auf dem Markt, denn das Obst ist dort oft frischer.“",
  },
  20: {
    title: "Eine Reklamation machen",
    intro: "Eine Reklamation machst du, wenn ein Produkt oder eine Dienstleistung ein Problem hat. Du erklärst kurz, was passiert ist, und sagst höflich, welche Lösung du möchtest.",
    example: "Die Kopfhörer funktionieren nicht. Du möchtest sie umtauschen.",
  },
  21: {
    title: "Ein Wochenende planen",
    intro: "Bei einer Wochenendplanung vereinbarst du Zeit, Aktivität und Ort. Du brauchst oft auch einen Plan B, falls etwas nicht möglich ist.",
    example: "Du sagst: „Wenn das Wetter gut ist, gehen wir in den Park. Falls es regnet, gehen wir ins Kino.“",
  },
  22: {
    title: "Die Woche planen",
    intro: "Bei einer Wochenplanung ordnest du Termine und Aktivitäten nach Tagen und Uhrzeiten. Du sagst auch, was du tun musst oder wann du Zeit hast.",
    example: "Du sagst: „Am Montag muss ich um 18 Uhr zum Deutschkurs gehen.“",
  },
  23: {
    title: "Schul- oder Arbeitsweg",
    intro: "Wenn du deinen Weg beschreibst, sagst du, welches Verkehrsmittel du benutzt, wohin du fährst und wie lange der Weg dauert.",
    example: "Du sagst: „Ich fahre mit dem Bus zur Arbeit. Der Weg dauert 30 Minuten.“",
  },
  24: {
    title: "Einen Urlaub planen",
    intro: "Bei einer Urlaubsplanung entscheidest du über Reiseziel, Verkehrsmittel, Unterkunft und Aktivitäten. Deine Angaben sollten konkret zusammenpassen.",
    example: "Du planst: „Ich möchte in die Schweiz fahren und dort in einem Hotel übernachten.“",
  },
  25: {
    title: "Tagesablauf",
    intro: "Beim Tagesablauf beschreibst du einen normalen Tag in zeitlicher Reihenfolge. Zeitangaben helfen, die einzelnen Schritte klar zu ordnen.",
    example: "Du sagst: „Um 6 Uhr stehe ich auf. Danach frühstücke ich und fahre zur Arbeit.“",
  },
  26: {
    title: "Gefühle in verschiedenen Situationen",
    intro: "Wenn du Gefühle beschreibst, nennst du zuerst die Situation und danach das Gefühl oder deine Reaktion. Ein Grund macht die Aussage verständlicher.",
    example: "Du sagst: „Vor einer Prüfung bin ich nervös, weil ich nichts vergessen möchte.“",
  },
  27: {
    title: "Digitale Kommunikation",
    intro: "Bei digitaler Kommunikation entscheidest du, ob Nachricht, E-Mail oder Anruf zur Situation passt. Du kannst auch über Regeln und typische Probleme sprechen.",
    example: "Du sagst: „Wenn etwas dringend ist, rufe ich an. Für formelle Informationen schreibe ich eine E-Mail.“",
  },
  28: {
    title: "Über die Zukunft sprechen",
    intro: "Wenn du über die Zukunft sprichst, nennst du einen konkreten Plan oder Wunsch und erklärst, warum er dir wichtig ist oder was du dafür tun musst.",
    example: "Du sagst: „Ich möchte später in Deutschland arbeiten. Deshalb verbessere ich jetzt mein Deutsch.“",
  },
});
const B1_TOPIC_INTROS = Object.freeze({
  1: {
    title: "Traumwelt und Zukunftsträume",
    intro: "Bei diesem Thema sprichst du über Wünsche, Ziele und Vorstellungen für die Zukunft. Ein Traum kann ein Beruf, eine Reise, ein Haus oder ein persönliches Ziel sein. Wichtig ist, nicht nur den Traum zu nennen, sondern auch zu erklären, warum er dir wichtig ist.",
    example: "Du möchtest später selbstständig arbeiten, weil du eigene Ideen umsetzen und unabhängiger entscheiden möchtest.",
    question: "Welcher Traum ist dir besonders wichtig, und was müsstest du dafür tun?",
  },
  2: {
    title: "Freunde fürs Leben",
    intro: "Freundschaft bedeutet mehr als nur gemeinsam Zeit zu verbringen. Vertrauen, Ehrlichkeit, Unterstützung und gemeinsame Erfahrungen spielen oft eine wichtige Rolle. Freundschaften können in der Schule, bei der Arbeit, in der Freizeit oder heute auch online entstehen.",
    example: "Eine gute Freundin hört dir zu und unterstützt dich auch dann, wenn du ein Problem hast.",
    question: "Welche Eigenschaft ist für eine gute Freundschaft am wichtigsten?",
  },
  3: {
    title: "Erfolgsgeschichten",
    intro: "Erfolg kann beruflich oder persönlich sein. Für manche Menschen bedeutet Erfolg ein guter Beruf, für andere ein abgeschlossenes Studium, eine neue Sprache oder ein schwieriges Ziel, das sie erreicht haben. Erfolg entsteht oft nicht sofort, sondern nach Herausforderungen und Rückschlägen.",
    example: "Ein Student fällt zuerst durch eine Prüfung, lernt anders und besteht sie beim zweiten Versuch.",
    question: "Was bedeutet Erfolg für dich persönlich?",
  },
  4: {
    title: "Wohnung suchen",
    intro: "Bei der Wohnungssuche müssen mehrere Kriterien zusammenpassen: Preis, Lage, Größe, Verkehrsanbindung und Zustand der Wohnung. Oft findet man nicht alles gleichzeitig und muss entscheiden, welche Punkte besonders wichtig sind.",
    example: "Eine Wohnung ist günstig und groß, liegt aber weit vom Arbeitsplatz entfernt.",
    question: "Welche zwei Kriterien wären für dich bei einer Wohnung am wichtigsten?",
  },
  5: {
    title: "Besichtigungstermin",
    intro: "Bei einer Wohnungsbesichtigung schaut man sich die Wohnung genau an und stellt wichtige Fragen. Dazu gehören Miete, Nebenkosten, Zustand, Lärm, Vertrag und Einzugstermin. Höfliche und klare Fragen helfen, später Probleme zu vermeiden.",
    example: "Du bemerkst ein feuchtes Fenster und fragst den Vermieter höflich, ob es dort schon einmal Schimmel gab.",
    question: "Welche Frage würdest du bei einer Besichtigung auf jeden Fall stellen?",
  },
  6: {
    title: "Stadt oder Land",
    intro: "Das Leben in der Stadt und auf dem Land ist unterschiedlich organisiert. In der Stadt sind Arbeit, Geschäfte und Verkehrsmittel oft näher. Auf dem Land gibt es häufig mehr Ruhe und Natur, dafür können Wege länger sein.",
    example: "Eine Person arbeitet in der Stadt, möchte aber wegen der Ruhe lieber auf dem Land wohnen und täglich pendeln.",
    question: "Was ist dir wichtiger: kurze Wege oder mehr Ruhe?",
  },
  7: {
    title: "Fast Food oder Hausmannskost",
    intro: "Fast Food ist schnell verfügbar und praktisch. Hausmannskost wird häufiger selbst zubereitet und man kann Zutaten besser auswählen. Beim Vergleich spielen Zeit, Preis, Geschmack und Gesundheit eine Rolle.",
    example: "Nach der Arbeit kauft jemand einen Burger, obwohl er zu Hause gesünder kochen könnte, weil wenig Zeit bleibt.",
    question: "Wann ist schnelles Essen praktisch, und wann würdest du lieber selbst kochen?",
  },
  8: {
    title: "Alles für die Gesundheit",
    intro: "Gesundheit betrifft nicht nur Krankheiten. Ernährung, Bewegung, Schlaf, mentale Gesundheit und Vorsorge gehören ebenfalls dazu. Viele kleine Gewohnheiten können langfristig einen großen Einfluss auf das Wohlbefinden haben.",
    example: "Eine Person beginnt regelmäßig spazieren zu gehen, früher zu schlafen und mehr Wasser zu trinken.",
    question: "Welche Gewohnheit hat deiner Meinung nach den größten Einfluss auf die Gesundheit?",
  },
  9: {
    title: "Work-Life-Balance",
    intro: "Work-Life-Balance bedeutet, Arbeit und Privatleben so zu organisieren, dass genug Zeit für Erholung, Familie und persönliche Interessen bleibt. Problematisch wird es, wenn Überstunden oder ständige Erreichbarkeit die Freizeit dauerhaft beeinflussen.",
    example: "Ein Mitarbeiter beantwortet nach Feierabend keine beruflichen Nachrichten mehr, damit er sich besser erholen kann.",
    question: "Wo sollte deiner Meinung nach die Grenze zwischen Arbeit und Freizeit liegen?",
  },
  10: {
    title: "Digitale Auszeit",
    intro: "Eine digitale Auszeit ist eine bewusste Pause von Smartphone, sozialen Medien oder anderen Bildschirmen. Das bedeutet nicht, Technik komplett abzulehnen. Ziel ist, Bildschirmzeit bewusster zu steuern und mehr Raum für Schlaf, Bewegung oder direkte Kontakte zu schaffen.",
    example: "Jeden Abend bleibt das Handy für eine Stunde ausgeschaltet, bevor man schlafen geht.",
    question: "In welcher Situation wäre eine digitale Auszeit für dich besonders sinnvoll?",
  },
  11: {
    title: "Teamspiele und Zusammenarbeit",
    intro: "Bei Teamspielen und Gruppenaufgaben arbeiten mehrere Personen an einem gemeinsamen Ziel. Gute Zusammenarbeit braucht Kommunikation, klare Aufgaben, Vertrauen und die Bereitschaft, Konflikte gemeinsam zu lösen.",
    example: "In einem Schulprojekt übernimmt jede Person eine andere Aufgabe, aber alle müssen Informationen miteinander teilen.",
    question: "Was ist wichtiger für ein gutes Team: klare Aufgaben oder gute Kommunikation?",
  },
  12: {
    title: "Abenteuer in der Natur",
    intro: "Ein Abenteuer in der Natur kann Wandern, Camping oder eine andere Aktivität draußen sein. Neben schönen Erlebnissen gehören Vorbereitung, Wetter, Orientierung und Sicherheit dazu. Unerwartete Probleme können schnell entstehen.",
    example: "Beim Wandern beginnt es stark zu regnen und die Gruppe muss entscheiden, ob sie weitergeht oder umkehrt.",
    question: "Was sollte man vor einem Ausflug in die Natur unbedingt vorbereiten?",
  },
  13: {
    title: "Eigene Filmkritik",
    intro: "Eine Filmkritik ist mehr als eine Zusammenfassung der Handlung. Du beschreibst kurz, worum es geht, und bewertest zum Beispiel Schauspiel, Atmosphäre, Musik, Regie oder Spannung. Am Ende begründest du deine Empfehlung.",
    example: "Der Film ist spannend und gut gespielt, aber einige Szenen sind zu lang.",
    question: "Was ist für deine Bewertung eines Films am wichtigsten?",
  },
  14: {
    title: "Traditionelles und digitales Lernen",
    intro: "Traditionelles Lernen findet meistens im Klassenzimmer mit direktem Kontakt statt. Digitales Lernen nutzt Online-Kurse, Videos oder interaktive Übungen und kann zeitlich flexibler sein. Beide Lernformen können je nach Person und Situation unterschiedlich gut funktionieren.",
    example: "Eine Studentin arbeitet tagsüber und lernt am Abend mit einem Online-Kurs Deutsch.",
    question: "Was ist für gutes Lernen wichtiger: Flexibilität oder persönlicher Kontakt?",
  },
  15: {
    title: "Medien und Arbeiten im Homeoffice",
    intro: "Homeoffice bedeutet, ganz oder teilweise von zu Hause aus zu arbeiten. Dafür werden oft E-Mail, Videokonferenzen und digitale Programme verwendet. Gleichzeitig braucht man klare Regeln für Arbeitszeit, Datenschutz und die Grenze zwischen Arbeit und Freizeit.",
    example: "Eine Mitarbeiterin arbeitet drei Tage zu Hause und zwei Tage im Büro.",
    question: "Welche Regel braucht Homeoffice, damit Arbeit und Freizeit getrennt bleiben?",
  },
  16: {
    title: "Prüfungsangst und Stressbewältigung",
    intro: "Prüfungsangst kann entstehen, wenn man sich schlecht vorbereitet fühlt, hohe Erwartungen hat oder Angst vor Fehlern hat. Typische Reaktionen sind Nervosität, Konzentrationsprobleme oder ein Blackout. Vorbereitung und einfache Stressstrategien können helfen.",
    example: "Ein Schüler beginnt früher zu lernen, plant Pausen ein und atmet vor der Prüfung bewusst ruhig.",
    question: "Welche Strategie hilft dir persönlich gegen Stress vor einer Prüfung?",
  },
  17: {
    title: "Wie lernt man am besten?",
    intro: "Menschen lernen unterschiedlich. Manche brauchen Ruhe und Notizen, andere lernen besser durch Sprechen, Wiederholen oder praktische Übungen. Auch Zeitmanagement, Pausen und Motivation beeinflussen den Lernerfolg.",
    example: "Eine Person liest zuerst einen Text, schreibt danach Stichpunkte und erklärt den Inhalt anschließend mit eigenen Worten.",
    question: "Welche Lernmethode funktioniert für dich besonders gut, und warum?",
  },
  18: {
    title: "Wege zum Wunschberuf",
    intro: "Der Weg zum Wunschberuf beginnt oft mit den eigenen Interessen und Stärken. Danach kommen Ausbildung, Studium, praktische Erfahrung oder Weiterbildung. Nicht jeder Berufsweg ist direkt, deshalb sind auch alternative Schritte wichtig.",
    example: "Jemand möchte Softwareentwickler werden und beginnt mit einem Kurs, praktischen Projekten und später einer Weiterbildung.",
    question: "Welcher nächste Schritt würde dich deinem Wunschberuf näherbringen?",
  },
  19: {
    title: "Vorstellungsgespräch",
    intro: "Im Vorstellungsgespräch möchte ein Unternehmen herausfinden, ob eine Person zur Stelle passt. Bewerber erklären Ausbildung, Erfahrung, Stärken und Motivation. Gute Antworten sind konkret und enthalten möglichst ein Beispiel.",
    example: "Statt nur zu sagen „Ich bin teamfähig“, erklärt die Bewerberin, wie sie in einem Projekt mit anderen zusammengearbeitet hat.",
    question: "Welche Stärke würdest du im Vorstellungsgespräch nennen und mit welchem Beispiel erklären?",
  },
  20: {
    title: "Berufe kennenlernen und beschreiben",
    intro: "Um einen Beruf gut zu beschreiben, reicht der Berufsname nicht. Wichtig sind typische Aufgaben, notwendige Qualifikationen, Arbeitsbedingungen und persönliche Eigenschaften. Danach kannst du erklären, ob der Beruf zu dir passt.",
    example: "Ein Lehrer plant Unterricht, erklärt Inhalte, arbeitet mit Lernenden und braucht Geduld sowie gute Kommunikation.",
    question: "Welche Aufgabe oder Fähigkeit ist für deinen Wunschberuf besonders wichtig?",
  },
  21: {
    title: "Lebensformen heute",
    intro: "Menschen leben heute in unterschiedlichen Formen zusammen: allein, als Paar, in einer Familie, in einer WG oder in anderen Gemeinschaften. Keine Lebensform ist automatisch die beste. Bedürfnisse, Kosten, Verantwortung und persönliche Freiheit spielen eine Rolle.",
    example: "Eine Person lebt gern in einer WG, weil sie Kosten teilt und nicht allein ist.",
    question: "Welche Lebensform würde zu deiner aktuellen Situation am besten passen?",
  },
  22: {
    title: "Was ist in einer Beziehung wichtig?",
    intro: "Gute Beziehungen brauchen oft Vertrauen, Respekt, Kommunikation und gegenseitige Unterstützung. Menschen haben aber unterschiedliche Erwartungen. Deshalb ist es wichtig, offen darüber zu sprechen, was beide Seiten brauchen.",
    example: "Zwei Partner haben unterschiedliche Pläne fürs Wochenende und suchen gemeinsam eine Lösung.",
    question: "Welche Eigenschaft ist für eine stabile Beziehung besonders wichtig?",
  },
  23: {
    title: "Erstes Date – Typische Situationen",
    intro: "Bei einem ersten Date lernen sich zwei Menschen besser kennen. Ort, Kommunikation, Höflichkeit und persönliche Grenzen spielen dabei eine wichtige Rolle. Ein Treffen sollte für beide Personen angenehm und respektvoll sein.",
    example: "Zwei Personen treffen sich in einem öffentlichen Café und entscheiden danach, ob sie noch spazieren gehen möchten.",
    question: "Was macht ein erstes Treffen angenehm und respektvoll?",
  },
  24: {
    title: "Konsum und Nachhaltigkeit",
    intro: "Nachhaltiger Konsum bedeutet, beim Kaufen auch Umwelt, Ressourcen und Lebensdauer eines Produkts zu berücksichtigen. Dazu gehören zum Beispiel weniger Verpackung, regionale Produkte, Secondhand und Produkte, die länger genutzt werden können.",
    example: "Jemand kauft ein gebrauchtes Möbelstück statt eines neuen und verwendet es weiter.",
    question: "Welche nachhaltige Entscheidung ist im Alltag leicht umzusetzen?",
  },
  25: {
    title: "Online einkaufen – Rechte und Risiken",
    intro: "Online-Shopping ist bequem und bietet viel Auswahl, aber es gibt auch Risiken wie Fake-Shops, beschädigte Ware oder Datenschutzprobleme. Deshalb sind Verbraucherrechte, sichere Bezahlung und klare Rückgaberegeln wichtig.",
    example: "Ein Handy kommt mit beschädigtem Display an und der Käufer fordert Ersatz oder eine Rückerstattung.",
    question: "Was solltest du vor einer Online-Bestellung immer prüfen?",
  },
  26: {
    title: "Reiseprobleme und Lösungen",
    intro: "Auf Reisen können Probleme wie Verspätungen, verlorenes Gepäck, falsche Buchungen oder Schwierigkeiten im Hotel entstehen. Wichtig ist, das Problem klar zu beschreiben, ruhig zu reagieren und eine passende Lösung vorzuschlagen oder zu verlangen.",
    example: "Dein Koffer kommt nicht an und du meldest das Problem am Serviceschalter des Flughafens.",
    question: "Was würdest du zuerst tun, wenn während einer Reise etwas Wichtiges schiefläuft?",
  },
  27: {
    title: "Umweltfreundlich im Alltag",
    intro: "Umweltfreundliches Verhalten beginnt oft mit kleinen Entscheidungen im Alltag. Energie sparen, Müll vermeiden, Dinge wiederverwenden und öfter öffentliche Verkehrsmittel nutzen sind typische Beispiele. Wichtig ist, dass die Maßnahmen praktisch und langfristig umsetzbar sind.",
    example: "Eine Familie fährt kurze Wege mit dem Fahrrad und schaltet Geräte vollständig aus, wenn sie nicht benutzt werden.",
    question: "Welche umweltfreundliche Gewohnheit könntest du leicht in deinen Alltag übernehmen?",
  },
  28: {
    title: "Klimafreundlich leben",
    intro: "Klimafreundliches Leben betrifft mehrere Bereiche gleichzeitig: Verkehr, Energie, Ernährung und Konsum. Einzelne Maßnahmen lösen das Problem nicht allein, aber viele bewusste Entscheidungen können den persönlichen CO₂-Ausstoß reduzieren.",
    example: "Eine Person fährt häufiger mit dem Zug, isst weniger Fleisch und spart zu Hause Energie.",
    question: "In welchem Bereich könntest du deinen Alltag am einfachsten klimafreundlicher gestalten?",
  },
});
const B2_TOPIC_FOUNDATIONS = Object.freeze({
  1: { intro: "Im Alltag entsteht viel Abfall durch Verpackungen, Einwegprodukte und spontane Käufe. Müllvermeidung beginnt deshalb vor dem Wegwerfen: Produkte länger nutzen, Mehrweg wählen, reparieren und nur kaufen, was wirklich gebraucht wird.", example: "Eine Familie nimmt eigene Behälter zum Einkaufen mit und kauft Getränke in Mehrwegflaschen.", tension: "Bequemlichkeit und niedriger Preis ↔ weniger Abfall und längere Nutzung", question: "Welche Maßnahme reduziert Müll im Alltag wirklich dauerhaft?" },
  2: { intro: "Mülltrennung ist nur ein Teil von Recycling. Entscheidend ist, ob Materialien gesammelt, sortiert, wiederverwendet oder zu neuen Produkten verarbeitet werden können. Kreislaufwirtschaft versucht, Rohstoffe möglichst lange im Umlauf zu halten.", example: "Ein altes Glas wird gesammelt, eingeschmolzen und als neues Glas wieder genutzt.", tension: "einfach wegwerfen ↔ Rohstoffe zurückgewinnen und Produkte weiterverwenden", question: "Wann ist Wiederverwendung sinnvoller als Recycling?" },
  3: { intro: "Lebensmittelverschwendung entsteht in Haushalten, Handel und Gastronomie. Häufig werden Produkte weggeworfen, obwohl sie noch essbar sind. Bessere Planung, passende Portionsgrößen und eine sinnvolle Weitergabe können Verschwendung reduzieren.", example: "Ein Supermarkt verkauft Produkte kurz vor dem Mindesthaltbarkeitsdatum günstiger statt sie wegzuwerfen.", tension: "große Auswahl und volle Regale ↔ weniger Verschwendung und bessere Planung", question: "Wer trägt mehr Verantwortung: Verbraucher oder Handel?" },
  4: { intro: "Verpackungen schützen Produkte, verursachen aber auch viel Abfall. Beim bewussten Einkauf geht es deshalb um Einweg und Mehrweg, unnötige Verpackungen, Materialwahl und die Frage, welche Alternative im Alltag wirklich praktikabel ist.", example: "Ein Geschäft bietet Nachfüllstationen an, damit Kunden Shampoo oder Reinigungsmittel ohne neue Plastikflasche kaufen können.", tension: "Hygiene und Bequemlichkeit ↔ weniger Verpackungsmüll", question: "Welche Verpackungen könnten leicht vermieden werden?" },
  5: { intro: "Nachhaltige Mobilität bedeutet nicht, dass ein Verkehrsmittel immer die beste Lösung ist. Entscheidend sind Strecke, Infrastruktur, Kosten, Zeit und Emissionen. Gute Verkehrspolitik verbindet mehrere Möglichkeiten.", example: "Eine Pendlerin fährt mit dem Fahrrad zum Bahnhof und danach mit der Bahn zur Arbeit.", tension: "Flexibilität des Autos ↔ weniger Emissionen und weniger Verkehr", question: "Was müsste passieren, damit mehr Menschen Bus und Bahn nutzen?" },
  6: { intro: "Energie sparen betrifft Haushalte, Unternehmen und Politik. Gleichzeitig geht es um den Ausbau erneuerbarer Energien wie Sonne und Wind. Weniger Verbrauch und sauberere Energiequellen ergänzen sich, lösen aber unterschiedliche Teile des Problems.", example: "Ein Wohnhaus wird besser gedämmt und erhält zusätzlich Solarmodule auf dem Dach.", tension: "Investitionskosten ↔ langfristig geringerer Verbrauch und Klimaschutz", question: "Was ist wichtiger: weniger Energie verbrauchen oder mehr erneuerbare Energie erzeugen?" },
  7: { intro: "Klimafreundliches Wohnen betrifft Gebäude, Energieverbrauch und die Gestaltung von Städten. Gute Dämmung, Grünflächen, kurze Wege und weniger versiegelte Flächen können Lebensqualität und Klimaschutz miteinander verbinden.", example: "Eine Stadt pflanzt Bäume, saniert alte Gebäude und schafft sichere Wege für Fußgänger und Fahrräder.", tension: "Baukosten und knapper Platz ↔ Energieeffizienz und Lebensqualität", question: "Welche Stadtmaßnahme bringt im Alltag den größten Nutzen?" },
  8: { intro: "Bildungsgerechtigkeit bedeutet nicht, dass alle Lernenden exakt dasselbe bekommen. Manche brauchen zusätzliche Förderung, technische Ausstattung oder finanzielle Unterstützung, damit unterschiedliche Startbedingungen nicht zu dauerhaften Nachteilen werden.", example: "Eine Schule stellt Tablets und kostenlose Lernförderung für Schüler bereit, die zu Hause wenig Unterstützung haben.", tension: "gleiche Regeln für alle ↔ zusätzliche Förderung bei ungleichen Voraussetzungen", question: "Was braucht ein Bildungssystem, damit Chancen tatsächlich fairer werden?" },
  9: { intro: "Schulpflicht sichert einen gemeinsamen Bildungsrahmen. Gleichzeitig muss Schule Leistungen bewerten, Schwächere fördern und klare Verantwortung übernehmen. Die Diskussion dreht sich oft darum, wie viel Druck sinnvoll ist und wie Unterstützung aussehen sollte.", example: "Ein Schüler hat schlechte Noten, erhält aber zusätzliche Beratung und Förderunterricht statt nur weitere Tests.", tension: "Leistungsanforderungen ↔ individuelle Förderung", question: "Wie kann Schule Leistung fordern, ohne schwächere Lernende zurückzulassen?" },
  10: { intro: "Kindergarten ist Betreuung und zugleich ein Ort früher Bildung. Kinder lernen Sprache, soziale Regeln und Selbstständigkeit, während Eltern Beruf und Familie besser organisieren können. Qualität hängt stark von Personal, Gruppen und pädagogischem Angebot ab.", example: "Eine Kita bietet Sprachförderung an und hat flexible Öffnungszeiten für berufstätige Eltern.", tension: "mehr Betreuungsplätze ↔ ausreichend Personal und gute pädagogische Qualität", question: "Was ist bei Kinderbetreuung wichtiger: Verfügbarkeit oder Qualität?" },
  11: { intro: "Digitale Bildung kann Unterricht ergänzen, aber Technik allein verbessert Lernen nicht automatisch. Lernplattformen, Videos und digitale Übungen sind besonders sinnvoll, wenn Lehrkräfte sie gezielt einsetzen und Lernende Medienkompetenz entwickeln.", example: "Eine Klasse arbeitet im Unterricht gemeinsam und nutzt eine Online-Plattform für zusätzliche Übungen zu Hause.", tension: "Flexibilität und digitale Möglichkeiten ↔ direkter Kontakt und Konzentration", question: "Wann verbessert Technologie den Unterricht wirklich?" },
  12: { intro: "Studium und Weiterbildung eröffnen Chancen, verursachen aber Kosten für Lernende und Gesellschaft. Bei Studiengebühren geht es deshalb um Finanzierung, Zugang und die Frage, wer wie viel beitragen sollte. Lebenslanges Lernen wird zusätzlich wichtiger, wenn Berufe sich verändern.", example: "Eine Berufstätige besucht berufsbegleitend einen Weiterbildungskurs, weil neue digitale Kompetenzen verlangt werden.", tension: "individuelle Finanzierung ↔ möglichst breiter Zugang zu Bildung", question: "Wie sollte Weiterbildung finanziert werden, damit sie zugänglich bleibt?" },
  13: { intro: "Wissenschaft und Forschung beeinflussen Medizin, Technik, Umwelt und Alltag. Wichtig ist, Ergebnisse nicht nur zu nennen, sondern zu verstehen, wie sie entstanden sind, welche Grenzen sie haben und welchen praktischen Nutzen sie tatsächlich zeigen.", example: "Eine medizinische Studie untersucht, ob eine neue Behandlung bei einer bestimmten Patientengruppe wirkt.", tension: "schnelle praktische Anwendung ↔ sorgfältige Prüfung und verlässliche Evidenz", question: "Wann kann man einem Forschungsergebnis vertrauen?" },
  14: { intro: "Desinformation wirkt oft überzeugend, weil echte Fakten mit falschen Schlussfolgerungen oder unklaren Quellen vermischt werden. Verlässliche Informationen erkennt man eher an nachvollziehbaren Quellen, überprüfbaren Daten und transparenter Einordnung.", example: "Ein viraler Beitrag behauptet eine medizinische Wirkung, verlinkt aber weder eine Studie noch eine seriöse Institution.", tension: "schnelle und einfache Aussagen ↔ gründliche Quellenprüfung", question: "Welche zwei Dinge würdest du zuerst prüfen, bevor du eine Behauptung weitergibst?" },
  15: { intro: "Wohnraummangel und hohe Mieten entstehen besonders dort, wo viele Menschen wohnen möchten und zu wenig bezahlbarer Wohnraum vorhanden ist. Lösungen können Neubau, Förderung, bessere Nutzung bestehender Wohnungen oder Regeln für den Mietmarkt betreffen.", example: "Eine Stadt fördert neue Wohnungen, verlangt aber, dass ein Teil davon langfristig bezahlbar bleibt.", tension: "Rendite und Baukosten ↔ bezahlbarer Wohnraum", question: "Welche Maßnahme könnte hohe Mieten am wirksamsten begrenzen?" },
  16: { intro: "Stadt und Land bieten unterschiedliche Formen von Lebensqualität. Städte haben oft bessere Infrastruktur und kurze Wege, während ländliche Regionen mehr Ruhe und Raum bieten können. Entscheidend ist, welche Angebote tatsächlich erreichbar sind.", example: "Eine Familie zieht aufs Land, braucht aber für Arbeit, Schule und Arzttermine weiterhin gute Verkehrsverbindungen.", tension: "Ruhe und Platz ↔ kurze Wege und gute Infrastruktur", question: "Welche Infrastruktur entscheidet besonders darüber, ob das Landleben attraktiv bleibt?" },
  17: { intro: "Familie und Beruf lassen sich leichter vereinbaren, wenn Betreuung, Arbeitszeiten und Verantwortung gut zusammenpassen. Probleme entstehen besonders dann, wenn Öffnungszeiten von Kitas und Arbeitszeiten nicht miteinander vereinbar sind.", example: "Ein Unternehmen bietet Gleitzeit an, damit Eltern ihre Kinder zuverlässig abholen können.", tension: "betriebliche Flexibilität ↔ verlässliche Familienzeit und Betreuung", question: "Welche Unterstützung hilft Familien im Arbeitsalltag am meisten?" },
  18: { intro: "Fachkräftemangel bedeutet, dass Unternehmen offene Stellen nicht ausreichend mit qualifizierten Personen besetzen können. Weiterbildung, Ausbildung, Anerkennung ausländischer Abschlüsse und bessere Arbeitsbedingungen können Teil der Lösung sein.", example: "Ein Betrieb finanziert Schulungen, damit Beschäftigte neue technische Aufgaben übernehmen können.", tension: "kurzfristige Personalkosten ↔ langfristige Qualifizierung und Personalbindung", question: "Welche Maßnahme hilft nachhaltiger gegen Fachkräftemangel?" },
  19: { intro: "Homeoffice kann Wege sparen und Arbeit flexibler machen. Gleichzeitig kann ständige digitale Erreichbarkeit dazu führen, dass Arbeit und Freizeit ineinander übergehen. Deshalb sind klare Regeln und echte Erholungszeiten wichtig.", example: "Ein Team vereinbart, dass nach 18 Uhr keine normalen Arbeitsnachrichten mehr beantwortet werden müssen.", tension: "Flexibilität und Erreichbarkeit ↔ Schutz der Freizeit und Erholung", question: "Welche Grenze sollte im Homeoffice verbindlich sein?" },
  20: { intro: "Soziale Medien verbinden private Selbstdarstellung mit öffentlicher Sichtbarkeit. Fotos, Meinungen und persönliche Daten können weitergeleitet, gespeichert und später anders bewertet werden als ursprünglich gedacht.", example: "Ein privates Foto wird von jemand anderem geteilt und erreicht dadurch Personen außerhalb des ursprünglichen Freundeskreises.", tension: "Selbstdarstellung und Reichweite ↔ Privatsphäre und Kontrolle", question: "Welche Informationen sollten besser nicht öffentlich geteilt werden?" },
  21: { intro: "KI kann beim Lernen erklären, strukturieren und Ideen liefern. In Schule und Universität bleibt aber wichtig, dass Lernende Quellen prüfen, eigene Leistungen kennzeichnen und verstehen, was sie abgeben.", example: "Eine Studentin nutzt KI für eine Gliederung, überprüft aber alle Fakten selbst und nennt die Nutzung transparent.", tension: "effiziente Unterstützung ↔ Eigenleistung und akademische Verantwortung", question: "Welche KI-Nutzung sollte in Schule oder Universität erlaubt sein?" },
  22: { intro: "Automatisierung verändert eher einzelne Tätigkeiten als ganze Berufe auf einmal. Routineaufgaben können wegfallen, während neue Aufgaben und Kompetenzen entstehen. Entscheidend ist, ob Beschäftigte rechtzeitig auf den Wandel vorbereitet werden.", example: "Eine Software übernimmt Dateneingaben, während Mitarbeitende stärker Qualitätskontrolle und Beratung übernehmen.", tension: "höhere Effizienz ↔ Arbeitsplatzunsicherheit und Weiterbildungsbedarf", question: "Wie kann Automatisierung fair gestaltet werden?" },
  23: { intro: "Personalisierte Werbung basiert häufig auf Nutzungsdaten, Suchverhalten und Interessenprofilen. Sie kann relevanter wirken, bedeutet aber auch, dass Plattformen viele Informationen über einzelne Personen sammeln und auswerten.", example: "Nach der Suche nach Laufschuhen sieht eine Person auf mehreren Plattformen ähnliche Werbung.", tension: "passendere Werbung ↔ Datenschutz und digitale Selbstbestimmung", question: "Wo sollte die Grenze bei der Nutzung persönlicher Daten für Werbung liegen?" },
  24: { intro: "Telemedizin kann Wege verkürzen und Versorgung erleichtern, besonders bei Beratung oder Nachfragen. Sie ersetzt aber nicht jede Untersuchung. Zusätzlich müssen sensible Gesundheitsdaten besonders gut geschützt werden.", example: "Eine Patientin bespricht einen Laborbefund per Videosprechstunde, muss für eine körperliche Untersuchung aber in die Praxis kommen.", tension: "leichter Zugang und Zeitersparnis ↔ medizinische Grenzen und Datenschutz", question: "Welche medizinischen Termine eignen sich gut für Telemedizin?" },
  25: { intro: "Tourismus schafft Einkommen und Arbeitsplätze, kann aber Orte durch Verkehr, hohe Preise und große Besucherzahlen belasten. Nachhaltiger Tourismus versucht, wirtschaftlichen Nutzen mit Umwelt- und Lebensqualität vor Ort zu verbinden.", example: "Eine Stadt begrenzt große Reisebusse im Zentrum und fördert längere Aufenthalte bei lokalen Anbietern.", tension: "Tourismuseinnahmen ↔ Umweltbelastung und Lebensqualität der Bevölkerung", question: "Wie kann ein beliebter Urlaubsort Besucher aufnehmen, ohne überlastet zu werden?" },
  26: { intro: "Integration ist ein längerfristiger Prozess. Sprache erleichtert Zugang zu Arbeit, Bildung, Behörden und sozialen Kontakten, ist aber nicht der einzige Faktor. Auch Anerkennung von Qualifikationen und faire Teilhabe sind wichtig.", example: "Eine Fachkraft besucht einen Sprachkurs, lässt ihren Abschluss anerkennen und findet dadurch leichter eine passende Stelle.", tension: "Eigeninitiative der Zugewanderten ↔ Unterstützung und offene Strukturen der Gesellschaft", question: "Welche Rolle spielt Sprache für erfolgreiche Integration?" },
  27: { intro: "Gleichstellung bedeutet, dass Menschen faire Chancen und Rechte haben sollen. Diskriminierung kann offen auftreten oder durch Verfahren entstehen, die bestimmte Gruppen systematisch benachteiligen. Deshalb braucht es sowohl Regeln als auch praktische Maßnahmen.", example: "Ein Unternehmen prüft Bewerbungen zunächst ohne Foto und Namen, um unbewusste Vorurteile zu reduzieren.", tension: "gleiche Behandlung ↔ gezielte Maßnahmen gegen bestehende Nachteile", question: "Welche Maßnahme kann Diskriminierung im Alltag konkret reduzieren?" },
  28: { intro: "Die B2-Prüfung verlangt, bekannte Themen flexibel miteinander zu verbinden. Entscheidend ist nicht, möglichst kompliziert zu klingen, sondern klare Argumente, passende Beispiele und sichere Strukturen zu verwenden.", example: "Bei einem Thema über KI im Beruf verbindet eine gute Antwort Ursache, Folge, Gegenargument, Beispiel und eine realistische Lösung.", tension: "sprachliche Komplexität ↔ Klarheit und kontrollierte Argumentation", question: "Welche B2-Strukturen kannst du sicher genug einsetzen, ohne den Satz zu verlieren?" },
});
const C1_TOPIC_FOUNDATIONS_BY_TOPIC = Object.freeze({
  "Wissenschaft und Forschung": {
    intro: "Wissenschaftliche Erkenntnisse entstehen nicht allein durch neue Ideen, sondern durch nachvollziehbare Methoden, überprüfbare Daten und kritische Diskussion. Auf C1-Niveau ist wichtig, zwischen Befund, Interpretation und noch offener Frage zu unterscheiden.",
    example: "Eine Studie zeigt einen Zusammenhang zwischen zwei Faktoren. Bevor daraus eine Ursache abgeleitet wird, werden Studiendesign, Stichprobe und mögliche Alternativerklärungen geprüft.",
    tension: "Forschungsfreiheit und Innovation ↔ wissenschaftliche Sorgfalt und gesellschaftliche Verantwortung",
    question: "Wie lässt sich wissenschaftlicher Fortschritt fördern, ohne Unsicherheit, Qualitätskontrolle und mögliche Folgen zu vernachlässigen?",
  },
  "Kunst und Kultur": {
    intro: "Kunst und Kultur prägen Erinnerung, Identität und öffentliche Debatten. Gleichzeitig stellt sich die Frage, wer Zugang zu kulturellen Angeboten hat, wie sie finanziert werden und wie frei künstlerischer Ausdruck sein sollte.",
    example: "Ein öffentlich finanziertes Theater zeigt ein kontroverses Stück und erreicht damit neue Zielgruppen, löst aber gleichzeitig eine Debatte über Förderung und gesellschaftliche Verantwortung aus.",
    tension: "künstlerische Freiheit ↔ öffentliche Förderung, Zugang und gesellschaftliche Verantwortung",
    question: "Welche Aufgaben sollte Kultur in einer Gesellschaft erfüllen, und wie weit sollte öffentliche Förderung dabei gehen?",
  },
  "Künstliche Intelligenz und Arbeitswelt": {
    intro: "Künstliche Intelligenz verändert vor allem Aufgaben, Entscheidungsprozesse und Kompetenzanforderungen. Produktivitätsgewinne können neue Möglichkeiten schaffen, während gleichzeitig Fragen nach Kontrolle, Qualifizierung und Arbeitsplatzsicherheit entstehen.",
    example: "Ein Unternehmen automatisiert Routineauswertungen mit KI, während Beschäftigte stärker Beratung, Qualitätskontrolle und komplexe Entscheidungen übernehmen.",
    tension: "Effizienz und Automatisierung ↔ menschliche Verantwortung, Weiterbildung und Arbeitsplatzsicherheit",
    question: "Wie sollten Unternehmen und Beschäftigte mit KI umgehen, damit Produktivitätsgewinne nicht auf Kosten von Transparenz und fairen Übergängen entstehen?",
  },
  "Digitalisierung und Datenschutz": {
    intro: "Digitale Dienste können Prozesse beschleunigen und personalisieren, benötigen dafür aber häufig große Mengen personenbezogener Daten. Entscheidend ist, ob Datennutzung transparent, zweckgebunden, sicher und für Nutzer kontrollierbar bleibt.",
    example: "Eine App vereinfacht Behördengänge, sammelt dabei aber zusätzliche Nutzungsdaten, deren weiterer Verwendungszweck für viele Menschen unklar ist.",
    tension: "digitale Bequemlichkeit und Effizienz ↔ Datenschutz, Sicherheit und Selbstbestimmung",
    question: "Wie viel Datennutzung ist vertretbar, wenn digitale Dienste dadurch deutlich bequemer oder effizienter werden?",
  },
  "Personalisierte Werbung": {
    intro: "Personalisierte Werbung nutzt Daten und Verhaltensmuster, um Inhalte gezielt auf einzelne Personen zuzuschneiden. Das kann Angebote relevanter machen, wirft aber Fragen nach Transparenz, Beeinflussung und digitaler Selbstbestimmung auf.",
    example: "Nach mehreren Produktsuchen sieht eine Person auf verschiedenen Plattformen fast nur noch Werbung für ähnliche Angebote.",
    tension: "relevantere Werbung und wirtschaftliche Interessen ↔ Privatsphäre, Transparenz und Verbraucherautonomie",
    question: "Unter welchen Bedingungen kann personalisierte Werbung nützlich sein, ohne Nutzer unangemessen zu beeinflussen?",
  },
  "Online- und Offline-Identität": {
    intro: "Menschen zeigen je nach sozialem Kontext unterschiedliche Seiten ihrer Identität. Online können Profile bewusst gestaltet werden; dadurch entstehen Chancen für Selbstausdruck, aber auch Druck zur Inszenierung und Risiken für Privatsphäre.",
    example: "Eine Person präsentiert online hauptsächlich berufliche Erfolge, obwohl ihr Alltag wesentlich vielfältiger und auch von Unsicherheiten geprägt ist.",
    tension: "Selbstdarstellung und soziale Zugehörigkeit ↔ Authentizität, Privatsphäre und Erwartungsdruck",
    question: "Wie stark darf sich eine Online-Identität von der eigenen Lebensrealität unterscheiden, ohne problematisch zu werden?",
  },
  "Gesellschaftlicher Zusammenhalt": {
    intro: "Gesellschaftlicher Zusammenhalt entsteht durch Vertrauen, faire Teilhabe, gemeinsame Regeln und die Möglichkeit, Konflikte friedlich auszutragen. Unterschiedliche Interessen müssen nicht verschwinden, solange Institutionen und soziale Beziehungen tragfähig bleiben.",
    example: "Ein Stadtteil schafft gemeinsame Räume und Beteiligungsangebote, damit Menschen mit unterschiedlichen Lebenslagen häufiger miteinander in Kontakt kommen.",
    tension: "individuelle Freiheit und unterschiedliche Interessen ↔ Solidarität, Vertrauen und gemeinsame Verantwortung",
    question: "Welche Bedingungen stärken gesellschaftlichen Zusammenhalt, wenn Interessen und Lebenslagen deutlich auseinandergehen?",
  },
  "Mehrsprachigkeit": {
    intro: "Mehrsprachigkeit kann Identität, Bildung und berufliche Chancen erweitern. Gleichzeitig braucht eine Gesellschaft gemeinsame Verständigungsmöglichkeiten und Bildungssysteme, die sprachliche Vielfalt weder romantisieren noch als Defizit behandeln.",
    example: "Ein Kind nutzt zu Hause zwei Sprachen und lernt in der Schule auf Deutsch; Unterrichtskonzepte können vorhandene Sprachkenntnisse gezielt einbeziehen.",
    tension: "gemeinsame Verständigung und Bildungssprache ↔ Förderung sprachlicher Vielfalt",
    question: "Wie kann Mehrsprachigkeit gefördert werden, ohne gemeinsame sprachliche Teilhabe zu erschweren?",
  },
  "Migration und Integration": {
    intro: "Integration betrifft Sprache, Bildung, Arbeit, Anerkennung von Qualifikationen, soziale Kontakte und institutionellen Zugang. Sie ist weder ausschließlich individuelle Anpassung noch allein eine Aufgabe des Staates.",
    example: "Eine qualifizierte Fachkraft spricht gut Deutsch, kann aber erst nach Anerkennung ihres Abschlusses im erlernten Beruf arbeiten.",
    tension: "Eigeninitiative der Zugewanderten ↔ institutionelle Offenheit und Unterstützung",
    question: "Wie sollte Verantwortung für gelingende Integration zwischen Einzelnen, Institutionen und Gesellschaft verteilt werden?",
  },
  "Ehrenamt und gesellschaftlicher Pflichtdienst": {
    intro: "Ehrenamt kann Gemeinschaft stärken und Erfahrungen ermöglichen, beruht aber grundsätzlich auf freiwilligem Engagement. Ein Pflichtdienst verfolgt andere Ziele und greift stärker in persönliche Lebensplanung und Freiheit ein.",
    example: "Junge Erwachsene könnten ein Jahr in Pflege, Katastrophenschutz oder sozialen Einrichtungen arbeiten, müssten dafür aber Ausbildung oder Berufseinstieg verschieben.",
    tension: "gesellschaftlicher Nutzen und gemeinschaftliche Verantwortung ↔ Freiwilligkeit und persönliche Autonomie",
    question: "Welche Aufgaben eignen sich für freiwilliges Engagement, und unter welchen Bedingungen wäre ein gesellschaftlicher Pflichtdienst vertretbar?",
  },
  "Demokratie und soziale Medien": {
    intro: "Soziale Medien erleichtern politische Information und Beteiligung, verändern aber auch Sichtbarkeit, Aufmerksamkeit und Verbreitung von Inhalten. Algorithmen, Desinformation und zugespitzte Kommunikation können öffentliche Debatten beeinflussen.",
    example: "Ein politischer Beitrag erreicht sehr viele Menschen, weil er starke Reaktionen auslöst, obwohl die zugrunde liegende Behauptung nur unzureichend belegt ist.",
    tension: "offene Beteiligung und Meinungsfreiheit ↔ verlässliche Information und verantwortliche Moderation",
    question: "Wie können soziale Medien politische Beteiligung ermöglichen, ohne Desinformation und Polarisierung unnötig zu verstärken?",
  },
  "Bildung und Prüfungsformate": {
    intro: "Prüfungen sollen Leistungen möglichst fair und aussagekräftig erfassen. Unterschiedliche Formate messen jedoch unterschiedliche Kompetenzen und können durch Technik, Zeitdruck oder persönliche Voraussetzungen verschieden wirken.",
    example: "Eine digitale Prüfung ermöglicht schnelle Auswertung, setzt aber zuverlässige Geräte, Internetzugang und klare Regeln für technische Störungen voraus.",
    tension: "Effizienz und standardisierte Bewertung ↔ Chancengleichheit und realistische Kompetenzmessung",
    question: "Welche Prüfungsformate messen Leistung möglichst fair, ohne wichtige Kompetenzen auf ein einziges Format zu reduzieren?",
  },
  "Lebenslanges Lernen": {
    intro: "Berufe und Technologien verändern sich kontinuierlich, weshalb Lernen nicht mit Ausbildung oder Studium endet. Weiterbildung hängt jedoch von Zeit, Geld, Motivation und Unterstützung durch Arbeitgeber oder öffentliche Stellen ab.",
    example: "Ein Unternehmen führt neue Software ein und stellt Beschäftigten Arbeitszeit sowie finanzierte Schulungen für die Umstellung zur Verfügung.",
    tension: "Eigenverantwortung für Weiterbildung ↔ Verantwortung von Arbeitgebern und öffentlichen Institutionen",
    question: "Wie kann lebenslanges Lernen gefördert werden, ohne Weiterbildung ausschließlich zur privaten Aufgabe Einzelner zu machen?",
  },
  "Homeoffice und moderne Arbeitsformen": {
    intro: "Homeoffice und hybride Arbeit können Wege reduzieren und Flexibilität erhöhen. Gleichzeitig verändern sie Zusammenarbeit, Kontrolle, Erreichbarkeit und die Grenze zwischen Beruf und Privatleben.",
    example: "Eine Mitarbeiterin arbeitet drei Tage von zu Hause, erhält aber auch abends regelmäßig Nachrichten, auf die schnelle Antworten erwartet werden.",
    tension: "Flexibilität und Autonomie ↔ Zusammenarbeit, Erreichbarkeitsgrenzen und Erholung",
    question: "Welche Regeln brauchen moderne Arbeitsformen, damit Flexibilität nicht zu dauerhafter Erreichbarkeit oder Isolation führt?",
  },
  "Fachkräftemangel und berufliche Mobilität": {
    intro: "Fachkräftemangel kann durch demografische Entwicklungen, Qualifikationslücken oder unattraktive Arbeitsbedingungen entstehen. Mögliche Antworten reichen von Weiterbildung über bessere Arbeitsbedingungen bis zur Anerkennung ausländischer Qualifikationen.",
    example: "Ein Krankenhaus findet zu wenige Fachkräfte und kombiniert bessere Arbeitszeiten, zusätzliche Ausbildungsplätze und schnellere Anerkennungsverfahren.",
    tension: "schnelle Personalgewinnung ↔ nachhaltige Ausbildung, faire Bedingungen und Integration",
    question: "Welche Maßnahmen sind langfristig geeignet, Fachkräftemangel zu verringern, ohne das Problem nur kurzfristig zu verschieben?",
  },
  "Bedingungsloses Grundeinkommen": {
    intro: "Ein bedingungsloses Grundeinkommen würde regelmäßige Zahlungen ohne individuelle Bedürftigkeitsprüfung vorsehen. Diskutiert werden soziale Sicherheit, Verwaltungsaufwand, Finanzierung, Arbeitsanreize und die Zukunft bestehender Sozialleistungen.",
    example: "Ein Modell ersetzt einen Teil bisheriger Leistungen durch eine einheitliche Zahlung, müsste aber klären, wie zusätzliche Unterstützungsbedarfe weiterhin berücksichtigt werden.",
    tension: "einfache soziale Absicherung und individuelle Freiheit ↔ Finanzierung, Zielgenauigkeit und Arbeitsanreize",
    question: "Welche Probleme könnte ein bedingungsloses Grundeinkommen lösen, und welche neuen Finanzierungs- oder Verteilungsfragen würde es schaffen?",
  },
  "Nachhaltigkeit in der Wirtschaft": {
    intro: "Nachhaltige Wirtschaft verbindet ökologische Ziele mit Produktion, Investitionen, Lieferketten und Wettbewerbsfähigkeit. Veränderungen verursachen häufig kurzfristige Kosten, können aber langfristig Risiken und Ressourcenverbrauch reduzieren.",
    example: "Ein Hersteller investiert in energieeffiziente Maschinen und reparierbare Produkte, obwohl die Umstellung zunächst höhere Kosten verursacht.",
    tension: "kurzfristige Wettbewerbsfähigkeit und Investitionskosten ↔ langfristige ökologische und wirtschaftliche Resilienz",
    question: "Wie können Unternehmen nachhaltiger wirtschaften, ohne ökologische Verantwortung gegen wirtschaftliche Tragfähigkeit auszuspielen?",
  },
  "Klimawandel und Verkehr": {
    intro: "Verkehrspolitik muss Mobilität ermöglichen und gleichzeitig Emissionen, Flächenverbrauch und soziale Zugänglichkeit berücksichtigen. Stadt und Land brauchen dabei oft unterschiedliche Lösungen.",
    example: "Eine Großstadt baut Bahn- und Radverkehr aus, während eine ländliche Region vor allem zuverlässigere Busverbindungen und Park-and-Ride-Angebote benötigt.",
    tension: "individuelle Mobilität und Erreichbarkeit ↔ Klimaschutz, Kosten und öffentlicher Raum",
    question: "Welche Verkehrsmaßnahmen können Emissionen wirksam senken, ohne Mobilität für bestimmte Gruppen unverhältnismäßig einzuschränken?",
  },
  "Nachhaltiger Konsum": {
    intro: "Nachhaltiger Konsum betrifft Lebensdauer, Reparierbarkeit, Ressourcenverbrauch, Herkunft und Preis von Produkten. Verbraucher treffen Entscheidungen, doch Hersteller, Handel und Regulierung bestimmen wesentlich mit, welche Alternativen verfügbar sind.",
    example: "Ein langlebiges reparierbares Gerät kostet beim Kauf mehr, kann aber über mehrere Jahre weniger Ressourcen verbrauchen als mehrere billige Ersatzgeräte.",
    tension: "niedrige Preise und Bequemlichkeit ↔ Langlebigkeit, Transparenz und Produzentenverantwortung",
    question: "Wie kann nachhaltiger Konsum gefördert werden, ohne die Verantwortung ausschließlich auf einzelne Verbraucher zu verlagern?",
  },
  "Reisen und Nachhaltigkeit": {
    intro: "Reisen ermöglicht Erholung, wirtschaftlichen Austausch und kulturelle Begegnung, verursacht aber Emissionen und kann beliebte Orte infrastrukturell oder sozial belasten. Nachhaltigkeit betrifft daher Verkehrsmittel, Aufenthaltsdauer und lokale Auswirkungen.",
    example: "Eine Region profitiert stark von Gästen, begrenzt aber gleichzeitig Reisebusse und Kurzzeitvermietungen, um Verkehr und Wohnraummangel zu reduzieren.",
    tension: "Mobilität, Begegnung und Tourismuseinnahmen ↔ Emissionen und lokale Lebensqualität",
    question: "Wie kann Reisen nachhaltiger werden, ohne Mobilität und wirtschaftliche Chancen unnötig einzuschränken?",
  },
  "Gesundheit und Impfpflicht": {
    intro: "Bei Impfpflichten treffen individuelle Entscheidungsfreiheit, Schutz besonders gefährdeter Personen, wissenschaftliche Evidenz und staatliche Eingriffe aufeinander. Eine sachliche Bewertung muss Wirksamkeit, Risiko, Verhältnismäßigkeit und Alternativen getrennt prüfen.",
    example: "Bei einer ansteckenden Krankheit wird diskutiert, ob eine Impfpflicht nur für besonders exponierte Berufsgruppen oder für eine größere Bevölkerungsgruppe gelten sollte.",
    tension: "individuelle Selbstbestimmung ↔ Schutz anderer und öffentliche Gesundheitsziele",
    question: "Unter welchen Bedingungen wäre eine Impfpflicht verhältnismäßig, und welche weniger eingreifenden Alternativen sollten zuerst geprüft werden?",
  },
  "Ernährung und moderner Lebensstil": {
    intro: "Ernährung wird von persönlichen Gewohnheiten, Zeit, Einkommen, Werbung und verfügbarer Infrastruktur beeinflusst. Gesundheitspolitik kann informieren und Rahmenbedingungen verändern, ohne individuelle Verantwortung vollständig zu ersetzen.",
    example: "Eine Beschäftigte möchte gesünder essen, hat aber im Schichtdienst wenig Zeit und am Arbeitsplatz hauptsächlich stark verarbeitete Angebote.",
    tension: "persönliche Verantwortung ↔ soziale, wirtschaftliche und berufliche Rahmenbedingungen",
    question: "Wie lässt sich gesündere Ernährung fördern, ohne komplexe Lebensbedingungen auf individuelle Disziplin zu reduzieren?",
  },
  "Wohnen, Mieten und soziale Gerechtigkeit": {
    intro: "Wohnungspolitik muss Bezahlbarkeit, Angebot, Eigentumsrechte, Baukosten und Lebensqualität miteinander verbinden. Maßnahmen können kurzfristig entlasten und zugleich langfristige Auswirkungen auf Neubau oder Investitionen haben.",
    example: "Eine Stadt begrenzt Mieterhöhungen und fördert gleichzeitig Neubau, damit kurzfristiger Schutz nicht zu einem dauerhaft knappen Wohnungsangebot führt.",
    tension: "bezahlbarer Wohnraum und Mieterschutz ↔ Investitionsanreize und ausreichendes Angebot",
    question: "Welche Kombination aus Mieterschutz, Neubau und Förderung kann Wohnraum langfristig bezahlbarer machen?",
  },
  "Zukunftstechnologien und Innovation": {
    intro: "Neue Technologien können Produktivität, Medizin oder Alltag stark verändern, während langfristige Nebenwirkungen oft noch unsicher sind. Gute Innovationspolitik verbindet Experimentiermöglichkeiten mit Transparenz, Sicherheitsstandards und lernfähiger Regulierung.",
    example: "Eine neue Technologie wird zunächst in begrenzten Pilotprojekten eingesetzt, bevor sie nach Auswertung von Nutzen und Risiken breiter zugelassen wird.",
    tension: "schnelle Innovation und wirtschaftliche Chancen ↔ Vorsorge, Sicherheit und gesellschaftliche Kontrolle",
    question: "Wie kann Innovation gefördert werden, ohne mögliche Risiken erst zu berücksichtigen, nachdem Schäden bereits entstanden sind?",
  },
  "Globalisierung und internationale Zusammenarbeit": {
    intro: "Globale Arbeitsteilung und internationale Kooperation können Handel, Wissenstransfer und gemeinsame Problemlösungen erleichtern. Gleichzeitig entstehen Abhängigkeiten, Verteilungsfragen und Risiken bei Krisen oder einseitigen Lieferketten.",
    example: "Ein Unternehmen bezieht wichtige Bauteile aus nur einer Weltregion, weil das günstig ist, wird bei einer Krise aber besonders verwundbar.",
    tension: "Effizienz, offene Märkte und Zusammenarbeit ↔ Resilienz, faire Standards und strategische Unabhängigkeit",
    question: "Wie viel internationale Abhängigkeit ist sinnvoll, wenn globale Zusammenarbeit wirtschaftliche Vorteile schafft, aber Krisenrisiken erhöht?",
  },
  "Wissenschaftliches Arbeiten und Quellen": {
    intro: "Wissenschaftliches Arbeiten verlangt nachvollziehbare Quellen, klare Trennung von Befund und Interpretation sowie einen transparenten Umgang mit Unsicherheit. Gute Quellenarbeit bedeutet mehr als das Sammeln vieler Belege.",
    example: "Eine Autorin nennt nicht nur eine Statistik, sondern prüft Originalquelle, Erhebungsmethode, Erscheinungsdatum und die Grenzen der Aussagekraft.",
    tension: "verständliche und schnelle Kommunikation ↔ Quellenprüfung, Präzision und wissenschaftliche Nachvollziehbarkeit",
    question: "Welche Kriterien entscheiden darüber, ob eine Quelle für eine wissenschaftliche Argumentation wirklich belastbar ist?",
  },
  "Stellungnahme und formelle Korrespondenz": {
    intro: "Eine Stellungnahme und eine formelle Nachricht verfolgen unterschiedliche kommunikative Ziele, brauchen aber beide klare Struktur, angemessenes Register und präzise Begründungen. Komplexität ist nur sinnvoll, wenn sie die Aussage verbessert.",
    example: "In einer Stellungnahme wird ein Gegenargument abgewogen; in einer formellen E-Mail wird dasselbe Problem adressatengerecht beschrieben und mit einer konkreten Bitte verbunden.",
    tension: "sprachliche Komplexität und formelles Register ↔ Klarheit, Adressatenbezug und Handlungsziel",
    question: "Wie lässt sich anspruchsvolle C1-Sprache einsetzen, ohne dass Struktur, Höflichkeit oder Verständlichkeit verloren gehen?",
  },
  "Prüfungsvorbereitung und spontane Argumentation": {
    intro: "In einer C1-Prüfung müssen Inhalte unter Zeitdruck strukturiert, sprachlich kontrolliert und flexibel entwickelt werden. Gute spontane Argumentation entsteht nicht durch möglichst viele Ideen, sondern durch klare Kriterien, Begründungen und Beispiele.",
    example: "Eine Lernende nutzt 30 Sekunden Vorbereitung, notiert Position, Grund, Beispiel und Gegenargument und spricht anschließend 90 Sekunden strukturiert.",
    tension: "sprachliche Komplexität und Ideenfülle ↔ Klarheit, Kontrolle und Zeitmanagement",
    question: "Wie kann man unter Prüfungsdruck differenziert argumentieren, ohne Struktur oder sprachliche Kontrolle zu verlieren?",
  },
});


function dayNumber(slide = {}) {
  const direct = Number(slide.dayNumber);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const match = String(slide.day || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function cleanSlideTitle(slide = {}) {
  return String(slide.title || slide.topic || "")
    .replace(/^(?:A2|B1|B2|C1|C2)\s+(?:Day\s+)?\d+\s*·?\s*/i, "")
    .replace(/^\d+(?:\.\d+)*\s*·?\s*/, "")
    .trim();
}

export function getPresenterTopicFoundation(slide = {}) {
  const level = String(slide.course || "").trim().toUpperCase();
  const day = dayNumber(slide);

  if (level === "A2") {
    const item = A2_SITUATIONS[day];
    if (!item) return null;
    return {
      level,
      day,
      kicker: "A2 · Situation verstehen",
      title: item.title,
      intro: item.intro,
      exampleLabel: "Beispiel",
      example: item.example,
      suggestedMinutes: 3,
      teacherNote: "Zuerst die Alltagssituation klären. Noch keine Grammatik erklären und noch keine längere Diskussion starten.",
    };
  }

  if (level === "B1") {
    const item = B1_TOPIC_INTROS[day];
    if (!item) return null;
    return {
      level,
      day,
      kicker: "B1 · Thema kurz verstehen",
      title: item.title,
      intro: item.intro,
      exampleLabel: "Beispiel",
      example: item.example,
      questionLabel: "Denkfrage",
      question: item.question,
      suggestedMinutes: 4,
      teacherNote: "Bedeutung und Beispiel zuerst sichern. Die Denkfrage nur kurz aktivieren; die eigentliche Argumentation folgt später.",
    };
  }

  if (level === "B2") {
    const item = B2_TOPIC_FOUNDATIONS[day];
    if (!item) return null;
    return {
      level,
      day,
      kicker: "B2 · Thema verstehen",
      title: cleanSlideTitle(slide),
      intro: item.intro,
      exampleLabel: "Konkretes Beispiel",
      example: item.example,
      tensionLabel: "Abwägung",
      tension: item.tension,
      questionLabel: "Leitfrage",
      question: item.question,
      suggestedMinutes: 5,
      teacherNote: "Do not debate yet. First make sure students understand the issue, the example and the trade-off. Debate begins in the later speaking stage.",
    };
  }

  if (level === "C1") {
    const topic = cleanSlideTitle(slide);
    const item = C1_TOPIC_FOUNDATIONS_BY_TOPIC[topic];
    if (!item) return null;
    return {
      level,
      day,
      kicker: "C1 · Thema verstehen",
      title: topic,
      intro: item.intro,
      exampleLabel: "Konkretes Beispiel",
      example: item.example,
      tensionLabel: "Zielkonflikt / Perspektiven",
      tension: item.tension,
      questionLabel: "Leitfrage",
      question: item.question,
      suggestedMinutes: 6,
      teacherNote: "Do not debate yet. Establish the concept, affected perspectives and real target conflict first; argumentation follows after grammar.",
    };
  }

  if (level === "C2") {
    const item = getC2TopicFoundation(day);
    if (!item) return null;
    return {
      level,
      day,
      kicker: "C2 · Kernfrage verstehen",
      title: cleanSlideTitle(slide),
      simpleEnglishLabel: "Simple English",
      simpleEnglish: item.en,
      intro: item.de,
      exampleLabel: "Konkretes Beispiel",
      example: item.example,
      tensionLabel: "Kernspannung",
      tension: item.tension,
      questionLabel: "Kernfrage",
      question: item.core,
      suggestedMinutes: 7,
      teacherNote: "Do not debate yet. Clarify the concept, assumptions, affected actors and central tension before students evaluate the three course perspectives.",
    };
  }

  return null;
}

export const PRESENTER_FOUNDATION_LEVELS = Object.freeze(["A2", "B1", "B2", "C1", "C2"]);
export const PRESENTER_FOUNDATION_SOURCE_SHA = "bafaffbb5fee47a0b9b4effa040dc69cf052f5fa";
