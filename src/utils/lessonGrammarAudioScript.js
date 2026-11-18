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
  // The published Day 2 is ONE canonical record (A1-0.2_1.1).
  // Older retired records are no longer prerequisites for the full narration.
  const canonicalDay2 = selected.some(item =>
    String(item.assignmentId || "").trim().toUpperCase() === "A1-0.2_1.1");
  const legacyDay2Pair = selected.some(item => String(item.assignmentId || "").toUpperCase() === "A1-0.2")
    && selected.some(item => String(item.assignmentId || "").toUpperCase() === "A1-1.1");
  const isFullA1Day2 = course === "A1" && day === "Day 2" && (canonicalDay2 || legacyDay2Pair);
  if (isFullA1Day2) {
    lines.push(
      spoken("EN", "First, the German alphabet. It has twenty-six basic letters. Listen to their German names."),
      spoken("DE", "A, B, C, D, E, F, G. H, I, J, K, L, M, N. O, P, Q, R, S, T. U, V, W, X, Y, Z."),
      spoken("EN", "There are also four special characters: three umlauts and Eszett. The letters change how words are written and pronounced. To ask how to spell something, use this question."),
      spoken("DE", "Ä, Ö, Ü, ß. Wie schreibt man das? Ich heiße Ama. A, M, A."),
      spoken("EN", "Now spell your own name using the German letter names."),
      "[PAUSE 3]",
      spoken("EN", "Next are personal pronouns. These replace names and tell us who is doing an action. Listen first, then repeat."),
      spoken("DE", "ich, du, er, sie, es, wir, ihr, sie, Sie."),
      spoken("EN", "Ich means I, du is informal singular you, er is he, sie is she, and es is it. Wir means we, ihr is informal plural you, lowercase sie can mean they, and capital Sie is formal you."),
      spoken("DE", "Ich bin Kojo. Du bist Ama. Er ist Lehrer. Wir lernen Deutsch."),
      spoken("EN", "German verbs change their endings according to the subject. This is called conjugation. For the regular verb lernen, remove the E N ending to get the stem lern. Add E after ich, S T after du, and T after er, sie, or es. Wir takes E N, ihr takes T, and sie or formal Sie takes E N."),
      spoken("DE", "ich lerne, du lernst, er lernt, sie lernt, es lernt, wir lernen, ihr lernt, sie lernen, Sie lernen."),
      spoken("EN", "Try another regular verb: wohnen, meaning to live. Keep the same endings."),
      spoken("DE", "Ich wohne in Accra. Du wohnst in Berlin. Er wohnt in Hamburg."),
      spoken("EN", "Heißen means to be called. Notice the special form du heißt, without adding another S. Sein means to be and is irregular, so memorize its forms."),
      spoken("DE", "Ich heiße Maria. Du heißt Kojo. Er heißt Peter. Ich bin. Du bist. Er ist. Wir sind. Ihr seid. Sie sind."),
      spoken("EN", "Let's practise. Complete this sentence using the correct form of lernen."),
      spoken("DE", "Ich ... Deutsch."),
      "[PAUSE 3]",
      spoken("DE", "Ich lerne Deutsch."),
      spoken("EN", "And now choose the correct form of wohnen."),
      spoken("DE", "Du ... in Accra."),
      "[PAUSE 3]",
      spoken("DE", "Du wohnst in Accra."),
      spoken("EN", "Finally, introduce yourself using a greeting, your name, where you live and what you are learning."),
      spoken("DE", "Guten Tag! Ich heiße Kojo. Ich wohne in Accra. Ich lerne Deutsch."),
      spoken("EN", "That completes today's lesson. Practise the alphabet, personal pronouns and verb forms until you can use them confidently."),
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
