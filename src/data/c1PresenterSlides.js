const GRAMMAR = {
  argumentation: "Structure complex arguments with einerseits ... andererseits, zwar ... jedoch, nicht nur ... sondern auch and sowohl ... als auch.",
  concessive: "Use obwohl, obgleich, wenngleich, trotz and dennoch to acknowledge counterarguments precisely.",
  contrast: "Use während and wohingegen for explicit contrasts, especially when comparing policies, trends or social groups.",
  nominalisation: "Use nominalisation for formal C1 style: entwickeln → die Entwicklung, fördern → die Förderung, reduzieren → die Reduzierung.",
  passive: "Use passive and modal passive when processes, rules or results are more important than the actor.",
  reported: "Separate sources from your own view with laut, zufolge, nach Angaben, der Studie zufolge and Konjunktiv-I-style reporting where appropriate.",
  consequence: "Express causes and consequences precisely with aufgrund, infolgedessen, sodass, weshalb and wodurch.",
  condition: "Use sofern, falls, vorausgesetzt, dass and Konjunktiv II for conditions, alternatives and hypothetical scenarios.",
  purpose: "Use indem, dadurch dass, um ... zu and damit to explain methods, mechanisms and goals.",
  relative: "Use extended relative clauses, including prepositional relatives such as mit dem, über die and für deren.",
  temporal: "Use bevor, nachdem, während, sobald and solange to organise complex sequences and developments.",
  academic: "Distinguish evidence, interpretation and limitation with cohesive academic connectors and precise reference language.",
};

