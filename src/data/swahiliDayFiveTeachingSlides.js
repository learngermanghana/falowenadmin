import { SWAHILI_MUSIC_TRACKS } from "./swahiliMusicTracks.js";

export const SWAHILI_DAY_FIVE_ADMIN_LESSON = {
  id: "swahili-day-5",
  course: "SWAHILI",
  language: "Kiswahili",
  day: "Day 5",
  dayNumber: 5,
  title: "Familia yangu",
  objective: "Introduce your family using simple Kiswahili sentences.",
  stages: [
    { id: "intro", type: "day-five", title: "Familia yangu", content: "Name two members of your family." },
    { id: "music", type: "day-five", title: "Muziki · Listen and repeat", audio: SWAHILI_MUSIC_TRACKS[0] },
    { id: "listening", type: "day-five", title: "Kusikiliza · Listening", content: "Listen to the recording and share one word you recognize." },
    { id: "grammar", type: "day-five", title: "Sarufi · Introductions", content: "Use huyu ni to introduce a person and nina to say what you have. Huyu ni mama yangu. Nina kaka mmoja." },
    { id: "vocabulary", type: "day-five", title: "Msamiati · Vocabulary", content: "mama · mother\nbaba · father\nkaka · brother\ndada · sister" },
    { id: "reading", type: "day-five", title: "Kusoma · Reading", content: "Huyu ni Asha. Ana kaka mmoja na dada wawili. How many sisters does Asha have?" },
    { id: "writing", type: "day-five", title: "Kuandika · Writing", content: "Write three sentences introducing your family." },
    { id: "speaking", type: "day-five", title: "Kuzungumza · Speaking", content: "Ask your partner: Una ndugu wangapi?" },
    { id: "presentation", type: "day-five", title: "Presentation · My family", content: "Introduce two members of your family to the class." },
  ],
};
