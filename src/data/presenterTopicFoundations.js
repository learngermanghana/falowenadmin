import { getC2TopicFoundation } from "./c2TopicFoundations.js";

// Classroom foundations mirrored from the student Falowen curriculum.
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
const C1_TOPIC_FOUNDATIONS = Object.freeze({
  1: {
    intro: "Anspruchsvolle Lernziele funktionieren besser, wenn sie in überprüfbare Etappen zerlegt werden. Gleichzeitig muss ein guter Lernplan flexibel genug bleiben, um auf Zeitprobleme, Rückschläge und neues Feedback reagieren zu können.",
    example: "Eine Lernende plant vier Wochen lang täglich 45 Minuten Deutsch, überprüft jeden Sonntag ihre Fehler und passt die nächste Woche entsprechend an.",
    tension: "klare Planung und messbare Ziele ↔ notwendige Flexibilität bei Rückschlägen",
  },
  2: {
    intro: "Kulturelle Identität entsteht nicht nur aus Herkunft. Sprache, Familie, Erfahrungen, Migration, soziale Beziehungen und persönliche Entscheidungen können gleichzeitig prägen, wie Menschen sich selbst verstehen und zu welcher Gruppe sie sich zugehörig fühlen.",
    example: "Eine Person wächst mit zwei Sprachen auf, lebt später in einem dritten Land und verbindet Werte und Gewohnheiten aus mehreren Lebenswelten.",
    tension: "Zugehörigkeit und gemeinsame Traditionen ↔ individuelle Mehrfachidentität und Veränderung",
  },
  3: {
    intro: "Informationskompetenz bedeutet, Behauptungen, Quellen und Belege voneinander zu unterscheiden. Gerade online reicht es nicht, dass eine Aussage oft geteilt wird oder professionell aussieht; entscheidend ist, ob sie überprüfbar und nachvollziehbar belegt ist.",
    example: "Ein viraler Beitrag nennt eine angebliche Studie, verlinkt aber weder die Originalquelle noch eine seriöse wissenschaftliche Institution.",
    tension: "schnelle Verbreitung und Meinungsfreiheit ↔ sorgfältige Prüfung und Schutz vor Desinformation",
  },
  4: {
    intro: "Erfolgreiche Teamarbeit hängt nicht nur von Sympathie ab. Rollen, Erwartungen, Verantwortung, Kommunikation und Konfliktlösung müssen so organisiert sein, dass Beiträge fair verteilt und Probleme früh angesprochen werden.",
    example: "In einem Projekt erledigt eine Person fast alle Aufgaben, obwohl die Verantwortung ursprünglich auf vier Teammitglieder verteilt war.",
    tension: "harmonische Zusammenarbeit ↔ klare Verantwortung und notwendige Konfliktklärung",
  },
  5: {
    intro: "Berufliche Entwicklung entsteht aus Erfahrung, Weiterbildung, Eigeninitiative und den Möglichkeiten, die Arbeitgeber oder Institutionen anbieten. Nicht alle Beschäftigten haben jedoch denselben Zugang zu Zeit, Finanzierung oder passenden Lernangeboten.",
    example: "Ein Unternehmen führt neue Software ein und finanziert Schulungen für Beschäftigte, statt von ihnen zu erwarten, dass sie sich ausschließlich privat weiterbilden.",
    tension: "Eigenverantwortung der Beschäftigten ↔ Verantwortung von Arbeitgebern für Weiterbildung",
  },
  6: {
    intro: "Gesundheit wird durch persönliche Gewohnheiten und äußere Bedingungen beeinflusst. Ernährung, Bewegung und Schlaf sind wichtig, aber auch Arbeitszeiten, Stress, Wohnbedingungen und Zugang zu Prävention können gesundheitliche Entscheidungen erleichtern oder erschweren.",
    example: "Eine Beschäftigte möchte regelmäßig Sport treiben, arbeitet aber dauerhaft in wechselnden Nachtschichten und schläft dadurch unregelmäßig.",
    tension: "persönliche Eigenverantwortung ↔ gesellschaftliche und berufliche Rahmenbedingungen",
  },
  7: {
    intro: "Nachhaltiges Reisen bedeutet, Umweltwirkung, Verkehrsmittel, Reisedauer, lokale Wirtschaft und soziale Zugänglichkeit gemeinsam zu betrachten. Eine Reise kann wirtschaftlich nützlich sein und gleichzeitig Umwelt oder lokale Lebensqualität belasten.",
    example: "Eine Region profitiert stark vom Tourismus, leidet aber in der Hauptsaison unter Verkehr, hohen Mieten und überfüllten Orten.",
    tension: "Mobilität und wirtschaftlicher Nutzen ↔ Umweltbelastung und lokale Lebensqualität",
  },
  8: {
    intro: "Stadtentwicklung muss mehrere Ziele gleichzeitig berücksichtigen: bezahlbares Wohnen, Infrastruktur, Grünflächen, Verkehr und wirtschaftliche Entwicklung. Maßnahmen helfen oft einer Gruppe stärker als einer anderen und erzeugen neue Zielkonflikte.",
    example: "Eine Stadt verdichtet ein Wohngebiet, um mehr Wohnungen zu schaffen, verliert dadurch aber einen Teil der freien Grünfläche.",
    tension: "mehr Wohnraum und wirtschaftliche Nutzung ↔ Grünflächen und Lebensqualität",
  },
  9: {
    intro: "Werbung beeinflusst Kaufentscheidungen durch Sprache, Bilder, Wiederholung und persönliche Daten. Besonders personalisierte Werbung kann relevant wirken, wirft aber Fragen nach Transparenz, Manipulation und digitaler Selbstbestimmung auf.",
    example: "Eine Plattform zeigt nach mehreren Produktsuchen gezielt Werbung, die auf das vermutete Interesse einer Person zugeschnitten ist.",
    tension: "relevante Angebote und wirtschaftliche Interessen ↔ Verbraucherautonomie und Datenschutz",
  },
  10: {
    intro: "Integration ist kein einseitiger Anpassungsprozess. Sprache, Bildung, Arbeitsmarkt, soziale Kontakte, Anerkennung von Qualifikationen und faire Institutionen beeinflussen gemeinsam, ob gesellschaftliche Teilhabe gelingt.",
    example: "Eine ausgebildete Pflegekraft lernt Deutsch, kann aber lange nicht im Beruf arbeiten, weil die Anerkennung ihrer Qualifikation noch fehlt.",
    tension: "Eigeninitiative der Zugewanderten ↔ institutionelle Unterstützung und faire Zugangsbedingungen",
  },
  11: {
    intro: "Ehrenamt stärkt Gemeinschaft und kann wichtige soziale Aufgaben unterstützen. Es sollte jedoch nicht dazu führen, dass dauerhaft notwendige öffentliche Leistungen auf unbezahlte Einzelpersonen verlagert werden.",
    example: "Freiwillige organisieren regelmäßig Nachbarschaftshilfe, merken aber nach einigen Monaten, dass wenige Personen fast die gesamte Arbeit übernehmen.",
    tension: "gesellschaftliches Engagement ↔ Überlastung und staatliche Verantwortung",
  },
  12: {
    intro: "Kultur- und Freizeitangebote beeinflussen Lebensqualität, Begegnung und gesellschaftliche Teilhabe. Zugang hängt jedoch oft von Kosten, Ort, Zeit, Barrierefreiheit und öffentlicher Förderung ab.",
    example: "Ein städtisches Kulturzentrum bietet günstige Veranstaltungen an, erreicht aber Menschen aus abgelegenen Stadtteilen nur schwer.",
    tension: "vielfältiges Kulturangebot ↔ faire Zugänglichkeit und Finanzierung",
  },
  13: {
    intro: "Mehrsprachigkeit kann Kommunikation, Identität und berufliche Chancen erweitern. Gleichzeitig braucht sie gute Lernbedingungen, damit vorhandene Sprachen nicht als Hindernis behandelt, sondern sinnvoll in Bildung und Alltag genutzt werden.",
    example: "Ein Kind spricht zu Hause zwei Sprachen und nutzt beide beim Lernen, erhält in der Schule aber nur Unterstützung in einer davon.",
    tension: "gemeinsame Bildungssprache ↔ Förderung sprachlicher Vielfalt",
  },
  14: {
    intro: "Innovation kann große Vorteile schaffen, obwohl ihre langfristigen Folgen nicht immer sicher vorhersehbar sind. Gesellschaften müssen deshalb Nutzen, Risiken, Zugang, Regulierung und Vorsorge gleichzeitig berücksichtigen.",
    example: "Eine neue Technologie senkt Produktionskosten, aber ihre Auswirkungen auf Beschäftigung und Datenschutz sind noch nicht vollständig geklärt.",
    tension: "schnelle Innovation und wirtschaftlicher Nutzen ↔ Vorsorge und gesellschaftliche Verantwortung",
  },
  15: {
    intro: "Lebenslanges Lernen wird wichtiger, weil sich Berufe, Technologien und Kompetenzanforderungen verändern. Weiterbildung bleibt jedoch ungleich zugänglich, wenn Zeit, Geld oder Unterstützung fehlen.",
    example: "Eine Beschäftigte möchte einen berufsbegleitenden Kurs besuchen, kann die Kosten aber ohne Unterstützung des Arbeitgebers nicht tragen.",
    tension: "individuelle Lernbereitschaft ↔ fairer Zugang und institutionelle Finanzierung",
  },
  16: {
    intro: "Digitale Dienste können Alltag und Verwaltung vereinfachen, schaffen aber auch neue Abhängigkeiten. Menschen ohne passende Geräte, Internetzugang oder digitale Kompetenzen dürfen dadurch nicht vom Zugang zu wichtigen Leistungen ausgeschlossen werden.",
    example: "Eine Behörde bietet fast alle Termine online an, während ältere Personen Schwierigkeiten mit der digitalen Anmeldung haben.",
    tension: "Effizienz und Bequemlichkeit ↔ Datenschutz, Barrierefreiheit und analoger Zugang",
  },
  17: {
    intro: "Umweltverantwortung verteilt sich auf Privatpersonen, Unternehmen und öffentliche Institutionen. Individuelles Verhalten ist wichtig, reicht aber allein nicht aus, wenn Infrastruktur, Produktion oder gesetzliche Regeln nachhaltiges Handeln erschweren.",
    example: "Menschen sollen weniger Auto fahren, haben in einer ländlichen Region aber kaum zuverlässige öffentliche Verkehrsmittel.",
    tension: "individuelle Verantwortung ↔ strukturelle und politische Verantwortung",
  },
  18: {
    intro: "Gesellschaftlicher Zusammenhalt entsteht dort, wo Menschen trotz unterschiedlicher Interessen Vertrauen, Teilhabe und faire Regeln erleben. Soziale Ungleichheit, Ausgrenzung und fehlende Begegnungsmöglichkeiten können dieses Vertrauen schwächen.",
    example: "In einem Stadtteil gibt es kaum gemeinsame öffentliche Räume, sodass verschiedene soziale Gruppen nur selten miteinander in Kontakt kommen.",
    tension: "individuelle Freiheit und unterschiedliche Interessen ↔ Solidarität und gemeinsame Verantwortung",
  },
  19: {
    intro: "Die Arbeitswelt verändert sich durch Automatisierung, digitale Technologien und flexible Arbeitsmodelle. Nicht jede Veränderung führt automatisch zu Arbeitsplatzverlust; oft verändern sich Aufgaben und damit die benötigten Kompetenzen.",
    example: "Eine Software übernimmt Routineberichte, während Beschäftigte stärker Beratung, Kontrolle und komplexe Entscheidungen übernehmen.",
    tension: "Produktivität und flexible Arbeit ↔ Arbeitsplatzsicherheit, Weiterbildung und Belastungsgrenzen",
  },
  20: {
    intro: "Digitale Gesundheitsangebote können Zugang und Kommunikation verbessern, ersetzen aber nicht jede medizinische Untersuchung. Besonders wichtig sind medizinische Qualität, Datenschutz und klare Verantwortlichkeit.",
    example: "Eine Patientin bespricht einen Laborbefund online, benötigt für eine körperliche Untersuchung aber weiterhin einen Termin in der Praxis.",
    tension: "leichter Zugang und Effizienz ↔ medizinische Grenzen und Schutz sensibler Daten",
  },
  21: {
    intro: "Langfristige gesellschaftliche Teilhabe hängt nicht nur von Sprachkenntnissen ab. Bildung, Arbeit, Anerkennung von Qualifikationen, soziale Kontakte und diskriminierungsarme Institutionen beeinflussen, ob Menschen tatsächlich Zugang zu wichtigen Bereichen erhalten.",
    example: "Ein Ingenieur spricht gut Deutsch, findet aber lange keine passende Arbeit, weil sein ausländischer Abschluss noch nicht anerkannt wurde.",
    tension: "persönliche Eigeninitiative ↔ institutionelle Zugangsbarrieren und Unterstützung",
  },
  22: {
    intro: "Demokratische Mitbestimmung findet auf unterschiedlichen Ebenen statt: durch Wahlen, Bürgerinitiativen, Beteiligungsverfahren oder politische Diskussionen. Mehr Beteiligung ist nur dann sinnvoll, wenn Menschen informiert teilnehmen können und Entscheidungen transparent bleiben.",
    example: "Eine Kommune lässt Einwohner über die Gestaltung eines öffentlichen Platzes beraten, muss aber am Ende auch Finanzierung und rechtliche Vorgaben berücksichtigen.",
    tension: "direkte Beteiligung und Mitsprache ↔ fachliche, rechtliche und repräsentative Entscheidungsverantwortung",
  },
  23: {
    intro: "Work-Life-Balance hängt nicht nur von persönlicher Disziplin ab. Arbeitszeit, Erreichbarkeit, Homeoffice-Regeln, Betreuungspflichten und betriebliche Erwartungen bestimmen mit, ob ausreichende Erholung möglich ist.",
    example: "Ein Unternehmen erlaubt Homeoffice, erwartet aber gleichzeitig, dass Beschäftigte auch abends schnell auf Nachrichten reagieren.",
    tension: "Flexibilität und betriebliche Erreichbarkeit ↔ verlässliche Erholung und private Grenzen",
  },
  24: {
    intro: "Verkehrsinfrastruktur soll Mobilität zuverlässig, bezahlbar und möglichst umweltverträglich ermöglichen. Stadt und Land haben dabei unterschiedliche Bedürfnisse, weshalb dieselbe Lösung nicht überall gleich sinnvoll ist.",
    example: "Eine Großstadt investiert in Straßenbahn und Radwege, während eine ländliche Region vor allem bessere Busverbindungen benötigt.",
    tension: "individuelle Mobilität und kurze Reisezeiten ↔ Kosten, Umweltwirkung und öffentlicher Raum",
  },
  25: {
    intro: "Wissenschaftlicher Fortschritt braucht Forschungsfreiheit, aber auch Regeln für Sicherheit, Ethik und verantwortliche Anwendung. Besonders schwierige Fragen entstehen, wenn möglicher Nutzen und mögliche Schäden beide erheblich sind.",
    example: "Eine medizinische Forschung könnte schwere Krankheiten behandeln helfen, wirft aber gleichzeitig erhebliche ethische Fragen zum Eingriff in menschliches Erbgut auf.",
    tension: "Forschungsfreiheit und Erkenntnisgewinn ↔ ethische Grenzen und gesellschaftliche Verantwortung",
  },
  26: {
    intro: "Nachhaltiger Konsum hängt von Produktqualität, Reparierbarkeit, Preis, Information und Lieferketten ab. Verbraucher können Entscheidungen treffen, aber Hersteller und Handel bestimmen wesentlich mit, welche Alternativen überhaupt verfügbar und bezahlbar sind.",
    example: "Ein langlebiges reparierbares Gerät ist teurer als ein billiges Modell, verursacht aber möglicherweise über mehrere Jahre weniger Ressourcenverbrauch.",
    tension: "günstige Preise und Bequemlichkeit ↔ Langlebigkeit, Transparenz und Produzentenverantwortung",
  },
  27: {
    intro: "Digitale Verwaltung kann Wege und Bearbeitungszeiten verkürzen. Gleichzeitig müssen Datenschutz, Barrierefreiheit, verständliche Sprache und persönliche Alternativen erhalten bleiben, damit Digitalisierung nicht neue Ausschlüsse erzeugt.",
    example: "Ein Online-Antrag spart Zeit, ist aber für eine Person ohne digitale Identifikation oder ausreichende Sprachkenntnisse kaum nutzbar.",
    tension: "Effizienz und Automatisierung ↔ Zugänglichkeit, Datenschutz und persönliche Beratung",
  },
  28: {
    intro: "Demografischer Wandel verändert das Verhältnis zwischen jüngeren und älteren Bevölkerungsgruppen. Dadurch geraten Rentenfinanzierung, Pflege, Fachkräftebedarf und Generationengerechtigkeit langfristig stärker unter Druck.",
    example: "Immer mehr Menschen beziehen lange Rente, während relativ weniger Erwerbstätige Beiträge zahlen und gleichzeitig mehr Pflegepersonal benötigt wird.",
    tension: "finanzielle Tragfähigkeit ↔ soziale Absicherung und faire Belastung zwischen Generationen",
  },
});
const C1_TOPIC_QUESTIONS = Object.freeze({
  1: "Wie sollte ein anspruchsvolles C1-Lernziel geplant werden, damit Fortschritt messbar bleibt, ohne dass der Lernplan zu starr wird?",
  2: "Inwiefern entsteht kulturelle Identität aus Sprache, Erfahrungen und sozialen Beziehungen, und wo liegen die Grenzen fester kultureller Zuordnungen?",
  3: "Welche Verantwortung tragen Medien, Plattformen und Nutzende dafür, dass Informationen zuverlässig geprüft und eingeordnet werden?",
  4: "Was macht Teamarbeit langfristig erfolgreich, und wie sollten Teams mit Konflikten oder ungleicher Verantwortung umgehen?",
  5: "Welche Verantwortung tragen Beschäftigte und Arbeitgeber für berufliche Weiterentwicklung in einer sich wandelnden Arbeitswelt?",
  6: "Wie kann ein gesunder Lebensstil gefördert werden, ohne Gesundheit ausschließlich zur privaten Verantwortung des Einzelnen zu machen?",
  7: "Wie lässt sich Reisen nachhaltiger gestalten, ohne Mobilität und Teilhabe unnötig einzuschränken?",
  8: "Wie können Städte bezahlbaren Wohnraum schaffen und sich zugleich sozial, ökologisch und wirtschaftlich weiterentwickeln?",
  9: "Wie stark darf Werbung Kaufentscheidungen beeinflussen, und welche Verantwortung tragen Unternehmen, Plattformen und Verbraucher?",
  10: "Welche Bedingungen fördern gesellschaftliche Teilhabe, und wie lässt sich Verantwortung zwischen Zugewanderten, Institutionen und Gesellschaft verteilen?",
  11: "Welche Rolle sollte freiwilliges Engagement in einer Gesellschaft spielen, und wo endet die Verantwortung von Ehrenamtlichen?",
  12: "Welche Bedeutung haben Kultur- und Freizeitangebote für Lebensqualität und gesellschaftliche Teilhabe?",
  13: "Welche Chancen bietet Mehrsprachigkeit, und unter welchen Bedingungen kann sie in Bildung und Gesellschaft tatsächlich genutzt werden?",
  14: "Wie sollte eine Gesellschaft mit Innovationen umgehen, deren Nutzen groß sein kann, deren langfristige Folgen aber noch unsicher sind?",
  15: "Wie kann lebenslanges Lernen gefördert werden, ohne Weiterbildung nur zur privaten Aufgabe einzelner Beschäftigter zu machen?",
  16: "Wie viel Digitalisierung erleichtert den Alltag tatsächlich, und welche analogen Alternativen sollten erhalten bleiben?",
  17: "Wie lässt sich Umweltverantwortung fair zwischen Privatpersonen, Unternehmen und öffentlichen Institutionen verteilen?",
  18: "Welche Bedingungen stärken gesellschaftlichen Zusammenhalt, wenn Interessen, Lebenslagen und Wertvorstellungen auseinandergehen?",
  19: "Wie sollten Beschäftigte, Unternehmen und Bildungssysteme auf Automatisierung und neue Arbeitsmodelle reagieren?",
  20: "Unter welchen Bedingungen können digitale Gesundheitsangebote die medizinische Versorgung sinnvoll ergänzen?",
  21: "Welche Faktoren entscheiden darüber, ob Zugewanderte langfristig an Bildung, Arbeit und gesellschaftlichem Leben teilhaben können?",
  22: "Welche Möglichkeiten gesellschaftlicher Mitbestimmung fördern Beteiligung, und welche Grenzen haben einzelne Beteiligungsformen?",
  23: "Welche Rahmenbedingungen helfen Beschäftigten, Beruf und Privatleben langfristig gesund miteinander zu vereinbaren?",
  24: "Wie sollte Verkehrsinfrastruktur geplant werden, damit Mobilität zuverlässig, bezahlbar und möglichst umweltverträglich bleibt?",
  25: "Wie lassen sich Forschungsfreiheit, wissenschaftlicher Fortschritt und ethische Verantwortung miteinander vereinbaren?",
  26: "Wie kann nachhaltiger Konsum gefördert werden, ohne Verantwortung ausschließlich auf einzelne Verbraucher zu verlagern?",
  27: "Wie kann Verwaltung digitaler werden, ohne Menschen mit geringem digitalem Zugang oder besonderen Unterstützungsbedarfen auszuschließen?",
  28: "Wie kann eine alternde Gesellschaft Renten, Pflege und Fachkräftebedarf langfristig finanzieren, ohne Belastungen einseitig auf eine Generation zu verlagern?",
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
    const item = C1_TOPIC_FOUNDATIONS[day];
    if (!item) return null;
    return {
      level,
      day,
      kicker: "C1 · Thema verstehen",
      title: cleanSlideTitle(slide),
      intro: item.intro,
      exampleLabel: "Konkretes Beispiel",
      example: item.example,
      tensionLabel: "Zielkonflikt / Perspektiven",
      tension: item.tension,
      questionLabel: "Leitfrage",
      question: C1_TOPIC_QUESTIONS[day] || "",
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
