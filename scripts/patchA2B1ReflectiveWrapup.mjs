import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
let source = fs.readFileSync(presenterPath, "utf8");

// Remove the old repeated reflection block if this patch is rerun against an
// already-patched worktree.
const oldReflectionStart = source.indexOf('  const reflectiveCourse = ["A2", "B1"].includes(classroomLevel(slide));');
if (oldReflectionStart >= 0) {
  const oldReflectionEnd = source.indexOf("  return stages;", oldReflectionStart);
  if (oldReflectionEnd < 0) throw new Error("Old A2/B1 reflection block has no return anchor");
  source = source.slice(0, oldReflectionStart) + source.slice(oldReflectionEnd);
}

// Remove the older Mini-Präsentation helper/mutation when present.
const helperStart = source.indexOf("function buildA2B1PresentationWrapup(");
const classicStart = source.indexOf("function buildClassicStages(");
if (helperStart >= 0 && classicStart > helperStart) {
  source = source.slice(0, helperStart) + source.slice(classicStart);
}

const legacyWrapupMutation = [
  '    const wrapupStage = stages.find((stage) => stage.id === "wrapup");',
  "    if (wrapupStage) {",
  '      wrapupStage.title = "Mini-Präsentation";',
  "      wrapupStage.body = buildA2B1PresentationWrapup(slide);",
  "      wrapupStage.suggestedMinutes = 6;",
  "    }",
  "",
].join("\n");
source = source.replace(legacyWrapupMutation, "");

