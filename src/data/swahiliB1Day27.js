// Classroom-only source: teacher-provided Day 27 recording and transcript.
export const SWAHILI_B1_DAY27_AUDIO_KEY = "swahili/B1/day-27/kuntunza.mp3";
const transcript = [
  [
    "A",
    "Jambo Juma, ninafikiri tunapaswa kubadilisha mfumo wetu wa takataka nyumbani ili kulinda mazingira."
  ],
  [
    "B",
    "Jambo Amina, wazo nzuri sana kwa sababu mazingira yetu yanazidi kuchafuka kila siku."
  ],
  [
    "A",
    "Unapendekeza tuanze na nini kati ya kupunguza matumizi ya plastiki na kutenganisha taka?"
  ],
  [
    "B",
    "Nadhani tuanze na kutenganisha taka za plastiki na zile za vyakula kwanza."
  ],
  [
    "A",
    "Mimi naona bora tupunguze matumizi ya plastiki dukani kwa sababu ndiyo zinazoharibu mazingira zaidi."
  ],
  [
    "B",
    "Nakubaliana nawe kidogo, lakini mifuko ya plastiki tayari ipo mingi ndani ya nyumba yetu."
  ],
  [
    "A",
    "Kweli kabisa, tukitenganisha taka tutapata urahisi wa kuzichakata au kuziuza kwa kampuni za usafi."
  ],
  [
    "B",
    "Lakini pia, kuacha kununua maji ya chupa za plastiki kutapunguza uchafu na kuokoa fedha zetu."
  ],
  [
    "A",
    "Hilo ni wazo bora zaidi kwa sababu tunaweza kutumia chupa za chuma zinazodumu kwa muda mrefu."
  ],
  [
    "B",
    "Sawa, kesho nitanunua mapipa mawili tofauti ya taka ili tuanze utaratibu huu mara moja."
  ],
  [
    "A",
    "Nitafurahi sana, na nitahakikisha familia nzima inafuata sheria hii mpya bila kukosea."
  ],
  [
    "B",
    "Vizuri sana, ushirikiano wetu utasaidia sana kuweka mtaa wetu safi na salama."
  ]
];
const source = [
  [
    "Juma anapendekeza kuanza kwa kutenganisha taka za plastiki na taka za vyakula.",
    "Kweli",
    3
  ],
  [
    "Amina anafikiri ni bora kuongeza matumizi ya plastiki dukani.",
    "Si kweli",
    4
  ],
  [
    "Kutenganisha taka kutarahisisha kuzichakata au kuziuza kwa kampuni za usafi.",
    "Kweli",
    6
  ],
  [
    "Juma anasema kuacha kununua maji kwenye chupa za plastiki kutaongeza gharama zao.",
    "Si kweli",
    7
  ],
  [
    "Juma atapata mapipa mawili tofauti ya taka kesho.",
    "Kweli",
    9
  ]
];
const options = Object.freeze(["Kweli", "Si kweli"]);
export const SWAHILI_B1_DAY27_LISTENING = Object.freeze({
  level: "B1", day: 27, title: "Kutunza mazingira · Amina na Juma",
  audioKey: SWAHILI_B1_DAY27_AUDIO_KEY,
  playbackNote: "Soma kauli tano kwanza. Sikiliza mazungumzo, kisha amua kama kila kauli ni kweli au si kweli.",
  previewWords: ["kutenganisha taka", "kuchakata", "mapipa", "chupa za chuma", "kuokoa fedha"],
  transcript,
  questions: source.map(([prompt, answer, line]) => ({
    prompt, options, answer, correctIndex: options.indexOf(answer),
    evidence: transcript[line][1],
    explanation: "Ushahidi: “" + transcript[line][1] + "”",
    hint: "Sikiliza kwa makini maneno yanayohusiana na kauli hii.",
  })),
});
export const swahiliB1Day27 = Object.freeze({
  id: "swahili-b1-day-27", course: "SWAHILI", level: "B1",
  day: "B1 · Day 27", dayNumber: 27, assignmentId: "SWAHILI-B1-10.27",
  title: "Kutunza mazingira katika maisha ya kila siku",
  objective: "Eleza tabia za kulinda mazingira, toa sababu na pendekeza suluhisho.",
  stages: [
    { id: "intro", type: "intro", kicker: "Utangulizi · B1", title: "Kutunza mazingira", heading: "Kutunza mazingira", content: "Unafanya nini kila siku ili kulinda mazingira?", prompt: "Taja tabia mbili zinazolinda mazingira." },
    { id: "vocabulary", type: "reading-text", kicker: "Msamiati", title: "Maneno muhimu", content: "Kutenganisha taka · Kuchakata taka\nKupunguza plastiki · Kuokoa nishati\nChupa ya chuma · Pipa la taka" },
    { id: "grammar", type: "question", kicker: "Sarufi", title: "Viunganishi vya B1", content: "Hata hivyo · tofauti\nKwa sababu hiyo · matokeo\nIli · lengo", prompt: "Unganisha: Ninazima taa. Ninataka kuokoa nishati. (ili)", answer: "Ninazima taa ili niokoe nishati." },
    { id: "knowledge", type: "classroom-listening", kicker: "Kusikiliza · B1", title: "Mazungumzo ya Amina na Juma", listening: SWAHILI_B1_DAY27_LISTENING },
    { id: "speaking", type: "presentation", kicker: "Kuzungumza", title: "Pendekezo kwa jamii", content: "Eleza tabia mbili au tatu za kulinda mazingira.\nTaja faida, changamoto na pendekezo.\nTumia angalau viunganishi vitatu vya B1." },
    { id: "writing", type: "writing", kicker: "Kuandika", title: "Insha au ripoti", content: "Andika maneno 120–160 kuhusu jinsi unavyotunza mazingira.\nEleza umuhimu, njia, faida na ushauri kwa jamii." },
  ],
  workbookConnection: { workbookUrl: "https://www.falowen.app/campus/course/swahili/b1/day-27", subtitle: "Endelea na kitabu cha kozi cha B1, somo la 27." },
});
