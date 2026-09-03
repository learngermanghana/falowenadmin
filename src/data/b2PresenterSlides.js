const assignmentIdForDay = (day) => `B2-${Math.ceil(day / 4)}.${day}`;

const B2_LESSONS = [
  { day: 1, topic: "Persönliche Identität und Selbstverständnis", grammar: ["Use nominalisation to discuss abstract ideas: sich entwickeln → die Entwicklung, sich verwirklichen → die Selbstverwirklichung.", "Use dass-clauses to explain beliefs and self-perception; the conjugated verb goes to the end.", "Use concessive connectors such as obwohl / dennoch to contrast self-image with external expectations."], models: ["Meine Identität wird sowohl durch meine Erfahrungen als auch durch meine Werte geprägt.", "Ich finde, dass Selbstreflexion wichtig ist, obwohl sie manchmal unangenehm sein kann.", "Die persönliche Entwicklung hängt davon ab, wie offen man für Veränderungen ist."] },
  { day: 2, topic: "Beziehungen und Kommunikation", grammar: ["Use Konjunktiv II for tactful advice, wishes and conflict-sensitive suggestions.", "Use indirect questions with ob and W-words; the conjugated verb goes to the end.", "Use paired connectors to weigh communication styles: einerseits ... andererseits; zwar ... jedoch."], models: ["An deiner Stelle würde ich das Problem direkt, aber respektvoll ansprechen.", "Ich würde gern wissen, ob wir darüber in Ruhe sprechen können.", "Einerseits erleichtern Nachrichten den Kontakt, andererseits entstehen leicht Missverständnisse."] },
  { day: 3, topic: "Öffentliches vs. Privates Leben", grammar: ["Use relative clauses with prepositions: die Person, mit der ...; das Thema, über das ....", "Use während / wohingegen to contrast public and private behaviour.", "Use passive constructions when the actor is less important than the public action or rule."], models: ["Es gibt Informationen, über die man nicht öffentlich sprechen sollte.", "Während manche Menschen viel online teilen, schützen andere ihre Privatsphäre konsequent.", "Private Daten werden häufig veröffentlicht, ohne dass die Folgen bedacht werden."] },
  { day: 4, topic: "Beruf und Karriere", grammar: ["Use nominalisation for professional language: sich bewerben → die Bewerbung; sich weiterbilden → die Weiterbildung.", "Use passive and modal passive for workplace processes: Bewerbungen werden geprüft; Unterlagen müssen eingereicht werden.", "Use purpose clauses with um ... zu / damit for career goals."], models: ["Für den beruflichen Aufstieg ist kontinuierliche Weiterbildung entscheidend.", "Die Bewerbungsunterlagen müssen vollständig eingereicht werden.", "Ich absolviere eine Weiterbildung, um meine beruflichen Chancen zu verbessern."] },
  { day: 5, topic: "Bildung und Lernen", grammar: ["Use um ... zu and damit to express learning goals; use damit when subjects differ.", "Use indem / dadurch, dass to explain learning methods and how results are achieved.", "Use nominalisation for formal discussion of access, motivation and educational equality."], models: ["Man erweitert seinen Wortschatz, indem man neue Wörter regelmäßig anwendet.", "Universitäten bieten Stipendien an, damit mehr Menschen Zugang zu Bildung haben.", "Lebenslanges Lernen trägt zur beruflichen und persönlichen Entwicklung bei."] },
  { day: 6, topic: "Kultur und Gesellschaft", grammar: ["Use relative clauses with der/die/das and prepositions to define cultural practices precisely.", "Use zwar ... jedoch and obwohl to present balanced cultural evaluations.", "Use nicht nur ... sondern auch to connect equal cultural effects."], models: ["Traditionen, mit denen Menschen aufwachsen, prägen häufig ihre Identität.", "Kulturelle Vielfalt kann zwar Konflikte verursachen, sie bietet jedoch auch neue Perspektiven.", "Feste stärken nicht nur die Gemeinschaft, sondern vermitteln auch kulturelle Werte."] },
  { day: 7, topic: "Medien und digitale Welt", grammar: ["Use passive/modal passive to describe how data, news and content are produced or regulated.", "Use einerseits ... andererseits / hingegen for balanced media arguments.", "Use wodurch / dadurch to express consequences of digital behaviour."], models: ["Persönliche Daten werden von vielen Plattformen gesammelt und ausgewertet.", "Einerseits ermöglichen soziale Medien schnellen Austausch, andererseits können sie die Konzentration beeinträchtigen.", "Falschinformationen verbreiten sich schnell, wodurch das Vertrauen in Medien sinken kann."] },
  { day: 8, topic: "Wissenschaft und Technologie", grammar: ["Use passive constructions to describe research, inventions and technical processes objectively.", "Use Futur I and modal expressions for predictions without overstating certainty.", "Use nominalisation to make scientific explanations more compact and formal."], models: ["Neue Technologien werden entwickelt, um komplexe Probleme effizienter zu lösen.", "Künstliche Intelligenz wird in Zukunft vermutlich viele Arbeitsprozesse verändern.", "Die Automatisierung bestimmter Aufgaben führt zu neuen Anforderungen an Beschäftigte."] },
  { day: 9, topic: "Politik und Gesellschaft", grammar: ["Use reported-speech structures (laut, zufolge, nach Angaben) to separate sources from your own view.", "Use passive/modal passive for laws, decisions and public measures.", "Use obwohl / dennoch and zwar ... jedoch to evaluate political measures from more than one perspective."], models: ["Nach Angaben der Regierung sollen neue Maßnahmen eingeführt werden.", "Politische Entscheidungen müssen transparent erklärt werden.", "Obwohl eine Regel sinnvoll sein kann, wird sie nicht von allen Bürgern unterstützt."] },
  { day: 10, topic: "Wirtschaft und Finanzen", grammar: ["Use causal and consequential links: aufgrund, wegen, deshalb, sodass, infolgedessen.", "Use nominalisation for formal economic language: steigen → der Anstieg; investieren → die Investition.", "Use je ... desto to express relationships between economic variables."], models: ["Der Anstieg der Lebenshaltungskosten belastet besonders einkommensschwache Haushalte.", "Je höher die Inflation ist, desto weniger Kaufkraft haben Verbraucher.", "Unternehmen investieren in Digitalisierung, sodass viele Prozesse effizienter werden."] },
  { day: 11, topic: "Umwelt und Nachhaltigkeit", grammar: ["Use indem / dadurch, dass to describe concrete ways of reducing environmental impact.", "Use trotz + Genitiv/Dativ and obwohl to contrast behaviour with obstacles.", "Use nominalisation for emissions, consumption and environmental protection."], models: ["Emissionen lassen sich reduzieren, indem mehr Menschen öffentliche Verkehrsmittel nutzen.", "Trotz höherer Anschaffungskosten können nachhaltige Technologien langfristig günstiger sein.", "Die Verringerung des Energieverbrauchs ist ein wichtiger Beitrag zum Klimaschutz."] },
  { day: 12, topic: "Gesundheit und Wohlbefinden", grammar: ["Use modal passive for recommendations and requirements: Stress sollte reduziert werden; Symptome müssen untersucht werden.", "Use sodass / weshalb to describe health consequences.", "Use ohne ... zu / statt ... zu for alternative or avoided behaviour."], models: ["Anhaltende Beschwerden sollten ärztlich untersucht werden.", "Viele Menschen schlafen zu wenig, sodass ihre Konzentrationsfähigkeit abnimmt.", "Man sollte Pausen machen, statt stundenlang ohne Unterbrechung zu arbeiten."] },
  { day: 13, topic: "Ernährung und Lebensstil", grammar: ["Use je ... desto for relationships between habits and health.", "Use obwohl / trotzdem to evaluate realistic lifestyle choices.", "Use indem and ohne ... zu to describe methods and alternatives."], models: ["Je ausgewogener man sich ernährt, desto leichter lässt sich das Wohlbefinden verbessern.", "Obwohl Bio-Produkte oft teurer sind, entscheiden sich viele Menschen bewusst dafür.", "Man kann Lebensmittelverschwendung vermeiden, indem man nur kauft, was man wirklich braucht."] },
  { day: 14, topic: "Reisen und Mobilität", grammar: ["Use während / wohingegen to compare transport and travel options.", "Use je ... desto plus comparative structures for trends and trade-offs.", "Use indem / dadurch, dass to explain how mobility can become more sustainable."], models: ["Während das Flugzeug schnell ist, verursacht die Bahn meist deutlich weniger Emissionen.", "Je besser der öffentliche Verkehr ausgebaut ist, desto seltener braucht man ein eigenes Auto.", "Städte können Emissionen reduzieren, indem sie sichere Radwege ausbauen."] },
  { day: 15, topic: "Wohnen und Lebensräume", grammar: ["Use indirect questions and Konjunktiv II for polite housing enquiries and complaints.", "Use relative clauses with prepositions to describe places and housing features precisely.", "Use obwohl / dennoch to weigh cost, location and quality."], models: ["Könnten Sie mir sagen, ob die Nebenkosten bereits in der Miete enthalten sind?", "Die Wohnung, in der ich zurzeit lebe, liegt zwar zentral, ist jedoch sehr teuer.", "Obwohl die Lage ideal ist, würde ich wegen des hohen Mietpreises nach einer Alternative suchen."] },
  { day: 16, topic: "Freizeit, Hobbys und Interessen", grammar: ["Use temporal clauses with während, bevor and nachdem to structure activities.", "Use um ... zu / ohne ... zu / statt ... zu to explain purpose and alternatives.", "Use comparative forms for evaluating different leisure activities."], models: ["Bevor ich Sport mache, erledige ich meistens meine wichtigsten Aufgaben.", "Ich gehe regelmäßig laufen, um nach der Arbeit abzuschalten.", "Aktive Freizeit ist für mich erholsamer als stundenlanges Fernsehen."] },
  { day: 17, topic: "Feste und Traditionen", grammar: ["Use temporal clauses to describe sequences: bevor, nachdem, während, sobald.", "Use passive constructions to explain how celebrations are organised.", "Use relative clauses to add cultural background without starting new sentences."], models: ["Bevor das Fest beginnt, werden die Straßen traditionell geschmückt.", "Nachdem die Gäste angekommen sind, wird gemeinsam gegessen.", "Das Fest, an dem jedes Jahr viele Familien teilnehmen, hat eine lange Tradition."] },
  { day: 18, topic: "Werte und Normen", grammar: ["Use modal passive for social expectations and rules: Normen müssen hinterfragt werden; Regeln sollten begründet werden.", "Use einerseits ... andererseits and wenngleich/obwohl to discuss competing values.", "Use nominalisation for abstract concepts such as Verantwortung, Gleichberechtigung and Toleranz."], models: ["Gesellschaftliche Regeln sollten regelmäßig hinterfragt und verständlich begründet werden.", "Einerseits geben Normen Orientierung, andererseits können sie individuelle Freiheit einschränken.", "Toleranz ist wichtig, obwohl nicht jedes Verhalten akzeptiert werden muss."] },
  { day: 19, topic: "Migration und Integration", grammar: ["Use concessive structures: obwohl, obgleich, wenngleich, trotz to acknowledge counterarguments.", "Use während / wohingegen to contrast integration experiences or policies.", "Use relative clauses with prepositions for precise descriptions of institutions and support systems."], models: ["Obwohl Integration Zeit braucht, kann frühe Sprachförderung den Prozess deutlich erleichtern.", "Während manche Zugewanderte schnell Arbeit finden, haben andere Schwierigkeiten mit der Anerkennung ihrer Qualifikationen.", "Beratungsstellen, an die sich Migranten wenden können, spielen eine wichtige Rolle."] },
  { day: 20, topic: "Diskriminierung und Gleichstellung", grammar: ["Use relative clauses with prepositions: Menschen, gegenüber denen ...; Bereiche, in denen ....", "Use passive/modal passive to focus on discriminatory actions, rights and remedies.", "Use nicht nur ... sondern auch and sowohl ... als auch for structured equality arguments."], models: ["Menschen, gegenüber denen Vorurteile bestehen, erleben häufig Nachteile im Alltag.", "Diskriminierung darf nicht nur kritisiert, sondern muss auch konsequent verhindert werden.", "Sowohl transparente Regeln als auch wirksame Beschwerdewege können Gleichstellung fördern."] },
  { day: 21, topic: "Recht und Ordnung", grammar: ["Use passive and modal passive for laws, procedures and obligations.", "Use nominalisation for formal legal language: genehmigen → die Genehmigung; verstoßen → der Verstoß.", "Use falls / sofern for conditions in rules and procedures."], models: ["Gesetze müssen eingehalten werden, unabhängig davon, ob man ihnen persönlich zustimmt.", "Für bestimmte Tätigkeiten ist eine behördliche Genehmigung erforderlich.", "Falls gegen eine Vorschrift verstoßen wird, können rechtliche Konsequenzen folgen."] },
  { day: 22, topic: "Konfliktmanagement", grammar: ["Use Konjunktiv II for proposals and de-escalating language.", "Use indirect questions to clarify needs without sounding accusatory.", "Use indem / dadurch, dass to describe conflict-resolution strategies."], models: ["Wir könnten zunächst klären, welche Erwartungen beide Seiten haben.", "Darf ich fragen, was Sie an der aktuellen Lösung besonders stört?", "Konflikte lassen sich oft entschärfen, indem man aktiv zuhört und Ich-Botschaften verwendet."] },
  { day: 23, topic: "Globalisierung", grammar: ["Use nominalisation for abstract processes: globalisieren → die Globalisierung; vernetzen → die Vernetzung.", "Use einerseits ... andererseits and während/wohingegen for balanced global comparisons.", "Use causal/consequential connectors to link trade, labour and environmental effects."], models: ["Die zunehmende wirtschaftliche Vernetzung schafft neue Chancen und Abhängigkeiten.", "Einerseits erleichtert Globalisierung den internationalen Handel, andererseits erhöht sie den Wettbewerbsdruck.", "Produktionen werden verlagert, wodurch sich Arbeitsbedingungen in verschiedenen Regionen verändern können."] },
  { day: 24, topic: "Zukunft und Innovation", grammar: ["Use Futur I and probability markers for evidence-based predictions.", "Use Konjunktiv II for hypothetical innovations and scenarios.", "Use passive constructions for processes whose future actor is unknown or irrelevant."], models: ["In Zukunft werden viele Routineaufgaben wahrscheinlich automatisiert werden.", "Wenn erneuerbare Energien günstiger wären, könnten mehr Haushalte schneller umsteigen.", "Neue Lösungen werden entwickelt, um Ressourcen effizienter zu nutzen."] },
  { day: 25, topic: "Kommunikation im Berufsleben", grammar: ["Use Konjunktiv II and indirect questions for professional requests, disagreement and negotiation.", "Use reported-speech markers to summarise colleagues' statements neutrally.", "Use nominal style selectively in formal emails and meeting summaries."], models: ["Könnten Sie mir bitte mitteilen, bis wann die Unterlagen benötigt werden?", "Nach Aussage der Teamleitung soll das Projekt nächste Woche abgeschlossen werden.", "Vielen Dank für die Rückmeldung; zur weiteren Abstimmung schlage ich ein kurzes Gespräch vor."] },
  { day: 26, topic: "Wissenschaftliches Arbeiten", grammar: ["Use passive and nominalisation for objective academic style.", "Use source-reporting language: laut, zufolge, nach Angaben, die Studie zeigt, dass ....", "Use cohesive connectors to distinguish evidence, interpretation and limitation."], models: ["Die Daten wurden in mehreren Schritten erhoben und anschließend ausgewertet.", "Laut der Studie besteht ein deutlicher Zusammenhang zwischen den beiden Faktoren.", "Die Ergebnisse sind zwar relevant, jedoch ist die Zahl der Teilnehmenden begrenzt."] },
  { day: 27, topic: "Zeitmanagement und Organisation", grammar: ["Use bevor, nachdem, während and sobald to order work precisely.", "Use ohne ... zu / statt ... zu for inefficient alternatives and better choices.", "Use indem / dadurch, dass to explain organisation strategies."], models: ["Bevor ich mit einer großen Aufgabe beginne, teile ich sie in kleinere Schritte auf.", "Nachdem ich meine Prioritäten festgelegt habe, plane ich feste Zeitblöcke.", "Man arbeitet konzentrierter, indem man Benachrichtigungen während wichtiger Aufgaben ausschaltet."] },
  { day: 28, topic: "Zusammenfassung & Prüfungsvorbereitung", grammar: ["Review B2 connector families: cause, consequence, concession, contrast, purpose and method.", "Review passive/modal passive, relative clauses with prepositions, nominalisation and Konjunktiv II.", "Prioritise accurate, flexible sentence building over forcing every advanced structure into one answer."], models: ["Obwohl das Thema komplex ist, lassen sich die wichtigsten Argumente klar strukturieren.", "Ein überzeugender Beitrag entsteht, indem man seine Position begründet und ein konkretes Beispiel nennt.", "Zusammenfassend lässt sich sagen, dass sprachliche Vielfalt nur dann hilft, wenn die Strukturen sicher beherrscht werden."] },
];

