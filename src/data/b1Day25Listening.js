// Teacher-facing B1 classroom Hören about consumer rights and shopping risks.
// The uploaded 5:43 recording repeats the complete programme twice. Display
// its transcript once. This is not the student's graded workbook audio.
// Day 24 slide 3 and Day 25 slide 3 intentionally share this recording and
// the same answer key; both retain their own lesson and music introductions.
export const B1_DAY25_AUDIO_KEY = "b1/day-25/online-shopping-verbraucherservice.mp3";

export const B1_DAY25_TRANSCRIPT = Object.freeze([
  [
    "A",
    "B1, D25. Online-Shopping – Rechte und Risiken. Hören: Verbraucherservice – Sicher online einkaufen."
  ],
  [
    "A",
    "Achtung, liebe Hörerinnen und Hörer! Hier ist wieder unser Verbraucherservice mit wichtigen Tipps für das Online-Shopping. Heute sprechen wir über Ihre Rechte, sichere Online-Shops und Probleme bei der Lieferung."
  ],
  [
    "B",
    "Immer mehr Menschen kaufen Kleidung, elektronische Geräte und Haushaltsartikel im Internet. Das ist praktisch, aber viele Kunden kennen ihre Rechte nicht genau."
  ],
  [
    "A",
    "Wussten Sie zum Beispiel, dass man bei vielen Online-Käufen in Deutschland ein gesetzliches Widerrufsrecht von vierzehn Tagen hat?"
  ],
  [
    "B",
    "Das bedeutet, dass Sie einen Kauf innerhalb dieser Frist ohne Angabe von Gründen widerrufen können. Die Frist beginnt normalerweise, wenn Sie die Ware erhalten haben."
  ],
  [
    "A",
    "Wichtig ist aber: Sie müssen dem Verkäufer mitteilen, dass Sie den Kauf widerrufen möchten. Das können Sie zum Beispiel per E-Mail machen. Einfach nur die Ware zurückzuschicken, reicht nicht aus."
  ],
  [
    "B",
    "Aber Vorsicht: Es gibt Ausnahmen. Bei Produkten, die speziell für einen Kunden angefertigt wurden, gilt dieses Widerrufsrecht normalerweise nicht."
  ],
  [
    "B",
    "Außerdem sollten Sie vor dem Bestellen prüfen, ob der Online-Shop seriös ist. Lesen Sie die Bewertungen anderer Käufer und achten Sie auf die Kontaktadresse des Unternehmens."
  ],
  [
    "A",
    "Besonders vorsichtig sollten Sie sein, wenn ein Produkt ungewöhnlich billig angeboten wird. Ein sehr niedriger Preis kann ein Hinweis auf einen betrügerischen Online-Shop sein."
  ],
  [
    "B",
    "Ein anderes Problem ist die Lieferung. Manchmal kommt ein Paket zu spät an oder ein Produkt ist beschädigt."
  ],
  [
    "B",
    "In solchen Fällen sollten Sie den Kundenservice kontaktieren. Beschreiben Sie das Problem möglichst genau und geben Sie Ihre Bestellnummer an."
  ],
  [
    "A",
    "Wenn ein Artikel beschädigt angekommen ist, können Fotos helfen, das Problem zu erklären."
  ],
  [
    "A",
    "Und noch ein Tipp: Informieren Sie sich vor dem Kauf über die Versandkosten und die Bedingungen für eine Rücksendung. Manchmal müssen Kunden die Rücksendekosten selbst bezahlen."
  ],
  [
    "B",
    "Denken Sie also daran: Vergleichen Sie die Preise, prüfen Sie den Verkäufer und lesen Sie die Informationen zum Widerrufsrecht."
  ],
  [
    "A",
    "So können Sie sicherer online einkaufen und viele unangenehme Überraschungen vermeiden."
  ],
  [
    "B",
    "Das war unser Verbraucherservice für heute. Vielen Dank fürs Zuhören!"
  ],
  [
    "B",
    "Und bis zum nächsten Mal. Bleiben Sie aufmerksam beim Online-Shopping."
  ]
].map(([speaker, line]) => Object.freeze([speaker, line])));

