import { SWAHILI_MUSIC_TRACKS } from "./swahiliMusicTracks.js";

export const SWAHILI_DAY_FIVE_ADMIN_LESSON = {
  id: "swahili-day-5",
  course: "SWAHILI",
  language: "Kiswahili",
  day: "Day 5",
  dayNumber: 5,
  title: "Shughuli za kila siku",
  objective: "Talk about simple daily routines in the present tense.",
  stages: [
    { id: "intro", type: "day-five", title: "Shughuli za kila siku", content: "Describe what you do in the morning." },
    { id: "music", type: "day-five", title: "Muziki · Listen and repeat", audio: SWAHILI_MUSIC_TRACKS[0] },
    { id: "listening", type: "day-five", title: "Kusikiliza · Listening", content: "Listen to the recording and share one word you recognize." },
    { id: "grammar", type: "day-five", title: "Sarufi · Present tense", content: "ni-na- marks “I”; a-na- marks “he/she”. Ninaamka mapema. Anaenda shuleni." },
    { id: "vocabulary", type: "day-five", title: "Msamiati · Vocabulary", content: "kuamka · to wake up\nkunywa · to drink\nkwenda · to go" },
    { id: "reading", type: "day-five", title: "Kusoma · Reading", content: "Asha anaamka mapema. Anakunywa chai. What does Asha drink?" },
    { id: "writing", type: "day-five", title: "Kuandika · Writing", content: "Write three sentences about your morning." },
    { id: "speaking", type: "day-five", title: "Kuzungumza · Speaking", content: "Ask your partner: Unaamka saa ngapi?" },
    { id: "presentation", type: "day-five", title: "Presentation · My morning", content: "Tell the class what you do on a typical morning." },
  ],
};