const LESSONS = [
  { topic: "Wissenschaft und Forschung", grammar: ["passive", "reported", "academic"], models: ["Unabhängige Forschung bildet die Grundlage für Innovationen, sofern wissenschaftliche Standards eingehalten werden.", "Der Studie zufolge wurden die Daten in mehreren Phasen erhoben und anschließend ausgewertet.", "Obwohl neue Verfahren große Chancen bieten, müssen mögliche gesellschaftliche Folgen kritisch geprüft werden."] },
  { topic: "Kunst und Kultur", grammar: ["argumentation", "concessive", "relative"], models: ["Kunst ist nicht nur Ausdruck individueller Kreativität, sondern auch ein wichtiger Bestandteil gesellschaftlicher Erinnerung.", "Obgleich Kulturförderung Geld kostet, trägt sie langfristig zur gesellschaftlichen Teilhabe bei.", "Kulturelle Einrichtungen, in denen unterschiedliche Perspektiven sichtbar werden, stärken den öffentlichen Dialog."] },
  { topic: "Künstliche Intelligenz und Arbeitswelt", grammar: ["passive", "consequence", "condition"], models: ["Routineaufgaben werden zunehmend automatisiert, wodurch sich die Anforderungen an Beschäftigte verändern.", "Sollten Unternehmen KI umfassend einsetzen, müssten zugleich klare Regeln für Verantwortung und Kontrolle geschaffen werden.", "Der Einsatz künstlicher Intelligenz kann die Produktivität erhöhen, sofern menschliche Entscheidungen weiterhin nachvollziehbar bleiben."] },
  { topic: "Digitalisierung und Datenschutz", grammar: ["passive", "concessive", "consequence"], models: ["Persönliche Daten werden häufig verarbeitet, ohne dass Nutzern das tatsächliche Ausmaß bewusst ist.", "Obwohl digitale Dienste den Alltag erleichtern, dürfen Datenschutzrechte nicht eingeschränkt werden.", "Unzureichende Sicherheitsstandards können zu Datenverlusten führen, wodurch das Vertrauen der Nutzer sinkt."] },
  { topic: "Personalisierte Werbung", grammar: ["argumentation", "relative", "consequence"], models: ["Personalisierte Werbung kann zwar relevanter sein, sie greift jedoch tief in das Nutzungsverhalten ein.", "Daten, anhand derer Werbeprofile erstellt werden, sollten nur mit transparenter Zustimmung verwendet werden.", "Je genauer Unternehmen Nutzer analysieren, desto größer wird die Verantwortung für einen fairen Umgang mit diesen Informationen."] },
  { topic: "Online- und Offline-Identität", grammar: ["contrast", "relative", "concessive"], models: ["Während manche Menschen online bewusst ein idealisiertes Bild zeigen, verhalten sie sich offline deutlich zurückhaltender.", "Die Identität, mit der man sich im Internet präsentiert, muss nicht vollständig der eigenen Lebensrealität entsprechen.", "Obwohl soziale Medien Selbstdarstellung fördern, können sie zugleich Räume für authentischen Austausch schaffen."] },
  { topic: "Gesellschaftlicher Zusammenhalt", grammar: ["argumentation", "concessive", "nominalisation"], models: ["Gesellschaftlicher Zusammenhalt setzt sowohl gegenseitige Verantwortung als auch faire Teilhabe voraus.", "Wenngleich politische Meinungen auseinandergehen, sollte ein respektvoller öffentlicher Austausch möglich bleiben.", "Die Stärkung lokaler Gemeinschaften kann dazu beitragen, soziale Isolation einzudämmen."] },
  { topic: "Mehrsprachigkeit", grammar: ["argumentation", "relative", "purpose"], models: ["Mehrsprachigkeit eröffnet nicht nur berufliche Chancen, sondern fördert auch den Zugang zu unterschiedlichen Perspektiven.", "Kinder, die mit mehreren Sprachen aufwachsen, entwickeln häufig flexible Kommunikationsstrategien.", "Schulen können sprachliche Vielfalt fördern, indem sie Herkunftssprachen sichtbar in den Unterricht einbeziehen."] },
  { topic: "Migration und Integration", grammar: ["concessive", "contrast", "relative"], models: ["Obgleich Integration Zeit benötigt, kann frühe Sprachförderung den Prozess deutlich erleichtern.", "Während manche Zugewanderte ihre Qualifikationen schnell anerkennen lassen können, stoßen andere auf bürokratische Hürden.", "Beratungsstellen, an die sich Migranten wenden können, spielen bei der Orientierung eine zentrale Rolle."] },
  { topic: "Ehrenamt und gesellschaftlicher Pflichtdienst", grammar: ["argumentation", "condition", "concessive"], models: ["Ein Pflichtdienst könnte den gesellschaftlichen Zusammenhalt stärken, sofern unterschiedliche Einsatzbereiche angeboten würden.", "Einerseits vermittelt ehrenamtliches Engagement Verantwortung, andererseits sollte freiwillige Arbeit nicht staatliche Aufgaben ersetzen.", "Obwohl ein verpflichtendes Jahr praktische Erfahrungen ermöglichen kann, greift es erheblich in die persönliche Lebensplanung ein."] },
  { topic: "Demokratie und soziale Medien", grammar: ["reported", "consequence", "argumentation"], models: ["Nach Angaben vieler Medienforscher verändern soziale Netzwerke die Art, wie politische Informationen verbreitet werden.", "Falschinformationen können sich schnell verbreiten, wodurch demokratische Debatten verzerrt werden.", "Einerseits erleichtern soziale Medien politische Beteiligung, andererseits fördern Algorithmen häufig abgeschlossene Informationsräume."] },
  { topic: "Bildung und Prüfungsformate", grammar: ["contrast", "argumentation", "condition"], models: ["Während handschriftliche Prüfungen technische Unabhängigkeit bieten, ermöglichen digitale Formate eine effizientere Bearbeitung.", "Prüfungsformen sollten nicht nur Wissen abfragen, sondern auch die Anwendung komplexer Kompetenzen ermöglichen.", "Digitale Prüfungen wären besonders sinnvoll, wenn technische Ausstattung und Chancengleichheit zuverlässig gewährleistet wären."] },
  { topic: "Lebenslanges Lernen", grammar: ["nominalisation", "purpose", "consequence"], models: ["Die kontinuierliche Weiterbildung gewinnt angesichts technologischer Veränderungen zunehmend an Bedeutung.", "Beschäftigte können ihre beruflichen Chancen verbessern, indem sie regelmäßig neue Kompetenzen erwerben.", "Wer langfristig auf Weiterbildung verzichtet, riskiert, dass vorhandene Kenntnisse schneller an Relevanz verlieren."] },
  { topic: "Homeoffice und moderne Arbeitsformen", grammar: ["contrast", "concessive", "purpose"], models: ["Während Homeoffice mehr Flexibilität ermöglicht, kann die Abgrenzung zwischen Beruf und Privatleben schwieriger werden.", "Obwohl Beschäftigte Wegezeit sparen, fehlt vielen der spontane Austausch mit Kolleginnen und Kollegen.", "Unternehmen sollten klare Kommunikationsstrukturen schaffen, damit hybride Teams effizient zusammenarbeiten können."] },
  { topic: "Fachkräftemangel und berufliche Mobilität", grammar: ["consequence", "nominalisation", "purpose"], models: ["Der Mangel an Fachkräften beeinträchtigt zahlreiche Wirtschaftsbereiche und führt zu längeren Besetzungszeiten.", "Die Anerkennung ausländischer Qualifikationen kann beschleunigt werden, indem Verfahren transparenter gestaltet werden.", "Unternehmen investieren in Weiterbildung, um vorhandene Mitarbeiter langfristig zu binden."] },
  { topic: "Bedingungsloses Grundeinkommen", grammar: ["argumentation", "condition", "concessive"], models: ["Ein bedingungsloses Grundeinkommen könnte soziale Sicherheit erhöhen, würde jedoch erhebliche finanzielle Mittel erfordern.", "Sollte ein solches Modell eingeführt werden, müsste geklärt werden, wie bestehende Sozialleistungen angepasst würden.", "Obwohl finanzielle Freiheit neue Möglichkeiten schaffen kann, bleibt umstritten, wie sich die Arbeitsmotivation entwickeln würde."] },
  { topic: "Nachhaltigkeit in der Wirtschaft", grammar: ["nominalisation", "consequence", "purpose"], models: ["Die Umstellung auf nachhaltige Produktionsverfahren erfordert zunächst Investitionen, kann langfristig jedoch Kosten senken.", "Unternehmen reduzieren Emissionen, indem sie Energie effizienter nutzen und Lieferketten überprüfen.", "Eine glaubwürdige Nachhaltigkeitsstrategie kann das Vertrauen stärken, wodurch sich auch wirtschaftliche Vorteile ergeben können."] },
  { topic: "Klimawandel und Verkehr", grammar: ["consequence", "purpose", "contrast"], models: ["Der Verkehrssektor trägt erheblich zum Klimawandel bei, da insbesondere fossile Kraftstoffe große Mengen CO₂ verursachen.", "Emissionen lassen sich eindämmen, indem der öffentliche Verkehr ausgebaut und klimafreundliche Mobilität gefördert wird.", "Während Flugreisen schnell sind, verursacht die Bahn auf vielen Strecken deutlich weniger Emissionen."] },
  { topic: "Nachhaltiger Konsum", grammar: ["purpose", "concessive", "consequence"], models: ["Lebensmittelverschwendung lässt sich vermeiden, indem man nur kauft, was tatsächlich benötigt wird.", "Obwohl regionale und biologische Produkte häufig teurer sind, entscheiden sich viele Verbraucher bewusst dafür.", "Der Kauf von Secondhand-Kleidung verlängert die Nutzungsdauer von Produkten und reduziert dadurch Abfall."] },
  { topic: "Reisen und Nachhaltigkeit", grammar: ["contrast", "consequence", "condition"], models: ["Während Fernreisen neue Erfahrungen ermöglichen, verursachen insbesondere Flugreisen einen hohen CO₂-Ausstoß.", "Je häufiger Reisende öffentliche Verkehrsmittel nutzen, desto geringer kann die Umweltbelastung vor Ort ausfallen.", "Nachhaltiger Tourismus wäre wirksamer, wenn ökologische Standards konsequent kontrolliert würden."] },
  { topic: "Gesundheit und Impfpflicht", grammar: ["argumentation", "concessive", "passive"], models: ["Eine Impfpflicht kann damit begründet werden, dass besonders gefährdete Personen geschützt werden müssen.", "Obwohl individuelle Entscheidungsfreiheit wichtig ist, kann sie bei ansteckenden Krankheiten mit dem Schutz der Allgemeinheit kollidieren.", "Gesundheitspolitische Maßnahmen sollten transparent erklärt und wissenschaftlich begründet werden."] },
  { topic: "Ernährung und moderner Lebensstil", grammar: ["consequence", "concessive", "purpose"], models: ["Ein dauerhaft unausgewogener Lebensstil kann langfristig zu gesundheitlichen Problemen führen.", "Obwohl viele Menschen die Bedeutung gesunder Ernährung kennen, fällt die Umsetzung im Alltag oft schwer.", "Man kann den eigenen Konsum verbessern, indem Mahlzeiten geplant und stark verarbeitete Lebensmittel begrenzt werden."] },
  { topic: "Wohnen, Mieten und soziale Gerechtigkeit", grammar: ["consequence", "relative", "argumentation"], models: ["Steigende Mieten belasten insbesondere einkommensschwache Haushalte, wodurch soziale Ungleichheit verschärft werden kann.", "Wohnungen, für die ein großer Teil des Einkommens aufgewendet werden muss, schränken andere Lebensbereiche deutlich ein.", "Einerseits braucht der Wohnungsmarkt private Investitionen, andererseits muss bezahlbarer Wohnraum politisch gesichert werden."] },
  { topic: "Zukunftstechnologien und Innovation", grammar: ["condition", "passive", "reported"], models: ["Neue Technologien sollten gezielt gefördert werden, sofern ihr gesellschaftlicher Nutzen nachvollziehbar ist.", "In Zukunft werden viele Prozesse automatisiert werden, wobei menschliche Kontrolle weiterhin notwendig bleiben dürfte.", "Experten zufolge hängt erfolgreiche Innovation nicht nur von Forschung, sondern auch von geeigneten Rahmenbedingungen ab."] },
  { topic: "Globalisierung und internationale Zusammenarbeit", grammar: ["argumentation", "contrast", "consequence"], models: ["Internationale Zusammenarbeit ermöglicht den Austausch von Wissen, erhöht jedoch zugleich gegenseitige Abhängigkeiten.", "Während globale Lieferketten Kosten senken können, reagieren sie empfindlich auf politische und wirtschaftliche Krisen.", "Eine stärkere internationale Abstimmung kann Konflikte entschärfen, wodurch gemeinsame Lösungen wahrscheinlicher werden."] },
  { topic: "Wissenschaftliches Arbeiten und Quellen", grammar: ["academic", "reported", "nominalisation"], models: ["Laut der vorliegenden Studie besteht ein deutlicher Zusammenhang zwischen Bildungszugang und sozialer Mobilität.", "Die Auswertung der Daten zeigt, dass einfache Ursache-Wirkungs-Erklärungen nicht ausreichen.", "Die Ergebnisse sind zwar relevant, ihre Übertragbarkeit auf andere Gruppen bleibt jedoch begrenzt."] },
  { topic: "Stellungnahme und formelle Korrespondenz", grammar: ["argumentation", "condition", "nominalisation"], models: ["Bei der Beurteilung dieser Maßnahme müssen sowohl gesellschaftliche Vorteile als auch mögliche Nebenwirkungen berücksichtigt werden.", "Ich wäre Ihnen dankbar, wenn Sie mir mitteilen könnten, welche weiteren Unterlagen erforderlich sind.", "Zusammenfassend bin ich der Auffassung, dass eine ausgewogene Lösung langfristig überzeugender ist als ein pauschales Verbot."] },
  { topic: "Prüfungsvorbereitung und spontane Argumentation", grammar: ["argumentation", "concessive", "academic"], models: ["Zunächst sollte geklärt werden, welche Kriterien für die Bewertung dieser Frage entscheidend sind.", "Ein häufig genanntes Gegenargument ist zwar nachvollziehbar, überzeugt jedoch nur unter bestimmten Voraussetzungen.", "Zusammenfassend lässt sich festhalten, dass eine differenzierte Lösung den unterschiedlichen Interessen am ehesten gerecht wird."] },
];

