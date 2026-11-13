// Source: Ruth's "Kiswahili Alfabeti Sauti na Matamshi", the Day 1
// source already used in the Falowen learner workbook. Do not extrapolate
// the A1/A2 syllabus into unpublished lessons or present audio as recorded.
export const SWAHILI_DAY_ONE_SLIDES = Object.freeze([
  { id: "intro", title: "Somo la 1 · Alfabeti, sauti na matamshi", content: "Leo tunajifunza vokali, silabi na matamshi.", english: "Today we learn vowels, syllables and pronunciation.", notes: "Tell learners the objective. Read each model first, then ask the class to repeat." },
  { id: "vowels", title: "Vokali tano", content: "A  ·  E  ·  I  ·  O  ·  U", english: "Five vowels: listen, repeat, then say them in reverse order.", notes: "Say each vowel clearly. Ask: Ni vokali gani unayosikia?" },
  { id: "vowel-words", title: "Vokali katika maneno", content: "A — mama\nE — wewe\nI — kiti\nO — mtoto\nU — kuku", english: "mother · you · chair · child · chicken", notes: "Model each word and invite volunteers to identify its highlighted vowel." },
  { id: "syllables-b", title: "Silabi za B", content: "ba  ·  be  ·  bi  ·  bo  ·  bu", english: "Combine consonants and vowels.", notes: "Students read each syllable slowly and then as a continuous sequence." },
  { id: "syllables-ch", title: "Silabi za CH", content: "cha  ·  che  ·  chi  ·  cho  ·  chu", english: "Practise the ch consonant combination.", notes: "Demonstrate ch, then practise pair repetition." },
  { id: "syllables-l", title: "Silabi za L", content: "la  ·  le  ·  li  ·  lo  ·  lu", english: "One more consonant–vowel series.", notes: "Ask learners to read a random syllable instead of only memorising the sequence." },
  { id: "letter-pairs", title: "Miunganiko ya herufi", content: "ch — chai\ndh — dhahabu\ngh — gharama\nng’ — ng’ombe\nny — nyanya\nsh — shule\nth — thelathini", english: "tea · gold · cost · cow · tomato · school · thirty", notes: "Focus on contrasts: ng / ng’, s / sh, t / th. Correct pronunciation, not spelling speed." },
  { id: "stress", title: "Mkazo wa neno", content: "MA-ma\nra-FI-ki\nmwa-LI-mu\ncha-KU-la\nKi-swa-HI-li", english: "In many Kiswahili words the penultimate syllable is stressed.", notes: "Tap the beat on the stressed syllable. Uppercase indicates stress here." },
  { id: "speaking", title: "Teil 1 · Kuzungumza", content: "A · E · I · O · U\nba · be · bi · bo · bu\nchai · shule · nyanya · ng’ombe", english: "Pair speaking practice: one learner reads, the other repeats.", notes: "Switch partners or roles. Invite volunteers to demonstrate." },
  { id: "finish", title: "Kazi ya Somo la 1", content: "Teil 2 · Kuandika\nTeil 3 · Kusoma\nTeil 4 · Kusikiliza (mwalimu)\nSubmit · Wasilisha", english: "Complete the exercises in the Falowen Kiswahili Day 1 workbook.", notes: "Teacher-led listening only until approved recorded audio is uploaded. Workbook: https://www.falowen.app/swahili/day-1" },
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
