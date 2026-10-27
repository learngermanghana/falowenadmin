export const A1_WRITING_RUBRIC_VERSION = "a1-semantic-2026-09-24-v1";

export const A1_LETTER_WRITING_ASSIGNMENTS = Object.freeze(["A1-12.3", "A1-13", "A1-14.1"]);
const A1_LETTER_WRITING_SET = new Set(A1_LETTER_WRITING_ASSIGNMENTS);

const rows = [
  [
    "A1-1.1",
    "Personalpronomen und Verbkonjugation",
    "writing",
    "unspecified",
    ["teil2"],
    "Write a short self-introduction. Use simple A1 sentences. Include your name, where you come from and where you live. Use at least one greeting and one farewell.",
    [
      "Begin with a greeting",
      "State your name",
      "Say where you come from",
      "Say where you live",
      "End with a farewell"
    ]
  ],
  [
    "A1-1.2",
    "Präsens und sich vorstellen",
    "writing",
    "unspecified",
    ["teil2"],
    "Write a short paragraph introducing yourself. Include a greeting, your name, where you come from and where you live.",
    [
      "Include a greeting",
      "State your name",
      "Say where you come from",
      "Say where you live"
    ]
  ],
  [
    "A1-3",
    "Über die Familie schreiben",
    "writing",
    "unspecified",
    ["teil2"],
    "Schreibe über deine Familie. Write one short connected text. The workbook gives these ideas as support: family members, names and ages, jobs, hobbies and where the family lives.",
    [
      "Write a connected text about your family",
      "Mention at least one family member",
      "Give at least two concrete family details such as a name, age or job",
      "Add at least one hobby or where the family lives"
    ]
  ],
  [
    "A1-12.3",
    "Einführung ins Briefeschreiben",
    "writing",
    "unspecified",
    ["teil1", "teil2"],
    "Complete both A1 letters. Each letter has exactly three content points. Teil 1 is an informal birthday message to a friend: congratulate the friend, ask whether there is a party, and ask whether your family can come. Teil 2 is a formal email to a language school: ask when the course begins, ask how much it costs, and ask whether you can pay online. Greeting, closing and name are required letter form, but they are not extra task points.",
    [
      "Teil 1: Congratulate the friend on the birthday",
      "Teil 1: Ask whether there is a party",
      "Teil 1: Ask whether your family can come",
      "Teil 2: Ask when the course begins",
      "Teil 2: Ask how much the course costs",
      "Teil 2: Ask whether you can pay online"
    ]
  ],
  [
    "A1-13",
    "Wetter",
    "informal_email",
    "informal",
    ["teil3"],
    "Second A1 letter-writing step after A1-12.3. Schreiben Sie eine kurze informelle E-Mail an Bina. Sie hat Sie zur Hochzeit eingeladen, aber Sie können nicht kommen. Write to exactly three content points: say that you cannot come, give one concrete weather reason, and suggest another meeting. Use an appropriate informal greeting, closing and your name, but do not treat these as extra task points.",
    [
      "Say that you cannot come to the wedding",
      "Give one concrete weather reason that explains why you cannot come",
      "Make a concrete suggestion for another meeting"
    ]
  ],
  [
    "A1-14.1",
    "Gesundheit und Körperteile",
    "informal_email",
    "informal",
    ["teil2"],
    "Third A1 letter-writing step after A1-12.3 and A1-13. Schreiben Sie eine kurze informelle E-Mail an Felix. Er hat Sie zum Geburtstag eingeladen, aber Sie können nicht teilnehmen. Write to exactly three content points: say that you cannot come, give one concrete health reason, and ask for or suggest another time to meet. Use an appropriate informal greeting, closing and your name, but do not treat these as extra task points.",
    [
      "Say that you cannot come to the birthday",
      "Give one concrete health reason for not attending",
      "Ask for another date or suggest another meeting"
    ]
  ]
];

const specs = rows.map(([assignmentKey, title, textType, register, partIds, taskText, taskPoints]) => Object.freeze({
  assignmentKey,
  level: "A1",
  title,
  textType,
  register,
  partIds,
  taskText,
  taskPoints,
  rubricVersion: A1_WRITING_RUBRIC_VERSION,
  letterWriting: A1_LETTER_WRITING_SET.has(assignmentKey),
}));

const byKey = new Map(specs.map((spec) => [spec.assignmentKey, spec]));

export function getA1WritingTaskSpec(assignmentKey = "") {
  return byKey.get(String(assignmentKey || "").trim().toUpperCase()) || null;
}

export function getA1WritingTaskSpecs() {
  return [...specs];
}

export function isA1LetterWritingAssignment(assignmentKey = "") {
  return A1_LETTER_WRITING_SET.has(String(assignmentKey || "").trim().toUpperCase());
}
