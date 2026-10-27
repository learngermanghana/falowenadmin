import { getB2TopicCollocations } from "./b2PresenterLanguage.js";

const assignmentIdForDay = (day) => `B2-${Math.ceil(day / 4)}.${day}`;

const B2_LESSONS = [
  { day: 1, topic: "Umweltschutz im Alltag – Müll vermeiden", grammar: ["Beschreibe konkrete Maßnahmen mit indem / dadurch, dass.", "Drücke Ziele mit um ... zu / damit aus.", "Zeige Folgen mit wodurch / sodass."], models: ["Haushalte können Abfall reduzieren, indem sie Produkte mit wenig Verpackung kaufen.", "Viele Städte fördern Mehrwegsysteme, damit weniger Einwegmüll entsteht.", "Immer mehr Menschen trennen ihren Müll konsequent, wodurch mehr Wertstoffe recycelt werden können."] },
  { day: 2, topic: "Mülltrennung, Recycling und Kreislaufwirtschaft", grammar: ["Nutze Passiv und Modalpassiv für Prozesse: Abfälle werden getrennt; Materialien müssen wiederverwendet werden.", "Nominalisiere für formellere Aussagen: recyceln → das Recycling; wiederverwenden → die Wiederverwendung.", "Ergänze Relativsätze, um Materialien und Systeme genauer zu beschreiben."], models: ["Verpackungen werden gesammelt, sortiert und anschließend recycelt.", "Die Wiederverwendung von Rohstoffen reduziert den Bedarf an neuen Ressourcen.", "Produkte, die leicht repariert werden können, bleiben länger im Wirtschaftskreislauf."] },
  { day: 3, topic: "Lebensmittelverschwendung und nachhaltiger Konsum", grammar: ["Nutze je ... desto, um Zusammenhänge zwischen Konsum und Verschwendung zu zeigen.", "Räume Gegenargumente mit obwohl / trotz ein.", "Beschreibe bessere Alternativen mit indem / ohne ... zu / statt ... zu."], models: ["Je genauer Haushalte ihre Einkäufe planen, desto weniger Lebensmittel werden weggeworfen.", "Obwohl viele Produkte noch essbar sind, landen sie wegen kleiner Mängel im Müll.", "Man kann Verschwendung vermeiden, indem man nur die Mengen kauft, die man wirklich benötigt."] },
  { day: 4, topic: "Plastik, Verpackungen und bewusster Einkauf", grammar: ["Formuliere Alternativen mit ohne ... zu und statt ... zu.", "Verbinde zwei positive Wirkungen mit nicht nur ... sondern auch.", "Zeige Methoden und Folgen mit indem / dadurch / wodurch."], models: ["Man kann einkaufen, ohne jedes Produkt in eine Plastiktüte zu packen.", "Mehrwegverpackungen sparen nicht nur Müll, sondern auch langfristig Rohstoffe.", "Verbraucher können Verpackungsmüll reduzieren, indem sie Nachfüllsysteme nutzen."] },
  { day: 5, topic: "Nachhaltige Mobilität und öffentlicher Verkehr", grammar: ["Vergleiche Verkehrsmittel mit während / wohingegen.", "Beschreibe Entwicklungen mit je ... desto.", "Erkläre Maßnahmen mit indem / dadurch, dass."], models: ["Während das Auto flexibel ist, verursacht der öffentliche Verkehr pro Person oft weniger Emissionen.", "Je zuverlässiger Busse und Bahnen fahren, desto eher verzichten Menschen auf das eigene Auto.", "Städte können den Verkehr entlasten, indem sie Busspuren und sichere Radwege ausbauen."] },
  { day: 6, topic: "Energie sparen und erneuerbare Energien", grammar: ["Nutze Passiv und Modalpassiv für Energiepolitik und technische Prozesse.", "Nominalisiere zentrale Vorgänge: verbrauchen → der Verbrauch; ausbauen → der Ausbau.", "Formuliere Einwände mit obwohl / trotz und Folgen mit sodass / wodurch."], models: ["Erneuerbare Energien müssen schneller ausgebaut werden, damit fossile Brennstoffe ersetzt werden können.", "Die Verringerung des Stromverbrauchs entlastet sowohl Haushalte als auch die Umwelt.", "Obwohl Solaranlagen zunächst teuer sein können, sinken die Energiekosten langfristig."] },
  { day: 7, topic: "Klimafreundliches Wohnen und grüne Städte", grammar: ["Nutze Relativsätze mit Präpositionen: Gebäude, in denen ...; Viertel, in denen ....", "Formuliere Vorschläge mit Konjunktiv II.", "Zeige Folgen und Einschränkungen mit sodass / obwohl / trotz."], models: ["Wohnhäuser, in denen Energie effizient genutzt wird, verursachen geringere Betriebskosten.", "Städte könnten mehr Grünflächen schaffen, damit sich dicht bebaute Viertel im Sommer weniger aufheizen.", "Obwohl nachhaltige Sanierungen teuer sind, können sie langfristig Energie und Kosten sparen."] },
  { day: 8, topic: "Bildungsgerechtigkeit und Zugang zu Bildung", grammar: ["Drücke Ziele mit um ... zu / damit aus.", "Erkläre Wege zu besseren Ergebnissen mit indem / dadurch, dass.", "Nutze Nominalisierung für formelle Bildungsargumente: fördern → die Förderung; teilnehmen → die Teilnahme."], models: ["Stipendien werden angeboten, damit auch einkommensschwächere Studierende Zugang zu Bildung erhalten.", "Bildungschancen lassen sich verbessern, indem Schulen gezielte Förderprogramme anbieten.", "Die Förderung benachteiligter Lernender ist eine zentrale Voraussetzung für mehr Chancengleichheit."] },
  { day: 9, topic: "Schulpflicht, Leistung und Verantwortung der Schule", grammar: ["Nutze Modalpassiv für Pflichten und Regeln: Schüler müssen unterstützt werden; Standards sollen eingehalten werden.", "Formuliere Bedingungen mit falls / sofern.", "Räume Gegenargumente mit obwohl / dennoch ein."], models: ["Schülerinnen und Schüler sollten individuell unterstützt werden, wenn sie Lernschwierigkeiten haben.", "Sofern Schulen genügend Personal erhalten, können sie stärker auf unterschiedliche Bedürfnisse eingehen.", "Obwohl Leistungsbewertungen notwendig sind, dürfen sie nicht der einzige Maßstab für Lernerfolg sein."] },
  { day: 10, topic: "Kindergarten und frühkindliche Bildung", grammar: ["Nutze Relativsätze, um Betreuung, Personal und Angebote genauer zu beschreiben.", "Formuliere Ziele mit damit / um ... zu.", "Beschreibe Zusammenhänge mit je ... desto."], models: ["Kindergärten, in denen Kinder spielerisch gefördert werden, unterstützen ihre sprachliche und soziale Entwicklung.", "Kommunen bauen Betreuungsplätze aus, damit Eltern Familie und Beruf besser vereinbaren können.", "Je früher Kinder gezielt gefördert werden, desto leichter können spätere Lernprobleme erkannt werden."] },
  { day: 11, topic: "Digitale Bildung – Unterricht mit und ohne Technologie", grammar: ["Vergleiche Lernformen mit während / wohingegen.", "Erkläre sinnvollen Technologieeinsatz mit indem / dadurch, dass.", "Formuliere hypothetische Verbesserungen mit Konjunktiv II."], models: ["Während digitale Plattformen flexibles Lernen ermöglichen, bietet Präsenzunterricht direkten sozialen Austausch.", "Digitale Medien unterstützen den Unterricht, indem sie Übungen individuell anpassen.", "Schulen könnten Technik wirksamer einsetzen, wenn Lehrkräfte ausreichend geschult würden."] },
  { day: 12, topic: "Studium, Studiengebühren und lebenslanges Lernen", grammar: ["Diskutiere Vor- und Nachteile mit obwohl / trotz / zwar ... jedoch.", "Beschreibe Zusammenhänge mit je ... desto.", "Nutze Nominalisierung und Konjunktiv II für formellere Vorschläge."], models: ["Studiengebühren können zwar zusätzliche Mittel schaffen, sie erschweren jedoch manchen Menschen den Zugang zur Hochschule.", "Je stärker Weiterbildung gefördert wird, desto besser können Beschäftigte auf technologische Veränderungen reagieren.", "Eine stärkere öffentliche Finanzierung könnte den Zugang zu Hochschulen verbessern."] },
  { day: 13, topic: "Wissenschaft und Forschung im Alltag", grammar: ["Nutze Passiv für Forschungsabläufe und Ergebnisse.", "Nominalisiere wissenschaftliche Prozesse: untersuchen → die Untersuchung; auswerten → die Auswertung.", "Kennzeichne Quellen mit laut / zufolge / nach Angaben."], models: ["Neue Medikamente werden vor ihrer Zulassung in mehreren Studien untersucht.", "Die Auswertung großer Datenmengen ermöglicht genauere wissenschaftliche Erkenntnisse.", "Laut aktuellen Forschungsergebnissen beeinflusst regelmäßige Bewegung zahlreiche Gesundheitsfaktoren."] },
  { day: 14, topic: "Wissenschaft, Desinformation und verlässliche Quellen", grammar: ["Nutze indirekte Rede und Quellenangaben, um fremde Aussagen von der eigenen Position zu trennen.", "Nutze Passiv, wenn die Quelle oder Handlung im Vordergrund steht.", "Formuliere Einschränkungen mit obwohl / zwar ... jedoch."], models: ["Forschende weisen darauf hin, dass Ergebnisse überprüft werden müssen, bevor weitreichende Schlüsse gezogen werden.", "Informationen werden in sozialen Medien häufig geteilt, ohne dass ihre Quelle kontrolliert wird.", "Eine Aussage kann zwar überzeugend klingen, sie ist jedoch nicht automatisch wissenschaftlich belegt."] },
  { day: 15, topic: "Wohnraummangel, hohe Mieten und soziale Gerechtigkeit", grammar: ["Nutze Relativsätze mit Präpositionen für präzise Wohnungsbeschreibungen.", "Formuliere Beschwerden und Vorschläge höflich mit Konjunktiv II.", "Verbinde Ursachen und Gegensätze mit aufgrund / trotz / obwohl."], models: ["Menschen, für die die Miete einen großen Teil des Einkommens ausmacht, sind besonders vom Wohnraummangel betroffen.", "Städte könnten mehr bezahlbaren Wohnraum fördern, anstatt ausschließlich teure Neubauten zu genehmigen.", "Trotz steigender Baukosten bleibt die Nachfrage nach günstigen Wohnungen hoch."] },
  { day: 16, topic: "Stadt oder Land – Lebensqualität und Infrastruktur", grammar: ["Vergleiche Lebensräume mit während / wohingegen.", "Nutze je ... desto für Zusammenhänge zwischen Entfernung, Infrastruktur und Lebensqualität.", "Räume Gegenargumente mit obwohl / dennoch ein."], models: ["Während Großstädte viele Arbeitsplätze bieten, ist Wohnraum dort häufig besonders teuer.", "Je besser ländliche Regionen an den öffentlichen Verkehr angebunden sind, desto attraktiver werden sie für Familien.", "Obwohl das Leben auf dem Land ruhiger sein kann, fehlen dort manchmal wichtige Dienstleistungen."] },
  { day: 17, topic: "Familie, Kinderbetreuung und Vereinbarkeit mit dem Beruf", grammar: ["Drücke Ziele mit um ... zu / damit aus.", "Vergleiche Rollen und Zeitaufteilung mit während / wohingegen.", "Formuliere Alternativen mit ohne ... zu / statt ... zu."], models: ["Unternehmen können flexible Arbeitszeiten anbieten, damit Eltern Beruf und Familie besser vereinbaren können.", "Während manche Familien Betreuung innerhalb der Familie organisieren, sind andere auf Kitas angewiesen.", "Eltern sollten berufstätig sein können, ohne dauerhaft auf verlässliche Betreuung verzichten zu müssen."] },
  { day: 18, topic: "Arbeitswelt, Fachkräftemangel und Weiterbildung", grammar: ["Nutze je ... desto für Entwicklungen auf dem Arbeitsmarkt.", "Drücke Ziele mit damit / um ... zu aus.", "Nutze Passiv und Nominalisierung für formelle Arbeitsmarktargumente."], models: ["Je stärker Unternehmen in Weiterbildung investieren, desto besser können sie auf Fachkräftemangel reagieren.", "Beschäftigte werden weiterqualifiziert, damit neue technische Aufgaben übernommen werden können.", "Die Anerkennung ausländischer Qualifikationen kann zur Verringerung des Fachkräftemangels beitragen."] },
  { day: 19, topic: "Homeoffice, ständige Erreichbarkeit und Work-Life-Balance", grammar: ["Nutze um ... zu / damit / ohne ... zu / statt ... zu für Ziele und Alternativen.", "Räume Einwände mit obwohl / trotzdem ein.", "Beschreibe Zusammenhänge mit je ... desto."], models: ["Beschäftigte sollten klare Grenzen setzen, um nach Feierabend wirklich abschalten zu können.", "Obwohl Homeoffice mehr Flexibilität bietet, kann ständige Erreichbarkeit die Erholung erschweren.", "Je klarer Arbeitszeiten geregelt sind, desto leichter lässt sich eine gesunde Work-Life-Balance aufrechterhalten."] },
  { day: 20, topic: "Soziale Medien, Privatsphäre und öffentliche Identität", grammar: ["Nutze Relativsätze mit Präpositionen: Plattformen, auf denen ...; Personen, mit denen ....", "Vergleiche öffentliches und privates Verhalten mit während / wohingegen.", "Zeige Folgen mit wodurch / sodass."], models: ["Plattformen, auf denen persönliche Daten veröffentlicht werden, beeinflussen zunehmend das öffentliche Selbstbild.", "Während manche Nutzer fast alles teilen, schützen andere ihre Privatsphäre sehr bewusst.", "Beiträge können dauerhaft gespeichert werden, wodurch unbedachte Veröffentlichungen langfristige Folgen haben können."] },
  { day: 21, topic: "Künstliche Intelligenz in Schule und Universität", grammar: ["Nutze Passiv für automatisierte Prozesse und Regeln.", "Erkläre sinnvollen Einsatz mit indem / dadurch, dass.", "Formuliere Bedingungen und hypothetische Regeln mit sofern / Konjunktiv II."], models: ["KI-Systeme werden zunehmend für Recherche, Übersetzung und individuelles Lernen eingesetzt.", "Studierende können KI sinnvoll nutzen, indem sie Ergebnisse kritisch prüfen und Quellen vergleichen.", "Universitäten könnten klare Regeln festlegen, sofern gleichzeitig transparent erklärt wird, welche Nutzung erlaubt ist."] },
  { day: 22, topic: "Künstliche Intelligenz, Automatisierung und Arbeitsplätze", grammar: ["Nutze Passiv und Modalpassiv, um Veränderungen in Arbeitsprozessen zu beschreiben.", "Zeige Entwicklungen mit je ... desto.", "Formuliere Bedingungen mit sofern / falls und Folgen mit wodurch."], models: ["Routineaufgaben werden zunehmend automatisiert, während komplexe Entscheidungen weiterhin menschliches Urteil erfordern.", "Je stärker Unternehmen KI einsetzen, desto wichtiger werden Weiterbildung und neue digitale Kompetenzen.", "Sofern Beschäftigte rechtzeitig qualifiziert werden, kann technischer Wandel neue Chancen schaffen."] },
  { day: 23, topic: "Datenschutz, Algorithmen und personalisierte Werbung", grammar: ["Nutze Passiv für Datenerhebung und algorithmische Verarbeitung.", "Verwende Relativsätze mit Präpositionen für Plattformen, Daten und Nutzergruppen.", "Zeige Konsequenzen mit wodurch / sodass und Gegensätze mit obwohl."], models: ["Persönliche Daten werden ausgewertet, um Werbung möglichst genau an Nutzer anzupassen.", "Algorithmen, über deren Funktionsweise Nutzer wenig wissen, beeinflussen häufig die angezeigten Inhalte.", "Personalisierte Werbung kann relevant sein, wodurch sie jedoch zugleich stärkere Datenschutzfragen aufwirft."] },
  { day: 24, topic: "Digitale Gesundheit, Telemedizin und medizinische Technologie", grammar: ["Nutze Passiv und Modalpassiv für medizinische Prozesse und Anforderungen.", "Erkläre Vorteile mit indem / dadurch, dass.", "Formuliere Bedingungen mit sofern und Folgen mit sodass / wodurch."], models: ["Gesundheitsdaten müssen besonders sorgfältig geschützt werden.", "Telemedizin kann Versorgung verbessern, indem Patientinnen und Patienten schneller ärztlichen Rat erhalten.", "Sofern digitale Systeme verantwortungsvoll eingesetzt werden, können sie Arbeitsbelastung verringern und Abläufe effizienter machen."] },
  { day: 25, topic: "Reisen, Massentourismus und nachhaltiger Tourismus", grammar: ["Vergleiche Reiseformen mit während / wohingegen.", "Beschreibe nachhaltige Maßnahmen mit indem / dadurch, dass.", "Räume Zielkonflikte mit obwohl / trotz ein."], models: ["Während Massentourismus vielen Regionen Einkommen bringt, kann er Natur und Infrastruktur stark belasten.", "Reisende können lokale Wirtschaft unterstützen, indem sie regionale Angebote nutzen.", "Obwohl nachhaltiges Reisen manchmal teurer ist, entscheiden sich immer mehr Menschen bewusst dafür."] },
  { day: 26, topic: "Migration, Integration und Sprache", grammar: ["Nutze obwohl / obgleich / trotz für differenzierte Argumente.", "Vergleiche Erfahrungen mit während / wohingegen.", "Nutze Relativsätze mit Präpositionen für Institutionen, Programme und Zielgruppen."], models: ["Obwohl Integration Zeit benötigt, kann frühe Sprachförderung den Einstieg in Bildung und Arbeit erleichtern.", "Während manche Zugewanderte schnell Beschäftigung finden, kämpfen andere mit der Anerkennung ihrer Abschlüsse.", "Beratungsstellen, an die sich neu Zugewanderte wenden können, unterstützen bei vielen praktischen Fragen."] },
  { day: 27, topic: "Gleichstellung, Diskriminierung und gesellschaftlicher Zusammenhalt", grammar: ["Strukturiere Wirkungen mit nicht nur ... sondern auch / sowohl ... als auch.", "Räume Gegenargumente mit obwohl / trotz ein.", "Erkläre Lösungen mit indem / dadurch, dass."], models: ["Gleichstellung verbessert nicht nur individuelle Chancen, sondern kann auch den gesellschaftlichen Zusammenhalt stärken.", "Obwohl rechtliche Regeln wichtig sind, verschwinden Vorurteile nicht automatisch.", "Institutionen können Diskriminierung reduzieren, indem sie transparente Verfahren und wirksame Beschwerdewege schaffen."] },
  { day: 28, topic: "Gesellschaft im Wandel – B2 Prüfungstraining", grammar: ["Wiederhole Ursache, Folge, Gegensatz, Einräumung, Ziel und Methode mit passenden B2-Konnektoren.", "Verbinde Passiv, Relativsätze mit Präpositionen, Nominalisierung und Konjunktiv II flexibel mit den Prüfungsthemen.", "Priorisiere korrekte, abwechslungsreiche Strukturen statt möglichst viele schwierige Formen in einen Satz zu zwingen."], models: ["Obwohl technischer Fortschritt viele Chancen bietet, müssen soziale und ökologische Folgen berücksichtigt werden.", "Eine tragfähige Lösung entsteht, indem unterschiedliche Interessen verglichen und konkrete Maßnahmen begründet werden.", "Zusammenfassend bin ich der Auffassung, dass Bildung, Nachhaltigkeit und verantwortungsvoller Technologieeinsatz eng miteinander verbunden sind."] },
];

