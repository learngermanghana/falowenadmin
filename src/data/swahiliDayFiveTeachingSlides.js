import { SWAHILI_MUSIC_TRACKS } from "./swahiliMusicTracks.js";

const radioUrl = "https://youtu.be/SKVEqbLqjSY";

const grammarPages = [
  {"title":"Huyu ni / Hawa ni · Introduce your family","rule":"Use huyu ni for one person and hawa ni for more than one. Ni stays the same. Use anaitwa to add one person’s name.","body":"Huyu ni dada yangu.\nAnaitwa Amina.\nHawa ni wazazi wangu.","english":"This is my sister. / Her name is Amina. / These are my parents.","question":"How do you introduce your parents?","answer":"Hawa ni wazazi wangu."},
  {"title":"Yangu / wangu · Say whose","rule":"Put the possessive after the family noun. The ending -angu means ‘my’, while the first part changes with noun-class agreement. Learn the whole phrase.","body":"mama yangu\nmke wangu\nwatoto wangu\nwazazi wangu","english":"my mother / my wife / my children / my parents","question":"Complete: Hawa ni watoto ___. (These are my children.)","answer":"Hawa ni watoto wangu."},
  {"title":"Nina / una / ana · Count family members","rule":"Nina means ‘I have’, una means ‘you have’, and ana means ‘he or she has’. Put the number after the noun. Compare mmoja and wawili in these phrases.","body":"Nina kaka mmoja.\nNina dada wawili.\nAna watoto wawili.\nUna ndugu wangapi?","english":"I have one brother. / I have two sisters. / They have two children. / How many siblings do you have?","question":"Say ‘I have one brother and two sisters.’","answer":"Nina kaka mmoja na dada wawili."},
  {"title":"Wakati uliopo · Describe your family","rule":"For these regular present forms, use a subject prefix + -na- + the verb stem. A- refers to one person and wa- to several people. Ask wapi? for a place.","body":"Anaishi Arusha.\nWanaishi Arusha.\nWatoto wangu wanasoma shule ya msingi.\nWazazi wako wanaishi wapi?","english":"He or she lives in Arusha. / They live in Arusha. / My children go to primary school. / Where do your parents live?","question":"Answer ‘Where do your parents live?’ using Arusha.","answer":"Wazazi wangu wanaishi Arusha."},
];

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
    { id: "music", type: "day-five", title: "Muziki · Listen and repeat", audio: SWAHILI_MUSIC_TRACKS.find(track => track.id === "swahili-a1-day-05") },
    {
      id: "listening", type: "listening", kicker: "Kusikiliza · Listening",
      title: "Falowen Radio · Familia yangu", radioUrl,
      english: "Read the first-round prompts, then play the episode for the class.",
      notes: "Use the next two stages for the first and second listens. Return here to play the embedded episode.",
    },
    {
      id: "radio-first-listening",
      type: "radio-questions",
      kicker: "Falowen Radio · First listening",
      title: "First listening · Main idea",
      english: "Listen once. Compare your notes with a partner.",
      content: "Mazungumzo yanahusu nini? · What is the conversation about?\n\nWrite one Swahili family word you hear.",
      radioUrl,
    },
    {
      id: "radio-second-listening",
      type: "radio-questions",
      kicker: "Falowen Radio · Second listening",
      title: "Second listening · Details",
      english: "Listen again. Compare answers and replay the relevant line to check.",
      content: "Ni maneno gani ya familia unayosikia? · Which family words do you hear?\n\nWrite one detail you hear about a family member.\n\nRepeat one complete phrase from the recording.",
      radioUrl,
    },
    {
      id: "radio-write",
      type: "radio-questions",
      kicker: "Falowen Radio · After listening",
      title: "Write · Familia yangu",
      content: "Use one family word from the episode in a new sentence. Introduce one family member in a second sentence.",
      prompt: "Show a model response",
      answer: "Huyu ni dada yangu. Anaitwa Amina.",
    },
    {
      id: "radio-speak",
      type: "radio-questions",
      kicker: "Falowen Radio · After listening",
      title: "Speak · Mazungumzo ya jozi",
      content: "Tell a partner about one family member. Your partner asks a follow-up question. Then switch roles.",
      prompt: "Show a model exchange",
      answer: "A: Huyu ni kaka yangu.\nB: Anaitwa nani?\nA: Anaitwa Juma.",
    },
    { id: "grammar", type: "grammar", kicker: "Sarufi · Grammar", title: "Familia yangu · Grammar", details: grammarPages },
    { id: "vocabulary", type: "day-five", title: "Msamiati · Vocabulary", content: "mama · mother\nbaba · father\nkaka · brother\ndada · sister" },
    { id: "reading", type: "day-five", title: "Kusoma · Reading", content: "Huyu ni Asha. Ana kaka mmoja na dada wawili. How many sisters does Asha have?" },
    { id: "writing", type: "day-five", title: "Kuandika · Writing", content: "Write three sentences introducing your family." },
    { id: "speaking", type: "day-five", title: "Kuzungumza · Speaking", content: "Ask your partner: Una ndugu wangapi?" },
    { id: "presentation", type: "day-five", title: "Presentation · My family", content: "Introduce two members of your family to the class." },
  ],
};
