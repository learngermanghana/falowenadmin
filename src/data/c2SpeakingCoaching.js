// C2 seminar coaching is grounded in each exact authored question and model.
// This is teacher guidance, not automatic assessment of an unheard response.
const clean = (value) => String(value || "").trim();
const sentence = (value) => clean(value).match(/[^.!?]+[.!?]?/u)?.[0]?.trim() || clean(value);
function checksFor(question) {
  const q = question.toLocaleLowerCase("de");
  const checks = [];
  if (/abwäg|differenzier|vor.? und nachteil|einerseits|andererseits|vergleich|gegenüberstell/.test(q))
    checks.push("Werden unterschiedliche Perspektiven erkennbar abgewogen, statt nur aufgezählt?");
  if (/beleg|evidenz|quelle|daten|statistik|nachweis/.test(q))
    checks.push("Ist die behauptete Evidenz nachvollziehbar, korrekt eingeordnet und nicht überinterpretiert?");
  if (/kriti|problematisier|einwand|gegenargument|grenze|risik/.test(q))
    checks.push("Wird ein ernstzunehmender Einwand oder eine Grenze ausdrücklich geprüft?");
  if (/formulier|register|sprach|stil|nuanc|umform|wirk/.test(q))
    checks.push("Ist die Formulierung bedeutungsgetreu, stilistisch präzise und adressatengerecht?");
  if (/warum|weshalb|begründe|beurteil|bewert|stellung|position|entscheid|inwiefern/.test(q))
    checks.push("Wird die Position durch einen tragfähigen Grund und ein konkretes Beispiel gestützt?");
  if (!checks.length)
    checks.push("Wird die genaue Fragestellung beantwortet und eine begründete Schlussfolgerung gezogen?");
  checks.push("Sind Argumentation und Übergänge kohärent, mit kontrolliertem C2-Register?");
  return [...new Set(checks)].slice(0, 3);
}
export function buildC2SpeakingCoaching(slide = {}, questions = []) {
  if (clean(slide.course).toUpperCase() !== "C2") return [];
  const models = Array.isArray(slide.speakingModels) ? slide.speakingModels : [];
  const expressions = Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe.filter(Boolean) : [];
  return (Array.isArray(questions) ? questions : []).map((rawQuestion) => {
    const questionDe = clean(rawQuestion);
    const matched = models.find((item) => clean(item?.questionDe) === questionDe);
    const answer = clean(matched?.modelAnswerDe);
    if (!questionDe || !answer) return null; // Never invent missing C2 model answers.
    const phrase = expressions.find((p) => answer.toLocaleLowerCase("de").includes(clean(p).toLocaleLowerCase("de")));
    const referenceIdeaDe = sentence(answer);
    return {
      questionDe,
      hintDe: phrase ? `Mögliche Formulierung aus der Lektion: „${clean(phrase)}“`
        : "Formuliere zuerst deine differenzierte Position. Begründe sie und benenne eine sinnvolle Einschränkung.",
      referenceIdeaDe,
      supportingIdeaDe: answer === referenceIdeaDe ? "" : answer.slice(referenceIdeaDe.length).trim(),
      taskChecksDe: checksFor(questionDe),
      languageFocusEn: "",
      commonErrorEn: "",
      lessonGrammarFocusEn: clean(slide.grammarTeachDe),
      lessonPitfallEn: "",
      retryDe: `Beantworte die genaue Frage „${questionDe}“ erneut. Präzisiere dein stärkstes Argument, erläutere einen Einwand und überprüfe Register und Kohäsion.`,
    };
  });
}