function makeSlide(definition) {
  const { day, topic, grammar, models } = definition;
  const assignmentId = assignmentIdForDay(day);
  const unit = Math.ceil(day / 4);
  const questions = [
    `Welche Bedeutung hat „${topic}“ heute?`,
    `Welche Chancen oder Vorteile gibt es bei „${topic}“ und welche Probleme können entstehen?`,
    `Welche konkrete Maßnahme oder Lösung hältst du bei diesem Thema für sinnvoll?`,
    `Wie ist die Situation bei „${topic}“ in Deutschland und in deinem Heimatland?`,
    `Welche Position vertrittst du persönlich zu „${topic}“? Begründe sie mit einem Beispiel.`,
  ];
  const speakingAnswers = [
    `${models[0]} Für die heutige Gesellschaft ist das Thema besonders relevant, weil individuelle Entscheidungen und politische Rahmenbedingungen zusammenwirken.`,
    `${models[1]} Ein Vorteil besteht darin, dass sinnvolle Maßnahmen langfristig Verbesserungen ermöglichen. Gleichzeitig müssen Kosten, Zugang und praktische Schwierigkeiten berücksichtigt werden.`,
    `${models[2]} Entscheidend ist für mich eine Maßnahme, die realistisch umgesetzt werden kann und nicht nur theoretisch gut klingt. Dabei sollten Betroffene früh einbezogen werden.`,
    `Bei „${topic}“ unterscheidet sich die konkrete Situation je nach Infrastruktur, Einkommen und gesetzlichen Rahmenbedingungen. Deshalb würde ich Deutschland und mein Heimatland nicht pauschal bewerten, sondern einzelne Maßnahmen und ihre Wirkung vergleichen.`,
    `Ich bin der Auffassung, dass bei „${topic}“ sowohl individuelle Verantwortung als auch verlässliche gesellschaftliche Strukturen nötig sind. Ein konkretes Beispiel sollte zeigen, ob eine Maßnahme im Alltag tatsächlich funktioniert.`,
  ];

  return {
    id: `b2-day-${day}-${topic.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, "-").replace(/^-|-$/g, "")}`,
    course: "B2",
    day: `Day ${day}`,
    dayNumber: day,
    assignmentId,
    title: `B2 Day ${day} · ${topic}`,
    topic: `${unit}.${day} ${topic}`,
    objective: `Students discuss ${topic} at B2 level with balanced arguments, precise connectors and exam-ready examples.`,
    estimatedDuration: "60 minutes",
    warmupQuestionsDe: [
      `Welche persönlichen Erfahrungen hast du mit „${topic}“?`,
      `Welche zwei Probleme fallen dir bei „${topic}“ zuerst ein?`,
      `Welche Veränderung würdest du dir bei diesem Thema wünschen?`,
    ],
    keyPhrasesDe: [
      ...getB2TopicCollocations(day),
      "Bei der Beurteilung dieses Themas sollte man berücksichtigen, dass ...",
      "Einerseits ... , andererseits ...",
      "Ein wesentlicher Vorteil / Nachteil besteht darin, dass ...",
      "Ein konkretes Beispiel dafür ist ...",
      "Im Vergleich dazu ...",
      "Zusammenfassend bin ich der Auffassung, dass ...",
    ],
    studentQuestionsDe: questions,
    speakingModels: questions.map((questionDe, index) => ({ questionDe, modelAnswerDe: speakingAnswers[index] })),
    teacherNotesEn: [
      `Treat Day ${day} as an exam-domain B2 argument lesson, not as a vocabulary-only discussion.`,
      "Require position → reason → concrete example → counterpoint or comparison.",
      "Correct connector word order and sentence structure after the speaking phase instead of interrupting every sentence.",
      "Use Germany/home-country comparisons only when learners can support them with concrete experience or information.",
    ],
    interactionFlow: [
      { phase: "Position line", detailEn: "6 min: students choose a position and justify it in one complete B2 sentence." },
      { phase: "Grammar activation", detailEn: "10 min: transform short statements using the lesson target structures." },
      { phase: "Argument ladder", detailEn: "10 min: build claim → reason → example → counterpoint." },
      { phase: "Speaking rehearsal", detailEn: "14 min: 90-second response followed by one challenging follow-up question." },
      { phase: "Exam transfer", detailEn: "8 min: convert the same ideas into a short writing plan or formal response." },
    ],
    wrapUpTaskDe: `Selbstcheck: Ist deine Position zu „${topic}“ klar? Hast du mindestens eine B2-Struktur korrekt verwendet, ein konkretes Beispiel genannt und auf einen Einwand oder Vergleich reagiert?`,
    workbookConnection: {
      grammarUrl: null,
      workbookUrl: "",
      subtitle: "New exam-domain B2 curriculum. Direct workbook links are only added after the matching Falowen route is verified.",
      parts: [
        { label: "Grammar", detailEn: grammar.join(" ") },
        { label: "Teil 1 · Sprechen", detailEn: `Structured B2 discussion of ${topic}: position, reasons, example, counterpoint and comparison.` },
        { label: "Teil 2 · Schreiben", detailEn: `Transfer the same arguments into an opinion text, formal message or task-based response about ${topic}.` },
        { label: "Teil 3 · Lesen", detailEn: `Use a text in the same domain; identify position, evidence, contrast and useful vocabulary.` },
        { label: "Teil 4 · Hören", detailEn: `Use a verified listening source in the same domain when available; do not invent missing audio.` },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: `Day ${day} develops exam-ready B2 production on ${topic}, combining recurring Goethe-style domains with controlled grammar, comparison, argumentation and concrete solutions.`,
      grammarFocusEn: grammar,
      modelExamplesDe: models,
      commonMistakesEn: [
        "Giving several ideas without developing any of them with a reason and example.",
        "Using an advanced connector but keeping the wrong verb position.",
        "Repeating the same connector instead of varying cause, contrast, consequence, purpose and method.",
        "Making broad claims about Germany or another country without a concrete basis or example.",
      ],
    },
  };
}

export const b2PresenterSlides = B2_LESSONS.map(makeSlide);

export function getB2PresenterSlide(assignmentId) {
  const normalized = String(assignmentId || "").trim().toUpperCase();
  return b2PresenterSlides.find((slide) => slide.assignmentId.toUpperCase() === normalized) || null;
}
