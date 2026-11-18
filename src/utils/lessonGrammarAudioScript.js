// Create a concise, lesson-aware narration draft locally, without a Gemini script call.
// The source is the authored teaching curriculum, never a generic topic guess.
const clean = value => String(value || "").replace(/\s+/g, " ").trim();
const stripSymbols = value => clean(value).replace(/[→·]/g, ", ").replace(/\s*[-–]\s*(?=[a-z]{1,3}(?:,|\.|$))/gi, " ending ");
const spoken = (language, value) => language + ": " + clean(value);
export function lessonGrammarAudioScript(lessons) {
  const selected = (Array.isArray(lessons) ? lessons : [lessons]).filter(Boolean);
  if (!selected.length) throw new Error("Select a lesson first.");
  const first = selected[0];
  const day = clean(first.day);
  const course = clean(first.course);
  const title = selected.length > 1 ? course + " " + day : clean(first.title);
  const lines = [
    spoken("DE", "Hallo und herzlich willkommen bei Falowen!"),
    spoken("EN", "Welcome to " + title + ". Let's learn today's grammar with short examples."),
  ];
  const isFullA1Day2 = course === "A1" && day === "Day 2" && selected.length > 1;
  if (isFullA1Day2) {
    lines.push(
      spoken("EN", "First, the German alphabet. Listen to the German letter names, then practise spelling your name."),
      spoken("DE", "A, B, C, D, E, F, G. H, I, J, K, L, M, N. O, P, Q, R, S, T. U, V, W, X, Y, Z."),
      spoken("EN", "German also uses A Umlaut, O Umlaut, U Umlaut and Eszett. To ask how to spell something, say:"),
      spoken("DE", "Wie schreibt man das? Ich heiße Ama. A, M, A."),
      "[PAUSE 2]",
      spoken("EN", "Next, personal pronouns. Listen to their German names."),
      spoken("DE", "ich, du, er, sie, es, wir, ihr, sie, Sie."),
      spoken("EN", "Ich means I; du means informal you; er, sie and es mean he, she and it. Wir means we; ihr means informal plural you; sie means they. Capital Sie is formal you."),
      spoken("DE", "Ich bin Kojo. Du bist Ama. Er ist Lehrer. Wir lernen Deutsch."),
      spoken("EN", "Now verbs. For regular verbs such as lernen, remove E N and add the correct ending. Listen to the forms."),
      spoken("DE", "ich lerne, du lernst, er lernt, sie lernt, es lernt, wir lernen, ihr lernt, sie lernen, Sie lernen."),
      spoken("EN", "Ich takes E, du takes S T, er, sie and es take T, wir takes E N, ihr takes T, and sie or formal Sie take E N."),
      spoken("DE", "Ich lerne Deutsch. Du wohnst in Accra."),
      spoken("EN", "Heißen means to be called. Notice du heißt, without an extra S."),
      spoken("DE", "ich heiße, du heißt, er heißt, wir heißen, ihr heißt, sie heißen."),
      spoken("EN", "Sein means to be. It is irregular, so learn its forms separately."),
      spoken("DE", "ich bin, du bist, er ist, wir sind, ihr seid, sie sind."),
      spoken("EN", "Your turn. Complete the sentence: Ich ... Deutsch."),
      "[PAUSE 3]",
      spoken("DE", "Ich lerne Deutsch."),
      spoken("EN", "Now introduce yourself using the sentences you have learned."),
      spoken("DE", "Ich heiße Kojo. Ich wohne in Accra. Ich lerne Deutsch."),
      spoken("EN", "That completes today's lesson. Practise the alphabet, pronouns and verb forms once more."),
      spoken("DE", "Sehr gut gemacht! Bis zum nächsten Mal bei Falowen!")
    );
    return lines.join("\n");
  }
  for (const [i, lesson] of selected.entries()) {
    if (i) lines.push(spoken("EN", "Next, " + clean(lesson.topic || lesson.title) + "."));
    const focus = (lesson.teacherSupport?.grammarFocusEn || lesson.teacherNotesEn || [])
      .map(stripSymbols).filter(Boolean).slice(0, 3);
    const examples = (lesson.teacherSupport?.modelExamplesDe || lesson.keyPhrasesDe || [])
      .map(clean).filter(Boolean).slice(0, 4);
    for (const explanation of focus) lines.push(spoken("EN", explanation));
    if (examples.length) lines.push(spoken("EN", "Listen to these German examples."), spoken("DE", examples.join(". ")));
  }
  lines.push(
    spoken("EN", "Now repeat one example aloud, and use it to make your own sentence."),
    "[PAUSE 3]",
    spoken("EN", "That completes today's lesson. Review the examples before your next class."),
    spoken("DE", "Sehr gut gemacht! Bis zum nächsten Mal bei Falowen!")
  );
  return lines.join("\n");
}
