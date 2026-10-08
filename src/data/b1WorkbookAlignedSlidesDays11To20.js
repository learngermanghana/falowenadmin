const lessonRoute = (day, view) => `/campus/course/lesson/B1/${day}?view=${view}`;

const standardConnection = (day, parts, options = {}) => ({
  grammarUrl: options.grammarUrl === undefined ? lessonRoute(day, "grammar") : options.grammarUrl,
  workbookUrl: lessonRoute(day, "workbook"),
  ...(options.subtitle ? { subtitle: options.subtitle } : {}),
  parts,
});

export const b1WorkbookAlignedSlidesDays11To20 = [
  {
    id: "b1-day-11-teamspiele",
    course: "B1",
    day: "Day 11",
    dayNumber: 11,
    assignmentId: "B1-4.11",
    title: "B1 Day 11 · Teamspiele und kooperative Aktivitäten",
    topic: "4.11 Teamspiele und kooperative Aktivitäten",
    objective: "Students describe reciprocal teamwork clearly with einander and preposition + -einander forms, then use that language in a structured team-cooperation presentation and opinion text.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was macht ein gutes Team aus?",
      "Wann musstest du zuletzt mit anderen zusammenarbeiten?",
      "Was kann in einem Team zu Konflikten führen?",
      "Welches Teamspiel findest du besonders sinnvoll? Warum?",
    ],
    keyPhrasesDe: [
      "Die Teammitglieder helfen einander.",
      "Wir arbeiten gut miteinander.",
      "Man kann viel voneinander lernen.",
      "Wir müssen uns aufeinander verlassen können.",
      "Gute Kollegen sind füreinander da.",
      "Konflikte entstehen, wenn Menschen gegeneinander statt miteinander arbeiten.",
    ],
    studentQuestionsDe: [
      "Warum sind Teamspiele für Lernen und persönliche Entwicklung wichtig?",
      "Welche Vorteile hat gute Teamarbeit?",
      "Welche Schwierigkeiten können entstehen?",
      "Wie kann man Konflikte im Team lösen?",
      "Welche persönliche Erfahrung hast du mit Teamarbeit gemacht?",
    ],
    speakingModels: [
      {
        "questionDe": "Warum sind Teamspiele für Lernen und persönliche Entwicklung wichtig?",
        "modelAnswerDe": "Teamspiele sind wichtig, weil man dabei Zusammenarbeit und Rücksicht lernt. Man muss Regeln beachten und auf andere reagieren. Außerdem lernt man, mit Erfolgen und Niederlagen umzugehen."
      },
      {
        "questionDe": "Welche Vorteile hat gute Teamarbeit?",
        "modelAnswerDe": "Bei guter Teamarbeit können sich die Mitglieder gegenseitig unterstützen. Jeder bringt andere Stärken mit, sodass schwierige Aufgaben leichter werden. Außerdem entstehen gemeinsam oft mehr Ideen."
      },
      {
        "questionDe": "Welche Schwierigkeiten können entstehen?",
        "modelAnswerDe": "Schwierigkeiten entstehen, wenn Aufgaben unfair verteilt sind oder niemand zuhört. Unterschiedliche Meinungen können ebenfalls zu Streit führen. Deshalb sollte das Team früh klare Regeln vereinbaren."
      },
      {
        "questionDe": "Wie kann man Konflikte im Team lösen?",
        "modelAnswerDe": "Zuerst sollte jeder seine Sicht ruhig erklären dürfen. Danach kann das Team nach einer Lösung suchen, die für alle akzeptabel ist. Klare Aufgaben und gemeinsame Regeln helfen, neue Konflikte zu vermeiden."
      },
      {
        "questionDe": "Welche persönliche Erfahrung hast du mit Teamarbeit gemacht?",
        "modelAnswerDe": "Ich habe einmal mit drei Mitschülern eine Präsentation vorbereitet. Am Anfang war unklar, wer welche Aufgabe übernimmt. Nachdem wir die Arbeit verteilt hatten, konnten wir gut zusammenarbeiten und pünktlich fertig werden."
      }
    ],
    teacherNotesEn: [
      "Teach the actual reciprocal-language focus: einander plus miteinander, füreinander, voneinander, aufeinander and gegeneinander.",
      "Contrast sich with explicit reciprocal meaning: Die Spieler begrüßen sich can be reciprocal, but einander removes ambiguity.",
      "Keep subordinate-clause word order visible when students justify teamwork with weil, wenn and obwohl.",
      "Use the speaking task as the main production route: benefits → challenges → one concrete teamwork example → solution.",
      "Keep the reading/listening comparison of traditional and digital games separate from the grammar production target.",
    ],
    interactionFlow: [
      { phase: "Reciprocal activation", detailEn: "6 min: students complete team sentences with einander / miteinander / voneinander / aufeinander." },
      { phase: "Meaning contrast", detailEn: "9 min: compare sich versus einander in short team situations." },
      { phase: "Teamwork reasons", detailEn: "10 min: build weil/wenn/obwohl sentences about cooperation and conflict." },
      { phase: "Speaking rehearsal", detailEn: "12 min: 90-second answer with benefits, challenge, solution and personal example." },
      { phase: "Workbook bridge", detailEn: "8 min: plan the work-cooperation opinion text and preview the traditional/digital-games comprehension vocabulary." },
    ],
    wrapUpTaskDe: "Erkläre in 5 Sätzen, was ein gutes Team braucht. Nutze mindestens drei verschiedene Formen mit -einander.",
    workbookConnection: standardConnection(11, [
      { label: "Grammar", detailEn: "Reciprocal expressions: einander, miteinander, füreinander, voneinander, aufeinander and gegeneinander; distinguish reciprocal meaning from reflexive sich and keep verb-final order in subordinate clauses." },
      { label: "Teil 1 · Sprechen", detailEn: "Discuss whether team games and cooperative activities are important for learning and personal development. Give benefits, challenges and one example of successful teamwork. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Write an 80–100 word opinion on whether team cooperation is important in modern working life; respond to Markus, give benefits, one challenge, a solution and an example." },
      { label: "Teil 3 · Lesen", detailEn: "Separate games-comprehension task comparing earlier outdoor/traditional games with computer games, including strategic thinking, addiction risk, social skills and balance." },
      { label: "Teil 4 · Hören", detailEn: "Separate listening about why people play, adult board games, the rise of digital games and the social/physical benefits of traditional games." },
    ]),
    teacherSupport: {
      lessonOverviewEn: "Day 11 teaches students to describe genuinely reciprocal team relationships rather than generic cooperation vocabulary. The production work focuses on teamwork, while Lesen and Hören broaden the chapter into traditional versus digital games.",
      grammarFocusEn: [
        "einander means each other / one another and makes reciprocal meaning explicit.",
        "Preposition + einander forms are lexical units: miteinander, füreinander, voneinander, aufeinander, gegeneinander.",
        "With verbs such as sich auf jemanden verlassen, the reciprocal form is sich aufeinander verlassen.",
        "In weil/wenn/obwohl clauses, the conjugated verb moves to the end.",
      ],
      modelExamplesDe: [
        "Die Teammitglieder helfen einander und hören einander zu.",
        "Wir lernen voneinander, weil jeder andere Stärken hat.",
        "Ein gutes Team funktioniert, wenn man sich aufeinander verlassen kann.",
        "Obwohl es manchmal Konflikte gibt, sprechen wir respektvoll miteinander.",
      ],
      commonMistakesEn: [
        "Using miteinander where the verb needs another preposition, for example wir lernen miteinander instead of wir lernen voneinander for learning from each other.",
        "Dropping sich in sich aufeinander verlassen.",
        "Combining redundant reciprocal markers such as helfen sich gegenseitig miteinander.",
        "Keeping main-clause word order after weil or wenn.",
      ],
    },
  },
  {
    id: "b1-day-12-abenteuer-in-der-natur",
    course: "B1",
    day: "Day 12",
    dayNumber: 12,
    assignmentId: "B1-4.12",
    title: "B1 Day 12 · Abenteuer in der Natur",
    topic: "4.12 Abenteuer in der Natur",
    objective: "Students tell a completed nature adventure as a clear timeline using Perfekt, background Präteritum and temporal connectors, then transfer the story into speaking and an informal letter.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welches Naturerlebnis ist dir besonders in Erinnerung geblieben?",
      "Warst du schon einmal wandern, campen oder klettern?",
      "Welche Schwierigkeiten können bei einem Naturabenteuer entstehen?",
      "Was sollte man vor einem Abenteuer vorbereiten?",
    ],
    keyPhrasesDe: [
      "Als wir ankamen, war ...",
      "Nachdem wir das Zelt aufgebaut hatten, ...",
      "Bevor wir weitergingen, ...",
      "Während wir gewandert sind, ...",
      "Obwohl es geregnet hat, sind wir weitergegangen.",
      "Am Ende habe ich gelernt, dass ...",
    ],
    studentQuestionsDe: [
      "Wo und wann war dein Abenteuer?",
      "Mit wem warst du unterwegs?",
      "Was ist zuerst, danach und am Ende passiert?",
      "Welche Schwierigkeit gab es und wie hast du sie gelöst?",
      "Was hast du aus dem Erlebnis gelernt?",
    ],
    speakingModels: [
      {
        "questionDe": "Wo und wann war dein Abenteuer?",
        "modelAnswerDe": "Mein Abenteuer war eine Wanderung in den Bergen im letzten Sommer. Wir waren einen ganzen Tag unterwegs. Besonders aufregend war es, als plötzlich dichter Nebel kam."
      },
      {
        "questionDe": "Mit wem warst du unterwegs?",
        "modelAnswerDe": "Ich war mit zwei Freunden unterwegs. Einer von ihnen kannte die Strecke schon. Wir hatten gemeinsam Essen, Wasser und Regenjacken eingepackt."
      },
      {
        "questionDe": "Was ist zuerst, danach und am Ende passiert?",
        "modelAnswerDe": "Zuerst sind wir früh am Morgen losgegangen. Danach haben wir eine Pause an einem Aussichtspunkt gemacht. Am Ende sind wir wegen des Nebels auf demselben Weg zurückgekehrt."
      },
      {
        "questionDe": "Welche Schwierigkeit gab es und wie hast du sie gelöst?",
        "modelAnswerDe": "Als Nebel aufkam, konnten wir den Weg schlechter erkennen. Wir blieben zusammen und kehrten um, statt weiterzugehen. Zum Glück erreichten wir den Ausgangspunkt noch vor Einbruch der Dunkelheit."
      },
      {
        "questionDe": "Was hast du aus dem Erlebnis gelernt?",
        "modelAnswerDe": "Ich habe gelernt, dass gute Vorbereitung sehr wichtig ist. Man sollte das Wetter prüfen und seine Grenzen kennen. Außerdem ist es besser, eine Tour abzubrechen, als ein unnötiges Risiko einzugehen."
      }
    ],
    teacherNotesEn: [
      "Teach the actual timeline logic: Perfekt for main completed actions and Präteritum especially with war/hatte for background.",
      "Use als for a one-time past situation and temporal connectors nachdem, bevor and während to order events.",
      "Require one reason or contrast with weil/obwohl so the story becomes B1 rather than a list of past-tense sentences.",
      "Prepare the exact informal-letter transfer to Felix: place, two key experiences, one difficulty, solution and lesson learned.",
      "Lesen asks what adventure means more broadly; Hören is a mountain-adventure report and is submitted.",
    ],
    interactionFlow: [
      { phase: "Timeline sort", detailEn: "7 min: order five adventure events from beginning to end." },
      { phase: "Past-tense contrast", detailEn: "10 min: choose Perfekt for actions and war/hatte Präteritum for background." },
      { phase: "Connector ladder", detailEn: "10 min: connect events with als, nachdem, bevor, während and obwohl." },
      { phase: "Story rehearsal", detailEn: "12 min: tell the adventure in 6–8 linked sentences." },
      { phase: "Workbook bridge", detailEn: "7 min: convert the spoken timeline into the informal Felix letter." },
    ],
    wrapUpTaskDe: "Erzähle dein Abenteuer in 6 Sätzen. Nutze Perfekt, mindestens einmal war/hatte und zwei Zeitkonnektoren.",
    workbookConnection: standardConnection(12, [
      { label: "Grammar", detailEn: "Past-story sequencing: Perfekt for main completed events; Präteritum especially war/hatte for background; als, nachdem, bevor and während for sequence; weil/obwohl for reason or contrast." },
      { label: "Teil 1 · Sprechen", detailEn: "Give a short B1 presentation about your most impressive nature adventure: place, environment, events, challenge, solution, lesson and a brief home-country perspective. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Write an informal letter to Felix about a recent adventure: where it happened, two important experiences, one difficulty, how you solved it and what you learned." },
      { label: "Teil 3 · Lesen", detailEn: "Read ‘Was bedeutet Abenteuer?’ about breaking routine, unknown experiences, risks, financial uncertainty and everyday forms of adventure." },
      { label: "Teil 4 · Hören", detailEn: "Submitted mountain-adventure listening: reason for going alone, first-day goal, animals seen, weather difficulty and feelings after returning." },
    ]),
    teacherSupport: {
      lessonOverviewEn: "Day 12 moves B1 learners from isolated Perfekt sentences to coherent storytelling. Temporal connectors organize the adventure, while background Präteritum and contrast clauses make the narrative more natural.",
      grammarFocusEn: [
        "Perfekt carries the main completed actions in everyday spoken narration.",
        "war and hatte are high-frequency Präteritum forms for background states and possession.",
        "als introduces a one-time past situation; nachdem/bevor/während organize sequence and overlap.",
        "Subordinate clauses send the conjugated verb to the end.",
      ],
      modelExamplesDe: [
        "Als wir ankamen, war das Wetter noch schön.",
        "Nachdem wir das Zelt aufgebaut hatten, haben wir gegessen.",
        "Während wir gewandert sind, hat es plötzlich angefangen zu regnen.",
        "Obwohl der Weg schwierig war, sind wir weitergegangen.",
      ],
      commonMistakesEn: [
        "Using wenn instead of als for a single completed past event.",
        "Putting the conjugated verb in position 2 inside nachdem/obwohl clauses.",
        "Mixing the event order so the listener cannot follow the story.",
        "Writing the Felix letter without the required difficulty and solution.",
      ],
    },
  },
  {
    id: "b1-day-13-eigene-filmkritik",
    course: "B1",
    day: "Day 13",
    dayNumber: 13,
    assignmentId: "B1-4.13",
    title: "B1 Day 13 · Eigene Filmkritik schreiben",
    topic: "4.13 Eigene Filmkritik schreiben",
    objective: "Students separate neutral film facts from personal evaluation, use passive forms for production information and justify a clear recommendation.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welchen Film hast du zuletzt gesehen?",
      "Was macht einen Film spannend?",
      "Welche Rolle spielen Musik und Schauspiel?",
      "Empfiehlst du lieber spannende oder ruhige Filme? Warum?",
    ],
    keyPhrasesDe: [
      "Der Film handelt von ...",
      "Der Film wurde in ... gedreht.",
      "Er wurde ... veröffentlicht.",
      "Ich finde, dass die Handlung ... ist.",
      "Obwohl der Film ..., würde ich ihn empfehlen.",
      "Besonders überzeugend fand ich ...",
    ],
    studentQuestionsDe: [
      "Worum geht es im Film?",
      "Wie bewertest du Schauspiel, Musik und Atmosphäre?",
      "Welche Stärke und welche Schwäche hat der Film?",
      "Welche Produktionsinformation kannst du im Passiv nennen?",
      "Würdest du den Film empfehlen? Begründe deine Antwort.",
    ],
    speakingModels: [
      {
        "questionDe": "Worum geht es im Film?",
        "modelAnswerDe": "In meinem Filmbeispiel geht es um eine junge Frau, die für ihre Ausbildung in eine fremde Stadt zieht. Am Anfang fühlt sie sich allein. Durch neue Freundschaften wird sie selbstständiger und findet ihren Weg."
      },
      {
        "questionDe": "Wie bewertest du Schauspiel, Musik und Atmosphäre?",
        "modelAnswerDe": "Die Schauspieler wirken glaubwürdig, besonders in den ruhigen Gesprächen. Die Musik passt gut zu den Gefühlen der Hauptfigur. Dadurch entsteht eine nachdenkliche, aber hoffnungsvolle Atmosphäre."
      },
      {
        "questionDe": "Welche Stärke und welche Schwäche hat der Film?",
        "modelAnswerDe": "Eine Stärke ist die glaubwürdige Entwicklung der Hauptfigur. Man versteht gut, warum sie bestimmte Entscheidungen trifft. Eine Schwäche ist, dass einige Szenen in der Mitte etwas zu lang sind."
      },
      {
        "questionDe": "Welche Produktionsinformation kannst du im Passiv nennen?",
        "modelAnswerDe": "Für mein erfundenes Filmbeispiel würde ich sagen: Der Film wurde in einer kleinen Stadt gedreht. Die Hauptrolle wurde von einer jungen Schauspielerin gespielt. Die Musik wurde eigens für den Film komponiert."
      },
      {
        "questionDe": "Würdest du den Film empfehlen? Begründe deine Antwort.",
        "modelAnswerDe": "Ja, ich würde den Film Menschen empfehlen, die Geschichten über Freundschaft und Neuanfänge mögen. Die Figuren sind glaubwürdig und die Handlung regt zum Nachdenken an. Wer viel Action erwartet, findet ihn vielleicht zu ruhig."
      }
    ],
    teacherNotesEn: [
      "Use Passiv for production facts: wurde gedreht / wurde veröffentlicht, not for every sentence in the review.",
      "Separate neutral plot/production information from evaluation with ich finde, dass / besonders gut fand ich.",
      "Add obwohl for a balanced judgement and würde + Infinitiv for a recommendation.",
      "The writing assignment is not the same as the speaking review: it asks whether exciting films are better than quiet films.",
      "Lesen is the review ‘Die Nacht des Unbekannten’; Hören focuses on how tension is created in films and is submitted.",
    ],
    interactionFlow: [
      { phase: "Fact or opinion", detailEn: "6 min: sort film statements into neutral facts and evaluations." },
      { phase: "Passive production facts", detailEn: "10 min: transform release/location/director facts into wurde + Partizip II." },
      { phase: "Evaluation language", detailEn: "10 min: add dass, obwohl and recommendation language to a film profile." },
      { phase: "Mini-review", detailEn: "12 min: 90-second film review with one strength, one weakness and recommendation." },
      { phase: "Workbook bridge", detailEn: "7 min: outline the separate exciting-vs-quiet-films opinion essay." },
    ],
    wrapUpTaskDe: "Gib eine Filmkritik in 5–6 Sätzen. Nutze einen Passivsatz, einen dass-Satz und eine Empfehlung mit würde.",
    workbookConnection: standardConnection(13, [
      { label: "Grammar", detailEn: "Passiv for film-production facts, especially Präteritum wurde + Partizip II; opinion clauses with dass/obwohl and recommendation with würde + Infinitiv." },
      { label: "Teil 1 · Sprechen", detailEn: "Review a film: plot/genre, acting, atmosphere, production, one strength, one weakness and a clear recommendation. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Write a B1 opinion essay on ‘Sind spannende Filme besser als ruhige Filme?’ with advantages, disadvantages, comparison and conclusion." },
      { label: "Teil 3 · Lesen", detailEn: "Read the thriller review ‘Die Nacht des Unbekannten’: mysterious murder, investigator, tension, twist, acting, music and weaknesses." },
      { label: "Teil 4 · Hören", detailEn: "Submitted listening about Spannung im Film, including how sound, suspense and film techniques affect the audience." },
    ]),
    teacherSupport: {
      lessonOverviewEn: "Day 13 teaches the language architecture of a B1 review: facts, evaluation, justification and recommendation. Passive voice is used selectively for production facts rather than mechanically throughout the text.",
      grammarFocusEn: [
        "Präteritum passive for completed production facts: wurde + Partizip II.",
        "dass introduces the content of an evaluation and sends the conjugated verb to the end.",
        "obwohl lets students acknowledge a weakness before maintaining an overall recommendation.",
        "würde + Infinitiv is a natural B1 recommendation form: Ich würde den Film empfehlen.",
      ],
      modelExamplesDe: [
        "Der Film wurde in Berlin gedreht und 2024 veröffentlicht.",
        "Ich finde, dass die Schauspieler sehr überzeugend sind.",
        "Obwohl einige Szenen zu lang sind, bleibt die Handlung spannend.",
        "Ich würde den Film allen Thriller-Fans empfehlen.",
      ],
      commonMistakesEn: [
        "Forming passive with haben instead of wurde + Partizip II.",
        "Using passive for personal evaluation where an active opinion phrase is clearer.",
        "Keeping the verb too early in dass/obwohl clauses.",
        "Forgetting to distinguish the speaking review from the separate exciting-vs-quiet writing prompt.",
      ],
    },
  },
  {
    id: "b1-day-14-traditionelles-digitales-lernen",
    course: "B1",
    day: "Day 14",
    dayNumber: 14,
    assignmentId: "B1-5.14",
    title: "B1 Day 14 · Traditionelles vs. digitales Lernen",
    topic: "5.14 Traditionelles vs. digitales Lernen",
    objective: "Students compare learning methods point by point using contrast structures, then apply formal register in a separate workplace email assignment.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Lernst du lieber online oder im Klassenzimmer?",
      "Was ist beim digitalen Lernen flexibler?",
      "Was fehlt manchmal beim Online-Lernen?",
      "Welche Mischung aus beiden Methoden wäre ideal?",
    ],
    keyPhrasesDe: [
      "Während digitales Lernen flexibler ist, ...",
      "Im Gegensatz zu ...",
      "Einerseits ..., andererseits ...",
      "Zwar ..., aber ...",
      "Online-Lernen ist flexibel; hingegen ...",
      "Ich bevorzuge ..., weil ...",
    ],
    studentQuestionsDe: [
      "Welche Unterschiede gibt es bei Lernumgebung und Kommunikation?",
      "Welche Methode ist flexibler?",
      "Welche Vor- und Nachteile haben beide Methoden?",
      "Welche Methode wird in deinem Heimatland häufiger genutzt?",
      "Welche Methode bevorzugst du und warum?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Unterschiede gibt es bei Lernumgebung und Kommunikation?",
        "modelAnswerDe": "Im Präsenzunterricht lernen alle im selben Raum und können direkt miteinander sprechen. Beim Online-Lernen sitzt jeder an einem anderen Ort und kommuniziert über Kamera, Mikrofon oder Chat. Zu Hause gibt es manchmal mehr Ablenkung."
      },
      {
        "questionDe": "Welche Methode ist flexibler?",
        "modelAnswerDe": "Online-Lernen ist häufig flexibler, weil der Weg zum Kurs entfällt. Aufgezeichnete Inhalte kann man auch später ansehen. Bei einem Live-Onlinekurs muss man allerdings trotzdem die festen Unterrichtszeiten beachten."
      },
      {
        "questionDe": "Welche Vor- und Nachteile haben beide Methoden?",
        "modelAnswerDe": "Online-Lernen spart Wege und ermöglicht die Teilnahme von zu Hause, braucht aber eine stabile Internetverbindung. Präsenzunterricht erleichtert persönliche Gespräche und gemeinsames Üben. Dafür muss man zum Kurs fahren und ist weniger flexibel."
      },
      {
        "questionDe": "Welche Methode wird in deinem Heimatland häufiger genutzt?",
        "modelAnswerDe": "Nach meiner Erfahrung wird in Ghana häufig im Klassenraum gelernt. Onlinekurse werden aber auch genutzt, besonders wenn die Teilnehmenden weit entfernt wohnen. Wie häufig beide Formen vorkommen, hängt von der Schule und dem Kurs ab."
      },
      {
        "questionDe": "Welche Methode bevorzugst du und warum?",
        "modelAnswerDe": "Ich bevorzuge Präsenzunterricht, weil ich mich dort besser konzentrieren kann. Fragen kann ich direkt stellen und in den Pausen mit anderen sprechen. Onlineunterricht ist für mich eine gute Ergänzung, wenn ich nicht zum Kurs fahren kann."
      }
    ],
    teacherNotesEn: [
      "Compare one dimension at a time: flexibility, personal contact, cost, concentration or time management.",
      "Teach während as a subordinate connector, versus hingegen/dagegen in main-clause structures.",
      "Use einerseits ... andererseits and zwar ... aber to force balanced B1 comparison rather than one-sided opinion.",
      "The writing task is structurally separate: a short formal email declining a six-month after-hours professional-development programme.",
      "Lesen/Hören shift to lifelong learning and continuing education and are submitted.",
    ],
    interactionFlow: [
      { phase: "Comparison grid", detailEn: "7 min: compare online and classroom learning across five exact dimensions." },
      { phase: "Connector choice", detailEn: "10 min: choose während, hingegen, einerseits/andererseits or zwar/aber for each contrast." },
      { phase: "Balanced argument", detailEn: "10 min: produce one advantage and one disadvantage for each method." },
      { phase: "Speaking rehearsal", detailEn: "11 min: 90-second comparison plus preference and home-country example." },
      { phase: "Workbook bridge", detailEn: "7 min: switch register and plan the formal Weiterbildung decline email." },
    ],
    wrapUpTaskDe: "Vergleiche digitales und traditionelles Lernen in 5 Sätzen. Nutze während, einerseits/andererseits und eine klare Präferenz.",
    workbookConnection: standardConnection(14, [
      { label: "Grammar", detailEn: "Contrast structures: während + verb-final subordinate clause; hingegen/dagegen in main clauses; einerseits ... andererseits; zwar ... aber; im Gegensatz zu + Dativ." },
      { label: "Teil 1 · Sprechen", detailEn: "Compare traditional and digital learning by environment, methods, communication, flexibility and advantages/disadvantages; give your preference and home-country perspective. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Separate formal-email task: politely decline a six-month professional-development programme that takes place after normal working hours; thank the employer, state the refusal, give a reason and close formally." },
      { label: "Teil 3 · Lesen", detailEn: "Read about lifelong learning in the 21st century: changing labour market, formal/informal learning, competitiveness, brain activity, time/cost/motivation challenges." },
      { label: "Teil 4 · Hören", detailEn: "Submitted dialogue about lifelong learning, online courses, current learning goals, limited time and practical ways to keep learning." },
    ]),
    teacherSupport: {
      lessonOverviewEn: "Day 14 is a controlled comparison lesson. Students learn to contrast methods precisely, then must switch from discussion language to concise formal workplace email language for the workbook writing task.",
      grammarFocusEn: [
        "während introduces a contrastive subordinate clause and sends the conjugated verb to the end.",
        "hingegen/dagegen contrast within main-clause syntax.",
        "einerseits ... andererseits and zwar ... aber create balanced two-sided arguments.",
        "im Gegensatz zu takes Dativ.",
      ],
      modelExamplesDe: [
        "Während digitales Lernen sehr flexibel ist, bietet Präsenzunterricht mehr direkten Kontakt.",
        "Einerseits spart man online Zeit, andererseits gibt es mehr Ablenkungen.",
        "Im Gegensatz zum Online-Kurs kann man im Klassenzimmer direkt nachfragen.",
        "Ich bevorzuge eine Kombination, weil beide Methoden Vorteile haben.",
      ],
      commonMistakesEn: [
        "Using main-clause word order after während.",
        "Using Akkusativ after im Gegensatz zu instead of Dativ.",
        "Listing advantages without a matching contrast point.",
        "Writing the Weiterbildung email like an essay instead of a short formal refusal.",
      ],
    },
  },
  {
    id: "b1-day-15-medien-homeoffice",
    course: "B1",
    day: "Day 15",
    dayNumber: 15,
    assignmentId: "B1-5.15",
    title: "B1 Day 15 · Medien und Arbeiten im Homeoffice",
    topic: "5.15 Medien und Arbeiten im Homeoffice",
    objective: "Students describe digital processes and workplace rules with Passiv and Modalpassiv, then evaluate how media affect working from home.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welche digitalen Tools nutzt du bei der Arbeit oder beim Lernen?",
      "Was ist ein großer Vorteil von Homeoffice?",
      "Welche Probleme entstehen durch ständige Erreichbarkeit?",
      "Wie kann man Arbeit und Privatleben besser trennen?",
    ],
    keyPhrasesDe: [
      "Die E-Mail wird verschickt.",
      "Persönliche Daten werden gespeichert.",
      "Sichere Passwörter müssen verwendet werden.",
      "Private Daten dürfen nicht weitergegeben werden.",
      "Die Daten werden von ... verarbeitet.",
      "Einerseits ..., andererseits ...",
    ],
    studentQuestionsDe: [
      "Welche digitalen Medien sind im Homeoffice wichtig?",
      "Welche Vorteile und Nachteile hat Homeoffice?",
      "Welche Regeln müssen beim Datenschutz beachtet werden?",
      "Wie kann man ständige Erreichbarkeit reduzieren?",
      "Ist eine Mischung aus Büro und Homeoffice besser? Warum?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche digitalen Medien sind im Homeoffice wichtig?",
        "modelAnswerDe": "Im Homeoffice sind E-Mail, Videokonferenzen und gemeinsame digitale Dokumente wichtig. Über einen Teamchat kann man kurze Fragen klären. Ein gemeinsamer Kalender hilft dabei, Termine abzustimmen."
      },
      {
        "questionDe": "Welche Vorteile und Nachteile hat Homeoffice?",
        "modelAnswerDe": "Ein Vorteil ist, dass der Arbeitsweg wegfällt. Außerdem kann man zu Hause oft ungestört arbeiten. Nachteile sind der fehlende persönliche Kontakt und die Gefahr, Arbeit und Freizeit nicht klar zu trennen."
      },
      {
        "questionDe": "Welche Regeln müssen beim Datenschutz beachtet werden?",
        "modelAnswerDe": "Vertrauliche Daten dürfen nicht an unbefugte Personen weitergegeben werden. Man sollte sichere Passwörter verwenden und den Bildschirm sperren, wenn man den Arbeitsplatz verlässt. Außerdem müssen die Datenschutzregeln der Firma eingehalten werden."
      },
      {
        "questionDe": "Wie kann man ständige Erreichbarkeit reduzieren?",
        "modelAnswerDe": "Man kann feste Zeiten vereinbaren, zu denen man erreichbar ist. Nach Feierabend sollten berufliche Benachrichtigungen ausgeschaltet werden. Wichtig ist, diese Grenzen auch im Team klar zu kommunizieren."
      },
      {
        "questionDe": "Ist eine Mischung aus Büro und Homeoffice besser? Warum?",
        "modelAnswerDe": "Für mich ist eine Mischung besser, weil beide Formen Vorteile haben. Im Büro kann ich mich persönlich mit Kollegen austauschen. Zu Hause kann ich Aufgaben erledigen, bei denen ich viel Ruhe brauche."
      }
    ],
    teacherNotesEn: [
      "Teach process-centred Passiv: werden + Partizip II when the action/process matters more than the actor.",
      "For rules and obligations, use Modalpassiv: modal verb + Partizip II + werden at the end.",
      "Only add the actor with von + Dativ when it is useful information.",
      "Prepare the exact writing response to Daniel about benefits, stress/availability and one boundary-setting solution.",
      "Lesen and Hören both broaden the lesson to the digital human: privacy, isolation, inequality, health and digital-real-life balance.",
    ],
    interactionFlow: [
      { phase: "Process or person", detailEn: "6 min: decide whether five workplace sentences should focus on actor or process." },
      { phase: "Passiv builder", detailEn: "10 min: convert active digital-process sentences to werden + Partizip II." },
      { phase: "Modalpassiv rules", detailEn: "10 min: formulate privacy/security rules with müssen/dürfen/können + Partizip II + werden." },
      { phase: "Homeoffice discussion", detailEn: "12 min: advantages, risks and one concrete boundary-setting strategy." },
      { phase: "Workbook bridge", detailEn: "7 min: outline the Daniel opinion response and preview digital-human comprehension themes." },
    ],
    wrapUpTaskDe: "Formuliere vier Homeoffice-Regeln: zwei im Passiv und zwei im Modalpassiv.",
    workbookConnection: standardConnection(15, [
      { label: "Grammar", detailEn: "Präsens-Passiv = werden + Partizip II; Modalpassiv = Modalverb + Partizip II + werden; optional actor with von + Dativ." },
      { label: "Teil 1 · Sprechen", detailEn: "Discuss digital media in Homeoffice: tools, at least two advantages and disadvantages, digital skills/privacy, personal experience and your preferred work model. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Respond to Daniel in 80–100 words: explain how media facilitate Homeoffice, one risk such as constant availability, and how to separate work and private life." },
      { label: "Teil 3 · Lesen", detailEn: "Read ‘Der digitale Mensch’: access to knowledge, global communication, flexible work, stress, isolation, privacy and adaptation difficulties for older generations." },
      { label: "Teil 4 · Hören", detailEn: "Submitted listening on digitization: Homeoffice flexibility, constant availability/stress, digital inequality in education, health effects and balancing digital with real life." },
    ]),
    teacherSupport: {
      lessonOverviewEn: "Day 15 uses passive voice as functional workplace language: processes, data handling and rules. The workbook then asks students to evaluate the benefits and human costs of digitally mediated work.",
      grammarFocusEn: [
        "Präsens passive = form of werden + Partizip II at the end.",
        "Modalpassiv = conjugated modal verb + ... + Partizip II + werden at the end.",
        "The actor can be added with von + Dativ when relevant.",
        "Use passive for processes, not when the person performing the action is the main point.",
      ],
      modelExamplesDe: [
        "Videokonferenzen werden regelmäßig organisiert.",
        "Persönliche Daten werden sicher gespeichert.",
        "Sichere Passwörter müssen verwendet werden.",
        "Private Informationen dürfen nicht ohne Erlaubnis weitergegeben werden.",
      ],
      commonMistakesEn: [
        "Leaving werden out of the passive construction.",
        "Using an infinitive instead of Partizip II before werden in Modalpassiv.",
        "Putting werden too early instead of at the end of the modal-passive clause.",
        "Discussing only convenience and missing the workbook's stress/privacy/boundary issues.",
      ],
    },
  },
  {
    id: "b1-day-16-pruefungsangst-stressbewaeltigung",
    course: "B1",
    day: "Day 16",
    dayNumber: 16,
    assignmentId: "B1-5.16",
    title: "B1 Day 16 · Prüfungsangst und Stressbewältigung",
    topic: "5.16 Prüfungsangst und Stressbewältigung",
    objective: "Students explain causes and symptoms of exam anxiety and give practical advice using subordinate clauses, modal verbs, Infinitiv mit zu and purpose structures.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was macht dich vor einer Prüfung nervös?",
      "Welche körperlichen Symptome kann Stress verursachen?",
      "Welche Strategie hilft dir am besten?",
      "Kann ein bisschen Stress auch nützlich sein?",
    ],
    keyPhrasesDe: [
      "Viele Schüler sind nervös, weil ...",
      "Ich denke, dass ...",
      "Wenn man unter Zeitdruck steht, ...",
      "Man sollte frühzeitig lernen.",
      "Es ist wichtig, genug zu schlafen.",
      "Ich mache Pausen, um konzentriert zu bleiben.",
      "Ich plane früh, damit ich weniger Stress habe.",
    ],
    studentQuestionsDe: [
      "Welche Ursachen hat Prüfungsangst?",
      "Welche Symptome können auftreten?",
      "Welche drei Strategien helfen gegen Stress?",
      "Was sollte man direkt vor einer Prüfung tun?",
      "Welche eigene Erfahrung hast du mit Prüfungsstress?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Ursachen hat Prüfungsangst?",
        "modelAnswerDe": "Prüfungsangst kann durch hohen Leistungsdruck oder schlechte Erfahrungen entstehen. Auch ungenügende Vorbereitung kann unsicher machen. Manche Menschen haben vor allem Angst, andere zu enttäuschen."
      },
      {
        "questionDe": "Welche Symptome können auftreten?",
        "modelAnswerDe": "Bei Prüfungsangst können zum Beispiel Herzklopfen, schwitzende Hände oder Bauchschmerzen auftreten. Manche Menschen können sich schlechter konzentrieren. Andere vergessen vor Aufregung Dinge, die sie eigentlich gelernt haben."
      },
      {
        "questionDe": "Welche drei Strategien helfen gegen Stress?",
        "modelAnswerDe": "Mir helfen ein realistischer Lernplan, regelmäßige Pausen und ruhiges Atmen. Mit einem Plan weiß ich, was ich noch üben muss. Pausen geben mir neue Energie, und ruhiges Atmen hilft mir, mich zu sammeln."
      },
      {
        "questionDe": "Was sollte man direkt vor einer Prüfung tun?",
        "modelAnswerDe": "Direkt vor der Prüfung sollte man rechtzeitig ankommen und die nötigen Materialien bereithalten. Ich würde nicht mehr versuchen, viele neue Inhalte zu lernen. Lieber atme ich ruhig und lese die Aufgaben aufmerksam."
      },
      {
        "questionDe": "Welche eigene Erfahrung hast du mit Prüfungsstress?",
        "modelAnswerDe": "Vor meiner letzten Sprachprüfung war ich sehr nervös und habe schlecht geschlafen. Dann habe ich mit einem Freund typische Aufgaben geübt. Dadurch wurde ich sicherer und konnte mich in der Prüfung besser konzentrieren."
      }
    ],
    teacherNotesEn: [
      "Teach cause/condition clauses with weil, dass and wenn before moving to advice.",
      "Use sollte/kann/muss/darf for practical recommendations and limits.",
      "Teach Es ist wichtig, ... zu ... plus um ... zu / damit for strategies and purpose.",
      "The writing task explicitly responds to Julia; students must connect to her opinion before giving their own strategies.",
      "Lesen broadens into fairness and alternatives in assessment; Hören remains exam-anxiety comprehension and is submitted.",
    ],
    interactionFlow: [
      { phase: "Problem map", detailEn: "6 min: classify causes, physical symptoms, mental symptoms and behaviours." },
      { phase: "Cause clauses", detailEn: "9 min: explain causes with weil/dass/wenn and correct verb-final order." },
      { phase: "Advice clinic", detailEn: "10 min: give solutions with sollte/kann plus Es ist wichtig, ... zu ... ." },
      { phase: "Purpose upgrade", detailEn: "10 min: connect strategies to goals with um ... zu and damit." },
      { phase: "Workbook bridge", detailEn: "8 min: plan a Julia response and preview exam-system/alternative-assessment vocabulary." },
    ],
    wrapUpTaskDe: "Nenne ein Prüfungsproblem, eine Ursache und drei Tipps. Nutze weil, sollte und um ... zu oder damit.",
    workbookConnection: standardConnection(16, [
      { label: "Grammar", detailEn: "Causes/conditions with weil, dass and wenn; advice with sollte/kann/muss/darf; Infinitiv mit zu after expressions such as Es ist wichtig; purpose with um ... zu and damit." },
      { label: "Teil 1 · Sprechen", detailEn: "Explain exam anxiety: causes, symptoms, coping strategies, exam-day tips, personal/home-country experience and whether stress can have both advantages and disadvantages. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Respond to Julia on whether the right stress-management strategies can reduce exam anxiety; give at least two strategies, explain why they help and conclude clearly." },
      { label: "Teil 3 · Lesen", detailEn: "Read about the role and fairness of exams in education: written/oral/practical exams, test anxiety and alternative assessment such as projects and coursework." },
      { label: "Teil 4 · Hören", detailEn: "Submitted listening on exam anxiety and practical ways to manage stress before and during tests." },
    ]),
    teacherSupport: {
      lessonOverviewEn: "Day 16 is a problem → cause → solution lesson. Grammar is selected according to communicative function: subordinate clauses explain the problem, modal verbs give advice, and infinitive/purpose structures make the advice concrete.",
      grammarFocusEn: [
        "weil/dass/wenn introduce subordinate clauses with the conjugated verb at the end.",
        "sollte is the high-frequency B1 form for advice; kann offers options; muss/darf express necessity or limits.",
        "Infinitiv mit zu follows structures such as Es ist wichtig, frühzeitig zu lernen.",
        "Use um ... zu with the same subject and damit especially when subjects differ or a full finite clause is needed.",
      ],
      modelExamplesDe: [
        "Viele Lernende sind nervös, weil sie Angst vor schlechten Noten haben.",
        "Man sollte frühzeitig lernen und regelmäßige Pausen machen.",
        "Es ist wichtig, vor der Prüfung genug zu schlafen.",
        "Ich mache Atemübungen, um ruhig zu bleiben.",
      ],
      commonMistakesEn: [
        "weil ich habe Angst instead of weil ich Angst habe.",
        "Ich bin Angst instead of Ich habe Angst.",
        "Ich mache Sport zu entspannen instead of um mich zu entspannen.",
        "Writing a generic stress essay without responding to Julia's opinion.",
      ],
    },
  },
  {
    id: "b1-day-17-wie-lernt-man-am-besten",
    course: "B1",
    day: "Day 17",
    dayNumber: 17,
    assignmentId: "B1-5.17",
    title: "B1 Day 17 · Wie lernt man am besten?",
    topic: "5.17 Wie lernt man am besten?",
    objective: "Students explain effective learning methods by linking conditions, reasons, opinions and goals with wenn, weil, dass, damit and um ... zu.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Wann kannst du dich am besten konzentrieren?",
      "Welche Lernmethode funktioniert für dich?",
      "Lernst du lieber allein oder in einer Gruppe?",
      "Wie oft wiederholst du neuen Lernstoff?",
    ],
    keyPhrasesDe: [
      "Ich lerne am besten, wenn ...",
      "Ich mache mir Notizen, weil ...",
      "Ich finde, dass ...",
      "Es hilft, einen Lernplan zu erstellen.",
      "Ich wiederhole den Stoff, um ihn besser zu behalten.",
      "Der Lehrer erklärt Beispiele, damit ...",
    ],
    studentQuestionsDe: [
      "Welche Lernmethode hilft dir am meisten?",
      "Welche Lernumgebung brauchst du?",
      "Wie planst du Lernzeiten und Pausen?",
      "Was hilft dir bei Motivation und Konzentration?",
      "Welche Methode würdest du anderen empfehlen und warum?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Lernmethode hilft dir am meisten?",
        "modelAnswerDe": "Mir hilft es am meisten, neue Wörter in eigenen Sätzen zu benutzen. So lerne ich nicht nur die Bedeutung, sondern auch die Verwendung. Zusätzlich wiederhole ich die Wörter regelmäßig."
      },
      {
        "questionDe": "Welche Lernumgebung brauchst du?",
        "modelAnswerDe": "Ich brauche einen ruhigen Platz mit einem aufgeräumten Tisch. Mein Handy lege ich außer Reichweite, damit ich nicht ständig abgelenkt werde. Außerdem sollte der Raum hell und angenehm sein."
      },
      {
        "questionDe": "Wie planst du Lernzeiten und Pausen?",
        "modelAnswerDe": "Ich lerne meistens eine halbe Stunde und mache danach eine kurze Pause. Schwierige Aufgaben erledige ich zuerst, wenn ich noch konzentriert bin. Am Ende wiederhole ich kurz, was ich gelernt habe."
      },
      {
        "questionDe": "Was hilft dir bei Motivation und Konzentration?",
        "modelAnswerDe": "Kleine, erreichbare Ziele motivieren mich. Wenn ich sehe, dass ich Fortschritte mache, lerne ich gern weiter. Für meine Konzentration helfen mir Ruhe, Pausen und ein klarer Plan."
      },
      {
        "questionDe": "Welche Methode würdest du anderen empfehlen und warum?",
        "modelAnswerDe": "Ich würde empfehlen, regelmäßig kurze Einheiten zu lernen und das Gelernte aktiv anzuwenden. Zum Beispiel kann man neue Wörter in einem Gespräch benutzen. Das ist für mich wirksamer, als nur lange Listen zu lesen."
      }
    ],
    teacherNotesEn: [
      "Choose the function before the connector: condition → wenn, reason → weil, opinion/content → dass, purpose → um ... zu / damit.",
      "Reinforce verb-final order after wenn/weil/dass/damit.",
      "Use Infinitiv mit zu for strategy language such as Es hilft, einen Lernplan zu erstellen.",
      "The deep Day 17 grammar exists inside the workbook Grammar tab; there is no separate lesson-route grammar page, so do not create a broken teacher link.",
      "Lesen focuses active learning, sleep, planning and spaced repetition; Hören adds chunking, environment and reflection and is submitted.",
    ],
    interactionFlow: [
      { phase: "Learning problem", detailEn: "6 min: each student chooses memory, concentration, motivation, speaking or time management as one concrete problem." },
      { phase: "Connector match", detailEn: "10 min: match condition/reason/opinion/purpose to wenn/weil/dass/um...zu/damit." },
      { phase: "Strategy sentences", detailEn: "10 min: produce strategy + reason + goal chains." },
      { phase: "Method presentation", detailEn: "11 min: explain best method, environment, time management and one disadvantage." },
      { phase: "Workbook bridge", detailEn: "8 min: plan the Tim opinion response and preview active-learning/spaced-repetition vocabulary." },
    ],
    wrapUpTaskDe: "Erkläre deine beste Lernmethode mit vier Funktionen: wenn, weil, dass und um ... zu oder damit.",
    workbookConnection: standardConnection(17, [
      { label: "Grammar", detailEn: "Grammar lives inside the workbook Grammar tab: wenn for conditions, weil for reasons, dass for opinions/content, um ... zu / damit for purpose, plus Infinitiv mit zu for learning strategies." },
      { label: "Teil 1 · Sprechen", detailEn: "Explain what helps you learn effectively: methods, environment, time management, motivation, personal experience and advantages/disadvantages of different approaches. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Respond to Tim about how people learn best; name two methods that work for you, explain the value of goals/pauses/repetition and give a clear conclusion." },
      { label: "Teil 3 · Lesen", detailEn: "Read ‘Effektiver lernen – Tipps und Tricks’: active learning, summaries/mindmaps, planning, pauses, sleep and spaced repetition." },
      { label: "Teil 4 · Hören", detailEn: "Submitted learning-techniques listening on chunking, repetition, a quiet environment, self-questioning/reflection and what to do after reaching a learning goal." },
    ], {
      grammarUrl: null,
      subtitle: "Teach toward the same Grammar, Sprechen, Schreiben, Lesen and Hören tasks students see in Falowen. Day 17 grammar is opened from the workbook's Grammar tab.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 17 turns learning advice into a logical B1 explanation. Students identify a learning problem, choose a method, explain why it works and state the condition or purpose with the correct connector.",
      grammarFocusEn: [
        "wenn introduces the condition under which a method works.",
        "weil gives a reason; dass introduces the content of an opinion or belief.",
        "um ... zu expresses purpose with the same subject; damit uses a finite subordinate clause and can handle different subjects.",
        "Infinitiv mit zu appears in strategy frames such as Es hilft, ... zu ... and Ich versuche, ... zu ... .",
      ],
      modelExamplesDe: [
        "Ich lerne besser, wenn ich mein Handy ausschalte.",
        "Ich mache mir Notizen, weil ich Informationen dann besser behalte.",
        "Ich finde, dass regelmäßige Wiederholung wichtig ist.",
        "Ich wiederhole die Wörter, um sie langfristig zu behalten.",
      ],
      commonMistakesEn: [
        "wenn es ist ruhig instead of wenn es ruhig ist.",
        "dass Pausen sind wichtig instead of dass Pausen wichtig sind.",
        "um ich sie zu behalten instead of um sie zu behalten.",
        "Naming many methods without linking each method to a concrete learning problem or goal.",
      ],
    },
  },
  {
    id: "b1-day-18-wege-zum-wunschberuf",
    course: "B1",
    day: "Day 18",
    dayNumber: 18,
    assignmentId: "B1-6.18",
    title: "B1 Day 18 · Wege zum Wunschberuf",
    topic: "6.18 Wege zum Wunschberuf",
    objective: "Students describe concrete steps towards their dream job and explain the purpose of each step with one grammar pattern: um ... zu + Infinitiv.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was ist dein Wunschberuf?",
      "Welche Ausbildung braucht man dafür?",
      "Welche Fähigkeiten sind besonders wichtig?",
      "Kann ein Praktikum bei der Berufswahl helfen? Warum?",
    ],
    keyPhrasesDe: [
      "Ich mache ein Praktikum, um Berufserfahrung zu sammeln.",
      "Ich lerne Deutsch, um in Deutschland zu arbeiten.",
      "Ich besuche einen Kurs, um meine Fähigkeiten zu verbessern.",
      "Ich schreibe einen Lebenslauf, um mich zu bewerben.",
      "Ich mache eine Weiterbildung, um neue Kenntnisse zu erwerben.",
      "Ich übe Vorstellungsgespräche, um sicherer zu werden.",
    ],
    studentQuestionsDe: [
      "Welcher Beruf interessiert dich? Welchen Schritt machst du, um ihn zu erreichen?",
      "Welche Ausbildung oder Qualifikation brauchst du? Erkläre deinen Plan mit um ... zu.",
      "Welche Rolle spielen Praktikum und Weiterbildung? Nutze um ... zu.",
      "Welche Fähigkeit möchtest du noch verbessern? Nutze um ... zu.",
      "Welcher nächste Schritt bringt dich deinem Ziel näher? Nutze um ... zu.",
    ],
    speakingModels: [
      {
        "questionDe": "Welcher Beruf interessiert dich? Welchen Schritt machst du, um ihn zu erreichen?",
        "modelAnswerDe": "Mein Wunschberuf ist Lehrer. Ich studiere Pädagogik, um später an einer Schule zu arbeiten. Außerdem übe ich Präsentationen, um klarer und sicherer zu erklären."
      },
      {
        "questionDe": "Welche Ausbildung oder Qualifikation brauchst du? Erkläre deinen Plan mit um ... zu.",
        "modelAnswerDe": "Für meinen geplanten Weg brauche ich eine passende pädagogische Ausbildung und gute Fachkenntnisse. Ich informiere mich über die Voraussetzungen, um den richtigen Ausbildungsweg zu wählen. Danach möchte ich ein Praktikum machen, um Erfahrung zu sammeln."
      },
      {
        "questionDe": "Welche Rolle spielen Praktikum und Weiterbildung? Nutze um ... zu.",
        "modelAnswerDe": "Ich mache ein Praktikum, um den Arbeitsalltag kennenzulernen. Später besuche ich eine Weiterbildung, um neue Methoden zu lernen und meine Kenntnisse zu erweitern."
      },
      {
        "questionDe": "Welche Fähigkeit möchtest du noch verbessern? Nutze um ... zu.",
        "modelAnswerDe": "Ich möchte sicherer vor Gruppen sprechen können. Ich übe kurze Präsentationen, um mein Selbstvertrauen zu stärken. Außerdem bitte ich andere um Rückmeldung, um meine Aussprache zu verbessern."
      },
      {
        "questionDe": "Welcher nächste Schritt bringt dich deinem Ziel näher? Nutze um ... zu.",
        "modelAnswerDe": "Mein nächster Schritt ist ein Praktikum an einer Schule. Ich aktualisiere meinen Lebenslauf, um mich dafür zu bewerben. Danach sammle ich praktische Erfahrungen, um meinen Wunschberuf besser kennenzulernen."
      }
    ],
    teacherNotesEn: [
      "Teach only one grammar pattern: um ... zu + Infinitiv for the purpose of a career step; do not introduce other new grammar in this lesson.",
      "Model the comma before um, put zu immediately before the infinitive, and keep the person performing both actions the same.",
      "Contrast Ich mache ein Praktikum, um Erfahrungen zu sammeln with the common mistakes um ich Erfahrungen sammle and um Erfahrungen sammeln.",
      "The writing task responds to Lena and compares Ausbildung, Studium, Praktikum and Weiterbildung as content; preserve the workbook task without adding grammar targets.",
      "Lesen/Hören test the tension between dream, labour-market reality, flexibility and continuing education and are submitted.",
    ],
    interactionFlow: [
      { phase: "Career map", detailEn: "6 min: choose one dream job and identify training, practice and the next career step." },
      { phase: "One grammar rule", detailEn: "9 min: teach Hauptsatz + Komma + um + Ziel + zu + Infinitiv; the acting person stays the same." },
      { phase: "Guided sentence building", detailEn: "10 min: combine Ich mache ein Praktikum + Ich möchte Erfahrungen sammeln into Ich mache ein Praktikum, um Erfahrungen zu sammeln; repeat with Kurs and Deutsch lernen." },
      { phase: "Error correction and practice", detailEn: "11 min: fix missing zu and repeated subjects after um; students explain three personal career steps using um ... zu." },
      { phase: "Workbook bridge", detailEn: "8 min: outline the Lena opinion and preview the dream-vs-reality reading/listening tasks; do not add new grammar." },
    ],
    wrapUpTaskDe: "Nenne deinen Wunschberuf und drei konkrete Schritte. Formuliere zu jedem Schritt einen Satz mit um ... zu, zum Beispiel: Ich mache ein Praktikum, um Berufserfahrung zu sammeln.",
    workbookConnection: standardConnection(18, [
      { label: "Grammar", detailEn: "Single grammar focus: um ... zu + Infinitiv for purpose and career goals. Same subject in both actions, comma before um, zu before the infinitive; practise three career-step sentences and correct typical mistakes." },
      { label: "Teil 1 · Sprechen", detailEn: "Explain how you can reach your dream job: motivation, training/degree, important skills, practical experience/application and your next career step. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Respond to Lena on whether there are different paths to a dream job; discuss Ausbildung, Studium, Praktikum or Weiterbildung and explain why different people need different routes." },
      { label: "Teil 3 · Lesen", detailEn: "Read ‘Berufswahl – Wunsch oder Realität?’ about passion versus security, changing labour markets, flexibility, Weiterbildung and expert advice." },
      { label: "Teil 4 · Hören", detailEn: "Submitted career-choice listening: enjoyment of work, value of internships, job availability and the balance between dream and reality." },
    ]),
    teacherSupport: {
      lessonOverviewEn: "Day 18 shifts from learning strategies to career planning. Students describe the route to their dream job while learning just one grammar structure: um ... zu for the purpose of each step.",
      grammarFocusEn: [
        "One focus only: um ... zu + Infinitiv states the purpose of an action when the acting person remains the same.",
        "Pattern: main clause + comma + um + goal + zu + infinitive at the end. Students should form sentences without repeating the subject after um.",
      ],
      modelExamplesDe: [
        "Ich mache ein Praktikum, um Berufserfahrung zu sammeln.",
        "Ich lerne Deutsch, um in Deutschland zu arbeiten.",
        "Ich besuche einen Kurs, um meine Fähigkeiten zu verbessern.",
        "Ich schreibe einen Lebenslauf, um mich zu bewerben.",
      ],
      commonMistakesEn: [
        "Writing um ich Erfahrungen sammle instead of um Erfahrungen zu sammeln; do not repeat the subject after um.",
        "Omitting zu: Ich mache ein Praktikum, um Erfahrungen sammeln instead of um Erfahrungen zu sammeln.",
        "Placing zu before the object instead of the infinitive: um zu mich bewerben instead of um mich zu bewerben.",
        "Naming a dream job without explaining the purpose of a concrete career step.",
      ],
    },
  },
  {
    id: "b1-day-19-vorstellungsgespraech",
    course: "B1",
    day: "Day 19",
    dayNumber: 19,
    assignmentId: "B1-6.19",
    title: "B1 Day 19 · Das Vorstellungsgespräch",
    topic: "6.19 Das Vorstellungsgespräch",
    objective: "Students answer interview questions politely and professionally with formal Sie language, Konjunktiv II and clear motivation/reason clauses.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welche Frage wird oft im Vorstellungsgespräch gestellt?",
      "Wie kann man sich gut vorbereiten?",
      "Welche zwei Stärken würdest du nennen?",
      "Was sollte man über die Firma wissen?",
    ],
    keyPhrasesDe: [
      "Ich würde gern in Ihrem Unternehmen arbeiten.",
      "Ich könnte sofort anfangen.",
      "Diese Stelle wäre eine gute Chance für mich.",
      "Ich bewerbe mich bei Ihnen, weil ...",
      "Da ich schon Erfahrung habe, ...",
      "Deshalb kann ich ...",
      "Könnten Sie mir mehr über die Aufgaben sagen?",
    ],
    studentQuestionsDe: [
      "Wie stellst du dich professionell vor?",
      "Warum möchtest du bei dieser Firma arbeiten?",
      "Welche Stärke kannst du mit einem Beispiel belegen?",
      "Wie würdest du eine höfliche Frage an den Arbeitgeber formulieren?",
      "Welche Vorbereitung reduziert Stress vor dem Gespräch?",
    ],
    speakingModels: [
      {
        "questionDe": "Wie stellst du dich professionell vor?",
        "modelAnswerDe": "Guten Tag, mein Name ist Alex Mensah. Ich habe eine kaufmännische Ausbildung abgeschlossen und bereits im Kundenservice gearbeitet. Besonders gern berate ich Kunden und löse organisatorische Aufgaben."
      },
      {
        "questionDe": "Warum möchtest du bei dieser Firma arbeiten?",
        "modelAnswerDe": "Mich interessiert die ausgeschriebene Stelle, weil sie gut zu meiner Erfahrung im Kundenservice passt. Ich möchte meine Kenntnisse einbringen und mich fachlich weiterentwickeln. Besonders wichtig ist mir eine gute Zusammenarbeit im Team."
      },
      {
        "questionDe": "Welche Stärke kannst du mit einem Beispiel belegen?",
        "modelAnswerDe": "Eine meiner Stärken ist Geduld. In meiner letzten Stelle habe ich einem unzufriedenen Kunden ruhig zugehört und eine passende Lösung gefunden. Am Ende war er mit der Beratung zufrieden."
      },
      {
        "questionDe": "Wie würdest du eine höfliche Frage an den Arbeitgeber formulieren?",
        "modelAnswerDe": "Könnten Sie mir bitte erklären, wie die Einarbeitung abläuft? Außerdem würde ich gern wissen, mit welchem Team ich zusammenarbeiten würde. Das hilft mir, die Stelle besser zu verstehen."
      },
      {
        "questionDe": "Welche Vorbereitung reduziert Stress vor dem Gespräch?",
        "modelAnswerDe": "Ich informiere mich vorher über die Firma und übe typische Fragen. Außerdem lege ich meine Unterlagen bereit und plane die Anfahrt. Wenn ich rechtzeitig losfahre, fühle ich mich deutlich ruhiger."
      }
    ],
    teacherNotesEn: [
      "Keep formal Sie/Ihnen/Ihr consistent throughout the interview role-play.",
      "Teach würde + Infinitiv for professional wishes, könnte for possibilities and wäre for polite evaluation/hypothetical description.",
      "Use weil/da for reasons with verb-final order and deshalb for a result with immediate verb inversion.",
      "The workbook writing asks whether interviews are difficult and responds to Emma; it is not a formal application letter.",
      "Teil 3 now uses Felix’s email about his MediaPlus interview with seven scored questions. Teil 4 is a graded listening dialogue between Herr Weber and Frau Keller with five questions.",
    ],
    interactionFlow: [
      { phase: "Register check", detailEn: "6 min: convert informal du phrases into professional Sie/Ihnen/Ihr forms." },
      { phase: "Konjunktiv-II responses", detailEn: "10 min: practise würde/könnte/wäre in common interview answers and questions." },
      { phase: "Reason structure", detailEn: "9 min: justify motivation and strengths with weil/da/deshalb." },
      { phase: "Interview role-play", detailEn: "13 min: 60–90 second self-introduction plus employer follow-up questions." },
      { phase: "Workbook bridge", detailEn: "8 min: plan the Emma opinion, preview Felix’s seven-question interview email, then prepare students for the five-question Frau Keller listening." },
    ],
    wrapUpTaskDe: "Antworte auf drei typische Interviewfragen. Nutze die Sie-Form, einmal würde/könnte/wäre und eine Begründung mit weil oder da.",
    workbookConnection: standardConnection(19, [
      { label: "Grammar", detailEn: "Professional interview language: formal Sie/Ihnen/Ihr; Konjunktiv II with würde + Infinitiv, könnte and wäre; motivation/reasons with weil/da and results with deshalb." },
      { label: "Teil 1 · Sprechen", detailEn: "Explain how you prepare for an interview: personal information, qualifications, experience, strengths, motivation and practical tips. Use polite language and Konjunktiv II. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Write about 80 words responding to Emma on whether interviews are difficult; explain stress factors, preparation and what helps candidates succeed." },
      { label: "Teil 3 · Lesen", detailEn: "Scored interview reading: Felix writes to Sarah about his MediaPlus interview, the English question, his own questions and when he expects a decision. Submit seven answer letters." },
      { label: "Teil 4 · Hören", detailEn: "Graded interview listening: Herr Weber interviews Frau Keller about her nursing background, three years in Germany, motivation, perfectionism and four-week onboarding. Submit five answer letters." },
    ], {
      subtitle: "Day 19 assessment: Teil 3 is the seven-question Felix interview reading and Teil 4 is the five-question Frau Keller Hören.",
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 19 teaches interview register and professional self-presentation. The assessment now stays on topic: Felix’s interview email in Teil 3 and Frau Keller’s clinic interview dialogue in Teil 4.",
      grammarFocusEn: [
        "Use formal Sie/Ihnen/Ihr consistently in an interview.",
        "würde + Infinitiv expresses professional wishes; könnte expresses polite possibility; wäre expresses hypothetical/polite evaluation.",
        "weil and da send the conjugated verb to the end; deshalb at clause start is followed immediately by the conjugated verb.",
        "A strength should be supported by a short concrete example rather than named alone.",
      ],
      modelExamplesDe: [
        "Ich würde gern in Ihrem Unternehmen arbeiten, weil ich mich für Kundenservice interessiere.",
        "Ich könnte sofort anfangen und wäre zeitlich flexibel.",
        "Da ich bereits Erfahrung im Büro habe, kann ich schnell selbstständig arbeiten.",
        "Könnten Sie mir bitte mehr über die Aufgaben sagen?",
      ],
      commonMistakesEn: [
        "Switching from Sie to du during the role-play.",
        "Using Ich will instead of a more professional Ich würde gern.",
        "weil ich interessiere mich instead of weil ich mich interessiere.",
        "Mixing details from Felix’s reading with Frau Keller’s listening; keep the two interview scenarios separate when checking answers.",
      ],
    },
  },
  {
    id: "b1-day-20-wie-wird-man",
    course: "B1",
    day: "Day 20",
    dayNumber: 20,
    assignmentId: "B1-6.20",
    title: "B1 Day 20 · Wie wird man …?",
    topic: "6.20 Berufe kennenlernen und beschreiben",
    objective: "Students describe professions, training routes, requirements and personal suitability using relative clauses, modal verbs and reason clauses.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welcher Beruf interessiert dich besonders?",
      "Welche Ausbildung braucht man dafür?",
      "Was ist wichtiger: Ausbildung oder Erfahrung?",
      "Welche persönliche Eigenschaft ist in deinem Beruf besonders wichtig?",
    ],
    keyPhrasesDe: [
      "Ein Arzt ist eine Person, die Patienten untersucht.",
      "Ein Beruf, der mich interessiert, ist ...",
      "Man muss gut kommunizieren können.",
      "Man sollte zuverlässig und geduldig sein.",
      "Dieser Beruf passt zu mir, weil ...",
      "Wenn man kreativ ist, ...",
      "Zuerst muss man ..., danach kann man ...",
    ],
    studentQuestionsDe: [
      "Welche Ausbildung und Qualifikationen braucht man für deinen Beruf?",
      "Welche Aufgaben hat man in diesem Beruf?",
      "Welche persönlichen Eigenschaften sind wichtig?",
      "Wie sieht der Karriereweg aus?",
      "Warum passt dieser Beruf zu dir oder nicht?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Ausbildung und Qualifikationen braucht man für deinen Beruf?",
        "modelAnswerDe": "Für meinen Wunschberuf als Koch brauche ich eine passende berufliche Ausbildung und praktische Erfahrung. Wichtig sind auch Kenntnisse über Lebensmittel und Hygiene. Welche Nachweise erforderlich sind, würde ich beim Ausbildungsbetrieb erfragen."
      },
      {
        "questionDe": "Welche Aufgaben hat man in diesem Beruf?",
        "modelAnswerDe": "Ein Koch bereitet Zutaten vor und kocht verschiedene Gerichte. Er plant Arbeitsabläufe und achtet auf Hygiene. Außerdem kontrolliert er, ob genügend Lebensmittel vorhanden sind."
      },
      {
        "questionDe": "Welche persönlichen Eigenschaften sind wichtig?",
        "modelAnswerDe": "Ein Koch sollte sorgfältig, belastbar und teamfähig sein. Wenn viele Bestellungen gleichzeitig kommen, muss er ruhig bleiben. Kreativität ist ebenfalls hilfreich, um neue Gerichte zu entwickeln."
      },
      {
        "questionDe": "Wie sieht der Karriereweg aus?",
        "modelAnswerDe": "Nach der Ausbildung kann man zunächst Erfahrungen in verschiedenen Küchen sammeln. Später kann man mehr Verantwortung übernehmen und ein Team leiten. Mit genügend Erfahrung könnte man auch ein eigenes Restaurant eröffnen."
      },
      {
        "questionDe": "Warum passt dieser Beruf zu dir oder nicht?",
        "modelAnswerDe": "Der Beruf passt zu mir, weil ich gern koche und praktisch arbeite. Auch die Zusammenarbeit im Team gefällt mir. Allerdings müsste ich mich an die Arbeit am Abend und am Wochenende gewöhnen."
      }
    ],
    teacherNotesEn: [
      "Use relative clauses to define jobs and duties precisely: eine Person, die ... / ein Beruf, der ... .",
      "Use müssen/können/sollte to distinguish requirements, abilities and desirable qualities.",
      "Use weil/dass/wenn to justify personal suitability and conditions.",
      "The deep Day 20 grammar notes exist in the student source but the current lesson route/workbook does not expose a direct grammar link, so the teacher guide must not point to a broken URL.",
      "Teil 3 Lesen now uses the Reiseleiter/in career article with seven scored questions. Teil 4 is a graded Cloudflare Hören task with five questions; students submit both objective parts.",
    ],
    interactionFlow: [
      { phase: "Profession definition", detailEn: "7 min: define three jobs with relative clauses." },
      { phase: "Requirement ladder", detailEn: "9 min: separate muss / muss ... können / sollte statements for one profession." },
      { phase: "Career path", detailEn: "10 min: explain school → training/study → entry → Weiterbildung → advancement with sequence language." },
      { phase: "Speaking rehearsal", detailEn: "11 min: 90-second answer on education, qualifications, experience and home-country route." },
      { phase: "Workbook bridge", detailEn: "8 min: plan the Felix opinion, preview the Reiseleiter/in reading, then prepare students for the five-question graded Hören." },
    ],
    wrapUpTaskDe: "Beschreibe einen Beruf in 6 Sätzen. Nutze einen Relativsatz, zwei Modalverben und eine Begründung mit weil oder wenn.",
    workbookConnection: standardConnection(20, [
      { label: "Grammar", detailEn: "Deep grammar source: relative clauses for professions/duties, modal verbs for requirements and ability, and weil/dass/wenn for suitability and reasons. The current Day 20 lesson does not expose a direct grammar route." },
      { label: "Teil 1 · Sprechen", detailEn: "Choose one profession and explain the education/training route, qualifications, career path, personal experience and the situation in your home country. Practice only." },
      { label: "Teil 2 · Schreiben", detailEn: "Respond to Felix in 80–100 words on whether education and qualifications are important; compare formal training with practical experience and give an example." },
      { label: "Teil 3 · Lesen", detailEn: "Scored reading: how to become a Reiseleiter/in, including qualifications, languages, problem-solving and training courses; answer seven multiple-choice questions." },
      { label: "Teil 4 · Hören", detailEn: "Graded listening with five questions on school qualification, training length, pay, job tasks and patience. Submit all five answer letters." },
    ], {
      grammarUrl: null,
      subtitle: "Teach toward the workbook tasks. Day 20 has no direct grammar link in the current student lesson; Teil 3 Lesen and Teil 4 Hören are both graded."
    }),
    teacherSupport: {
      lessonOverviewEn: "Day 20 consolidates career language around profession definitions, requirements and suitability. The assessed reading now uses the Reiseleiter/in career profile, and Teil 4 is a graded listening task.",
      grammarFocusEn: [
        "Relative clauses describe a profession or person precisely and place the conjugated verb at the end.",
        "muss expresses a requirement; kann/muss ... können expresses ability; sollte expresses a desirable quality or recommendation.",
        "weil/dass/wenn clauses explain suitability, opinions and conditions with verb-final order.",
        "Career descriptions should include duties, route/qualification and personal fit, not only a job title.",
      ],
      modelExamplesDe: [
        "Ein Arzt ist eine Person, die Patienten untersucht.",
        "In diesem Beruf muss man gut kommunizieren können.",
        "Man sollte zuverlässig und geduldig sein.",
        "Dieser Beruf passt zu mir, weil ich gern mit Menschen arbeite.",
      ],
      commonMistakesEn: [
        "Using main-clause word order inside a relative clause.",
        "Saying man muss gut kommunizieren kann instead of man muss gut kommunizieren können.",
        "Giving only education details without describing duties or personal suitability.",
        "Forgetting that the new Hören is graded and must be submitted with five answer letters.",
      ],
    },
  },
];

export function getB1WorkbookAlignedSlideDay11To20(assignmentId) {
  const normalized = String(assignmentId || "").trim().toUpperCase();
  return b1WorkbookAlignedSlidesDays11To20.find(
    (slide) => String(slide.assignmentId || "").trim().toUpperCase() === normalized,
  ) || null;
}