const weeklyChallengeBlock = [
  '  // a2-b1-weekly-challenge:start',
  '  const weeklyLevel = classroomLevel(slide);',
  '  if (["A2", "B1"].includes(weeklyLevel)) {',
  '    const repetitiveEndStageIds = new Set([',
  '      "grammar-check", "vocabulary-retrieval", "sentence-builder", "guided-action", "role-play",',
  '      "b1-grammar-check", "b1-vocabulary-retrieval", "b1-sentence-builder", "b1-guided-action", "b1-role-play",',
  '      "learning-reflection", "learning-exit-ticket",',
  '    ]);',
  '    for (let index = stages.length - 1; index >= 0; index -= 1) {',
  '      if (repetitiveEndStageIds.has(stages[index]?.id)) stages.splice(index, 1);',
  '    }',
  '',
  '    const weeklyDay = Math.max(1, Number(slide.dayNumber || String(slide.day || "").match(/\\d+/)?.[0] || 1));',
  '    const weeklyNumber = Math.min(7, Math.max(1, Math.ceil(weeklyDay / 4)));',
  '    const topic = cleanTopic(slide);',
  '    const questions = (Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : []).filter(Boolean);',
  '    const phrases = (Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).filter(Boolean);',
  '    const q1 = questions[0] || `Was ist für dich bei „${topic}“ wichtig?`;',
  '    const q2 = questions[1] || `Welche Erfahrung hast du mit „${topic}“?`;',
  '    const q3 = questions[2] || `Welche Lösung oder Alternative passt zu „${topic}“?`;',
  '    const phrase = phrases[0] || "";',
  '    const phrasePrompt = phrase ? `Verwende, wenn es passt: „${phrase}“` : "Nutze mindestens ein Redemittel aus der heutigen Lektion.";',
  '    let weeklyTitle = "";',
  '    let weeklyItems = [];',
  '',
  '    if (weeklyLevel === "A2") {',
  '      if (weeklyNumber === 1) {',
  '        weeklyTitle = "Woche 1 · Wähle & begründe";',
  '        weeklyItems = [',
  '          { title: "Entscheide", instruction: q1, prompts: ["Gib eine klare Antwort.", "Nenne einen einfachen Grund."], minutes: 2 },',
  '          { title: "Vergleiche", instruction: q2, prompts: ["Höre zuerst auf die Antwort deines Partners.", "Sage dann: gleich, anders oder teilweise anders."], minutes: 2 },',
  '          { title: "Neues Beispiel", instruction: "Gib ein neues Beispiel, das noch niemand genannt hat.", prompts: [phrasePrompt], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 2) {',
  '        weeklyTitle = "Woche 2 · Gespräch weiterführen";',
  '        weeklyItems = [',
  '          { title: "Start", instruction: q1, prompts: ["Antworte in 2–3 Sätzen."], minutes: 2 },',
  '          { title: "Weiter", instruction: "Dein Partner fügt eine neue Information hinzu.", prompts: ["Wiederhole nicht dieselbe Idee.", phrasePrompt], minutes: 2 },',
  '          { title: "Abschluss", instruction: q2, prompts: ["Reagiere auf deinen Partner und beende das Mini-Gespräch natürlich."], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 3) {',
  '        weeklyTitle = "Woche 3 · Situationsauftrag";',
  '        weeklyItems = [',
  '          { title: "Situation", instruction: `Stell dir eine echte Situation zu „${topic}“ vor. ${q1}`, prompts: ["Was ist passiert?", "Was musst du jetzt tun?"], minutes: 2 },',
  '          { title: "Lösung", instruction: q3, prompts: ["Nenne eine konkrete Lösung.", phrasePrompt], minutes: 2 },',
  '          { title: "Plan B", instruction: "Dein erster Plan funktioniert nicht. Nenne eine einfache Alternative.", prompts: ["Sage auch wann, wo oder wie."], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 4) {',
  '        weeklyTitle = "Woche 4 · Informationslücke";',
  '        weeklyItems = [',
  '          { title: "Frage", instruction: q1, prompts: ["Stelle die Frage deinem Partner. Höre genau zu."], minutes: 2 },',
  '          { title: "Rückfrage", instruction: "Stelle eine neue Rückfrage, die nicht auf der Folie steht.", prompts: ["Beginne z. B. mit Warum?, Wann?, Wo?, Wie? oder Mit wem?"], minutes: 2 },',
  '          { title: "Rollenwechsel", instruction: q2, prompts: ["Jetzt fragt dein Partner. Antworte mit einer neuen Information.", phrasePrompt], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 5) {',
  '        weeklyTitle = "Woche 5 · Bedeutung reparieren";',
  '        weeklyItems = [',
  '          { title: "Unklar", instruction: "Dein Partner versteht deine Antwort nicht.", prompts: ["Sage dieselbe Idee noch einmal mit einfacheren Wörtern."], minutes: 2 },',
  '          { title: "Präziser", instruction: q2, prompts: ["Füge eine fehlende Information hinzu.", phrasePrompt], minutes: 2 },',
  '          { title: "Bestätigen", instruction: "Frage deinen Partner, ob deine Aussage jetzt klar ist, und reagiere auf die Antwort.", prompts: ["Nutze eine natürliche kurze Rückfrage."], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 6) {',
  '        weeklyTitle = "Woche 6 · 2-Minuten-Challenge";',
  '        weeklyItems = [',
  '          { title: "Vorbereiten", instruction: q1, prompts: ["Plane nur drei Stichpunkte: Antwort, Grund, Beispiel."], minutes: 1 },',
  '          { title: "Sprechen", instruction: "Sprich bis zu 2 Minuten ohne abzulesen.", prompts: ["Antwort → Grund → Beispiel.", phrasePrompt], minutes: 2 },',
  '          { title: "Eine Nachfrage", instruction: "Ein Partner stellt danach genau eine spontane Nachfrage.", prompts: ["Antworte direkt und kurz."], minutes: 1 },',
  '        ];',
  '      } else {',
  '        weeklyTitle = "Woche 7 · Überraschungsmission";',
  '        weeklyItems = [',
  '          { title: "Karte A", instruction: q1, prompts: ["Antworte sofort mit Grund und Beispiel."], minutes: 2 },',
  '          { title: "Karte B", instruction: q2, prompts: ["Verbinde deine Antwort mit einer eigenen Erfahrung.", phrasePrompt], minutes: 2 },',
  '          { title: "Karte C", instruction: q3, prompts: ["Die Lehrkraft wählt erst jetzt A, B oder C für dich."], minutes: 2 },',
  '        ];',
  '      }',
  '    } else {',
  '      if (weeklyNumber === 1) {',
  '        weeklyTitle = "Woche 1 · Abwägen & begründen";',
  '        weeklyItems = [',
  '          { title: "Position", instruction: q1, prompts: ["Formuliere eine klare Position und einen Grund."], minutes: 2 },',
  '          { title: "Beleg", instruction: "Ergänze ein konkretes Beispiel oder eine Erfahrung.", prompts: [phrasePrompt], minutes: 2 },',
  '          { title: "Andere Sicht", instruction: q2, prompts: ["Nenne kurz, warum jemand anderer Meinung sein könnte."], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 2) {',
  '        weeklyTitle = "Woche 2 · Gespräch fortsetzen";',
  '        weeklyItems = [',
  '          { title: "Beitrag 1", instruction: q1, prompts: ["Antworte mit Position und Begründung."], minutes: 2 },',
  '          { title: "Beitrag 2", instruction: "Reagiere auf die vorige Aussage, bevor du eine neue Idee nennst.", prompts: ["Nutze Zustimmung, Einschränkung oder Widerspruch.", phrasePrompt], minutes: 2 },',
  '          { title: "Beitrag 3", instruction: q2, prompts: ["Führe das Gespräch weiter, ohne die erste Antwort zu wiederholen."], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 3) {',
  '        weeklyTitle = "Woche 3 · Real-Life Problem";',
  '        weeklyItems = [',
  '          { title: "Problem", instruction: `Übertrage „${topic}“ auf eine reale Situation. ${q1}`, prompts: ["Was ist das konkrete Problem?", "Wer ist betroffen?"], minutes: 2 },',
  '          { title: "Lösung", instruction: q3, prompts: ["Schlage eine realistische Lösung vor und begründe sie.", phrasePrompt], minutes: 2 },',
  '          { title: "Folge", instruction: "Was könnte passieren, wenn diese Lösung nicht funktioniert?", prompts: ["Nenne eine Alternative oder Konsequenz."], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 4) {',
  '        weeklyTitle = "Woche 4 · Interview & Rückfrage";',
  '        weeklyItems = [',
  '          { title: "Interview", instruction: q1, prompts: ["Stelle die Frage deinem Partner und höre bis zum Ende zu."], minutes: 2 },',
  '          { title: "Spontane Rückfrage", instruction: "Stelle eine neue Rückfrage, die nicht auf der Folie steht.", prompts: ["Nutze z. B. Warum?, Welche Alternative?, Welche Folge? oder Unter welcher Bedingung?"], minutes: 2 },',
  '          { title: "Reagieren & Rollen wechseln", instruction: q2, prompts: ["Reagiere zuerst auf die vorige Antwort.", phrasePrompt, "Danach tauscht ihr die Rollen."], minutes: 3 },',
  '        ];',
  '      } else if (weeklyNumber === 5) {',
  '        weeklyTitle = "Woche 5 · Bedeutung reparieren";',
  '        weeklyItems = [',
  '          { title: "Missverständnis", instruction: "Dein Partner versteht deine Aussage anders als du sie gemeint hast.", prompts: ["Formuliere die Idee neu, ohne denselben Satz zu wiederholen."], minutes: 2 },',
  '          { title: "Präzisieren", instruction: q2, prompts: ["Ergänze Grund, Bedingung oder Beispiel.", phrasePrompt], minutes: 2 },',
  '          { title: "Prüfen", instruction: "Fasse die Aussage deines Partners in eigenen Worten zusammen und frage, ob du ihn richtig verstanden hast.", prompts: ["Reagiere danach auf die Korrektur."], minutes: 2 },',
  '        ];',
  '      } else if (weeklyNumber === 6) {',
  '        weeklyTitle = "Woche 6 · 3-Minuten-Position";',
  '        weeklyItems = [',
  '          { title: "Position planen", instruction: q1, prompts: ["Position → zwei Gründe → Beispiel → mögliche Gegenposition."], minutes: 1 },',
  '          { title: "3 Minuten sprechen", instruction: "Sprich bis zu 3 Minuten strukturiert und ohne abzulesen.", prompts: [phrasePrompt, "Beziehe mindestens ein Gegenargument ein."], minutes: 3 },',
  '          { title: "Reaktion", instruction: "Ein Partner widerspricht oder stellt eine kritische Nachfrage.", prompts: ["Antworte direkt und begründe deine Reaktion."], minutes: 2 },',
  '        ];',
  '      } else {',
  '        weeklyTitle = "Woche 7 · Sprach-Challenge";',
  '        weeklyItems = [',
  '          { title: "Unbekannte Frage", instruction: q1, prompts: ["Die Lehrkraft entscheidet erst beim Aufrufen, welche Karte du bekommst."], minutes: 2 },',
  '          { title: "Perspektivwechsel", instruction: q2, prompts: ["Antworte einmal aus deiner Sicht und einmal aus einer anderen Perspektive.", phrasePrompt], minutes: 2 },',
  '          { title: "Transfer", instruction: q3, prompts: ["Verbinde das Thema mit einer neuen Situation aus Arbeit, Schule, Familie oder Gesellschaft."], minutes: 2 },',
  '        ];',
  '      }',
  '    }',
  '',
  '    stages.push({',
  '      id: "weekly-challenge",',
  '      type: "flow",',
  '      kicker: `Woche ${weeklyNumber} · Challenge`,',
  '      title: weeklyTitle,',
  '      items: weeklyItems,',
  '      suggestedMinutes: weeklyItems.reduce((total, item) => total + Number(item.minutes || 0), 0),',
  '    });',
  '  }',
  '  // a2-b1-weekly-challenge:end',
].join("\n");

if (!source.includes("// a2-b1-weekly-challenge:start")) {
  const functionStart = source.indexOf("function buildPresenterV2Stages(");
  if (functionStart < 0) throw new Error("Presenter V2 function missing");
  const returnIndex = source.indexOf("  return stages;", functionStart);
  if (returnIndex < 0) throw new Error("Presenter V2 return missing");
  source = source.slice(0, returnIndex) + weeklyChallengeBlock + "\n" + source.slice(returnIndex);
}

if (source.includes("Mini-Präsentation") || source.includes("buildA2B1PresentationWrapup(")) {
  throw new Error("Legacy A2/B1 mini-presentation code is still present");
}
if (source.includes('id: "learning-reflection"') || source.includes('id: "learning-exit-ticket"')) {
  throw new Error("Repeated A2/B1 reflection pages are still present");
}

fs.writeFileSync(presenterPath, source);
console.log("A2/B1 presenter: repeated end drills replaced by seven weekly challenge mechanics.");
