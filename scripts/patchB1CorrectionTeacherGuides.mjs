import fs from "node:fs";

function replaceOnce(source, anchor, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(anchor)) throw new Error(`${label} anchor missing.`);
  return source.replace(anchor, replacement);
}

const presenterUtilPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
let presenterUtil = fs.readFileSync(presenterUtilPath, "utf8");

const guideMarker = "/* b1-correction-teacher-guides-v1 */";
if (!presenterUtil.includes(guideMarker)) {
  const anchor = "function buildClassicStages(slide = {}, topicLabel = \"\") { return [";
  const helper = `${guideMarker}\nfunction buildB1CorrectionTeacherGuide(questionDe = \"\", modelAnswerDe = \"\") {\n  const question = String(questionDe || \"\").trim();\n  const answer = String(modelAnswerDe || \"\").trim();\n  const text = \`${'${question}'} ${'${answer}'}\`;\n\n  if (/Während wir wanderten/i.test(question)) {\n    return [\n      \"The während-clause is a subordinate clause (Nebensatz), so its conjugated verb is at the end: während wir wanderten.\",\n      \"Because the während-clause comes first, it fills position 1 of the whole sentence. After the comma, the main clause begins with the conjugated verb: begann es ..., not es begann ....\",\n      \"Board pattern: Während + subject + ... + verb, verb + subject + ....\",\n      \"Correct sentence: Während wir wanderten, begann es zu regnen.\",\n      \"Meaning: While we were hiking, it began to rain. Ask the learner to make one more sentence with a während-clause first.\",\n    ];\n  }\n\n  if (/Nachdem wir sind angekommen/i.test(question)) {\n    return [\n      \"In this past narrative, nachdem marks the earlier completed action. Use Plusquamperfekt for that earlier action: angekommen waren.\",\n      \"The later action stays in Präteritum here: bauten ... auf.\",\n      \"nachdem introduces a subordinate clause, so the finite auxiliary goes to the end: Nachdem wir angekommen waren, ....\",\n      \"sind angekommen = have arrived (Perfekt); waren angekommen = had arrived (Plusquamperfekt).\",\n      \"Correct sentence: Nachdem wir angekommen waren, bauten wir das Zelt auf. Meaning: After we had arrived, we put up the tent.\",\n    ];\n  }\n\n  if (/obwohl es sehr kalt war/i.test(question) && /Wir kamen früh an/i.test(question)) {\n    return [\n      \"This sentence is already correct; use it to confirm the rule rather than inventing an error.\",\n      \"obwohl introduces a subordinate clause, so the conjugated verb goes to the end: obwohl es sehr kalt war.\",\n      \"The main clause keeps normal verb-second order: Wir kamen früh an.\",\n      \"Meaning: We arrived early although it was very cold. Ask for a new obwohl sentence to check transfer.\",\n    ];\n  }\n\n  const guide = [];\n  if (/\\b(weil|obwohl|wenn|während|nachdem|bevor|dass|ob|damit)\\b/i.test(text)) {\n    guide.push(\"This connector introduces a subordinate clause (Nebensatz): the conjugated verb normally goes to the end of that clause.\");\n    guide.push(\"If the subordinate clause comes first, the following main clause begins with its conjugated verb before the subject.\");\n  }\n  if (/\\b(deshalb|trotzdem|daher|darum)\\b/i.test(text)) {\n    guide.push(\"deshalb/trotzdem/daher/darum can occupy position 1; the conjugated verb then stays in position 2, before the subject.\");\n  }\n  if (/um .* zu|um\\s+zu|damit/i.test(text)) {\n    guide.push(\"Use um ... zu when the subject is the same in both actions; use damit when the subjects are different or when a full subordinate clause is needed.\");\n  }\n  if (/\\b(wegen|trotz)\\b/i.test(text)) {\n    guide.push(\"In standard/formal German, wegen and trotz are commonly taught with the genitive. Check the article and noun ending as well as the preposition.\");\n  }\n  if (/je .* desto|desto/i.test(text)) {\n    guide.push(\"With je ... desto, the je-clause behaves like a subordinate clause; in the desto-clause, the conjugated verb follows the fronted comparative phrase.\");\n  }\n  if (/indirekt|indirect|\\bob\\b|warum|wann|woher|wie/i.test(question) && /korrigiere/i.test(question)) {\n    if (/frage|frag|wissen|sagen|erklären|erzaehlen|erzählen/i.test(text)) {\n      guide.push(\"In an indirect question, keep the W-word or ob, and place the conjugated verb at the end of the embedded clause.\");\n    }\n  }\n  if (/relativ|der |die |das |denen|dessen|deren/i.test(question) && /korrigiere/i.test(question)) {\n    if (/person|mann|frau|kolleg|student|buch|haus|ort|stadt/i.test(text)) {\n      guide.push(\"For a relative clause, choose the relative pronoun by gender/number and by its grammatical role inside the relative clause; the finite verb goes to the end.\");\n    }\n  }\n  if (/modal|muss|kann|soll|darf|möchte|wollen|will/i.test(text)) {\n    guide.push(\"With a modal verb in a main clause, conjugate the modal in position 2 and put the second verb as an infinitive at the end, normally without zu.\");\n  }\n  if (/könnt|koennt|würde|wuerde|hätte|haette|wäre|waere/i.test(text)) {\n    guide.push(\"Konjunktiv II forms such as könnten/würden/hätten/wären make requests, suggestions and hypothetical statements more polite or less direct.\");\n  }\n  if (/komparativ|als\\b|größer|besser|mehr|weniger/i.test(text)) {\n    guide.push(\"For an unequal comparison, use the comparative + als: größer als, besser als, mehr als.\");\n  }\n\n  if (answer) guide.push(\`Board model: ${'${answer}'}\`);\n  guide.push(\"After explaining the correction, ask the learner to make one new sentence with the same rule.\");\n\n  return [...new Set(guide)].slice(0, 6);\n}\n\n`;
  presenterUtil = replaceOnce(presenterUtil, anchor, `${helper}${anchor}`, "B1 teacher-guide helper");
}

