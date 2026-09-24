export const A1_WRITING_RUBRIC_VERSION = "a1-semantic-2026-09-24-v1";

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
    "Complete both A1 letters. Teil 1 is an informal birthday message to a friend: say why you are writing, congratulate the friend, ask whether there is a party, and ask whether your family can come. Teil 2 is a formal email to a language school: say why you are writing, ask when the course begins, ask how much it costs, and ask whether you can pay online. Each letter must use the appropriate greeting and closing.",
    [
      "Teil 1: Say why you are writing",
      "Teil 1: Congratulate the friend on the birthday",
      "Teil 1: Ask whether there is a party",
      "Teil 1: Ask whether your family can come",
      "Teil 1: Use an informal greeting and informal closing with your name",
      "Teil 2: Say why you are writing to the language school",
      "Teil 2: Ask when the course begins",
      "Teil 2: Ask how much the course costs",
      "Teil 2: Ask whether you can pay online",
      "Teil 2: Use a formal greeting and formal closing with your name"
    ]
  ],
  [
    "A1-13",
    "Wetter",
    "informal_email",
    "informal",
    ["teil3"],
    "Schreiben Sie eine E-Mail an Bina. Sie hat Sie zur Hochzeit eingeladen, aber Sie können nicht kommen. Explain why you are writing, give a concrete weather reason, and make a suggestion.",
    [
      "Explain why you are writing or say that you cannot come to the wedding",
      "Give one concrete weather reason for not coming",
      "Make a concrete suggestion for another meeting"
    ]
  ],
  [
    "A1-14.1",
    "Gesundheit und Körperteile",
    "informal_email",
    "informal",
    ["teil2"],
    "Schreiben Sie eine E-Mail an Felix. Er hat Sie zum Geburtstag eingeladen, aber Sie können nicht teilnehmen. Explain why you are writing, give a health-related reason, and ask for another time to meet.",
    [
      "Explain why you are writing or say that you cannot attend the birthday",
      "Give one health-related reason for not attending",
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
}));

const byKey = new Map(specs.map((spec) => [spec.assignmentKey, spec]));

export function getA1WritingTaskSpec(assignmentKey = "") {
  return byKey.get(String(assignmentKey || "").trim().toUpperCase()) || null;
}

export function getA1WritingTaskSpecs() {
  return [...specs];
}
