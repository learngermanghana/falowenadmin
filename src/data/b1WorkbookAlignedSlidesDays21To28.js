const lessonRoute = (day, view) => `/campus/course/lesson/B1/${day}?view=${view}`;

const workbookConnection = (day, parts, options = {}) => ({
  grammarUrl: options.grammarUrl === undefined ? null : options.grammarUrl,
  workbookUrl: lessonRoute(day, "workbook"),
  ...(options.subtitle ? { subtitle: options.subtitle } : {}),
  parts,
});

export const b1WorkbookAlignedSlidesDays21To28 = [
  {
    id: "b1-day-21-lebensformen-heute",
    course: "B1",
    day: "Day 21",
    dayNumber: 21,
    assignmentId: "B1-7.21",
    title: "B1 Day 21 · Lebensformen heute",
    topic: "7.21 Lebensformen heute – Familie und Wohngemeinschaft",
    objective: "Students compare family life, shared flats and single life with balanced B1 argument structures and justify which living arrangement fits them best.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welche Wohnform passt gerade zu deinem Leben?",
      "Welche Vorteile hat eine WG?",
      "Wann kann Singleleben besonders praktisch sein?",
      "Welche Lebensform ist in deinem Heimatland besonders verbreitet?",
    ],
    keyPhrasesDe: [
      "Einerseits bietet eine WG Gemeinschaft, andererseits muss man Kompromisse machen.",
      "Das Singleleben ist zwar flexibel, aber es kann einsam sein.",
      "Während eine Familie viel Nähe bietet, hat man allein oft mehr Freiheit.",
      "Für mich passt ... am besten, weil ...",
      "Obwohl ..., finde ich ...",
      "Ich denke, dass jede Person selbst entscheiden sollte.",
    ],
    studentQuestionsDe: [
      "Welche Vor- und Nachteile haben Familie, WG und Singleleben?",
      "Welche Rolle spielen Kosten, Privatsphäre und Unterstützung?",
      "Welche Lebensform würdest du heute wählen und warum?",
      "Kann sich die passende Lebensform im Laufe des Lebens ändern?",
      "Wie ist die Situation in deinem Heimatland?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Vor- und Nachteile haben Familie, WG und Singleleben?",
        "modelAnswerDe": "Bei der Familie bekommt man Unterstützung, hat aber manchmal weniger Freiheit. In einer WG kann man Kosten teilen, muss jedoch Rücksicht auf Mitbewohner nehmen. Allein zu wohnen bietet viel Privatsphäre, ist aber oft teurer und manchmal einsam."
      },
      {
        "questionDe": "Welche Rolle spielen Kosten, Privatsphäre und Unterstützung?",
        "modelAnswerDe": "Die Kosten entscheiden oft darüber, welche Wohnform möglich ist. Privatsphäre ist wichtig, damit man sich zurückziehen kann. Gleichzeitig finde ich Unterstützung im Alltag wertvoll, besonders wenn es Probleme gibt."
      },
      {
        "questionDe": "Welche Lebensform würdest du heute wählen und warum?",
        "modelAnswerDe": "Ich würde heute eine WG wählen, weil ich die Miete teilen und mit anderen zusammenleben möchte. Trotzdem hätte ich gern ein eigenes Zimmer. Klare Regeln für Ruhe und Sauberkeit wären mir wichtig."
      },
      {
        "questionDe": "Kann sich die passende Lebensform im Laufe des Lebens ändern?",
        "modelAnswerDe": "Ja, die passende Lebensform kann sich ändern. Während der Ausbildung ist eine WG vielleicht praktisch, später möchte man möglicherweise mit einem Partner zusammenwohnen. Im Alter kann die Nähe zur Familie wieder wichtiger werden."
      },
      {
        "questionDe": "Wie ist die Situation in deinem Heimatland?",
        "modelAnswerDe": "Nach meiner Erfahrung leben in Ghana viele Menschen mit Familienangehörigen zusammen. Das kann Unterstützung bieten und Kosten sparen. Es gibt aber auch Menschen, die allein oder mit Freunden wohnen, besonders wegen Arbeit oder Ausbildung."
      }
    ],
    teacherNotesEn: [
      "Teach the actual Day 21 grammar: weil/obwohl/während/dass with verb-final order plus einerseits … andererseits, zwar … aber and nicht nur … sondern auch.",
      "The speaking and writing tasks both require comparison plus a clear personal judgement; do not accept lists of advantages without evaluation.",
      "Teil 3 is the Andrea Müller family-at-different-places reading with five questions.",
      "There is genuinely no Teil 4 for Day 21. The workbook hides it and the marking contract explicitly excludes teil4.",
    ],
    interactionFlow: [
      { phase: "Contrast builder", detailEn: "8 min: turn simple pros/cons into einerseits … andererseits and zwar … aber sentences." },
      { phase: "Subordinate-clause check", detailEn: "9 min: practise weil/obwohl/während/dass with verb-final order." },
      { phase: "Living-form comparison", detailEn: "12 min: pairs compare family, WG and single life using cost, freedom, support and privacy." },
      { phase: "Workbook bridge", detailEn: "10 min: rehearse the Mara opinion structure and preview Andrea Müller's distributed-family reading." },
    ],
    wrapUpTaskDe: "Vergleiche zwei Lebensformen in fünf Sätzen. Nutze einen zweiteiligen Konnektor, einen Nebensatz und eine klare eigene Meinung.",
    workbookConnection: workbookConnection(21, [
      { label: "Grammar", detailEn: "Direct grammar page available: weigh advantages and disadvantages with weil, obwohl, während and dass plus einerseits … andererseits, zwar … aber and nicht nur … sondern auch." },
      { label: "Teil 1 · Sprechen", detailEn: "Compare Familie, Wohngemeinschaft and Singleleben; give advantages, disadvantages, a home-country/personal example and explain which form suits you best. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Write 80–100 words responding to Mara about the best modern living arrangement; compare the three forms, include at least one advantage and disadvantage, an example and a clear conclusion." },
      { label: "Teil 3 · Lesen", detailEn: "Scored reading: Andrea Müller and a family living across different German regions; answer all five multiple-choice questions and submit them under Teil 3." },
    ], {
      grammarUrl: lessonRoute(21, "grammar"),
      subtitle: "Day 21 has Grammar, Sprechen, Schreiben and Lesen only. There is no Teil 4, and teil4 is excluded by the marking contract.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 21 teaches balanced comparison of modern living arrangements and has a deliberately shorter workbook structure with no listening part.",
      grammarFocusEn: [
        "weil, obwohl and dass send the conjugated verb to the end.",
        "während can contrast two living situations while keeping verb-final order in the subordinate clause.",
        "einerseits … andererseits and zwar … aber are useful for balanced evaluation.",
        "nicht nur … sondern auch adds a second positive or negative aspect without repeating a full argument.",
      ],
      modelExamplesDe: [
        "Einerseits ist eine WG günstiger, andererseits hat man weniger Privatsphäre.",
        "Das Singleleben ist zwar flexibel, aber man muss alles allein organisieren.",
        "Während eine Familie viel Unterstützung bietet, gibt das Singleleben mehr Unabhängigkeit.",
        "Ich würde eine WG wählen, weil ich gern mit anderen zusammenlebe.",
      ],
      commonMistakesEn: [
        "Keeping main-clause word order after weil, obwohl, während or dass.",
        "Using einerseits without completing the contrast with andererseits.",
        "Listing three living forms without evaluating which one fits the speaker.",
        "Inventing a Day 21 listening task even though the workbook and grading contract contain no Teil 4.",
      ],
    },
  },
  {
    id: "b1-day-22-beziehung-wichtig",
    course: "B1",
    day: "Day 22",
    dayNumber: 22,
    assignmentId: "B1-7.22",
    title: "B1 Day 22 · Was ist dir in einer Beziehung wichtig?",
    topic: "7.22 Was ist dir in einer Beziehung wichtig?",
    objective: "Students describe relationship values and expectations with dass clauses, relative clauses and reciprocal expressions, then evaluate online dating.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welche drei Werte sind dir in einer Beziehung besonders wichtig?",
      "Wie wichtig sind Vertrauen und Ehrlichkeit?",
      "Welche Rolle spielen gemeinsame Interessen?",
      "Welche Vor- und Nachteile kann Partnersuche im Internet haben?",
    ],
    keyPhrasesDe: [
      "Mir ist wichtig, dass man offen miteinander spricht.",
      "Ich wünsche mir einen Partner, der zuverlässig ist.",
      "Partner sollten füreinander da sein.",
      "Man kann viel voneinander lernen.",
      "Wenn beide respektvoll kommunizieren, ...",
      "Obwohl Menschen unterschiedlich sind, ...",
    ],
    studentQuestionsDe: [
      "Welche Eigenschaften sollte ein idealer Partner haben?",
      "Was bedeutet gute Kommunikation für dich?",
      "Wie wichtig sind gemeinsame Zukunftspläne?",
      "Welche Chancen und Risiken hat Online-Dating?",
      "Was ist wichtiger: gemeinsame Interessen oder gegenseitiger Respekt?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Eigenschaften sollte ein idealer Partner haben?",
        "modelAnswerDe": "Mein idealer Partner sollte ehrlich, zuverlässig und verständnisvoll sein. Mir ist wichtig, dass wir offen über Probleme sprechen können. Außerdem sollte jeder die persönlichen Ziele des anderen respektieren."
      },
      {
        "questionDe": "Was bedeutet gute Kommunikation für dich?",
        "modelAnswerDe": "Gute Kommunikation bedeutet für mich, ehrlich zu sprechen und aufmerksam zuzuhören. Man sollte Probleme ansprechen, ohne den anderen zu beleidigen. Wichtig ist auch, nachzufragen, wenn man etwas nicht versteht."
      },
      {
        "questionDe": "Wie wichtig sind gemeinsame Zukunftspläne?",
        "modelAnswerDe": "Gemeinsame Zukunftspläne sind wichtig, weil große Entscheidungen beide betreffen. Zum Beispiel sollte man über Wohnort, Beruf und Familie sprechen. Trotzdem dürfen sich Wünsche ändern, wenn man gemeinsam darüber redet."
      },
      {
        "questionDe": "Welche Chancen und Risiken hat Online-Dating?",
        "modelAnswerDe": "Online-Dating bietet die Chance, Menschen außerhalb des eigenen Freundeskreises kennenzulernen. Allerdings können Profile falsche Informationen enthalten. Deshalb würde ich persönliche Daten vorsichtig teilen und mich zuerst an einem öffentlichen Ort treffen."
      },
      {
        "questionDe": "Was ist wichtiger: gemeinsame Interessen oder gegenseitiger Respekt?",
        "modelAnswerDe": "Gegenseitiger Respekt ist für mich wichtiger. Gemeinsame Interessen sind schön, aber man muss nicht jedes Hobby teilen. Ohne Respekt kann eine Beziehung meiner Meinung nach nicht gut funktionieren."
      }
    ],
    teacherNotesEn: [
      "The intended deep grammar is verified in Falowen source: dass clauses, relative clauses and reciprocal expressions miteinander/füreinander/voneinander/aufeinander, plus weil/wenn/obwohl.",
      "The current Day 22 student lesson does not expose that deep grammar through a direct grammar route, so do not provide a broken grammar link from the teacher guide.",
      "The workbook comprehension topics are unrelated to relationships: Berlin and Bewerbung. Keep them separate from the production lesson.",
      "Important grading split: the marking contract stores Berlin questions 1–5 plus Bewerbung questions 1–2 under teil3 (seven answers total), then Bewerbung questions 3–5 under teil4 (three answers). Follow the marking contract rather than the workbook's visually simpler 5+5 split.",
    ],
    interactionFlow: [
      { phase: "Value ranking", detailEn: "7 min: rank Vertrauen, Ehrlichkeit, Kommunikation, Unterstützung and Zukunftspläne." },
      { phase: "Grammar frames", detailEn: "10 min: build Mir ist wichtig, dass … and Partner, der/die … relative clauses." },
      { phase: "Reciprocal language", detailEn: "8 min: practise miteinander, füreinander, voneinander and aufeinander in relationship contexts." },
      { phase: "Online-dating argument", detailEn: "12 min: prepare one advantage, one risk, comparison with face-to-face contact and conclusion." },
      { phase: "Marking bridge", detailEn: "8 min: explain the unusual Berlin/Bewerbung answer split before students submit." },
    ],
    wrapUpTaskDe: "Nenne drei wichtige Werte in einer Beziehung. Nutze einen dass-Satz, einen Relativsatz und einen Ausdruck mit -einander.",
    workbookConnection: workbookConnection(22, [
      { label: "Grammar", detailEn: "No direct grammar route is currently exposed. Teach expectations with dass, people with relative clauses, reciprocal behavior with miteinander/füreinander/voneinander/aufeinander, and reasons/conditions with weil, wenn and obwohl." },
      { label: "Teil 1 · Sprechen", detailEn: "Explain what matters in a relationship: communication, trust, shared interests, respect/support and future plans. Build a fictional profile and justify priorities. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Write 80–100 words responding to Maria about online dating: agreement/disagreement, advantages, risks, comparison with meeting in person, example and conclusion." },
      { label: "Teil 3 · Lesen", detailEn: "MARKING CONTRACT SPLIT: submit seven answers under Teil 3—Berlin questions 1–5, then Bewerbung questions 1–2. The workbook visually shows two five-question readings, but the grader stores the first two Bewerbung answers in teil3." },
      { label: "Teil 4 · Lesen", detailEn: "Submit only the remaining three Bewerbung answers (workbook questions 3–5) under Teil 4. The grading contract expects teil4 and stores exactly three reference answers there." },
    ], {
      grammarUrl: null,
      subtitle: "Day 22 uses an unusual grading split: Teil 3 = Berlin 1–5 + Bewerbung 1–2; Teil 4 = Bewerbung 3–5. Follow the marking contract when submitting.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 22 is a relationship-values production lesson with two unrelated reading assignments and an operational answer split that must be explained before submission.",
      grammarFocusEn: [
        "dass clauses express expectations and send the conjugated verb to the end.",
        "Relative clauses describe an ideal partner: der/die/das agrees with the antecedent and the verb comes last.",
        "Reciprocal forms include miteinander, füreinander, voneinander and aufeinander.",
        "weil/wenn/obwohl add reasons, conditions and concessions with verb-final order.",
      ],
      modelExamplesDe: [
        "Mir ist wichtig, dass man ehrlich miteinander spricht.",
        "Ich wünsche mir einen Partner, der zuverlässig ist.",
        "Partner sollten füreinander da sein und voneinander lernen.",
        "Obwohl Online-Dating praktisch ist, kann man sich dort anders darstellen als im echten Leben.",
      ],
      commonMistakesEn: [
        "Using a main-clause verb position inside dass or relative clauses.",
        "Using sich instead of a clearer reciprocal -einander form when mutual action is intended.",
        "Treating Berlin or Bewerbung as relationship-topic texts; they are separate comprehension assignments.",
        "Submitting all five Bewerbung answers under Teil 4; the current marking contract stores the first two under Teil 3 and only the last three under Teil 4.",
      ],
    },
  },
  {
    id: "b1-day-23-erstes-date",
    course: "B1",
    day: "Day 23",
    dayNumber: 23,
    assignmentId: "B1-7.23",
    title: "B1 Day 23 · Erstes Date – typische Situationen",
    topic: "7.23 Erstes Date – typische Situationen",
    objective: "Students make polite first-date suggestions with Konjunktiv II, justify choices and respond appropriately to successful or unsuccessful situations.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welcher Ort eignet sich für ein erstes Treffen?",
      "Was sollte man beim ersten Date vermeiden?",
      "Welche Gesprächsthemen sind angenehm?",
      "Ist der erste Eindruck für eine Beziehung entscheidend?",
    ],
    keyPhrasesDe: [
      "Wir könnten in ein Café gehen.",
      "Ich würde einen Spaziergang vorschlagen.",
      "Ich würde einen öffentlichen Ort wählen, weil ...",
      "Wenn das Treffen gut läuft, würde ich ...",
      "Obwohl ich nervös war, ...",
      "Vielen Dank für den schönen Abend.",
    ],
    studentQuestionsDe: [
      "Welche Treffpunkte würdest du vorschlagen?",
      "Welche Vor- und Nachteile haben Restaurant und Spaziergang?",
      "Wie reagiert man höflich, wenn man kein weiteres Treffen möchte?",
      "Was kann man tun, wenn man nervös ist?",
      "Wie wichtig ist der erste Eindruck?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Treffpunkte würdest du vorschlagen?",
        "modelAnswerDe": "Ich würde ein ruhiges Café oder einen Spaziergang in einem belebten Park vorschlagen. Dort kann man sich gut unterhalten. Für ein erstes Treffen wäre mir ein öffentlicher Ort wichtig."
      },
      {
        "questionDe": "Welche Vor- und Nachteile haben Restaurant und Spaziergang?",
        "modelAnswerDe": "Im Restaurant kann man bequem sitzen und gemeinsam essen, aber es kann teuer oder laut sein. Ein Spaziergang kostet wenig und wirkt oft lockerer. Allerdings ist man dabei vom Wetter abhängig."
      },
      {
        "questionDe": "Wie reagiert man höflich, wenn man kein weiteres Treffen möchte?",
        "modelAnswerDe": "Vielen Dank für das Treffen, ich habe mich über unser Gespräch gefreut. Ich habe aber gemerkt, dass es für mich nicht für ein weiteres Date passt. Ich möchte ehrlich sein und wünsche dir alles Gute."
      },
      {
        "questionDe": "Was kann man tun, wenn man nervös ist?",
        "modelAnswerDe": "Man kann vorher ein paar einfache Gesprächsthemen überlegen und ruhig durchatmen. Mir hilft es, das Treffen nicht wie eine Prüfung zu sehen. Außerdem darf man offen sagen, dass man ein bisschen nervös ist."
      },
      {
        "questionDe": "Wie wichtig ist der erste Eindruck?",
        "modelAnswerDe": "Der erste Eindruck spielt eine Rolle, weil er beeinflusst, wie wohl man sich fühlt. Trotzdem zeigt ein kurzes Treffen nicht den ganzen Charakter. Ich würde deshalb auch darauf achten, wie die Person zuhört und mit anderen umgeht."
      }
    ],
    teacherNotesEn: [
      "The deep Day 23 grammar is available inside the workbook Grammar tab, but the lesson route does not expose a separate direct grammar page; leave grammarUrl unset and use the workbook link.",
      "Teach polite suggestions with könnten/würden, reasons with weil/da, conditions with wenn and balanced reactions with obwohl/aber.",
      "Teil 3 is an unrelated seven-question reading about Elizabeth Magie Phillips and the history of Monopoly.",
      "Teil 4 is only a planned placeholder with no listening medium. The marking contract excludes teil4, so nothing should be submitted there.",
    ],
    interactionFlow: [
      { phase: "Suggestion ladder", detailEn: "8 min: transform direct plans into könnten/würden suggestions." },
      { phase: "Reason and condition", detailEn: "9 min: justify places with weil/da and build Wenn …, würde ich … responses." },
      { phase: "Date scenarios", detailEn: "12 min: role-play good chemistry, awkward silence, late arrival and polite rejection." },
      { phase: "Opinion rehearsal", detailEn: "9 min: respond to Sophie's view on the importance of a first date." },
      { phase: "Workbook bridge", detailEn: "7 min: preview Monopoly vocabulary and make clear that the listening placeholder is not submitted." },
    ],
    wrapUpTaskDe: "Formuliere zwei höfliche Vorschläge für ein erstes Date und begründe einen davon mit weil. Ergänze einen Wenn-Satz.",
    workbookConnection: workbookConnection(23, [
      { label: "Grammar", detailEn: "Open the workbook and use its Grammar tab. Focus: könnten/würden for polite suggestions, weil/da for reasons, wenn for conditions and obwohl/aber for polite contrast/reactions." },
      { label: "Teil 1 · Sprechen", detailEn: "Discuss typical first-date situations: preparation, meeting place, topics, feelings, respectful behavior and possible outcomes; compare options and justify one choice. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Write an opinion response to Sophie on whether the first date is really important; discuss first impressions, why they can mislead, give an example and conclude." },
      { label: "Teil 3 · Lesen", detailEn: "Scored separate reading: ‘Die Frau, die Monopoly erfand’ about Elizabeth Magie Phillips, The Landlord's Game, Charles Darrow and Mary Pilon; submit seven answer letters under Teil 3." },
      { label: "Teil 4 · Hören", detailEn: "NO SCORED TEIL 4. The workbook contains only a planned listening placeholder; no medium has been added and the marking contract explicitly excludes teil4." },
    ], {
      grammarUrl: null,
      subtitle: "Day 23 grammar is reached through the workbook Grammar tab. Teil 4 is a placeholder only and is excluded from scoring/submission.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 23 combines first-date functional language with a separate Monopoly reading and has no active listening assignment.",
      grammarFocusEn: [
        "könnten and würden make suggestions softer and more polite.",
        "weil and da introduce reasons with verb-final order.",
        "wenn clauses express conditions; when the wenn-clause comes first, the main clause begins with the conjugated verb.",
        "obwohl adds concession; aber contrasts in a main clause.",
      ],
      modelExamplesDe: [
        "Wir könnten uns in einem Café treffen.",
        "Ich würde einen Spaziergang vorschlagen, weil man dabei gut reden kann.",
        "Wenn das Treffen gut läuft, würde ich ein zweites Date vorschlagen.",
        "Obwohl ich nervös war, war das Gespräch angenehm.",
      ],
      commonMistakesEn: [
        "Using direct wollen/müssen where a polite suggestion with könnten/würden is intended.",
        "Forgetting verb-final order after weil, da or wenn.",
        "Forcing the Monopoly reading into the dating theme instead of treating it as separate comprehension.",
        "Assigning or submitting a Day 23 listening task even though the medium is only planned and teil4 is excluded.",
      ],
    },
  },
  {
    id: "b1-day-24-konsum-nachhaltigkeit",
    course: "B1",
    day: "Day 24",
    dayNumber: 24,
    assignmentId: "B1-8.24",
    title: "B1 Day 24 · Konsum und Nachhaltigkeit",
    topic: "8.24 Konsum und Nachhaltigkeit",
    objective: "Students argue for and against sustainable consumption, explain practical measures and support an opinion with reasons, examples and purpose structures.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welche nachhaltigen Produkte kaufst du bereits?",
      "Ist nachhaltiger Konsum immer teurer?",
      "Wer trägt mehr Verantwortung: Unternehmen oder Verbraucher?",
      "Welche Gewohnheit würdest du gern ändern?",
    ],
    keyPhrasesDe: [
      "Einerseits ..., andererseits ...",
      "Ich denke, dass Nachhaltigkeit wichtig ist, weil ...",
      "Es ist notwendig, unser Konsumverhalten zu ändern, um ...",
      "Meiner Meinung nach sollten wir ...",
      "Ein Beispiel dafür ist, dass ...",
      "In Zukunft wird nachhaltiger Konsum wichtiger sein.",
    ],
    studentQuestionsDe: [
      "Wie kann man nachhaltiger konsumieren?",
      "Welche Nachteile haben nachhaltige Alternativen?",
      "Welche Rolle spielen Secondhand, regionale Produkte und Verpackungen?",
      "Wie unterscheiden sich Konsumgewohnheiten in Deutschland und deinem Heimatland?",
      "Welche Maßnahme ist für dich besonders realistisch?",
    ],
    speakingModels: [
      {
        "questionDe": "Wie kann man nachhaltiger konsumieren?",
        "modelAnswerDe": "Man kann nachhaltiger konsumieren, indem man nur kauft, was man wirklich braucht. Außerdem kann man Dinge reparieren und gebraucht kaufen. Beim Essen plane ich meine Einkäufe, damit weniger verdirbt."
      },
      {
        "questionDe": "Welche Nachteile haben nachhaltige Alternativen?",
        "modelAnswerDe": "Nachhaltige Alternativen können teurer oder schwerer zu finden sein. Reparaturen brauchen manchmal Zeit, und gebrauchte Waren sind nicht immer in der passenden Größe verfügbar. Deshalb muss man prüfen, welche Lösung im Alltag möglich ist."
      },
      {
        "questionDe": "Welche Rolle spielen Secondhand, regionale Produkte und Verpackungen?",
        "modelAnswerDe": "Secondhand verlängert die Nutzung von Kleidung und anderen Dingen. Regionale und saisonale Lebensmittel können lange Transportwege vermeiden. Weniger Einwegverpackung hilft außerdem, Müll zu reduzieren."
      },
      {
        "questionDe": "Wie unterscheiden sich Konsumgewohnheiten in Deutschland und deinem Heimatland?",
        "modelAnswerDe": "Ich kenne aus Deutschland Pfandsysteme und viele Angebote für Mülltrennung. In Ghana werden nach meiner Erfahrung manche Dinge lange genutzt und repariert, während Verpackungsmüll ebenfalls ein Problem ist. Die Gewohnheiten unterscheiden sich aber auch innerhalb beider Länder."
      },
      {
        "questionDe": "Welche Maßnahme ist für dich besonders realistisch?",
        "modelAnswerDe": "Für mich ist es besonders realistisch, mit einer Einkaufsliste einzukaufen. So kaufe ich weniger unnötige Lebensmittel und spare Geld. Außerdem möchte ich Kleidung länger tragen, bevor ich etwas Neues kaufe."
      }
    ],
    teacherNotesEn: [
      "Day 24 has no day-specific deep grammar page. The workbook Grammar tab supplies general B1 advantage/disadvantage/opinion training; build the lesson language from the workbook's own dass/weil/um … zu/sollten/einerseits … andererseits frames.",
      "Teil 3 is Eleni's environmental-awareness/recycling text, not a shopping case study.",
      "The workbook displays seven Richtig/Falsch statements, but the current marking contract contains only five reference answers. Students can complete all seven for practice; do not promise that statements 6–7 are reference-scored by the current key.",
      "The old Day 24 listening video is removed in the rendered workbook. Teil 4 is not submitted and the marking contract excludes teil4.",
    ],
    interactionFlow: [
      { phase: "Argument frame", detailEn: "8 min: build one Vorteil, one Nachteil and one opinion with examples." },
      { phase: "Purpose and reason", detailEn: "9 min: connect sustainable actions with weil/dass and um … zu." },
      { phase: "Measure comparison", detailEn: "12 min: compare Secondhand, regional products, low packaging and reduced meat consumption." },
      { phase: "Workbook writing bridge", detailEn: "9 min: outline the response to Paul with a counterargument and concrete examples." },
      { phase: "Marking note", detailEn: "5 min: explain the five-reference-answer grading limitation for the seven-statement reading." },
    ],
    wrapUpTaskDe: "Nenne eine nachhaltige Maßnahme, einen Vorteil und einen Nachteil. Begründe deine Meinung mit weil und formuliere ein Ziel mit um … zu.",
    workbookConnection: workbookConnection(24, [
      { label: "Grammar", detailEn: "No separate deep grammar page. Use the workbook Grammar tab's B1 argument training plus lesson frames with dass/weil, um … zu, sollten and einerseits … andererseits." },
      { label: "Teil 1 · Sprechen", detailEn: "Discuss sustainable consumption across shopping, recycling, energy, transport, business responsibility and individual action; compare measures and choose one important action. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Write an opinion responding to Paul on whether sustainable consumption matters; include benefits, difficulties, concrete examples and a clear conclusion." },
      { label: "Teil 3 · Lesen", detailEn: "Read Eleni's text about environmental education, Sperrmüll, second-hand furniture, Altkleider, glass recycling and hazardous-waste collection. Workbook shows seven Richtig/Falsch statements; current marking contract has five reference answers only." },
      { label: "Teil 4 · Hören", detailEn: "SELF-CHECK/UNSCORED ONLY. The old listening link is removed from the rendered workbook; no live Hören medium is currently available. The marking contract excludes teil4, so do not submit it." },
    ], {
      grammarUrl: null,
      subtitle: "Day 24 has no direct deep-grammar page. Teil 4 is excluded; the current reading key also contains only five reference answers although the workbook shows seven statements.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 24 develops B1 sustainability arguments and requires teachers to distinguish the seven-item workbook reading from the five-answer grading key currently stored in admin.",
      grammarFocusEn: [
        "Use dass and weil clauses for opinion and reason with verb-final order.",
        "um … zu expresses purpose when the subject is the same.",
        "sollten gives recommendations without sounding as absolute as müssen.",
        "einerseits … andererseits supports balanced evaluation of price, convenience and environmental benefit.",
      ],
      modelExamplesDe: [
        "Ich denke, dass nachhaltiger Konsum wichtig ist, weil wir Ressourcen sparen müssen.",
        "Ich kaufe Secondhand, um Kleidung länger zu nutzen.",
        "Einerseits sind Bioprodukte oft teurer, andererseits können sie umweltfreundlicher sein.",
        "Meiner Meinung nach sollten Unternehmen weniger Verpackung verwenden.",
      ],
      commonMistakesEn: [
        "Keeping main-clause order after weil or dass.",
        "Using um … zu when the two clauses have different subjects.",
        "Claiming all seven reading statements are covered by the current reference key; only five reference answers are stored.",
        "Trying to play the removed Day 24 listening link or submitting Teil 4 despite its exclusion.",
      ],
    },
  },
  {
    id: "b1-day-25-online-einkaufen",
    course: "B1",
    day: "Day 25",
    dayNumber: 25,
    assignmentId: "B1-8.25",
    title: "B1 Day 25 · Online einkaufen – Rechte und Risiken",
    topic: "8.25 Online einkaufen – Rechte und Risiken",
    objective: "Students discuss online-shopping rights and risks and write a clear formal complaint requesting an appropriate solution.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was kaufst du häufig online?",
      "Woran erkennt man einen sicheren Online-Shop?",
      "Welche Rechte hat man bei beschädigter Ware?",
      "Welche Bezahlmethode findest du sicher?",
    ],
    keyPhrasesDe: [
      "Das Produkt ist beschädigt angekommen.",
      "Ich möchte die Ware zurückgeben.",
      "Könnten Sie mir bitte Ersatz schicken?",
      "Ich bitte Sie, mir den Kaufpreis zu erstatten.",
      "Das Problem ist, dass ...",
      "Deshalb habe ich die Ware zurückgeschickt.",
    ],
    studentQuestionsDe: [
      "Welche Vorteile hat Online-Shopping?",
      "Welche Risiken gibt es bei Fake-Shops und Datenschutz?",
      "Was sollte man vor einer Bestellung prüfen?",
      "Wie reklamiert man beschädigte Ware höflich?",
      "Wann würdest du Ersatz statt Geld zurück verlangen?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Vorteile hat Online-Shopping?",
        "modelAnswerDe": "Online-Shopping ist bequem, weil ich unabhängig von Öffnungszeiten bestellen kann. Ich kann Preise und Angebote leicht vergleichen. Außerdem finde ich manchmal Produkte, die es in meiner Nähe nicht gibt."
      },
      {
        "questionDe": "Welche Risiken gibt es bei Fake-Shops und Datenschutz?",
        "modelAnswerDe": "Bei Fake-Shops besteht das Risiko, dass ich bezahle und keine Ware bekomme. Persönliche Daten können außerdem missbraucht werden. Deshalb würde ich unbekannte Anbieter sorgfältig prüfen und nicht unnötig viele Daten angeben."
      },
      {
        "questionDe": "Was sollte man vor einer Bestellung prüfen?",
        "modelAnswerDe": "Vor einer Bestellung prüfe ich den Gesamtpreis, die Lieferkosten und die Lieferzeit. Außerdem schaue ich nach Angaben zum Anbieter und zu Rücksendungen. Bewertungen können helfen, sollten aber nicht die einzige Grundlage sein."
      },
      {
        "questionDe": "Wie reklamiert man beschädigte Ware höflich?",
        "modelAnswerDe": "Guten Tag, meine Bestellung ist heute angekommen, leider ist der Artikel beschädigt. Im Anhang finden Sie ein Foto des Schadens. Könnten Sie mir bitte mitteilen, ob ein Ersatz möglich ist?"
      },
      {
        "questionDe": "Wann würdest du Ersatz statt Geld zurück verlangen?",
        "modelAnswerDe": "Ich würde Ersatz verlangen, wenn ich den Artikel weiterhin brauche und nur dieses Exemplar beschädigt ist. Voraussetzung wäre, dass ein einwandfreier Ersatz zeitnah verfügbar ist. Wenn ich kein Vertrauen mehr in das Produkt hätte, würde ich lieber um eine Rückzahlung bitten."
      }
    ],
    teacherNotesEn: [
      "Day 25 has no day-specific deep grammar page; use functional complaint language from the workbook plus the general B1 argument training in the Grammar tab.",
      "For writing, insist on formal register, clear chronology (purchase → damage → return) and one explicit requested solution.",
      "Teil 3 is a separate mixed reading on self-employment, environmental habits and Verbraucherzentralen; it is not an online-shopping-only text.",
      "The old Day 25 listening link is removed in the rendered workbook. The marking contract excludes teil4, so Hören is not submitted or officially scored.",
    ],
    interactionFlow: [
      { phase: "Rights vocabulary", detailEn: "8 min: activate Widerrufsrecht, Rücksendung, Garantie, Ersatz and Erstattung." },
      { phase: "Polite request", detailEn: "9 min: reformulate demands with Könnten Sie …? and Ich bitte Sie, … zu …" },
      { phase: "Complaint chronology", detailEn: "10 min: order purchase, defect, return and desired solution into a coherent complaint." },
      { phase: "Role-play", detailEn: "10 min: customer and support agent negotiate replacement, repair or refund." },
      { phase: "Workbook bridge", detailEn: "7 min: outline the formal letter and preview the separate Verbraucherberatung reading." },
    ],
    wrapUpTaskDe: "Schreibe vier Sätze einer Reklamation: Kauf, Problem, Rücksendung und gewünschte Lösung. Nutze eine höfliche Bitte.",
    workbookConnection: workbookConnection(25, [
      { label: "Grammar", detailEn: "No separate deep grammar page. Functional focus from the workbook: formal complaint sequencing, dass for the problem, deshalb for the result, and polite requests such as Könnten Sie …? / Ich bitte Sie, … zu …" },
      { label: "Teil 1 · Sprechen", detailEn: "Discuss online-shopping advantages, consumer rights, risks, safe shops/payment and what to do with damaged or incorrect goods. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Formal complaint to customer service about a damaged phone: date of purchase, damage, return details, requested replacement/repair/refund and polite request for a quick response." },
      { label: "Teil 3 · Lesen", detailEn: "Scored seven-question mixed reading about a self-employed hairdresser, environmental behavior and German Verbraucherzentralen; submit seven answer letters under Teil 3." },
      { label: "Teil 4 · Hören", detailEn: "SELF-CHECK/UNSCORED ONLY. The old listening link is removed from the rendered workbook and the marking contract excludes teil4. Do not submit it." },
    ], {
      grammarUrl: null,
      subtitle: "Day 25 uses workbook-based functional complaint language rather than a separate deep grammar page. Teil 4 is excluded from scoring/submission.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 25 turns consumer-rights vocabulary into a formal complaint workflow and then shifts to a broader consumer-advice reading.",
      grammarFocusEn: [
        "Use formal Sie-register throughout a customer-service complaint.",
        "dass can introduce the defect/problem; deshalb links the problem to the action taken.",
        "Könnten Sie …? and Ich bitte Sie, … zu … make the requested solution clear and polite.",
        "Keep the timeline explicit: purchase date, defect, return and desired outcome.",
      ],
      modelExamplesDe: [
        "Das Problem ist, dass das Display bei der Lieferung kaputt war.",
        "Deshalb habe ich das Handy am Montag zurückgeschickt.",
        "Könnten Sie mir bitte ein Ersatzgerät schicken?",
        "Ich bitte Sie, mir den Kaufpreis zu erstatten.",
      ],
      commonMistakesEn: [
        "Switching from formal Sie to informal du in the complaint.",
        "Describing the problem without asking for a concrete solution.",
        "Forgetting when/how the item was returned.",
        "Assigning the removed Day 25 listening as an officially scored task even though teil4 is excluded.",
      ],
    },
  },
  {
    id: "b1-day-26-reiseprobleme",
    course: "B1",
    day: "Day 26",
    dayNumber: 26,
    assignmentId: "B1-9.26",
    title: "B1 Day 26 · Reiseprobleme und Lösungen",
    topic: "9.26 Reiseprobleme und Lösungen",
    objective: "Students plan for travel disruptions and respond with conditionals, polite solution language and a coherent informal past-event letter.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welches Reiseproblem hast du schon erlebt?",
      "Was würdest du tun, wenn dein Gepäck verloren geht?",
      "Welche Dokumente sollte man vor einer Reise prüfen?",
      "Warum kann eine Reiseversicherung sinnvoll sein?",
    ],
    keyPhrasesDe: [
      "Wenn unser Flug Verspätung hat, würden wir ...",
      "Falls unser Gepäck verloren geht, sollten wir ...",
      "Wir könnten den Kundenservice kontaktieren.",
      "Können Sie mir bitte weiterhelfen?",
      "Am wichtigsten ist, dass man ruhig bleibt.",
      "Ich würde eine Reiseversicherung abschließen, weil ...",
    ],
    studentQuestionsDe: [
      "Welche Probleme können bei Flug, Zug, Hotel oder Gepäck entstehen?",
      "Welche Lösung passt zu welchem Problem?",
      "Was sollte man vor der Reise vorbereiten?",
      "Wie reagiert man höflich bei einer Reklamation?",
      "Welche Reise würdest du planen und welche Risiken gibt es?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Probleme können bei Flug, Zug, Hotel oder Gepäck entstehen?",
        "modelAnswerDe": "Ein Flug kann ausfallen, und ein Zug kann sich verspäten. Im Hotel kann eine Buchung fehlen oder das Zimmer nicht sauber sein. Außerdem kann Gepäck verloren gehen oder beschädigt ankommen."
      },
      {
        "questionDe": "Welche Lösung passt zu welchem Problem?",
        "modelAnswerDe": "Bei einem ausgefallenen Flug würde ich nach einer alternativen Verbindung fragen. Bei einem schmutzigen Hotelzimmer würde ich um Reinigung oder ein anderes Zimmer bitten. Fehlendes Gepäck würde ich direkt am zuständigen Schalter melden."
      },
      {
        "questionDe": "Was sollte man vor der Reise vorbereiten?",
        "modelAnswerDe": "Vor der Reise sollte man Buchungen, Ausweisdokumente und notwendige Reiseinformationen prüfen. Ich würde wichtige Unterlagen auch offline speichern. Außerdem plane ich genügend Zeit und einen kleinen finanziellen Puffer ein."
      },
      {
        "questionDe": "Wie reagiert man höflich bei einer Reklamation?",
        "modelAnswerDe": "Guten Tag, ich habe ein ruhiges Zimmer gebucht, aber neben meinem Zimmer finden laute Bauarbeiten statt. Könnten Sie mir bitte ein anderes Zimmer anbieten? Ich wäre Ihnen für eine schnelle Lösung dankbar."
      },
      {
        "questionDe": "Welche Reise würdest du planen und welche Risiken gibt es?",
        "modelAnswerDe": "Ich würde eine kurze Städtereise mit dem Zug planen. Mögliche Risiken sind Verspätungen, schlechtes Wetter oder eine fehlerhafte Hotelbuchung. Deshalb würde ich Verbindungen und Buchungen vorher prüfen und Alternativen bereithalten."
      }
    ],
    teacherNotesEn: [
      "Day 26 has no day-specific deep grammar page. Use the workbook's functional conditionals with wenn/falls, Konjunktiv II with würden/könnten and advice with sollten.",
      "The informal letter asks for destination/transport, one concrete problem and how it was solved; use past narration naturally rather than turning it into a formal complaint.",
      "Teil 3 is the separate ‘Urlaubsland Deutschland’ reading. The workbook shows seven questions, but the current grading key has six reference answers and its sequence omits the current workbook's second mountain question.",
      "The old Day 26 listening link is removed and the marking contract excludes teil4; do not submit Hören.",
    ],
    interactionFlow: [
      { phase: "Problem-solution match", detailEn: "8 min: match delay, lost luggage, missing reservation, illness and documents to realistic solutions." },
      { phase: "Conditional practice", detailEn: "10 min: build wenn/falls clauses with würden, könnten and sollten." },
      { phase: "Service language", detailEn: "8 min: practise asking for help, rebooking, refund and emergency information politely." },
      { phase: "Travel plan", detailEn: "11 min: pairs plan destination, transport, two risks and responses." },
      { phase: "Workbook bridge", detailEn: "8 min: outline the Max/Lisa letter and explain the six-answer-key limitation in the seven-question reading." },
    ],
    wrapUpTaskDe: "Beschreibe ein Reiseproblem und zwei Lösungen. Nutze einmal wenn oder falls, einmal könnten/würden und einmal sollten.",
    workbookConnection: workbookConnection(26, [
      { label: "Grammar", detailEn: "No separate deep grammar page. Functional focus from the workbook: wenn/falls conditions, würden/könnten for hypothetical solutions, sollten for advice, dass for priorities and weil for reasons." },
      { label: "Teil 1 · Sprechen", detailEn: "Plan a trip and discuss possible delays, lost luggage, hotel/reservation issues, missing documents, illness and practical solutions. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Informal letter to Max/Lisa about a trip: destination and transport, what went wrong, how you solved it and how the trip ended." },
      { label: "Teil 3 · Lesen", detailEn: "Read ‘Urlaubsland Deutschland’. Workbook currently shows seven questions, but the grading contract stores six reference answers; the current workbook's question 2 about a Bavarian mountain is not represented in that key. Complete it for practice, but do not promise seven reference-scored answers." },
      { label: "Teil 4 · Hören", detailEn: "SELF-CHECK/UNSCORED ONLY. The old listening link is removed and the marking contract excludes teil4. Do not submit Hören." },
    ], {
      grammarUrl: null,
      subtitle: "Day 26 has no direct deep grammar page. Teil 4 is excluded, and the current reading key contains six reference answers for a seven-question workbook task.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 26 teaches conditional problem solving for travel and requires care with a current six-key/seven-question reading mismatch.",
      grammarFocusEn: [
        "wenn and falls introduce conditions with verb-final order.",
        "würden and könnten express hypothetical or polite solutions.",
        "sollten gives practical advice; weil explains why a preparation step is useful.",
        "Past narration in the informal letter should make the event sequence easy to follow.",
      ],
      modelExamplesDe: [
        "Wenn unser Flug ausfällt, würden wir den nächsten Flug buchen.",
        "Falls mein Gepäck nicht ankommt, könnte ich sofort den Schalter kontaktieren.",
        "Man sollte wichtige Dokumente vor der Reise kontrollieren.",
        "Ich habe den Kundenservice angerufen, weil mein Koffer verloren gegangen ist.",
      ],
      commonMistakesEn: [
        "Using main-clause word order after wenn/falls.",
        "Using würden plus a conjugated verb instead of würden + infinitive.",
        "Writing the Max/Lisa task in formal Sie-register.",
        "Claiming the current seven-question reading has seven reference answers; the grading key stores only six and does not represent workbook question 2.",
      ],
    },
  },
  {
    id: "b1-day-27-umweltfreundlich-alltag",
    course: "B1",
    day: "Day 27",
    dayNumber: 27,
    assignmentId: "B1-10.27",
    title: "B1 Day 27 · Umweltfreundlich im Alltag",
    topic: "10.27 Umweltfreundlich im Alltag",
    objective: "Students explain practical environmental actions with method, reason and condition structures and evaluate which changes are realistic in everyday life.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was machst du schon umweltfreundlich?",
      "Welche Änderung fällt dir im Alltag schwer?",
      "Wie kann man zu Hause Energie sparen?",
      "Welche Verkehrsmittel sind in deinem Alltag realistisch?",
    ],
    keyPhrasesDe: [
      "Zu Hause kann man umweltfreundlicher leben, indem man ...",
      "Beim Einkaufen ist es sinnvoll, ...",
      "Unterwegs könnte man öfter ...",
      "Für mich ist schwierig, dass ...",
      "Wenn man kleine Schritte macht, ...",
      "Ich glaube, dass jeder etwas tun kann.",
    ],
    studentQuestionsDe: [
      "Wie kann man zu Hause Energie und Wasser sparen?",
      "Wie kann man nachhaltiger einkaufen?",
      "Welche Mobilitätslösungen sind realistisch?",
      "Welche Maßnahme kostet wenig oder nichts?",
      "Was sollten Schule, Arbeit oder Familie zusätzlich tun?",
    ],
    speakingModels: [
      {
        "questionDe": "Wie kann man zu Hause Energie und Wasser sparen?",
        "modelAnswerDe": "Zu Hause kann man Licht ausschalten, wenn es nicht gebraucht wird, und Geräte nicht unnötig laufen lassen. Wasser spart man zum Beispiel durch kürzeres Duschen. Einen tropfenden Wasserhahn sollte man reparieren lassen."
      },
      {
        "questionDe": "Wie kann man nachhaltiger einkaufen?",
        "modelAnswerDe": "Man kann mit einer Einkaufsliste einkaufen und langlebige Produkte wählen. Gebrauchte Kleidung ist ebenfalls eine Möglichkeit. Bei Lebensmitteln hilft es, nur die Mengen zu kaufen, die man verbrauchen kann."
      },
      {
        "questionDe": "Welche Mobilitätslösungen sind realistisch?",
        "modelAnswerDe": "Für kurze Wege sind Gehen und Radfahren realistisch, wenn die Wege sicher sind. Für längere Strecken kommen Busse oder Fahrgemeinschaften infrage. Welche Lösung passt, hängt vom Wohnort und vom Angebot ab."
      },
      {
        "questionDe": "Welche Maßnahme kostet wenig oder nichts?",
        "modelAnswerDe": "Das Licht in leeren Räumen auszuschalten kostet nichts. Auch Lebensmittelreste zu verwerten kann Geld sparen. Ich würde mit solchen einfachen Gewohnheiten anfangen."
      },
      {
        "questionDe": "Was sollten Schule, Arbeit oder Familie zusätzlich tun?",
        "modelAnswerDe": "Schulen und Betriebe könnten Abfall vermeiden und Energiesparregeln gemeinsam festlegen. In der Familie kann man Einkäufe und Fahrten besser planen. Wichtig ist, dass alle mitmachen und die Regeln im Alltag umsetzbar sind."
      }
    ],
    teacherNotesEn: [
      "Day 27 has no day-specific deep grammar page; use the workbook Grammar tab's general B1 argument training and the lesson's own indem/dass/wenn/könnte frames.",
      "Teil 3 is a coherent seven-question environment text on recycling, energy, transport and consumption.",
      "Critical operational mismatch: the workbook copy calls Hören self-check and the old video is removed from the rendered page, but the current marking contract expects teil4 and contains five reference answers.",
      "Do not invent audio or fabricated answers. Tell teachers that Teil 4 is currently blocked by a source mismatch: it is score-required by the contract but has no live medium in the workbook. This must be resolved before assigning/scoring the listening part.",
    ],
    interactionFlow: [
      { phase: "Method language", detailEn: "8 min: build environmental actions with indem man …" },
      { phase: "Reason and condition", detailEn: "9 min: add dass/when clauses and practical reasons." },
      { phase: "Everyday plan", detailEn: "12 min: groups plan realistic changes for home, shopping, mobility and school/work." },
      { phase: "Opinion rehearsal", detailEn: "9 min: respond to Ahmed with examples, difficulty and conclusion." },
      { phase: "Contract warning", detailEn: "6 min: flag the unresolved Teil 4 scoring/media contradiction before assigning the workbook." },
    ],
    wrapUpTaskDe: "Nenne drei umweltfreundliche Maßnahmen. Nutze indem man, einen dass-Satz und eine realistische Schwierigkeit.",
    workbookConnection: workbookConnection(27, [
      { label: "Grammar", detailEn: "No separate deep grammar page. Use B1 argument training plus workbook language with indem for method, dass for statements/opinions, wenn for conditions and könnte for realistic suggestions." },
      { label: "Teil 1 · Sprechen", detailEn: "Plan practical environmental changes at home, while shopping, in transport and at school/work; compare what is easy, difficult and realistic. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Opinion response to Ahmed on whether everyone can live environmentally friendly; include importance, everyday examples, difficulties and a clear conclusion." },
      { label: "Teil 3 · Lesen", detailEn: "Scored seven-question reading ‘Die Umwelt schützen: Was können wir tun?’ on recycling, energy, renewable sources, transport, consumption and individual responsibility." },
      { label: "Teil 4 · Hören", detailEn: "BLOCKING MISMATCH: the marking contract expects/scored teil4 with five reference answers, but the current workbook labels Hören self-check and the old video is removed, so there is no live listening medium. Do not invent or assign fabricated audio answers; resolve the assessment source before scoring Teil 4." },
    ], {
      grammarUrl: null,
      subtitle: "Day 27 has an unresolved Teil 4 source mismatch: grading expects five Hören answers, while the rendered workbook has no live listening medium. Do not invent a task.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 27 has coherent environmental production and reading content, but its listening assessment cannot currently be delivered honestly because the grading contract and rendered workbook disagree.",
      grammarFocusEn: [
        "indem + subordinate clause explains how an environmental action is carried out.",
        "dass clauses state opinions or difficulties with verb-final order.",
        "wenn clauses describe conditions for environmentally friendly behavior.",
        "könnte makes suggestions realistic rather than absolute.",
      ],
      modelExamplesDe: [
        "Man kann Energie sparen, indem man Geräte ganz ausschaltet.",
        "Ich glaube, dass jeder kleine Schritte machen kann.",
        "Wenn ich kurze Wege habe, fahre ich mit dem Fahrrad.",
        "Unterwegs könnte man öfter öffentliche Verkehrsmittel benutzen.",
      ],
      commonMistakesEn: [
        "Using indem with main-clause word order.",
        "Giving only environmental slogans without a concrete action or example.",
        "Calling the missing Day 27 listening safely self-check when the grading contract still expects teil4.",
        "Inventing five listening answers or an audio source simply because the marking contract contains five reference answers.",
      ],
    },
  },
  {
    id: "b1-day-28-klimafreundlich-leben",
    course: "B1",
    day: "Day 28",
    dayNumber: 28,
    assignmentId: "B1-10.28",
    title: "B1 Day 28 · Klimafreundlich leben",
    topic: "10.28 Klimafreundlich leben",
    objective: "Students present realistic climate-friendly actions, weigh advantages and obstacles and connect individual choices to the situation in their country.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welche Klimaschutzmaßnahme ist für dich am einfachsten?",
      "Welche Maßnahme ist in deinem Land besonders schwierig?",
      "Wie kann man beim Verkehr CO₂ sparen?",
      "Was können Politik und Einzelne jeweils tun?",
    ],
    keyPhrasesDe: [
      "In meinem Land kann man klimafreundlich leben, indem man ...",
      "Ein Vorteil ist, dass ...",
      "Ein Nachteil ist jedoch, dass ...",
      "Für viele Menschen ist es schwierig, weil ...",
      "Trotzdem kann jeder einen kleinen Beitrag leisten.",
      "Zusammenfassend denke ich, dass ...",
    ],
    studentQuestionsDe: [
      "Welche Maßnahmen helfen bei Energie, Verkehr, Konsum und Ernährung?",
      "Welche Vorteile und Nachteile haben diese Maßnahmen?",
      "Welche Hindernisse gibt es auf dem Land oder bei wenig Geld?",
      "Wie ist die Situation in deinem Land?",
      "Welche Maßnahme würdest du persönlich zuerst umsetzen?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Maßnahmen helfen bei Energie, Verkehr, Konsum und Ernährung?",
        "modelAnswerDe": "Bei Energie helfen sparsame Geräte und das Ausschalten unnötiger Beleuchtung. Im Verkehr kann man öfter Bus fahren oder Wege gemeinsam zurücklegen. Beim Konsum helfen Reparieren und Secondhand, bei der Ernährung weniger Lebensmittelverschwendung und häufiger pflanzliche Mahlzeiten."
      },
      {
        "questionDe": "Welche Vorteile und Nachteile haben diese Maßnahmen?",
        "modelAnswerDe": "Viele Maßnahmen sparen Ressourcen und auf Dauer auch Geld. Busfahren oder Reparieren kann aber mehr Zeit brauchen. Manche Anschaffungen sind zunächst teuer, deshalb sollte man Nutzen und Kosten vergleichen."
      },
      {
        "questionDe": "Welche Hindernisse gibt es auf dem Land oder bei wenig Geld?",
        "modelAnswerDe": "Auf dem Land fahren Busse manchmal selten und die Wege sind lang. Wer wenig Geld hat, kann nicht sofort neue sparsame Geräte kaufen. Deshalb braucht man auch günstige Lösungen und bessere öffentliche Angebote."
      },
      {
        "questionDe": "Wie ist die Situation in deinem Land?",
        "modelAnswerDe": "In Ghana hängt vieles vom Wohnort und vom Einkommen ab. Nach meiner Erfahrung werden Gegenstände oft repariert und lange genutzt. Gleichzeitig können unzuverlässige Verkehrsangebote und fehlende Möglichkeiten zur Mülltrennung nachhaltiges Verhalten erschweren."
      },
      {
        "questionDe": "Welche Maßnahme würdest du persönlich zuerst umsetzen?",
        "modelAnswerDe": "Ich würde zuerst meine Lebensmitteleinkäufe besser planen. Mit einer Einkaufsliste und kleineren Mengen werfe ich weniger weg. Das ist sofort möglich und spart gleichzeitig Geld."
      }
    ],
    teacherNotesEn: [
      "Day 28 has no day-specific deep grammar page. Use the workbook's general B1 argument training and the lesson's indem/dass/weil/trotzdem contrast-and-reason frames.",
      "Teil 3 is a separate seven-question reading about water as a scarce resource, water saving, pollution and government responsibility.",
      "Critical operational mismatch: the workbook calls Hören self-check and the old video is removed from the rendered page, but the current marking contract expects teil4 and stores five reference answers.",
      "Do not fabricate a listening task. Treat Teil 4 as an unresolved assessment-source blocker until a live medium/question set or a corrected grading contract is provided.",
    ],
    interactionFlow: [
      { phase: "Climate-action map", detailEn: "8 min: sort actions into energy, transport, consumption, food, recycling and education." },
      { phase: "Language links", detailEn: "9 min: connect methods with indem, reasons with weil and obstacles with dass/trotzdem." },
      { phase: "Country comparison", detailEn: "11 min: discuss what is realistic in the learner's country and why." },
      { phase: "Opinion rehearsal", detailEn: "10 min: prepare a structured answer with measures, obstacles and conclusion." },
      { phase: "Contract warning", detailEn: "6 min: flag the unresolved scored-Teil4/no-media contradiction before assignment." },
    ],
    wrapUpTaskDe: "Erkläre eine klimafreundliche Maßnahme, einen Vorteil und ein Hindernis. Nutze indem, weil und trotzdem.",
    workbookConnection: workbookConnection(28, [
      { label: "Grammar", detailEn: "No separate deep grammar page. Use B1 argument training plus workbook language with indem for method, dass/weil for explanation, trotzdem for concession and balanced advantage/disadvantage structures." },
      { label: "Teil 1 · Sprechen", detailEn: "Explain how people can live climate-friendly in your country across energy, transport, consumption, food, recycling and education; discuss advantages, disadvantages and one realistic personal action. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Opinion text on whether everyone can live climate-friendly; include everyday examples, obstacles such as rural transport/money/habits, justification and conclusion." },
      { label: "Teil 3 · Lesen", detailEn: "Scored seven-question reading ‘Bewusst Leben: Wasser als kostbare Ressource’ on scarcity, water use, saving measures, pollution, policy and public education." },
      { label: "Teil 4 · Hören", detailEn: "BLOCKING MISMATCH: the marking contract expects/scored teil4 with five reference answers, but the current workbook labels Hören self-check and the old video is removed, leaving no live listening medium. Do not invent a task; resolve the source/contract mismatch before scoring." },
    ], {
      grammarUrl: null,
      subtitle: "Day 28 has an unresolved Teil 4 source mismatch: grading expects five Hören answers, but the rendered workbook currently has no live listening medium.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 28 completes B1 with climate-action argumentation and a water-resource reading, while the listening assessment remains blocked by a contract-versus-media mismatch.",
      grammarFocusEn: [
        "indem explains the method used to reduce environmental impact.",
        "weil gives a reason and sends the verb to the end.",
        "dass clauses support opinions and evaluations with verb-final order.",
        "trotzdem introduces a main-clause concession and is followed by the conjugated verb.",
      ],
      modelExamplesDe: [
        "Man kann CO₂ sparen, indem man öfter öffentliche Verkehrsmittel nutzt.",
        "Für viele Menschen ist das schwierig, weil auf dem Land wenige Busse fahren.",
        "Ich denke, dass kleine Veränderungen trotzdem wichtig sind.",
        "Trotzdem kann jeder einen persönlichen Beitrag leisten.",
      ],
      commonMistakesEn: [
        "Using indem or weil with main-clause word order.",
        "Using trotzdem like a subordinate conjunction and putting the verb at the end.",
        "Talking only about abstract climate policy without concrete everyday measures.",
        "Inventing a Day 28 listening task merely because the grading contract currently contains five teil4 answers.",
      ],
    },
  },
];

const byAssignmentId = Object.fromEntries(
  b1WorkbookAlignedSlidesDays21To28.map((slide) => [slide.assignmentId, slide]),
);

export function getB1WorkbookAlignedSlideDay21To28(assignmentId) {
  return byAssignmentId[String(assignmentId || "").trim().toUpperCase()] || null;
}
