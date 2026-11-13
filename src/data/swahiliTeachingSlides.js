// Day 1 content is taken from the existing Kiswahili alphabet and
// pronunciation lesson. This is the same A2-inspired teaching sequence
// (introduction, music, listening, grammar, reading, speaking, writing,
// presentation, summary), not a separate slide engine or a new lesson.
// Audio stages remain intentionally unrecorded until supplied by the teacher.
export const SWAHILI_DAY_ONE_SLIDES = Object.freeze([
  {
    id: "intro", type: "intro", kicker: "Utangulizi · Introduction",
    title: "Somo la 1 · Alfabeti, sauti na matamshi",
    content: "Leo tunajifunza vokali, silabi na matamshi.",
    english: "Today we learn vowels, syllables and pronunciation.",
    prompt: "Ni vokali zipi unazozijua?",
    answer: "A · E · I · O · U",
    notes: "Introduce the goal. Invite learners to name sounds they already recognise before revealing the five vowels."
  },
  {
    id: "music", type: "music", kicker: "Muziki · Music",
    title: "Muziki · Sauti za Kiswahili",
    content: "A · E · I · O · U",
    english: "Music is planned for this lesson but has not been uploaded.",
    status: "pending-audio",
    prompt: "Unaweza kutamka vokali hizi?",
    notes: "Do not simulate or play missing recordings. Use a spoken call-and-response activity until an approved Falowen track is published."
  },
  {
    id: "listening", type: "listening", kicker: "Kusikiliza · Hören",
    title: "Sikiliza na utambue sauti",
    content: "mama · kiti · mtoto · kuku · chai",
    english: "Teacher-led listening: listen to each spoken word and identify its vowel.",
    status: "teacher-led",
    prompt: "Ni vokali gani unayosikia?",
    answer: "mama → a · kiti → i · mtoto → o · kuku → u · chai → a / i",
    notes: "Read each example aloud once or twice. Let learners answer before revealing. No recorded listening file exists yet."
  },
  {
    id: "grammar", type: "grammar", kicker: "Sarufi · Grammatik",
    title: "Vokali, silabi na matamshi",
    content: "A · E · I · O · U\nba · be · bi · bo · bu\ncha · che · chi · cho · chu\nla · le · li · lo · lu",
    english: "Five vowels and consonant–vowel syllables. Pronounce the combinations clearly.",
    details: [
      { title: "Vokali tano", body: "A · E · I · O · U" },
      { title: "Silabi za B", body: "ba · be · bi · bo · bu" },
      { title: "Silabi za CH", body: "cha · che · chi · cho · chu" },
      { title: "Silabi za L", body: "la · le · li · lo · lu" },
      { title: "Miunganiko", body: "ch — chai\ndh — dhahabu\ngh — gharama\nng’ — ng’ombe\nny — nyanya\nsh — shule\nth — thelathini" },
      { title: "Mkazo", body: "MA-ma · ra-FI-ki · mwa-LI-mu · cha-KU-la · Ki-swa-HI-li" }
    ],
    prompt: "Soma: cha · che · chi · cho · chu",
    answer: "The combination CH is pronounced together in each syllable.",
    notes: "Use the same A2 rule → model → quick-check sequence. Contrast ng/ng’, s/sh and t/th. Stress generally falls on the penultimate syllable."
  },
  {
    id: "reading", type: "reading", kicker: "Kusoma · Lesen",
    title: "Soma maneno haya",
    content: "mama\nmtoto\nkiti\nkuku\nchai",
    english: "Read the five familiar Day 1 words. Do not introduce new vocabulary.",
    prompt: "Neno gani linamaanisha ‘chair’?",
    answer: "kiti",
    notes: "Ask learners to read individually, then match each word to its familiar meaning: mother, child, chair, chicken, tea."
  },
  {
    id: "speaking", type: "speaking", kicker: "Kuzungumza · Sprechen",
    title: "Soma na rudia",
    content: "A · E · I · O · U\nba · be · bi · bo · bu\nchai · shule · nyanya · ng’ombe",
    english: "Pair practice: one learner reads and the other repeats; switch roles.",
    prompt: "Unaweza kutamka ‘ng’ombe’ na ‘nyanya’?",
    notes: "Model carefully, allow pair practice, then invite volunteers to read and provide one additional pronunciation attempt."
  },
  {
    id: "writing", type: "writing", kicker: "Kuandika · Schreiben",
    title: "Andika vokali na silabi",
    content: "a · e · i · o · u\nba · be · bi · bo · bu\nmama · kiti · kuku",
    english: "Write the vowels, five B syllables and familiar words from the Day 1 workbook.",
    prompt: "Andika silabi tano za B.",
    answer: "ba · be · bi · bo · bu",
    notes: "This is a classroom bridge to the workbook's existing Teil 2 writing task, not a separate graded submission."
  },
  {
    id: "presentation", type: "presentation", kicker: "Uwasilishaji · Presentation",
    title: "Onyesha unachojua",
    content: "1. Taja vokali tano.\n2. Soma silabi za CH.\n3. Soma ‘mama’, ‘kiti’ na ‘mtoto’.",
    english: "One learner demonstrates vowel recognition and pronunciation, while classmates listen.",
    prompt: "Ni sauti gani ilikuwa ngumu kutamka?",
    notes: "Invite a brief individual demonstration and one follow-up question. Keep it supportive and ungraded."
  },
  {
    id: "summary", type: "summary", kicker: "Hitimisho · Summary",
    title: "Umejifunza nini?",
    content: "Vokali · Silabi · Matamshi\nTeil 2 · Kuandika\nTeil 3 · Kusoma\nTeil 4 · Kusikiliza\nSubmit · Wasilisha",
    english: "You can identify vowels, read syllables and pronounce simple words. Continue in the Day 1 learner workbook.",
    prompt: "Taja neno moja jipya ulilojifunza.",
    notes: "Return to the existing Day 1 workbook. Recorded music/listening and further lessons will be attached when available."
  }
]);

export const SWAHILI_DAY_ONE_ADMIN_LESSON = Object.freeze({
  id: "swahili-day-1",
  course: "SWAHILI",
  language: "Kiswahili",
  day: "Day 1",
  dayNumber: 1,
  title: "Somo la 1 · Alfabeti, sauti na matamshi",
  topic: "Alfabeti, sauti na matamshi",
  objective: "Kutambua vokali na konsonanti, kusoma silabi, na kutamka maneno ya Kiswahili kwa usahihi.",
  stages: SWAHILI_DAY_ONE_SLIDES,
});
