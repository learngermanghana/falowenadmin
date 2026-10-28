// Deterministic, zero-cost suggestions from the selected course dictionary
// topic. Teachers can always switch to a custom music direction.
const TOPIC_MOODS = Object.freeze([
  { match: /gesundheit|körper|koerper|body|health|arzt|apotheke|doctor|hospital|krank|schmerz|wohlbefinden/i, label: "Health & care", style: "a gentle, reassuring acoustic folk ballad with softly fingerpicked guitar, a delicate piano line and a calm, caring melody; empathetic rather than dramatic; light percussion only" },
  { match: /reisen|reise|urlaub|travel|journey|transport|bahn|zug|bahnhof|flughafen|richtung|directions|weg|stadt|unterwegs/i, label: "Travel & directions", style: "a bright acoustic Afro-pop travel groove with light hand percussion and gentle guitar; a sense of moving forward, not a heavy dance beat" },
  { match: /essen|trinken|food|restaurant|café|cafe|küche|kochen|rezept|einkaufen|shopping|supermarkt|markt/i, label: "Food & shopping", style: "a playful, warm acoustic bossa-pop rhythm with soft guitar and subtle shaker; conversational and easy to sing along to" },
  { match: /familie|family|freunde|friends|beziehung|relationship|liebe|love|menschen|people/i, label: "Family & friendship", style: "a heartfelt acoustic Afro-soul melody with soft guitar, restrained piano and a comforting, friendly pulse" },
  { match: /arbeit|beruf|job|work|karriere|career|büro|office|bewerbung|interview/i, label: "Work & career", style: "a steady, optimistic acoustic pop groove with light guitar and soft piano, confident and encouraging without loud drums" },
  { match: /schule|lernen|learn|studium|studieren|prüfung|exam|kurs|unterricht|classroom|bildung/i, label: "School & learning", style: "a cheerful, unhurried acoustic pop singalong with light guitar, soft handclaps and a memorable melodic hook" },
  { match: /natur|umwelt|environment|wetter|weather|klima|nature|tiere|animals|garten|garden/i, label: "Nature & weather", style: "an airy, relaxed acoustic folk arrangement with gentle guitar, subtle flute and spacious natural warmth" },
  { match: /gefühle|gefuehle|feelings|emotion|glück|happy|traurig|sad|angst|stress|problem|konflikt/i, label: "Feelings & challenges", style: "a reflective, hopeful soft acoustic soul song with delicate piano and quiet guitar, moving toward a warm resolution" },
  { match: /hallo|greeting|begrüß|begrueß|vorstell|introduc|name|herkunft|origin/i, label: "Greetings & introductions", style: "a friendly, bright acoustic Afro-pop welcome song with simple rhythmic guitar and a gentle call-and-response feel" },
  { match: /zeit|time|uhr|tagesablauf|routine|woche|week|termine|appointments|planen|planning/i, label: "Time & routines", style: "a gentle rhythmic acoustic pop track with soft guitar, a light ticking shaker and an easy, steady pulse" },
]);
export function getMusicTopicStyle(entry) {
  const topic = [entry?.germanTitle, entry?.englishTitle].filter(Boolean).join(" ");
  return TOPIC_MOODS.find(item => item.match.test(topic))
    || { label: "Everyday German", style: "a warm, melodic acoustic Afro-soul / soft pop arrangement with very gentle guitar and a simple memorable hook" };
}
export function suggestLessonMusicDirection(entry, { instrumental = false } = {}) {
  const { label, style } = getMusicTopicStyle(entry);
  const level = String(entry?.level || "A1").toUpperCase();
  const pace = level === "A1" ? "slow and very clear, with space between short German phrases"
    : level === "A2" ? "relaxed and clearly articulated, with short everyday dialogue"
    : level === "B1" ? "moderate and conversational, with a slightly fuller story arc"
    : "natural and expressive while keeping every lyric intelligible";
  const voice = instrumental
    ? "Instrumental only, no voice, no choir, no humming and no spoken words."
    : "One intimate warm lead voice, clearly in front of every instrument. No backing choir, loud drums, heavy bass or competing solos.";
  return [
    `Falowen German lesson music — automatically matched to ${label}.`,
    `Music style: ${style}.`,
    `CEFR ${level}: keep the rhythm ${pace}.`,
    voice,
    "Make the music support the lesson's real-life storytelling. Keep the arrangement sparse, uplifting and classroom-friendly, with a complete final cadence and gentle fade. Never drown out German consonants.",
  ].join(" ");
}
