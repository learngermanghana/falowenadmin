import { SWAHILI_MUSIC_TRACKS } from "./swahiliMusicTracks.js";

// Day 2 follows the complete classroom sequence used on Day 10. The Radio
// stage is intentionally prepared without a player until its episode exists.
export const SWAHILI_DAY_TWO_ADMIN_LESSON = Object.freeze({
  id: "swahili-day-2",
  course: "SWAHILI",
  language: "Kiswahili",
  day: "Day 2",
  dayNumber: 2,
  title: "Somo la 2 · Salamu",
  topic: "Salamu na kujitambulisha",
  objective: "Kusalimia kwa heshima, kujibu salamu na kujitambulisha kwa Kiswahili.",
  stages: [
    {
      id: "intro", type: "intro", kicker: "Utangulizi · Introduction", title: "Somo la 2 · Salamu",
      heading: "Salamu · Heshima · Kujitambulisha",
      content: "Salimia mtu kwa wakati unaofaa.\nJibu kwa heshima.\nTumia salamu za marafiki na za wakubwa.",
      english: "Greet people for the time and situation, reply politely, and use both informal and respectful greetings.",
      notes: "Start with a quick call-and-response: Habari za asubuhi? / Njema sana! Then ask learners what greeting they use at home."
    },
    {
      id: "ai-video", type: "media-pending", kicker: "Video ya somo · AI", title: "Video ya somo · Salamu",
      content: "Video ya somo itaongezwa baadaye.",
      english: "The Day 2 lesson video will be added later. Continue with the live greeting practice."
    },
    {
      id: "grammar", type: "grammar", kicker: "Sarufi · Grammar", title: "Salamu na viwakilishi vya nafsi",
      details: [
        { title: "Salamu za wakati · Time-based greetings", rule: "Use Habari za asubuhi? in the morning, Habari za mchana? in the afternoon and Habari za jioni? in the evening. A reply can be Nzuri, Salama or Njema.", body: "Habari za asubuhi? — Njema sana!\nHabari za mchana? — Salama!\nHabari za jioni? — Nzuri sana!", english: "Good morning? — Very well! · Good afternoon? — Fine! · Good evening? — Very well!", question: "Unasemaje ‘Good afternoon?’", answer: "Habari za mchana?" },
        { title: "Salamu za heshima · Respectful greetings", rule: "Use Shikamoo for an older person or someone you address respectfully. The respectful reply is Marahaba.", body: "Shikamoo mama! — Marahaba!\nShikamoo mwalimu! — Marahaba!", english: "Respectful greeting to mother/teacher — respectful reply.", question: "Mtu akisema Shikamoo, unajibu nini?", answer: "Marahaba!" },
        { title: "Salamu za kawaida · Everyday greetings", rule: "Hujambo? addresses one person; Hamjambo? addresses more than one person. Friends may also use Mambo?, Vipi?, Sasa? or Niaje?", body: "Hujambo? — Sijambo!\nHamjambo? — Hatujambo!\nMambo? — Poa!\nVipi? — Safi!", english: "How are you? — I’m fine! · How are you all? — We’re fine! · What’s up? — Cool!", question: "Jibu la Hamjambo? ni lipi?", answer: "Hatujambo!" },
        { title: "Viwakilishi vya nafsi · Personal pronouns", rule: "Mimi, wewe, yeye, sisi, ninyi and wao mean I, you, he/she, we, you all and they. Use ni in a simple identity sentence.", body: "Mimi ni mwanafunzi.\nWewe ni rafiki yangu.\nSisi ni wanafunzi.", english: "I am a student. · You are my friend. · We are students.", question: "Jaza pengo: Sisi ___ wanafunzi.", answer: "ni" },
        { title: "Kujitambulisha · Introducing yourself", rule: "Ask Unaitwa nani? for a name and Unatoka wapi? for origin. Answer with Ninaitwa … and Ninatoka ….", body: "Unaitwa nani? — Ninaitwa Amina.\nUnatoka wapi? — Ninatoka Ghana.", english: "What is your name? — My name is Amina. · Where are you from? — I am from Ghana.", question: "Uliza mwenzako jina lake.", answer: "Unaitwa nani?" }
      ],
      notes: "Read each pair aloud twice. Have learners answer before revealing the model answer."
    },
    {
      id: "vocabulary", type: "reading", kicker: "Msamiati · Vocabulary", title: "Maneno muhimu ya salamu",
      content: "asubuhi · morning\nmchana · afternoon\njioni · evening\nheshima · respect\nrafiki · friend\nmwalimu · teacher\nkwa heri · goodbye\nkaribu tena · welcome again",
      prompt: "Taja salamu moja ya heshima na salamu moja ya marafiki.", answer: "Shikamoo! ni ya heshima. Mambo? ni ya marafiki."
    },
    {
      id: "music", type: "music", kicker: "Muziki · Music", title: "Salamu, Salamu",
      audio: SWAHILI_MUSIC_TRACKS.find(track => track.id === "swahili-a1-day-02"),
      questions: [
        { section: "A. Uelewa wa wimbo · Song understanding", prompt: "Wimbo unasema tunafanya nini kila siku?", english: "What does the song say we do every day?", answer: "Tunasalimiana kila siku." },
        { section: "A. Uelewa wa wimbo · Song understanding", prompt: "Jibu la Shikamoo ni lipi?", english: "What is the reply to Shikamoo?", answer: "Marahaba!" },
        { section: "A. Uelewa wa wimbo · Song understanding", prompt: "Taja salamu mbili za marafiki unazosikia katika wimbo.", english: "Name two informal greetings you hear in the song.", answer: "Mambo? / Vipi? / Sasa? / Niaje? (any two)." },
        { section: "B. Kuzungumza · Speaking practice", prompt: "Chagua wakati wa siku na umsalamie mwenzako. Mwenzako ajibu kwa Kiswahili.", english: "Choose a time of day, greet your partner and have them reply in Swahili.", answer: "Mfano: Habari za jioni? — Nzuri sana!" },
        { section: "C. Kazi ya jozi · Pair work", prompt: "Tengenezeni mazungumzo ya mistari minne: salamu, jibu, swali la jina na kwa heri.", english: "Create a four-line dialogue: greeting, reply, name question and goodbye.", answer: "A: Hujambo?\nB: Sijambo.\nA: Unaitwa nani?\nB: Ninaitwa … Kwa heri!" }
      ]
    },
    {
      id: "radio", type: "media-pending", kicker: "Kusikiliza · Falowen Radio", title: "Falowen Radio · Salamu",
      content: "Kipindi cha Falowen Radio kitaongezwa baadaye.",
      english: "The Day 2 Falowen Radio episode will be added later. Use the song and the teacher-led dialogue for listening practice.",
      notes: "Keep this stage in the sequence. Do not add a placeholder audio player."
    },
    {
      id: "teacher-listening", type: "teacher-listening", kicker: "Kusikiliza · Teacher-led listening", title: "Sikiliza salamu",
      content: "Sikiliza mwalimu mara mbili. Tambua salamu, jibu na salamu ya kuaga.",
      english: "Listen to your teacher twice. Identify the greeting, reply and farewell.",
      prompt: "Asha anamsalimia mwalimu kwa heshima. Anasema nini, na mwalimu anajibu nini?", answer: "Asha: Shikamoo mwalimu! Mwalimu: Marahaba!",
      notes: "Read twice: Asha: Shikamoo mwalimu! Mwalimu: Marahaba, Asha. Hujambo? Asha: Sijambo, asante. Kwa heri! Mwalimu: Kwa heri!"
    },
    {
      id: "reading", type: "reading", kicker: "Kusoma · Reading", title: "Soma mazungumzo",
      content: "Amina: Habari za asubuhi?\nJuma: Njema sana, asante. Na wewe je?\nAmina: Salama. Unaitwa nani?\nJuma: Ninaitwa Juma. Unatoka wapi?\nAmina: Ninatoka Ghana. Kwa heri!\nJuma: Kwa heri!",
      english: "Read the dialogue with a partner, then change the names, country and time of day.", prompt: "Amina anatoka wapi?", answer: "Amina anatoka Ghana."
    },
    {
      id: "scenario", type: "scenario", kicker: "Kuzungumza · Scenario", title: "Kutana na rafiki mpya",
      content: "Mko darasani kwa mara ya kwanza.\nSalimiana kwa wakati unaofaa.\nUliza jina na nchi ya mwenzako.\nJibu kwa sentensi kamili.\nMuage kwa heshima.",
      english: "Meet a new classmate. Greet them appropriately, ask their name and country, answer in full sentences and say goodbye.",
      notes: "Put learners in pairs. Switch roles after one minute. Ask one pair to perform for the class."
    },
    {
      id: "writing", type: "writing", kicker: "Kuandika · Writing", title: "Andika mazungumzo mafupi",
      content: "Andika mazungumzo ya mistari 4–6. Tumia salamu, jina, nchi na kwa heri.\n\nTumia: Habari …? · Ninaitwa … · Ninatoka … · Kwa heri!",
      english: "Write a 4–6 line dialogue using a greeting, names, countries and goodbye.",
      prompt: "Je, umeandika salamu, jina, nchi na kwa heri?", answer: "Kagua kazi yako kabla ya kuisoma kwa mwenzako."
    },
    {
      id: "presentation", type: "presentation", kicker: "Uwasilishaji · Presentation", title: "Onyesha mazungumzo yako",
      content: "Fanyeni mazungumzo yenu mbele ya darasa.\nSikiliza jozi nyingine na taja salamu moja mpya uliyosikia.",
      english: "Perform your dialogue for the class. Listen to another pair and name one new greeting you heard.",
      notes: "End with whole-class repetition of the song’s final line: Asante sana, karibu tena!"
    }
  ]
});