const oldModelBuilder = '    const makeB1Models = (pairs) => pairs.map(([questionDe, modelAnswerDe]) => ({ questionDe, modelAnswerDe }));';
const newModelBuilder = '    const makeB1Models = (pairs) => pairs.map(([questionDe, modelAnswerDe]) => ({ questionDe, modelAnswerDe, teacherGuideItems: buildB1CorrectionTeacherGuide(questionDe, modelAnswerDe) }));';
if (!presenterUtil.includes(newModelBuilder)) {
  presenterUtil = replaceOnce(presenterUtil, oldModelBuilder, newModelBuilder, "B1 model teacher guides");
}

fs.writeFileSync(presenterUtilPath, presenterUtil);

const presenterPath = new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url);
let presenter = fs.readFileSync(presenterPath, "utf8");
const oldModelSupport = `                  <strong>Possible model answer</strong>\n                  <p>{activeModel?.modelAnswerDe || "A model answer has not been added for this question yet."}</p>\n                  {activeModel?.modelAnswerDe ? <small>Example only — adapt the details to your own experience.</small> : null}`;
const newModelSupport = `                  <strong>Possible model answer</strong>\n                  <p>{activeModel?.modelAnswerDe || "A model answer has not been added for this question yet."}</p>\n                  {Array.isArray(activeModel?.teacherGuideItems) && activeModel.teacherGuideItems.length ? (\n                    <div className="presenter-teacher-guide">\n                      <strong>What to explain to students</strong>\n                      <ul>{activeModel.teacherGuideItems.map((item) => <li key={item}>{item}</li>)}</ul>\n                    </div>\n                  ) : null}\n                  {activeModel?.modelAnswerDe ? (\n                    <small>{activeModel?.teacherGuideItems?.length\n                      ? "Use these points as a teaching guide; accept another correct B1 formulation when the same rule is applied."\n                      : "Example only — adapt the details to your own experience."}</small>\n                  ) : null}`;
if (!presenter.includes(newModelSupport)) {
  presenter = replaceOnce(presenter, oldModelSupport, newModelSupport, "Presenter teacher-guide rendering");
}
fs.writeFileSync(presenterPath, presenter);

const cssPath = new URL("../src/components/TeachingSlidePresenter.css", import.meta.url);
let css = fs.readFileSync(cssPath, "utf8");
const cssMarker = "/* b1-correction-teacher-guide */";
if (!css.includes(cssMarker)) {
  css += `\n${cssMarker}\n.presenter-teacher-guide {\n  margin-top: 0.8rem;\n  border-top: 1px solid #cbd5e1;\n  padding-top: 0.75rem;\n}\n\n.presenter-teacher-guide > strong {\n  display: block;\n  margin-bottom: 0.4rem;\n}\n\n.presenter-teacher-guide ul {\n  display: grid;\n  gap: 0.4rem;\n  margin: 0.25rem 0 0.55rem;\n  padding-left: 1.25rem;\n}\n\n.presenter-teacher-guide li {\n  line-height: 1.4;\n}\n`;
}
fs.writeFileSync(cssPath, css);

console.log("B1 correction model answers now include teacher-facing grammar explanations.");
