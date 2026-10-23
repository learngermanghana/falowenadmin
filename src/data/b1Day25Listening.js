// B1 Day 25 · verified classroom recording and uploaded Richtig/Falsch key.
// This teaches listening in the presenter; it does not create a scored workbook Teil.
export const B1_DAY25_AUDIO_KEY = "b1/day-25/online-shopping-verbraucherservice.mp3";
export const B1_DAY25_TRANSCRIPT = Object.freeze([
  ["A", "Achtung, liebe Hörerinnen und Hörer! Hier ist wieder unser Verbraucherservice mit wichtigen Tipps für das Online-Shopping. Heute sprechen wir über Ihre Rechte, sichere Online-Shops und Probleme bei der Lieferung."],
  ["B", "Immer mehr Menschen kaufen Kleidung, elektronische Geräte und Haushaltsartikel im Internet. Das ist praktisch, aber viele Kunden kennen ihre Rechte nicht genau."],
  ["A", "Wussten Sie zum Beispiel, dass man bei vielen Online-Käufen in Deutschland ein gesetzliches Widerrufsrecht von vierzehn Tagen hat?"],
  ["B", "Das bedeutet, dass Sie einen Kauf innerhalb dieser Frist ohne Angabe von Gründen widerrufen können. Die Frist beginnt normalerweise, wenn Sie die Ware erhalten haben."],
  ["A", "Wichtig ist aber: Sie müssen dem Verkäufer mitteilen, dass Sie den Kauf widerrufen möchten. Das können Sie zum Beispiel per E-Mail machen. Einfach nur die Ware zurückzuschicken, reicht nicht aus."],
  ["B", "Aber Vorsicht! Es gibt Ausnahmen. Bei Produkten, die speziell für einen Kunden angefertigt wurden, gilt dieses Widerrufsrecht normalerweise nicht."],
  ["C", "Außerdem sollten Sie vor dem Bestellen prüfen, ob der Online-Shop seriös ist. Lesen Sie die Bewertungen anderer Käufer und achten Sie auf die Kontaktadresse des Unternehmens."],
  ["A", "Besonders vorsichtig sollten Sie sein, wenn ein Produkt ungewöhnlich billig angeboten wird. Ein sehr niedriger Preis kann ein Hinweis auf einen betrügerischen Online-Shop sein."],
  ["B", "Ein anderes Problem ist die Lieferung. Manchmal kommt ein Paket zu spät an oder ein Produkt ist beschädigt."],
  ["C", "In solchen Fällen sollten Sie den Kundenservice kontaktieren. Beschreiben Sie das Problem möglichst genau und geben Sie Ihre Bestellnummer an."],
  ["A", "Wenn ein Artikel beschädigt angekommen ist, können Fotos helfen, das Problem zu erklären."],
  ["B", "Und noch ein Tipp: Informieren Sie sich vor dem Kauf über die Versandkosten und die Bedingungen für eine Rücksendung. Manchmal müssen Kunden die Rücksendekosten selbst bezahlen."],
  ["C", "Denken Sie also daran: Vergleichen Sie die Preise, prüfen Sie den Verkäufer und lesen Sie die Informationen zum Widerrufsrecht."],
  ["A", "So können Sie sicherer online einkaufen und viele unangenehme Überraschungen vermeiden."],
  ["B", "Das war unser Verbraucherservice für heute. Vielen Dank fürs Zuhören!"],
  ["C", "Und bis zum nächsten Mal. Bleiben Sie aufmerksam beim Online-Shopping!"],
]);

// Questions, evidence and answer values match the user's uploaded
// falowen-b1-hoeren-online-einkaufen-rechte-und-risiken-questions-key.json.
const OPTIONS = Object.freeze(["Richtig", "Falsch"]);
const questions = [
  {
    prompt: "In Deutschland hat man bei vielen Online-Käufen ein gesetzliches Widerrufsrecht von vierzehn Tagen.",
    evidence: "gesetzliches Widerrufsrecht von vierzehn Tagen hat",
    answer: "Richtig",
  },
  {
    prompt: "Es reicht völlig aus, die Ware einfach nur zurückzuschicken, um den Kauf zu widerrufen.",
    evidence: "Einfach nur die Ware zurückzuschicken, reicht nicht aus.",
    answer: "Falsch",
  },
  {
    prompt: "Bei Produkten, die speziell für einen Kunden angefertigt wurden, gilt das Widerrufsrecht normalerweise.",
    evidence: "Bei Produkten, die speziell für einen Kunden angefertigt wurden, gilt dieses Widerrufsrecht normalerweise nicht.",
    answer: "Falsch",
  },
  {
    prompt: "Ein sehr niedriger Preis kann ein Hinweis auf einen betrügerischen Online-Shop sein.",
    evidence: "Ein sehr niedriger Preis kann ein Hinweis auf einen betrügerischen Online-Shop sein.",
    answer: "Richtig",
  },
  {
    prompt: "Wenn ein Artikel beschädigt angekommen ist, können Fotos helfen, das Problem zu erklären.",
    evidence: "Wenn ein Artikel beschädigt angekommen ist, können Fotos helfen, das Problem zu erklären.",
    answer: "Richtig",
  },
];
export const B1_DAY25_LISTENING_QUESTIONS = Object.freeze(questions.map((item) => Object.freeze({
  prompt: item.prompt,
  options: OPTIONS,
  correctIndex: OPTIONS.indexOf(item.answer),
  answer: item.answer,
  evidence: item.evidence,
  hint: "Hörbeleg: „" + item.evidence + "“",
  explanation: item.evidence,
})));
export const B1_DAY25_LISTENING = Object.freeze({
  level: "B1",
  day: 25,
  title: "Verbraucherservice · Sicher online einkaufen",
  audioKey: B1_DAY25_AUDIO_KEY,
  transcript: B1_DAY25_TRANSCRIPT,
  questions: B1_DAY25_LISTENING_QUESTIONS,
  suggestedMinutes: 12,
  playbackNote: "Die Aufnahme enthält zwei vollständige Durchgänge (5:43 Minuten insgesamt).",
  previewWords: ["das Widerrufsrecht", "die Rücksendung", "der Kundenservice"],
});
