import { getC2TopicFoundation } from "./c2TopicFoundations.js";
import { getC1CanonicalLesson } from "./c1CanonicalCurriculum.js";

// A2/B1/B2 classroom foundations mirror the student Falowen curriculum.
// C1 is resolved from the canonical learner-aligned C1 curriculum manifest.
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
    const item = getC1CanonicalLesson(day);
    if (!item) return null;
    return {
      level,
      day,
      kicker: "C1 · Thema verstehen",
      title: item.title,
      intro: item.foundation.intro,
      exampleLabel: "Konkretes Beispiel",
      example: item.foundation.example,
      tensionLabel: "Zielkonflikt / Perspektiven",
      tension: item.foundation.tension,
      questionLabel: "Leitfrage",
      question: item.profile.question,
      suggestedMinutes: 6,
      teacherNote: "Do not debate yet. Establish the learner-side concept, affected perspectives and target conflict first; grammar and argumentation follow afterwards.",
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