const slug = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

function makeSlide(lesson, index) {
  const day = index + 1;
  const assignmentId = `C1 ${day}`;
  const grammarFocusEn = lesson.grammar.map((key) => GRAMMAR[key]);
  const topic = lesson.topic;

  return {
    id: `c1-day-${day}-${slug(topic)}`,
    course: "C1",
    day: `Day ${day}`,
    dayNumber: day,
    assignmentId,
    title: `C1 Day ${day} · ${topic}`,
    topic: `${day} ${topic}`,
    objective: `Students develop a nuanced C1 position on ${topic}, support it with precise examples and counterarguments, and use advanced cohesive structures accurately.`,
    estimatedDuration: "60–75 minutes",
    warmupQuestionsDe: [
      `Welche aktuelle Debatte verbindest du mit dem Thema „${topic}“?`,
      `Welche zwei Chancen siehst du bei „${topic}“?`,
      `Welche Risiken oder Gegenargumente sind besonders wichtig?`,
      `Wie wird dieses Thema in deinem Heimatland diskutiert?`,
    ],
    keyPhrasesDe: [
      "Bei der Beurteilung dieser Frage sollte berücksichtigt werden, dass ...",
      "Einerseits ..., andererseits ...",
      "Zwar ..., jedoch ...",
      "Ein entscheidender Vorteil / Nachteil besteht darin, dass ...",
      "Dem lässt sich entgegenhalten, dass ...",
      "Ich bin der Auffassung, dass ...",
      "Zusammenfassend lässt sich festhalten, dass ...",
    ],
    studentQuestionsDe: [
      `Welche Vorteile bietet „${topic}“ und für wen?`,
      `Welche Nachteile oder unbeabsichtigten Folgen könnten entstehen?`,
      `Welches Gegenargument findest du am stärksten und wie würdest du darauf reagieren?`,
      `Welche konkrete Maßnahme oder Alternative würdest du vorschlagen?`,
      `Nimm in 60–90 Sekunden differenziert Stellung zu „${topic}“.",
    ],
    teacherNotesEn: [
      "Require claim → reason → example → consequence rather than isolated opinions.",
      "Ask learners to acknowledge one credible counterargument before defending their final position.",
      "Push precise C1 connectors and correct verb placement; complexity without structural control is not the goal.",
      "Use the model language as support, not as a script to memorize word-for-word.",
      "Finish with a timed 60–90 second response or a short 180–220 word written position.",
    ],
    interactionFlow: [
      { phase: "Position line", detailEn: "6 min: learners choose a position and give one immediate reason." },
      { phase: "Language upgrade", detailEn: "10 min: transform B1/B2-style sentences into precise C1 structures using the grammar focus." },
      { phase: "Argument map", detailEn: "12 min: build claim → reason → example → counterargument → response." },
      { phase: "Timed speaking", detailEn: "12 min: 60–90 second answers, partner follow-up and targeted correction." },
      { phase: "Writing bridge", detailEn: "10 min: convert the oral argument into an introduction, two developed points and a conclusion." },
    ],
    wrapUpTaskDe: `Formuliere eine 60–90 Sekunden lange Stellungnahme zu „${topic}“. Nenne ein Argument, ein Gegenargument, ein Beispiel und deine Schlussposition.`,
    workbookConnection: {
      grammarUrl: null,
      workbookUrl: null,
      subtitle: "C1 classroom bridge. Direct Falowen workbook/grammar routes are intentionally omitted until verified.",
      parts: [
        { label: "Teil 1 · Sprechen", detailEn: "Develop a nuanced position, justify it, respond to a counterargument and use an example." },
        { label: "Teil 2 · Schreiben", detailEn: "Build a structured C1 opinion text or formal response with clear paragraph logic and cohesive devices." },
        { label: "Teil 3 · Lesen / Analyse", detailEn: "Identify thesis, evidence, assumptions, contrast and consequences in an advanced text on the lesson topic." },
        { label: "Teil 4 · Wortschatz", detailEn: "Collect reusable topic vocabulary, collocations and nominal expressions for speaking and writing." },
        { label: "Teil 5 · Grammatik", detailEn: "Apply the lesson's advanced sentence structures accurately in argumentation rather than as isolated drills." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: `C1 discussion and writing lesson on ${topic}. Move from spontaneous opinion to structured argumentation, then pressure-test the position with a counterargument and transfer the language into a short written response.`,
      grammarFocusEn,
      modelExamplesDe: lesson.models,
      commonMistakesEn: [
        "Using advanced connectors without completing the required sentence structure or verb position.",
        "Giving abstract claims without a concrete example, consequence or affected group.",
        "Repeating the same argument in different words instead of developing a counterargument and response.",
        "Overusing nominal style until the sentence becomes unclear; precision is more important than sounding complicated.",
      ],
    },
  };
}

export const c1PresenterSlides = LESSONS.map(makeSlide);
