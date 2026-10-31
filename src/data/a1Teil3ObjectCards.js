// Day 15 · Goethe A1 Sprechen Teil 3. Show an object before revealing a model.
// The exact wording is not prescribed: another suitable polite A1 request counts.
export const A1_TEIL3_OBJECT_CARDS = Object.freeze([
  { id: "flasche", objectDe: "die Flasche", objectEn: "bottle", symbol: "🍾", verb: "öffnen", requestDe: "Können Sie bitte die Flasche öffnen?", reactionDe: "Ja, gern." },
  { id: "bleistift", objectDe: "der Bleistift", objectEn: "pencil", symbol: "✏️", verb: "geben", requestDe: "Können Sie mir bitte den Bleistift geben?", reactionDe: "Natürlich, hier bitte." },
  { id: "wasser", objectDe: "das Glas Wasser", objectEn: "glass of water", symbol: "🥤", verb: "bringen", requestDe: "Können Sie mir bitte ein Glas Wasser bringen?", reactionDe: "Ja, natürlich." },
  { id: "radio", objectDe: "das Radio", objectEn: "radio", symbol: "📻", verb: "ausmachen", requestDe: "Können Sie bitte das Radio ausmachen?", reactionDe: "Ja, gern." },
  { id: "tuer", objectDe: "die Tür", objectEn: "door", symbol: "🚪", verb: "schließen", requestDe: "Können Sie bitte die Tür schließen?", reactionDe: "Ja, natürlich." },
  { id: "stuhl", objectDe: "der Stuhl", objectEn: "chair", symbol: "🪑", verb: "holen", requestDe: "Können Sie bitte einen Stuhl holen?", reactionDe: "Ja, gern." },
  { id: "stadtplan", objectDe: "der Stadtplan", objectEn: "city map", symbol: "🗺️", verb: "zeigen", requestDe: "Können Sie mir bitte den Stadtplan zeigen?", reactionDe: "Natürlich." },
  { id: "buch", objectDe: "das Buch", objectEn: "book", symbol: "📖", verb: "leihen", requestDe: "Können Sie mir bitte das Buch leihen?", reactionDe: "Ja, gern." },
  { id: "lampe", objectDe: "die Lampe", objectEn: "lamp", symbol: "💡", verb: "anmachen", requestDe: "Können Sie bitte die Lampe anmachen?", reactionDe: "Ja, natürlich." },
  { id: "formular", objectDe: "das Formular", objectEn: "form", symbol: "📄", verb: "unterschreiben", requestDe: "Können Sie bitte das Formular unterschreiben?", reactionDe: "Ja, gern." },
  { id: "fenster", objectDe: "das Fenster", objectEn: "window", symbol: "🪟", verb: "öffnen", requestDe: "Können Sie bitte das Fenster öffnen?", reactionDe: "Tut mir leid, das geht leider nicht." },
]);

export function a1Teil3ObjectPrompt(card, { exit = false } = {}) {
  if (!card) return "";
  return `${exit ? "Exit-Check: " : ""}Bildkarte ${card.id}: Bilde eine höfliche Bitte und reagiere danach auf eine Bitte.`;
}

export function getA1Teil3ObjectCard(question = "") {
  const text = String(question || "");
  return A1_TEIL3_OBJECT_CARDS.find((card) =>
    text.includes(`Bildkarte ${card.id}:`)
  ) || null;
}

export function a1Teil3ObjectCheck(card, { exit = false } = {}) {
  return {
    questionDe: a1Teil3ObjectPrompt(card, { exit }),
    answerDe: `${card.requestDe} – ${card.reactionDe}`,
    noteEn: `Show ${card.objectDe} first, let the learner choose a sensible action verb and speak independently. Accept other polite requests that fit the object, plus an appropriate short reaction. Do not show the model before the answer.`,
    responseMode: "performance",
    conceptLabel: "Teil 3 · Bildkarte",
  };
}