const OPTIONS = Object.freeze(["A) Richtig", "B) Falsch"]);
const STATEMENTS = [
  {
    "prompt": "Bei vielen Online-Käufen in Deutschland kann man innerhalb von 14 Tagen ohne Angabe von Gründen widerrufen.",
    "correctIndex": 0,
    "hint": "Achte auf die Frist und darauf, ob man einen Grund nennen muss.",
    "evidence": "ein gesetzliches Widerrufsrecht von vierzehn Tagen",
    "explanation": "Die Sprecher erklären das 14-tägige Widerrufsrecht für viele Online-Käufe. Der Widerruf ist innerhalb der Frist ohne Begründung möglich."
  },
  {
    "prompt": "Für einen Widerruf reicht es, die Ware ohne weitere Nachricht zurückzuschicken.",
    "correctIndex": 1,
    "hint": "Was muss der Käufer dem Verkäufer mitteilen?",
    "evidence": "Einfach nur die Ware zurückzuschicken, reicht nicht aus.",
    "explanation": "Der Käufer muss den Widerruf gegenüber dem Verkäufer erklären, zum Beispiel per E-Mail."
  },
  {
    "prompt": "Auch bei speziell für Kunden angefertigten Produkten gilt das Widerrufsrecht normalerweise.",
    "correctIndex": 1,
    "hint": "Höre auf die genannten Ausnahmen.",
    "evidence": "Bei Produkten, die speziell für einen Kunden angefertigt wurden, gilt dieses Widerrufsrecht normalerweise nicht.",
    "explanation": "Sonderanfertigungen sind eine ausdrücklich genannte Ausnahme."
  },
  {
    "prompt": "Ein ungewöhnlich niedriger Preis kann auf einen betrügerischen Online-Shop hinweisen.",
    "correctIndex": 0,
    "hint": "Welche Warnung geben die Sprecher zu extrem billigen Angeboten?",
    "evidence": "Ein sehr niedriger Preis kann ein Hinweis auf einen betrügerischen Online-Shop sein.",
    "explanation": "Die Sprecher empfehlen, Preise, Bewertungen und die Kontaktadresse des Anbieters zu überprüfen."
  },
  {
    "prompt": "Bei einer beschädigten Lieferung sollte man den Kundenservice kontaktieren und die Bestellnummer angeben.",
    "correctIndex": 0,
    "hint": "Welche Informationen soll man bei Lieferproblemen nennen?",
    "evidence": "Beschreiben Sie das Problem möglichst genau und geben Sie Ihre Bestellnummer an.",
    "explanation": "Zusätzlich können Fotos helfen, die Beschädigung zu zeigen."
  }
];

export const B1_DAY25_LISTENING_QUESTIONS = Object.freeze(STATEMENTS.map((item) => Object.freeze({
  prompt: item.prompt,
  options: OPTIONS,
  correctIndex: item.correctIndex,
  answer: OPTIONS[item.correctIndex],
  evidence: item.evidence,
  hint: item.hint,
  explanation: item.explanation,
})));

export const B1_DAY25_LISTENING = Object.freeze({
  level: "B1",
  day: 25,
  title: "Verbraucherservice · Sicher online einkaufen",
  audioKey: B1_DAY25_AUDIO_KEY,
  transcript: B1_DAY25_TRANSCRIPT,
  questions: B1_DAY25_LISTENING_QUESTIONS,
  suggestedMinutes: 9,
  playbackNote: "Lies zuerst die fünf Aussagen. Das Programm wird in der Aufnahme zweimal vorgespielt (ca. 5:43 Min.). Wähle A = Richtig oder B = Falsch.",
  previewWords: ["das Widerrufsrecht", "der Online-Shop", "die Rücksendung", "die Bestellnummer"],
});
