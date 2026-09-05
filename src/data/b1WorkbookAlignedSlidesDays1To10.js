const lessonRoute = (day, view) => `/campus/course/lesson/B1/${day}?view=${view}`;

export const b1WorkbookAlignedSlidesDays1To10 = [
  {
    id: "b1-day-1-traumwelten",
    course: "B1",
    day: "Day 1",
    dayNumber: 1,
    assignmentId: "B1-1.1",
    title: "B1 Day 1 · Traumwelten",
    topic: "1.1 Traumwelten",
    objective: "Students distinguish Präsens from Perfekt while discussing dream jobs, future wishes and past experiences, then transfer that language into the workbook speaking, opinion-writing and dream-comprehension tasks.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was ist dein Traumberuf und warum?",
      "Welche Fähigkeit brauchst du für deinen Traumberuf?",
      "Welchen Traum oder Wunsch hattest du als Kind?",
      "Welche Erfahrung hast du schon gemacht, die dich deinem Ziel nähergebracht hat?",
    ],
    keyPhrasesDe: [
      "Mein Traumberuf ist ..., weil ...",
      "In Zukunft möchte ich ...",
      "Nächstes Jahr arbeite / lerne / reise ich ...",
      "Ich habe schon ... gemacht / gelernt / erlebt.",
      "Ich bin schon nach ... gereist.",
      "Um dieses Ziel zu erreichen, möchte ich ...",
    ],
    studentQuestionsDe: [
      "Was ist dein Traumberuf und welche zwei Gründe hast du dafür?",
      "Welche Fähigkeiten sind für diesen Beruf wichtig?",
      "Was möchtest du tun, um dieses Ziel zu erreichen?",
      "Welche Erfahrung hast du schon gemacht, die zu deinem Traum passt?",
      "Ist persönlicher Kontakt im Traumberuf wichtiger als flexible Arbeit im Homeoffice? Warum?",
    ],
    speakingModels: [
      {
        "questionDe": "Was ist dein Traumberuf und welche zwei Gründe hast du dafür?",
        "modelAnswerDe": "Mein Traumberuf ist Lehrer, weil ich gern Wissen vermittle. Außerdem macht es mir Freude, Menschen bei ihren Zielen zu unterstützen. Besonders schön finde ich es, wenn jemand etwas Schwieriges endlich versteht."
      },
      {
        "questionDe": "Welche Fähigkeiten sind für diesen Beruf wichtig?",
        "modelAnswerDe": "Ein Lehrer muss verständlich erklären und gut zuhören können. Geduld ist ebenfalls wichtig, weil nicht alle gleich schnell lernen. Außerdem sollte er seinen Unterricht gut organisieren."
      },
      {
        "questionDe": "Was möchtest du tun, um dieses Ziel zu erreichen?",
        "modelAnswerDe": "Ich möchte eine passende Ausbildung machen und meine Deutschkenntnisse verbessern. Danach möchte ich praktische Erfahrungen an einer Schule sammeln. Deshalb lerne ich regelmäßig und suche nach einem Praktikumsplatz."
      },
      {
        "questionDe": "Welche Erfahrung hast du schon gemacht, die zu deinem Traum passt?",
        "modelAnswerDe": "Ich habe schon einem Freund beim Deutschlernen geholfen. Wir haben gemeinsam Grammatik geübt und kurze Gespräche geführt. Dabei habe ich gemerkt, dass mir das Erklären Spaß macht."
      },
      {
        "questionDe": "Ist persönlicher Kontakt im Traumberuf wichtiger als flexible Arbeit im Homeoffice? Warum?",
        "modelAnswerDe": "Für mich ist persönlicher Kontakt als Lehrer wichtiger, weil ich die Reaktionen der Lernenden direkt sehe. So kann ich schneller auf Fragen eingehen. Homeoffice ist zwar flexibel, aber ich würde es vor allem für die Unterrichtsvorbereitung nutzen."
      }
    ],
    teacherNotesEn: [
      "Teach the actual Day 1 contrast: Präsens for current/general habits and future plans with a time marker; Perfekt for completed past experience.",
      "Keep haben/sein + Partizip II visible and contrast Ich habe geträumt / gesehen with Ich bin gereist.",
      "Use the speaking task as the main production target: dream job → two reasons → skills → plan to reach the goal.",
      "Bridge into the opinion-writing task about personal contact versus Homeoffice rather than turning the lesson into a generic dream-vocabulary lesson.",
      "Treat the Freud/Jung dream-reading and the creativity/nightmare/lucid-dream listening as separate comprehension applications of the chapter theme.",
    ],
    interactionFlow: [
      { phase: "Dream-job activation", detailEn: "6 min: students name a dream job, two reasons and one required skill." },
      { phase: "Time contrast", detailEn: "10 min: sort statements into Präsens or Perfekt and explain why each tense is needed." },
      { phase: "Perfekt builder", detailEn: "10 min: practise haben/sein + Partizip II with dream, learning and travel experiences." },
      { phase: "Speaking rehearsal", detailEn: "12 min: 60–90 second dream-job answer using reasons, skills and a future plan." },
      { phase: "Workbook bridge", detailEn: "7 min: plan the Homeoffice opinion paragraph and preview the separate dream-reading/listening focus." },
    ],
    wrapUpTaskDe: "Sprich 5–6 Sätze über deinen Traumberuf. Nutze Präsens für deinen Plan und mindestens einen Perfekt-Satz für eine Erfahrung, die du schon gemacht hast.",
    workbookConnection: {
      grammarUrl: lessonRoute(1, "grammar"),
      workbookUrl: lessonRoute(1, "workbook"),
      parts: [
        { label: "Grammar", detailEn: "Präsens for now, habits and future plans with time markers; Perfekt for completed experience with haben/sein + Partizip II." },
        { label: "Teil 1 · Sprechen", detailEn: "Answer ‘Was ist dein Traumberuf und warum?’ for 60–90 seconds: name the job, give at least two reasons, describe required skills and explain how you want to reach the goal. Practice only." },
        { label: "Teil 2 · Schreiben", detailEn: "Write an approximately 80-word opinion on whether personal contact in a dream job is more important than flexible Homeoffice work; discuss advantages/disadvantages and justify your position." },
        { label: "Teil 3 · Lesen", detailEn: "Separate dream-interpretation comprehension: antiquity, Freud, Jung, the collective unconscious and modern scientific views of dreams." },
        { label: "Teil 4 · Hören", detailEn: "Separate dream/science comprehension: Kekulé, Mary Shelley, nightmares, lucid dreaming and the REM phase." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Day 1 introduces B1 production through a meaningful tense contrast. Students talk about future goals in Präsens, add completed experiences in Perfekt and then move into an opinion task about work arrangements, while Lesen and Hören broaden the chapter into dream interpretation and dream science.",
      grammarFocusEn: [
        "Präsens covers current actions, habits, general statements and future plans when a time expression makes the future clear.",
        "Perfekt = conjugated haben or sein in position 2 + Partizip II at the end.",
        "Use sein especially with many movement/change-of-state verbs: Ich bin nach Deutschland gereist.",
        "Keep irregular present forms accurate: sehen → du siehst / er sieht.",
      ],
      modelExamplesDe: [
        "Mein Traumberuf ist Lehrer, weil ich gern mit Menschen arbeite.",
        "Nächstes Jahr mache ich eine Weiterbildung, um diesem Ziel näherzukommen.",
        "Ich habe schon Deutsch unterrichtet und viele Erfahrungen gesammelt.",
        "Letztes Jahr bin ich nach Deutschland gereist und habe neue Eindrücke bekommen.",
      ],
      commonMistakesEn: [
        "Using the wrong auxiliary: Ich bin geträumt instead of Ich habe geträumt.",
        "Using haben with a movement verb where the lesson expects sein: Ich habe nach Deutschland gereist.",
        "Putting the participle too early instead of at the end of the Perfekt clause.",
        "Giving only a job title in speaking without reasons, skills and a concrete plan.",
      ],
    },
  },
  {
    id: "b1-day-2-freunde-fuers-leben",
    course: "B1",
    day: "Day 2",
    dayNumber: 2,
    assignmentId: "B1-1.2",
    title: "B1 Day 2 · Freunde fürs Leben",
    topic: "1.2 Freunde fürs Leben",
    objective: "Students describe friendship qualities with accurate adjective forms and justify opinions with weil, denn and deshalb, then use the same relationship language in the workbook email and comprehension tasks.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welche drei Eigenschaften sind dir bei Freunden wichtig?",
      "Was macht eine Freundschaft besonders?",
      "Wie löst du normalerweise Konflikte mit Freunden?",
      "Welche Eigenschaft beschreibt deinen besten Freund oder deine beste Freundin?",
    ],
    keyPhrasesDe: [
      "ein guter / ehrlicher / zuverlässiger Freund",
      "eine gute / hilfsbereite Freundin",
      "Ich mag ihn/sie, weil ...",
      "..., denn er/sie ...",
      "Er/Sie ist zuverlässig, deshalb ...",
      "Wir haben uns ... kennengelernt.",
      "Wollen wir uns am ... treffen?",
    ],
    studentQuestionsDe: [
      "Was macht eine Freundschaft für dich besonders?",
      "Welche drei Eigenschaften muss ein guter Freund haben?",
      "Wie habt ihr euch kennengelernt?",
      "Wie kann man einen Konflikt in einer Freundschaft lösen?",
      "Warum ist Vertrauen wichtig? Begründe mit weil, denn oder deshalb.",
    ],
    speakingModels: [
      {
        "questionDe": "Was macht eine Freundschaft für dich besonders?",
        "modelAnswerDe": "Eine Freundschaft ist für mich besonders, wenn wir offen miteinander sprechen können. Ein guter Freund hört auch bei Problemen zu. Außerdem können wir zusammen lachen, ohne uns verstellen zu müssen."
      },
      {
        "questionDe": "Welche drei Eigenschaften muss ein guter Freund haben?",
        "modelAnswerDe": "Ein guter Freund sollte ehrlich, zuverlässig und verständnisvoll sein. Ehrlichkeit schafft Vertrauen, und auf einen zuverlässigen Freund kann ich mich verlassen. Verständnis ist wichtig, wenn ich einen Fehler mache."
      },
      {
        "questionDe": "Wie habt ihr euch kennengelernt?",
        "modelAnswerDe": "Wir haben uns in einem Deutschkurs kennengelernt. Zuerst haben wir zusammen eine Aufgabe gemacht und danach unsere Telefonnummern ausgetauscht. Seitdem treffen wir uns regelmäßig und helfen uns beim Lernen."
      },
      {
        "questionDe": "Wie kann man einen Konflikt in einer Freundschaft lösen?",
        "modelAnswerDe": "Man sollte zuerst ruhig erklären, was einen verletzt hat. Danach sollte man dem anderen zuhören, ohne ihn zu unterbrechen. Wenn beide einen Fehler zugeben können, finden sie oft einen Kompromiss."
      },
      {
        "questionDe": "Warum ist Vertrauen wichtig? Begründe mit weil, denn oder deshalb.",
        "modelAnswerDe": "Vertrauen ist wichtig, weil ich mit einem Freund auch über persönliche Probleme sprechen möchte. Ich muss sicher sein, dass er meine Geheimnisse nicht weitererzählt. Deshalb ist Ehrlichkeit für mich die Grundlage einer Freundschaft."
      }
    ],
    teacherNotesEn: [
      "Use the rendered Day 2 grammar page as source of truth: adjective forms plus weil-sentences, with denn and deshalb as alternatives.",
      "Contrast predicative adjectives with adjective-before-noun forms: Er ist ehrlich versus ein ehrlicher Freund.",
      "Make verb-final weil visible, then compare normal V2 after denn and inversion after deshalb at clause start.",
      "Prepare the exact email task: how the friendship began, why it is special and a concrete meeting suggestion.",
      "Lesen and Hören both test trust, support, honesty, shared experiences and forgiveness, so recycle those nouns deliberately.",
    ],
    interactionFlow: [
      { phase: "Quality ranking", detailEn: "6 min: rank friendship qualities and justify the top three." },
      { phase: "Adjective forms", detailEn: "10 min: transform ehrlich → ein ehrlicher Freund / eine ehrliche Freundin / gute Freunde." },
      { phase: "Reason connectors", detailEn: "10 min: express the same reason with weil, denn and deshalb and compare word order." },
      { phase: "Friendship presentation", detailEn: "12 min: 60–90 seconds on qualities, a personal example and conflict resolution." },
      { phase: "Workbook bridge", detailEn: "7 min: outline the friend-for-life email and preview trust/support/forgiveness vocabulary for reading and listening." },
    ],
    wrapUpTaskDe: "Beschreibe eine wichtige Freundschaft in 5 Sätzen. Nutze mindestens eine korrekte Adjektivendung und je einen Satz mit weil oder deshalb.",
    workbookConnection: {
      grammarUrl: lessonRoute(2, "grammar"),
      workbookUrl: lessonRoute(2, "workbook"),
      parts: [
        { label: "Grammar", detailEn: "Friendship adjectives and adjective endings before nouns, plus reasons with weil (verb final), denn (normal V2) and deshalb (verb directly after deshalb when it starts the clause)." },
        { label: "Teil 1 · Sprechen", detailEn: "Explain what makes friendship special: name at least three qualities, give a personal example and explain how conflicts can be solved. Practice only." },
        { label: "Teil 2 · Schreiben", detailEn: "Write an email about a friend for life: explain how you met, why the friendship is special and propose a meeting." },
        { label: "Teil 3 · Lesen", detailEn: "Essay on true friendship: trust, support, shared interests, honesty, communication, respect and forgiveness." },
        { label: "Teil 4 · Hören", detailEn: "Friendship listening on support during problems, shared experiences, honesty, reactions to success and forgiveness after conflict." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Day 2 moves students from vague ‘nett’ descriptions to precise B1 friendship language. The grammar combines adjective forms with reason-giving, and the workbook uses the same semantic field across speaking, email writing, reading and listening.",
      grammarFocusEn: [
        "Predicative adjectives have no ending: Mein Freund ist ehrlich. Before a noun, the adjective is declined: ein ehrlicher Freund.",
        "High-frequency safe forms: ein guter Freund, eine gute Freundin, ein ehrliches Gespräch, gute Freunde / die guten Freunde.",
        "weil introduces a subordinate clause with the conjugated verb at the end.",
        "denn keeps normal main-clause V2; deshalb at the beginning is followed directly by the conjugated verb.",
      ],
      modelExamplesDe: [
        "Meine beste Freundin ist eine sehr zuverlässige Person.",
        "Ich vertraue ihr, weil sie immer ehrlich ist.",
        "Sie hört mir zu, denn sie ist sehr geduldig.",
        "Sie unterstützt mich immer, deshalb ist unsere Freundschaft besonders.",
      ],
      commonMistakesEn: [
        "weil er ist ehrlich instead of weil er ehrlich ist.",
        "eine guter Freundin / ein gute Freund instead of correctly declined adjective forms.",
        "deshalb ich vertraue ihm instead of deshalb vertraue ich ihm.",
        "Writing the email without the required meeting proposal.",
      ],
    },
  },
  {
    id: "b1-day-3-erfolgsgeschichten",
    course: "B1",
    day: "Day 3",
    dayNumber: 3,
    assignmentId: "B1-1.3",
    title: "B1 Day 3 · Erfolgsgeschichten",
    topic: "1.3 Erfolgsgeschichten",
    objective: "Students describe successful people, projects and challenges using adjective declension after indefinite/possessive articles, then apply the chapter language to a success presentation and the workbook email/comprehension tasks.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was bedeutet Erfolg für dich?",
      "Welche erfolgreiche Person inspiriert dich?",
      "Welche Herausforderung muss man oft überwinden, um erfolgreich zu sein?",
      "Welche Eigenschaft braucht eine erfolgreiche Person?",
    ],
    keyPhrasesDe: [
      "ein erfolgreicher Unternehmer",
      "eine mutige Sportlerin",
      "ein schwieriges Projekt",
      "einen erfahrenen Mentor",
      "mit einem klaren Plan",
      "mit einer guten Strategie",
      "Für mich bedeutet Erfolg, dass ...",
    ],
    studentQuestionsDe: [
      "Was ist für dich eine Erfolgsgeschichte?",
      "Welche Person oder Situation ist ein gutes Beispiel?",
      "Welche Herausforderung musste diese Person überwinden?",
      "Welche Strategie hat zum Erfolg geführt?",
      "Welche Eigenschaften braucht ein erfolgreicher Mensch?",
    ],
    speakingModels: [
      {
        "questionDe": "Was ist für dich eine Erfolgsgeschichte?",
        "modelAnswerDe": "Eine Erfolgsgeschichte zeigt für mich, wie jemand trotz Schwierigkeiten ein Ziel erreicht. Erfolg bedeutet nicht nur, viel Geld zu verdienen. Auch eine bestandene Prüfung nach mehreren Versuchen kann eine Erfolgsgeschichte sein."
      },
      {
        "questionDe": "Welche Person oder Situation ist ein gutes Beispiel?",
        "modelAnswerDe": "Ein gutes Beispiel ist meine Freundin, die ihre Deutschprüfung beim zweiten Versuch bestanden hat. Beim ersten Mal war sie sehr nervös und hat zu wenig gesprochen. Danach hat sie regelmäßig geübt und sich deutlich verbessert."
      },
      {
        "questionDe": "Welche Herausforderung musste diese Person überwinden?",
        "modelAnswerDe": "Sie musste ihre Prüfungsangst überwinden und neben ihrer Arbeit Zeit zum Lernen finden. Nach dem ersten Versuch war sie enttäuscht. Trotzdem hat sie weitergemacht und Unterstützung gesucht."
      },
      {
        "questionDe": "Welche Strategie hat zum Erfolg geführt?",
        "modelAnswerDe": "Sie hat einen Lernplan erstellt und jeden Tag eine halbe Stunde gesprochen. Außerdem hat sie ihre Fehler aufgeschrieben und gezielt wiederholt. Durch diese regelmäßige Übung wurde sie sicherer."
      },
      {
        "questionDe": "Welche Eigenschaften braucht ein erfolgreicher Mensch?",
        "modelAnswerDe": "Ein erfolgreicher Mensch braucht Geduld, Ausdauer und die Bereitschaft zu lernen. Er sollte Kritik annehmen und aus Fehlern lernen können. Wichtig ist auch, sich realistische Ziele zu setzen."
      }
    ],
    teacherNotesEn: [
      "Teach the actual Day 3 grammar page: adjective declension after ein/eine/kein and possessive articles across Nominativ, Akkusativ and Dativ.",
      "Prioritize the contrast ein erfolgreicher Mann → einen erfolgreichen Mann → mit einem erfolgreichen Mann.",
      "Use success-story vocabulary to make endings meaningful rather than drilling tables without context.",
      "The writing task is a short formal/apology email to Frau Wolmer about missing the success-story presentation; it is not an opinion essay.",
      "Mark Lesen/Hören as adjacent everyday-hero comprehension: nurse/single father/volunteers and Herr Müller the caretaker.",
    ],
    interactionFlow: [
      { phase: "Success adjectives", detailEn: "6 min: collect adjectives for people, tasks, projects and strategies." },
      { phase: "Case ladder", detailEn: "12 min: move the same noun phrase through Nominativ, Akkusativ and Dativ." },
      { phase: "Success-story build", detailEn: "10 min: describe one person, one challenge and one strategy with correctly declined adjectives." },
      { phase: "Speaking rehearsal", detailEn: "10 min: 60–90 second definition + example + challenge + strategy." },
      { phase: "Workbook bridge", detailEn: "7 min: plan the concise Frau-Wolmer apology email and distinguish the everyday-hero reading/listening from the grammar production task." },
    ],
    wrapUpTaskDe: "Erzähle eine kurze Erfolgsgeschichte mit vier Nominalgruppen: ein/eine ..., einen/eine ..., mit einem/einer ... und meine/keine ... .",
    workbookConnection: {
      grammarUrl: lessonRoute(3, "grammar"),
      workbookUrl: lessonRoute(3, "workbook"),
      parts: [
        { label: "Grammar", detailEn: "Adjective declension after indefinite, negative and possessive articles: Nominativ, Akkusativ and Dativ, including masculine ein ... -er / einen ... -en and Dativ mostly -en." },
        { label: "Teil 1 · Sprechen", detailEn: "Define a success story, give a concrete person/situation, describe at least one challenge and explain one strategy that led to success. Practice only." },
        { label: "Teil 2 · Schreiben", detailEn: "Short email to course leader Frau Wolmer: apologize for not being able to join the success-story presentation, explain why and include appropriate salutation and closing." },
        { label: "Teil 3 · Lesen", detailEn: "Separate everyday-hero text: a nurse, a single father and volunteers as quiet heroes whose small actions show courage and commitment." },
        { label: "Teil 4 · Hören", detailEn: "Separate everyday-hero listening about school caretaker Herr Müller, his early routine, a broken heating system, his immediate response and his satisfied exhaustion at day’s end." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Day 3 gives students the adjective-declension control needed to describe successful people and projects precisely. The workbook then shifts from success production to a short absence email and everyday-hero comprehension, which should be kept distinct in class.",
      grammarFocusEn: [
        "Nominativ after ein/eine: ein erfolgreicher Mann, eine mutige Frau, ein schwieriges Projekt; plural after possessives/kein normally -en.",
        "Akkusativ masculine is the key change: einen erfolgreichen Mann; feminine and neuter keep forms such as eine klare Strategie / ein schwieriges Projekt.",
        "Dativ after ein/eine/possessive articles uses adjective -en: mit einem erfahrenen Kollegen, mit einer erfolgreichen Unternehmerin.",
        "Teach article + adjective + noun as one chunk so students do not choose endings in isolation.",
      ],
      modelExamplesDe: [
        "Ein erfolgreicher Unternehmer braucht einen klaren Plan.",
        "Eine mutige Sportlerin überwindet eine schwierige Phase.",
        "Mit einem erfahrenen Mentor kann man wichtige Fehler vermeiden.",
        "Meine motivierten Freunde haben mich bei meinem Projekt unterstützt.",
      ],
      commonMistakesEn: [
        "ein erfolgreiche Mann instead of ein erfolgreicher Mann.",
        "einen mutiger Unternehmer instead of einen mutigen Unternehmer.",
        "mit ein guter Plan instead of mit einem guten Plan.",
        "Writing a long success essay instead of the short required apology/explanation email to Frau Wolmer.",
      ],
    },
  },
  {
    id: "b1-day-4-wohnung-suchen",
    course: "B1",
    day: "Day 4",
    dayNumber: 4,
    assignmentId: "B1-2.4",
    title: "B1 Day 4 · Wohnung suchen",
    topic: "2.4 Wohnung suchen",
    objective: "Students compare housing-search options and weigh advantages/disadvantages with paired connectors, then use the same argument structure in the workbook speaking and opinion-writing tasks.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Wie sucht man in deinem Land normalerweise eine Wohnung?",
      "Was ist wichtiger: gute Lage oder niedrige Miete?",
      "Würdest du lieber online oder über persönliche Kontakte suchen?",
      "Welche drei Kriterien sind für dich bei einer Wohnung wichtig?",
    ],
    keyPhrasesDe: [
      "sowohl ... als auch ...",
      "nicht nur ... sondern auch ...",
      "zwar ... aber ...",
      "einerseits ... andererseits ...",
      "entweder ... oder ...",
      "weder ... noch ...",
      "Ein Beispiel dafür ist, dass ...",
    ],
    studentQuestionsDe: [
      "Welche Methode ist erfolgreicher: Online-Portale oder persönliche Kontakte?",
      "Welchen Vorteil haben Online-Portale?",
      "Welchen Nachteil haben persönliche Kontakte oder Online-Portale?",
      "Was ist bei einer Wohnung sowohl praktisch als auch wichtig?",
      "Welche Methode würdest du wählen und warum?",
    ],
    speakingModels: [
      {
        "questionDe": "Welche Methode ist erfolgreicher: Online-Portale oder persönliche Kontakte?",
        "modelAnswerDe": "Für mich sind Online-Portale erfolgreicher, weil ich dort viele Angebote vergleichen kann. Persönliche Kontakte können zwar gute Hinweise geben, aber die Auswahl ist oft kleiner. Deshalb würde ich beide Wege nutzen und zuerst online suchen."
      },
      {
        "questionDe": "Welchen Vorteil haben Online-Portale?",
        "modelAnswerDe": "Online-Portale bieten viele Angebote an einem Ort. Ich kann nach Preis, Größe und Lage filtern und spare dadurch Zeit. Außerdem lassen sich verschiedene Wohnungen direkt vergleichen."
      },
      {
        "questionDe": "Welchen Nachteil haben persönliche Kontakte oder Online-Portale?",
        "modelAnswerDe": "Bei persönlichen Kontakten hängt die Suche davon ab, ob jemand eine freie Wohnung kennt. Auf Online-Portalen gibt es dagegen oft sehr viele Bewerber. Außerdem sollte man vorsichtig sein, weil nicht jede Anzeige seriös ist."
      },
      {
        "questionDe": "Was ist bei einer Wohnung sowohl praktisch als auch wichtig?",
        "modelAnswerDe": "Bei einer Wohnung ist eine gute Verkehrsanbindung sowohl praktisch als auch wichtig. Ich komme dadurch leichter zur Arbeit und brauche vielleicht kein Auto. Auch eine bezahlbare Miete ist entscheidend."
      },
      {
        "questionDe": "Welche Methode würdest du wählen und warum?",
        "modelAnswerDe": "Ich würde zuerst ein Online-Portal nutzen, weil ich gezielt nach meinem Budget suchen kann. Gleichzeitig würde ich Freunde fragen, ob sie etwas wissen. So erhöhe ich meine Chancen, eine passende Wohnung zu finden."
      }
    ],
    teacherNotesEn: [
      "Make paired connectors the organising system of the lesson, not just decorative vocabulary.",
      "Keep grammatical parallelism visible: sowohl Nomen als auch Nomen; nicht nur Adjektiv, sondern auch Adjektiv.",
      "Stress that these connectors normally link equal elements/main clauses and do not automatically send the verb to the end.",
      "Use the exact workbook comparison: Online-Portale versus persönliche Kontakte, with advantage, disadvantage, example and final opinion.",
      "Lesen and Hören remain housing-specific: big-city housing pressure and concrete apartment facts such as rent, Nebenkosten, furniture, pets and transport.",
    ],
    interactionFlow: [
      { phase: "Housing priorities", detailEn: "6 min: rank price, location, size, transport, condition and contacts." },
      { phase: "Connector matching", detailEn: "10 min: choose the connector that expresses addition, contrast, alternative or double negation." },
      { phase: "Online vs contacts", detailEn: "12 min: build paired arguments using einerseits/andererseits and zwar/aber." },
      { phase: "Opinion rehearsal", detailEn: "10 min: 1–2 minute answer with one advantage, one disadvantage, example and opinion." },
      { phase: "Workbook bridge", detailEn: "7 min: outline the 80-word opinion and preview housing-pressure reading plus apartment-detail listening." },
    ],
    wrapUpTaskDe: "Vergleiche Online-Portale und persönliche Kontakte in 5 Sätzen. Nutze mindestens zwei verschiedene zweiteilige Konnektoren.",
    workbookConnection: {
      grammarUrl: lessonRoute(4, "grammar"),
      workbookUrl: lessonRoute(4, "workbook"),
      parts: [
        { label: "Grammar", detailEn: "Paired connectors for adding, contrasting and choosing: sowohl ... als auch, nicht nur ... sondern auch, zwar ... aber, einerseits ... andererseits, entweder ... oder, weder ... noch." },
        { label: "Teil 1 · Sprechen", detailEn: "Compare Online-Portale and personal contacts for apartment hunting; give an advantage with example, a disadvantage with example and a final personal opinion. Practice only." },
        { label: "Teil 2 · Schreiben", detailEn: "Approximately 80-word opinion on whether personal contacts are more helpful than online portals; justify the position and give a concrete example." },
        { label: "Teil 3 · Lesen", detailEn: "Housing shortage in large cities: affordable housing, rising rents, high demand, investors, Mietpreisbremse/new construction and the need for patience/flexibility." },
        { label: "Teil 4 · Hören", detailEn: "Apartment-information listening: rent, Nebenkosten, whether the flat is furnished, permitted pets and public-transport connections." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Day 4 is an argument-structure lesson. Students learn to connect parallel points and weigh alternatives, then immediately use those structures to compare apartment-search methods in speaking and writing.",
      grammarFocusEn: [
        "sowohl ... als auch adds two equal points; keep both sides grammatically parallel.",
        "nicht nur ... sondern auch adds and strengthens a second point; do not replace sondern with aber.",
        "zwar ... aber and einerseits ... andererseits are ideal for balanced B1 evaluation.",
        "entweder ... oder gives alternatives; weder ... noch negates both and needs no extra nicht.",
      ],
      modelExamplesDe: [
        "Sowohl die Lage als auch der Mietpreis sind wichtig.",
        "Online-Portale sind zwar praktisch, aber dort gibt es viel Konkurrenz.",
        "Einerseits findet man online viele Angebote, andererseits helfen persönliche Kontakte oft schneller.",
        "Ich suche entweder über ein Portal oder über Freunde.",
      ],
      commonMistakesEn: [
        "nicht nur ... aber auch instead of nicht nur ... sondern auch.",
        "Adding an unnecessary nicht to weder ... noch.",
        "Sending the verb to the end after aber/sondern/or the second half of a paired main-clause connector.",
        "Giving only one side of the online-versus-contacts comparison instead of weighing both.",
      ],
    },
  },
  {
    id: "b1-day-5-besichtigungstermin",
    course: "B1",
    day: "Day 5",
    dayNumber: 5,
    assignmentId: "B1-2.5",
    title: "B1 Day 5 · Der Besichtigungstermin",
    topic: "2.5 Der Besichtigungstermin",
    objective: "Students arrange apartment-viewing appointments politely with Konjunktiv II and indirect questions, then perform the exact role-play and formal email required in the workbook.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Welche Fragen stellst du bei einer Wohnungsbesichtigung?",
      "Wie fragst du höflich nach einem Termin?",
      "Welche Informationen brauchst du vor einer Besichtigung?",
      "Was kontrollierst du in einer Wohnung zuerst?",
    ],
    keyPhrasesDe: [
      "Könnten Sie mir bitte ...?",
      "Wäre Samstag um 14 Uhr möglich?",
      "Ich würde die Wohnung gern besichtigen.",
      "Ich möchte wissen, ob ...",
      "Könnten Sie mir sagen, wann ...?",
      "Dürfte ich fragen, wie hoch ...?",
      "Ich würde mich über eine Bestätigung freuen.",
    ],
    studentQuestionsDe: [
      "Wie würdest du höflich um einen Besichtigungstermin bitten?",
      "Welche vier Fragen würdest du dem Vermieter stellen?",
      "Wie fragst du indirekt, ob die Wohnung noch frei ist?",
      "Wie fragst du indirekt nach den Nebenkosten?",
      "Wie bittest du höflich um eine Bestätigung?",
    ],
    speakingModels: [
      {
        "questionDe": "Wie würdest du höflich um einen Besichtigungstermin bitten?",
        "modelAnswerDe": "Guten Tag, ich interessiere mich für Ihre Wohnung. Wäre es möglich, einen Besichtigungstermin zu vereinbaren? Am Dienstag oder Donnerstag hätte ich nachmittags Zeit."
      },
      {…3037 tokens truncated…rs help weigh perspectives.",
        "Relative clauses add place information: Das ist die Stadt, in der ich studiert habe; Das Dorf, in dem meine Familie lebt, ist ruhig.",
      ],
      modelExamplesDe: [
        "Auf dem Land ist es ruhiger als in der Stadt.",
        "Ich bevorzuge die Stadt, weil es dort mehr Arbeitsmöglichkeiten gibt.",
        "Obwohl das Land ruhiger ist, fehlen manchmal gute Busverbindungen.",
        "Das ist die Stadt, in der ich gern arbeiten würde.",
      ],
      commonMistakesEn: [
        "Using wie after a comparative difference instead of als.",
        "weil ich brauche Ruhe instead of weil ich Ruhe brauche.",
        "Giving a one-sided list without a disadvantage or counterpoint.",
        "Forgetting verb-final order in obwohl and relative clauses.",
      ],
    },
  },
  {
    id: "b1-day-7-fast-food-hausmannskost",
    course: "B1",
    day: "Day 7",
    dayNumber: 7,
    assignmentId: "B1-3.7",
    title: "B1 Day 7 · Fast Food vs. Hausmannskost",
    topic: "3.7 Fast Food vs. Hausmannskost",
    objective: "Students compare food choices while forming the Genitiv accurately, especially with wegen and trotz, then use that grammar in the workbook discussion/opinion tasks and prepare for the sugar-focused reading/listening section.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Wie oft isst du Fast Food?",
      "Warum kochst du gern oder nicht gern selbst?",
      "Was ist für dich gesünder: Fertiggerichte oder Hausmannskost?",
      "Welche Rolle spielen Preis, Zeit, Zucker und Fett bei deiner Wahl?",
    ],
    keyPhrasesDe: [
      "wegen des hohen Zuckeranteils",
      "wegen der ungesunden Zutaten",
      "trotz des günstigen Preises",
      "trotz der langen Zubereitungszeit",
      "die Vorteile der Hausmannskost",
      "die Qualität der frischen Zutaten",
      "Einerseits ..., andererseits ...",
    ],
    studentQuestionsDe: [
      "Fast Food oder Hausmannskost – was ist besser?",
      "Welche zwei Vorteile und zwei Nachteile hat Fast Food?",
      "Warum isst du bestimmte Lebensmittel selten oder oft? Nutze wegen.",
      "Was machst du trotz eines Nachteils? Nutze trotz.",
      "Sind Fertiggerichte eine gute Wahl für eine gesunde Ernährung?",
    ],
    speakingModels: [
      {
        "questionDe": "Fast Food oder Hausmannskost – was ist besser?",
        "modelAnswerDe": "Für mich ist Hausmannskost besser, weil ich die Zutaten selbst auswählen kann. Ich kann zum Beispiel mehr Gemüse und weniger Salz verwenden. Fast Food ist praktisch, wenn ich wenig Zeit habe, sollte aber nicht meine einzige Wahl sein."
      },
      {
        "questionDe": "Welche zwei Vorteile und zwei Nachteile hat Fast Food?",
        "modelAnswerDe": "Fast Food ist schnell verfügbar und oft bequem unterwegs zu essen. Allerdings enthalten viele Angebote viel Salz oder Fett. Außerdem entsteht durch die Verpackung häufig viel Müll."
      },
      {
        "questionDe": "Warum isst du bestimmte Lebensmittel selten oder oft? Nutze wegen.",
        "modelAnswerDe": "Wegen ihres hohen Zuckergehalts trinke ich Limonade nur selten. Gemüse esse ich dagegen oft wegen seiner Vitamine. Außerdem schmeckt mir ein frisch gekochtes Essen besser."
      },
      {
        "questionDe": "Was machst du trotz eines Nachteils? Nutze trotz.",
        "modelAnswerDe": "Trotz meines vollen Terminkalenders koche ich abends meistens selbst. Ich bereite einfache Gerichte zu, die nicht lange dauern. Dadurch muss ich nicht jeden Tag Essen bestellen."
      },
      {
        "questionDe": "Sind Fertiggerichte eine gute Wahl für eine gesunde Ernährung?",
        "modelAnswerDe": "Das hängt von den Zutaten ab. Manche Fertiggerichte enthalten viel Salz, andere können eine praktische Ergänzung sein. Ich würde die Zutatenliste prüfen und zum Beispiel frisches Gemüse dazu essen."
      }
    ],
    teacherNotesEn: [
      "Teach Genitiv as a functional case: possession/relationship and especially the prepositions wegen and trotz in standard written German.",
      "Make article changes visible: der/das → des, die/plural → der; masculine/neuter singular nouns usually gain -s/-es.",
      "After a Genitiv article, adjectives normally use -en: wegen des hohen Zuckeranteils.",
      "Use the exact speaking/writing contrast: Fast Food/Hausmannskost and Fertiggerichte/healthy diet.",
      "Flag the workbook shift: Lesen is about sweets/sugar and includes an additional A–F advertisement matching task; Hören also focuses on hidden sugar and health risks.",
    ],
    interactionFlow: [
      { phase: "Food comparison", detailEn: "6 min: gather practical pros/cons for Fast Food, home cooking and ready meals." },
      { phase: "Genitiv conversion", detailEn: "10 min: convert der/das/die phrases to des/der and add noun -s/-es where needed." },
      { phase: "wegen/trotz builder", detailEn: "10 min: express reasons and concessions with full Genitiv noun phrases." },
      { phase: "Discussion rehearsal", detailEn: "12 min: two advantages + two disadvantages + personal habit using wegen/trotz." },
      { phase: "Workbook bridge", detailEn: "7 min: outline the Fertiggerichte opinion and explicitly switch vocabulary to sugar, health effects and advertisement matching for Lesen/Hören." },
    ],
    wrapUpTaskDe: "Formuliere vier Sätze: zwei mit wegen + Genitiv und zwei mit trotz + Genitiv zum Thema Fast Food, Hausmannskost oder Zucker.",
    workbookConnection: {
      grammarUrl: lessonRoute(7, "grammar"),
      workbookUrl: lessonRoute(7, "workbook"),
      parts: [
        { label: "Grammar", detailEn: "Genitiv for possession/relationship and after wegen/trotz: des/eines for masculine/neuter with noun -s/-es, der/einer for feminine, der for plural; adjectives normally -en after the Genitiv article." },
        { label: "Teil 1 · Sprechen", detailEn: "Discuss Fast Food versus Hausmannskost for 1–2 minutes: at least two advantages, two disadvantages and a justified personal eating habit; use structures such as einerseits/andererseits, wegen and trotz. Practice only." },
        { label: "Teil 2 · Schreiben", detailEn: "Approximately 80-word opinion on whether ready meals are a good choice for healthy eating; react to Tanja, discuss pros/cons and explain your practical solution." },
        { label: "Teil 3 · Lesen", detailEn: "Separate sugar/health section: seven questions on the effects of sweets plus five A–F advertisement-matching tasks on healthy eating, diet programs, sugar-free sweets, restaurants and chocolate offers." },
        { label: "Teil 4 · Hören", detailEn: "Separate sugar-focused listening: hidden sugar, short-term effects, long-term health risks and expert recommendations." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Day 7 combines a familiar food debate with a precise case target. The teacher should make Genitiv phrases usable in argumentation, then explicitly signal the workbook’s shift from Fast Food/Hausmannskost to sugar-health comprehension and advertisements.",
      grammarFocusEn: [
        "Genitiv asks Wessen? and expresses belonging/relationship: die Qualität der Zutaten, der Geschmack des Essens.",
        "Maskuline/neuter singular: des/eines + noun usually -s/-es; feminine/plural: der/einer without an added Genitiv noun ending.",
        "wegen + Genitiv gives a reason; trotz + Genitiv expresses an action/result despite an obstacle.",
        "Adjectives after a Genitiv article normally end in -en: wegen des hohen Fettanteils, trotz der langen Zubereitungszeit.",
      ],
      modelExamplesDe: [
        "Wegen des hohen Zuckeranteils trinke ich wenig Cola.",
        "Trotz des günstigen Preises kaufe ich Fast Food nur selten.",
        "Trotz der langen Zubereitungszeit koche ich lieber frisch.",
        "Die Qualität der frischen Zutaten ist für mich sehr wichtig.",
      ],
      commonMistakesEn: [
        "Using Dativ article forms where the lesson expects standard Genitiv after wegen/trotz.",
        "Forgetting -s/-es on masculine/neuter singular Genitiv nouns.",
        "Using an adjective ending other than -en after a clear Genitiv article.",
        "Treating the Lesen section as another Fast-Food text and overlooking the separate sugar + advertisement task structure.",
      ],
    },
  },
  {
    id: "b1-day-8-alles-fuer-die-gesundheit",
    course: "B1",
    day: "Day 8",
    dayNumber: 8,
    assignmentId: "B1-3.8",
    title: "B1 Day 8 · Alles für die Gesundheit",
    topic: "3.8 Alles für die Gesundheit",
    objective: "Students give differentiated health advice and express necessity, possibility and healthy limits with modal verbs, then apply those forms to the workbook lifestyle discussion/opinion while recognizing the separate medical-hero comprehension tasks.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was tust du, um gesund zu bleiben?",
      "Was sollte man jeden Tag für die Gesundheit tun?",
      "Wann muss man zum Arzt gehen?",
      "Was kann gegen Stress helfen?",
    ],
    keyPhrasesDe: [
      "Man sollte ...",
      "Bei starken Beschwerden muss man ...",
      "... kann helfen.",
      "Man darf auch Pausen machen.",
      "Ich möchte ... verbessern.",
      "Ich glaube, dass man ... machen sollte.",
      "..., weil ... helfen kann.",
    ],
    studentQuestionsDe: [
      "Wie wichtig ist eine gesunde Lebensweise für dich?",
      "Welche drei Dinge sollte man regelmäßig tun?",
      "Wann muss man ärztliche Hilfe suchen?",
      "Welche Methode kann Stress reduzieren?",
      "Sind regelmäßige Sporteinheiten der Schlüssel zu einem gesunden Leben?",
    ],
    speakingModels: [
      {
        "questionDe": "Wie wichtig ist eine gesunde Lebensweise für dich?",
        "modelAnswerDe": "Eine gesunde Lebensweise ist mir wichtig, weil ich mich im Alltag fit fühlen möchte. Ich achte auf Bewegung, ausreichend Schlaf und abwechslungsreiches Essen. Trotzdem möchte ich mir gelegentlich auch etwas Süßes gönnen."
      },
      {
        "questionDe": "Welche drei Dinge sollte man regelmäßig tun?",
        "modelAnswerDe": "Man sollte sich regelmäßig bewegen, abwechslungsreich essen und ausreichend schlafen. Ich gehe zum Beispiel oft spazieren und koche mit Gemüse. Feste Schlafzeiten helfen mir, morgens ausgeruht zu sein."
      },
      {
        "questionDe": "Wann muss man ärztliche Hilfe suchen?",
        "modelAnswerDe": "Wenn Beschwerden stark sind, länger anhalten oder schlimmer werden, sollte man ärztlichen Rat suchen. Bei plötzlich auftretenden ernsten Beschwerden muss man sofort Hilfe holen. Ich würde gesundheitliche Probleme nicht einfach ignorieren."
      },
      {
        "questionDe": "Welche Methode kann Stress reduzieren?",
        "modelAnswerDe": "Ein ruhiger Spaziergang hilft mir, Stress zu reduzieren. Dabei lege ich mein Handy weg und konzentriere mich auf meine Umgebung. Danach kann ich oft wieder klarer denken."
      },
      {
        "questionDe": "Sind regelmäßige Sporteinheiten der Schlüssel zu einem gesunden Leben?",
        "modelAnswerDe": "Regelmäßiger Sport ist ein wichtiger Teil eines gesunden Lebens, aber nicht der einzige. Auch Schlaf, Ernährung und Erholung spielen eine Rolle. Für mich ist eine gute Mischung entscheidend."
      }
    ],
    teacherNotesEn: [
      "Teach modal meaning, not only form: sollte recommendation, muss necessity, kann possibility, darf permission/healthy boundary, möchte personal intention.",
      "Keep the modal infinitive-final structure visible in main clauses and the modal group final in weil/dass subordinate clauses.",
      "Use the exact speaking map: nutrition, sport, stress and doctor visits; avoid generic medical vocabulary without advice language.",
      "The writing task asks whether regular exercise is the key to healthy living and must also address nutrition and personal habits.",
      "Explicitly separate the workbook comprehension: Lesen is a modern medical hero; Hören follows Herr Weber’s work, attitude, calm problem-solving and emotional support rather than a lifestyle-advice lecture.",
    ],
    interactionFlow: [
      { phase: "Advice continuum", detailEn: "6 min: sort health statements into suggestion, necessity, possibility and permission/limit." },
      { phase: "Modal sentence build", detailEn: "10 min: modal in V2 + infinitive final; then move the same idea into dass/weil with the modal group final." },
      { phase: "Health clinic", detailEn: "10 min: students give recommendations for food, exercise, stress, sleep and doctor visits." },
      { phase: "Opinion rehearsal", detailEn: "12 min: answer whether regular sport is the key, balancing exercise, nutrition and personal routine." },
      { phase: "Workbook bridge", detailEn: "7 min: preview the medical-hero reading/listening as separate comprehension and identify the vocabulary shift." },
    ],
    wrapUpTaskDe: "Gib fünf Gesundheitstipps: einen mit sollte, einen mit muss, einen mit kann, einen mit darf und einen persönlichen Plan mit möchte.",
    workbookConnection: {
      grammarUrl: lessonRoute(8, "grammar"),
      workbookUrl: lessonRoute(8, "workbook"),
      parts: [
        { label: "Grammar", detailEn: "Modal verbs for health communication: sollte for advice, muss for necessity, kann for possibility, darf for permission/limits and möchte for intention; infinitive final in main clauses and modal group final in weil/dass clauses." },
        { label: "Teil 1 · Sprechen", detailEn: "Discuss how important a healthy lifestyle is: nutrition, sport, stress and doctor visits; use modal verbs and B1 opinion language. Practice only." },
        { label: "Teil 2 · Schreiben", detailEn: "80–100 word opinion on whether regular sport is the key to a healthy life; react to Max, discuss sport, nutrition and personal habits/improvements." },
        { label: "Teil 3 · Lesen", detailEn: "Separate medical-hero comprehension: ‘Ein moderner Held in der Medizinwelt’, with seven questions about professional care and contribution." },
        { label: "Teil 4 · Hören", detailEn: "Separate medical-professional listening about Herr Weber’s daily work, attitude, calm problem-solving, emotional support and how patients/colleagues perceive him." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Day 8 teaches students to calibrate health statements—advice is not the same as obligation, and possibility is not certainty. Speaking/writing stay lifestyle-focused, while Lesen/Hören deliberately move to medical-hero comprehension.",
      grammarFocusEn: [
        "Main clause: subject + modal verb in position 2 + complements + infinitive at the end.",
        "sollte = recommendation; muss = necessity; kann = possibility; darf = permission/limit; möchte = intention/wish.",
        "In subordinate clauses with dass/weil, the modal construction sits at the end: dass man regelmäßig Sport machen sollte; weil Stress den Schlaf stören kann.",
        "Choose the modal according to communicative strength; avoid turning every health suggestion into müssen.",
      ],
      modelExamplesDe: [
        "Man sollte täglich genug Wasser trinken.",
        "Bei starken Schmerzen muss man zum Arzt gehen.",
        "Yoga kann beim Stressabbau helfen.",
        "Ich glaube, dass man regelmäßig Sport machen sollte.",
      ],
      commonMistakesEn: [
        "man sollte isst instead of man sollte essen.",
        "weil man sollte schlafen instead of weil man schlafen sollte.",
        "Using müssen for every recommendation and making the statement unnecessarily strong.",
        "Assuming the reading/listening are direct lifestyle-advice exercises when they actually center on medical professionals/heroes.",
      ],
    },
  },
  {
    id: "b1-day-9-work-life-balance",
    course: "B1",
    day: "Day 9",
    dayNumber: 9,
    assignmentId: "B1-3.9",
    title: "B1 Day 9 · Work-Life-Balance",
    topic: "3.9 Work-Life-Balance im modernen Arbeitsumfeld",
    objective: "Students explain goals, methods, alternatives and contrasts with um … zu, damit, indem, statt/ohne … zu, obwohl and trotzdem, then build the structured Work-Life-Balance opinion required by the workbook.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Was bedeutet Work-Life-Balance für dich?",
      "Was verursacht bei dir Stress im Alltag?",
      "Welche Strategie hilft dir, Arbeit und Freizeit zu trennen?",
      "Ist Homeoffice für die Work-Life-Balance eher hilfreich oder problematisch?",
    ],
    keyPhrasesDe: [
      "..., um ... zu ...",
      "..., damit ...",
      "..., indem ...",
      "Statt ... zu ..., ...",
      "..., ohne ... zu ...",
      "Obwohl ..., ...",
      "Trotzdem ...",
      "Zusammenfassend lässt sich sagen, dass ...",
    ],
    studentQuestionsDe: [
      "Ist eine gute Work-Life-Balance in der modernen Welt möglich?",
      "Welche Faktoren stören die Balance am stärksten?",
      "Wie können Arbeitgeber helfen? Nutze damit oder indem.",
      "Welche persönliche Strategie hilft dir?",
      "Welche Vor- und Nachteile hat Homeoffice?",
    ],
    speakingModels: [
      {
        "questionDe": "Ist eine gute Work-Life-Balance in der modernen Welt möglich?",
        "modelAnswerDe": "Ja, eine gute Work-Life-Balance ist möglich, aber man muss Grenzen setzen. Arbeit und Freizeit sollten nicht ständig ineinander übergehen. Auch der Arbeitgeber muss darauf achten, dass die Aufgaben in der Arbeitszeit zu schaffen sind."
      },
      {
        "questionDe": "Welche Faktoren stören die Balance am stärksten?",
        "modelAnswerDe": "Zu viele Überstunden und ständige Erreichbarkeit stören die Balance besonders. Lange Arbeitswege nehmen ebenfalls Zeit weg. Dadurch bleibt weniger Zeit für Familie, Freunde und Erholung."
      },
      {
        "questionDe": "Wie können Arbeitgeber helfen? Nutze damit oder indem.",
        "modelAnswerDe": "Arbeitgeber können flexible Arbeitszeiten anbieten, damit Beschäftigte ihren Alltag besser planen können. Sie helfen auch, indem sie Aufgaben fair verteilen. Außerdem sollten sie Nachrichten nach Feierabend nicht sofort beantwortet erwarten."
      },
      {
        "questionDe": "Welche persönliche Strategie hilft dir?",
        "modelAnswerDe": "Ich plane feste Zeiten für Arbeit und Freizeit. Nach Feierabend schalte ich berufliche Benachrichtigungen aus. Außerdem reserviere ich bewusst Zeit für Sport und Freunde."
      },
      {
        "questionDe": "Welche Vor- und Nachteile hat Homeoffice?",
        "modelAnswerDe": "Im Homeoffice spare ich den Arbeitsweg und kann meinen Tag flexibler gestalten. Allerdings fehlen manchmal persönliche Gespräche mit Kollegen. Außerdem fällt es mir schwerer, nach der Arbeit wirklich abzuschalten."
      }
    ],
    teacherNotesEn: [
      "Organize grammar by communicative function: purpose (um ... zu/damit), method (indem), alternative/absence (statt/ohne ... zu), contrast (obwohl/trotzdem).",
      "Keep the subject rule explicit: um ... zu normally requires the same subject; damit allows a separate subject.",
      "Contrast damit = goal with indem = method through paired examples.",
      "Use the workbook opinion architecture: Lisa → for/against → Homeoffice/flexible hours → personal/home-country example → own position → conclusion.",
      "Day 9 Hören is self-check only. The tutor evaluates/submits only Teil 2 Schreiben and Teil 3 Lesen; do not tell students to submit listening answers.",
    ],
    interactionFlow: [
      { phase: "Function sort", detailEn: "7 min: classify sentence goals as purpose, method, alternative or contrast." },
      { phase: "um zu vs damit", detailEn: "10 min: decide whether subjects are the same or different and build the correct purpose clause." },
      { phase: "Method/contrast", detailEn: "10 min: solve Work-Life problems using indem, statt/ohne ... zu, obwohl and trotzdem." },
      { phase: "Opinion rehearsal", detailEn: "12 min: balanced answer on whether Work-Life-Balance is possible, including one employer measure and one personal strategy." },
      { phase: "Workbook bridge", detailEn: "7 min: map Lisa’s writing prompt and explain that Stress reading is submitted while the listening is independent self-check only." },
    ],
    wrapUpTaskDe: "Schreibe sechs Sätze zur Work-Life-Balance: je einen mit um … zu, damit, indem, statt/ohne … zu und obwohl/trotzdem.",
    workbookConnection: {
      grammarUrl: lessonRoute(9, "grammar"),
      workbookUrl: lessonRoute(9, "workbook"),
      subtitle: "Teach toward the same Grammar, Sprechen, Schreiben and Lesen tasks students see in Falowen. Teil 4 · Hören is self-check only and is not submitted for tutor evaluation.",
      parts: [
        { label: "Grammar", detailEn: "Purpose with um ... zu (normally same subject) and damit (own subject), method with indem, alternative/absence with statt ... zu / ohne ... zu, and contrast with obwohl/trotzdem." },
        { label: "Teil 1 · Sprechen", detailEn: "Discuss whether good Work-Life-Balance is possible: definition, challenges, strategies, benefits and future developments, with examples from daily life/home country. Practice only." },
        { label: "Teil 2 · Schreiben", detailEn: "Opinion response to Lisa: arguments for/against, role of Homeoffice/flexible work, personal or home-country example, clear position and conclusion. This part is submitted." },
        { label: "Teil 3 · Lesen", detailEn: "Submitted reading on everyday stress and health: causes, symptoms, chronic risks, exercise, nutrition, sleep, relaxation and social contact." },
        { label: "Teil 4 · Hören", detailEn: "SELF-CHECK ONLY: stress-management listening on realistic goals, exercise, yoga/relaxation, sleep and social contacts. Students mark their own answers; this part is not submitted." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Day 9 is a high-value B1 connector lesson. Students learn to distinguish purpose from method and subordinate-clause contrast from main-clause contrast, then apply those choices to a balanced Work-Life-Balance discussion and opinion text. Listening is explicitly self-check only.",
      grammarFocusEn: [
        "um ... zu expresses purpose with the same subject: Ich mache Pausen, um konzentriert zu bleiben.",
        "damit expresses purpose with a full subordinate clause and can introduce a different subject: Die Firma bietet Gleitzeit an, damit Eltern flexibler arbeiten können.",
        "indem answers ‘how/by what method?’: Man reduziert Stress, indem man klare Arbeitszeiten festlegt.",
        "obwohl is a verb-final subordinate clause; trotzdem starts/continues a main clause and is followed by the conjugated verb.",
      ],
      modelExamplesDe: [
        "Ich schalte mein Diensthandy aus, um mich besser zu erholen.",
        "Die Firma bietet Gleitzeit an, damit Eltern flexibler arbeiten können.",
        "Man reduziert Stress, indem man realistische Ziele setzt.",
        "Obwohl ich viel Arbeit habe, mache ich Pausen. Ich habe viel Arbeit. Trotzdem mache ich Pausen.",
      ],
      commonMistakesEn: [
        "um ich gesund bleibe instead of um gesund zu bleiben.",
        "Using um ... zu when the second clause has a different subject and damit is needed.",
        "damit/indem confused: purpose versus method.",
        "Asking students to submit Teil 4 Hören even though Day 9 explicitly makes it self-check only.",
      ],
    },
  },
  {
    id: "b1-day-10-digitale-auszeit",
    course: "B1",
    day: "Day 10",
    dayNumber: 10,
    assignmentId: "B1-4.10",
    title: "B1 Day 10 · Digitale Auszeit und Selbstfürsorge",
    topic: "4.10 Digitale Auszeit und Selbstfürsorge",
    objective: "Students compare digital habits and self-care strategies using Komparativ, Superlativ, so … wie and je … desto, then build the workbook discussion/opinion while respecting the self-check-only listening workflow.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: [
      "Wie viele Stunden pro Tag benutzt du dein Smartphone?",
      "Was ist entspannender als soziale Medien?",
      "Welche Selbstfürsorge-Strategie ist für dich am wichtigsten?",
      "Hast du schon einmal eine digitale Auszeit gemacht?",
    ],
    keyPhrasesDe: [
      "... ist entspannender als ...",
      "... ist so wichtig wie ...",
      "... ist für mich am wichtigsten.",
      "Ich lese lieber, als ...",
      "Je weniger ..., desto ...",
      "Im Vergleich zu ...",
      "Einerseits ..., andererseits ...",
      "Zusammenfassend bin ich der Meinung, dass ...",
    ],
    studentQuestionsDe: [
      "Brauchen wir digitale Auszeiten für unsere Gesundheit?",
      "Welche Aktivität ist für dich entspannender als Scrollen?",
      "Welche Strategie ist am wichtigsten und warum?",
      "Je weniger Bildschirmzeit du hast, desto was verändert sich bei dir?",
      "Welche Schwierigkeit hat eine digitale Auszeit im Alltag?",
    ],
    speakingModels: [
      {
        "questionDe": "Brauchen wir digitale Auszeiten für unsere Gesundheit?",
        "modelAnswerDe": "Ja, digitale Auszeiten können helfen, bewusster mit dem Handy umzugehen. Wenn ich ständig Nachrichten lese, kann ich mich schlechter konzentrieren. Deshalb lege ich beim Essen und vor dem Schlafengehen mein Handy weg."
      },
      {
        "questionDe": "Welche Aktivität ist für dich entspannender als Scrollen?",
        "modelAnswerDe": "Ein Spaziergang ist für mich entspannender als Scrollen. Ich bewege mich und nehme meine Umgebung wahr. Danach fühle ich mich ruhiger als nach einer Stunde am Handy."
      },
      {
        "questionDe": "Welche Strategie ist am wichtigsten und warum?",
        "modelAnswerDe": "Für mich sind feste handyfreie Zeiten am wichtigsten. Eine klare Regel ist leichter einzuhalten als der allgemeine Wunsch, weniger online zu sein. Deshalb benutze ich beim gemeinsamen Essen kein Handy."
      },
      {
        "questionDe": "Je weniger Bildschirmzeit du hast, desto was verändert sich bei dir?",
        "modelAnswerDe": "Je weniger Zeit ich am Bildschirm verbringe, desto mehr Zeit habe ich für Freunde und Bewegung. Außerdem fällt es mir leichter, mich auf eine Aufgabe zu konzentrieren. Für meine Arbeit brauche ich den Computer natürlich weiterhin."
      },
      {
        "questionDe": "Welche Schwierigkeit hat eine digitale Auszeit im Alltag?",
        "modelAnswerDe": "Eine Schwierigkeit ist, dass viele berufliche Informationen digital kommen. Ich kann mein Handy deshalb nicht den ganzen Tag ausschalten. Stattdessen plane ich kurze Auszeiten und sage anderen, wann ich erreichbar bin."
      }
    ],
    teacherNotesEn: [
      "Teach the full comparison system: difference with Komparativ + als, equality with so/genauso ... wie, highest degree with Superlativ and relationship with je ... desto/umso.",
      "Include irregular forms that students need in natural discussion: besser, mehr, lieber, am liebsten.",
      "Make je-clause word order explicit: verb final; the desto/umso clause begins with the comparison phrase and then the conjugated verb.",
      "Use the workbook writing task to balance benefits, one difficulty/counterargument, two concrete strategies and a personal/home-country example.",
      "Day 10 Hören is self-check only. Tutor evaluation/submission is limited to Schreiben and Lesen; do not present the listening questions as submission work.",
    ],
    interactionFlow: [
      { phase: "Habit comparison", detailEn: "6 min: compare phone use, reading, walking, sleep and personal conversations." },
      { phase: "Comparison system", detailEn: "10 min: practise als vs so ... wie and regular/irregular comparative forms." },
      { phase: "Superlative + je/desto", detailEn: "10 min: rank self-care strategies, then express cause-like correlations with je ... desto." },
      { phase: "Digital-detox discussion", detailEn: "12 min: benefits, practical challenge, personal strategy and recommendation." },
      { phase: "Workbook bridge", detailEn: "7 min: map the opinion task, preview Miriam’s weekend-without-smartphone reading and explain that Hören is self-check only." },
    ],
    wrapUpTaskDe: "Formuliere fünf Sätze über digitale Selbstfürsorge: einen Komparativ mit als, einen Vergleich mit so … wie, einen Superlativ und einen Satz mit je … desto.",
    workbookConnection: {
      grammarUrl: lessonRoute(10, "grammar"),
      workbookUrl: lessonRoute(10, "workbook"),
      subtitle: "Teach toward the same Grammar, Sprechen, Schreiben and Lesen tasks students see in Falowen. Teil 4 · Hören is self-check only and is not submitted for tutor evaluation.",
      parts: [
        { label: "Grammar", detailEn: "Comparisons for digital habits: Komparativ + als, equality with so/genauso ... wie, Superlativ, irregular besser/mehr/lieber/am liebsten and je ... desto/umso correlations." },
        { label: "Teil 1 · Sprechen", detailEn: "Discuss whether digital breaks are necessary for health: importance, challenges, self-care, pros/cons, personal experience and concrete strategies. Practice only." },
        { label: "Teil 2 · Schreiben", detailEn: "Opinion on digital detox: summarize the impulse, give at least two benefits, one challenge, two concrete strategies, personal/home-country example and a clear conclusion. This part is submitted." },
        { label: "Teil 3 · Lesen", detailEn: "Submitted reading ‘Ein Wochenende ohne Smartphone’: Miriam’s initial anxiety, offline activities, deeper conversation, practical limitations and her move toward more conscious—not zero—technology use." },
        { label: "Teil 4 · Hören", detailEn: "SELF-CHECK ONLY: listening on stress/overwork, productivity after breaks, relationships, healthy work-leisure balance and the risk of loneliness from too much time alone. Not submitted." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Day 10 uses comparison grammar to make digital-detox arguments more precise. Students compare habits, rank strategies and express correlations, then use that language in a realistic digital-self-care opinion task. Lesen is submitted; Hören remains independent self-check.",
      grammarFocusEn: [
        "Difference: Komparativ + als; equality: so/genauso + adjective + wie.",
        "Superlative: am + -sten/-esten predicatively, or article + attributive -ste form before a noun.",
        "Important irregular forms: gut → besser → am besten; viel → mehr → am meisten; gern → lieber → am liebsten.",
        "je ... desto/umso: the je-clause ends with the conjugated verb; the desto/umso comparison phrase is followed by the main-clause verb.",
      ],
      modelExamplesDe: [
        "Ein Spaziergang ist entspannender als eine Stunde in sozialen Medien.",
        "Genug Schlaf ist genauso wichtig wie regelmäßige Bewegung.",
        "Für mich ist eine bildschirmfreie Stunde am Abend am wichtigsten.",
        "Je weniger Benachrichtigungen ich bekomme, desto ruhiger kann ich arbeiten.",
      ],
      commonMistakesEn: [
        "Using wie after a comparative difference: besser wie instead of besser als.",
        "so entspannender wie instead of so entspannend wie.",
        "die am wichtigste Regel instead of die wichtigste Regel.",
        "Asking students to submit Day 10 listening answers even though Teil 4 is explicitly self-check only.",
      ],
    },
  },
];

export function getB1WorkbookAlignedSlideDay1To10(assignmentId) {
  const normalized = String(assignmentId || "").trim().toUpperCase();
  if (!normalized) return null;
  return b1WorkbookAlignedSlidesDays1To10.find(
    (slide) => String(slide.assignmentId || "").trim().toUpperCase() === normalized,
  ) || null;
}