function makeSlide(definition) {
  const { day, topic, grammar, models } = definition;
  const assignmentId = assignmentIdForDay(day);
  const unit = Math.ceil(day / 4);
  return {
    id: `b2-day-${day}-${topic.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, "-").replace(/^-|-$/g, "")}`,
    course: "B2",
    day: `Day ${day}`,
    dayNumber: day,
    assignmentId,
    title: `B2 Day ${day} · ${topic}`,
    topic: `${unit}.${day} ${topic}`,
    objective: `Students discuss ${topic} at B2 level with balanced arguments, precise connectors and extended sentence structures.`,
    estimatedDuration: "60 minutes",
    warmupQuestionsDe: [
      `Welche persönlichen Erfahrungen hast du mit dem Thema „${topic}“?`,
      `Welche zwei Vorteile und welche zwei Herausforderungen siehst du bei „${topic}“?`,
      `Wie ist die Situation bei diesem Thema in deinem Heimatland oder in Ghana?`,
    ],
    keyPhrasesDe: [
      "Bei der Beurteilung dieses Themas sollte man berücksichtigen, dass ...",
      "Einerseits ... , andererseits ...",
      "Ein wesentlicher Vorteil / Nachteil besteht darin, dass ...",
      "Ein konkretes Beispiel dafür ist ...",
      "Zusammenfassend bin ich der Auffassung, dass ...",
    ],
    studentQuestionsDe: [
      `Welche Bedeutung hat „${topic}“ heute?`,
      `Welche Chancen bietet „${topic}“ und welche Probleme können entstehen?`,
      `Welche Maßnahme oder Lösung hältst du in diesem Bereich für besonders sinnvoll?`,
      `Wie unterscheidet sich die Situation in Deutschland und deinem Heimatland?`,
      `Welche Position vertrittst du persönlich? Begründe sie mit einem Beispiel.`,
    ],
    teacherNotesEn: [
      `Treat Day ${day} as a B2 argument-building lesson, not a vocabulary-only discussion.`,
      "Require claim → reason → example/counterpoint in extended speaking answers.",
      "Correct connector word order and sentence structure after the speaking phase rather than interrupting every sentence.",
      "Use the model language as support, but require students to personalise the content and avoid memorised lists.",
    ],
    interactionFlow: [
      { phase: "Position line", detailEn: "6 min: students choose a position and justify it in one B2 sentence." },
      { phase: "Grammar activation", detailEn: "10 min: transform short statements using the lesson's target structures." },
      { phase: "Argument ladder", detailEn: "10 min: build claim → reason → example → counterpoint." },
      { phase: "Speaking rehearsal", detailEn: "14 min: 90-second response, then one follow-up question from a partner." },
      { phase: "Workbook bridge", detailEn: "8 min: connect the discussion to writing, reading and listening tasks for the lesson." },
    ],
    wrapUpTaskDe: `Formuliere 5–6 Sätze zum Thema „${topic}“. Nutze mindestens zwei B2-Konnektoren und ein konkretes Beispiel.`,
    workbookConnection: {
      grammarUrl: null,
      workbookUrl: "",
      subtitle: "B2 teaching guide follows the 28-day LLEA curriculum. Direct Falowen workbook links are only added after the live B2 route is verified.",
      parts: [
        { label: "Grammar", detailEn: grammar.join(" ") },
        { label: "Teil 1 · Sprechen", detailEn: `Structured B2 discussion of ${topic}: position, reasons, advantages/disadvantages, example and comparison.` },
        { label: "Teil 2 · Schreiben", detailEn: `Transfer the lesson argument structure into a B2 opinion, formal message or task-based response about ${topic}.` },
        { label: "Teil 3 · Lesen", detailEn: `Use the current B2 workbook reading for Day ${day}; focus on identifying position, evidence, contrast and key vocabulary.` },
        { label: "Teil 4 · Hören", detailEn: `Use the current B2 workbook listening for Day ${day} when a live audio source is available; do not invent missing audio.` },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: `Day ${day} develops a structured B2 discussion of ${topic}, combining topic vocabulary with argumentation and sentence-building accuracy.`,
      grammarFocusEn: grammar,
      modelExamplesDe: models,
      commonMistakesEn: [
        "Giving a list of ideas without connecting them into a reasoned B2 argument.",
        "Using advanced connectors with main-clause word order when the connector requires verb-final order.",
        "Repeating the same connector instead of varying cause, contrast, consequence and example language.",
      ],
    },
  };
}

export const b2PresenterSlides = B2_LESSONS.map(makeSlide);

export function getB2PresenterSlide(assignmentId) {
  const normalized = String(assignmentId || "").trim().toUpperCase();
  return b2PresenterSlides.find((slide) => slide.assignmentId.toUpperCase() === normalized) || null;
}
