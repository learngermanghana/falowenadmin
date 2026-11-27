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
  title: "Uchafuzi wa mazingira: sababu na suluhisho",
  objective: "Eleza tabia za kulinda mazingira, toa sababu na pendekeza suluhisho.",
  stages: [
    { id: "intro", type: "intro", kicker: "Utangulizi · B1", title: "Uchafuzi wa mazingira: sababu na suluhisho", heading: "Uchafuzi wa mazingira: sababu na suluhisho", content: "Unafanya nini kila siku ili kulinda mazingira?", prompt: "Taja tabia mbili zinazolinda mazingira." },
    { id: "music", type: "media-pending", kicker: "Muziki · B1", title: "Wimbo wa somo", content: "Wimbo wa somo hili bado haujawekwa. Endelea na zoezi la kusikiliza." },
    { id: "vocabulary", type: "reading-text", kicker: "Msamiati", title: "Maneno muhimu", content: "Kutenganisha taka · Kuchakata taka\nKupunguza plastiki · Kuokoa nishati\nChupa ya chuma · Pipa la taka" },
    { id: "grammar", type: "question", kicker: "Sarufi", title: "Viunganishi vya B1", content: "Hata hivyo · tofauti\nKwa sababu hiyo · matokeo\nIli · lengo", prompt: "Unganisha: Ninazima taa. Ninataka kuokoa nishati. (ili)", answer: "Ninazima taa ili niokoe nishati." },
    { id: "knowledge", type: "classroom-listening", kicker: "Kusikiliza · B1", title: "Mazungumzo ya Amina na Juma", listening: SWAHILI_B1_DAY27_LISTENING },
    { id: "reading", type: "reading-text", kicker: "Kusoma · B1", title: "Kutunza mazingira", content: "Katika ulimwengu wa leo, kutunza mazingira ni jukumu muhimu la kila raia. Mazingira safi na salama huwezesha binadamu na viumbe wengine kuishi kwa afya njema. Hata hivyo, kutokana na kuongezeka kwa uchafuzi wa mazingira na matumizi mabaya ya maliasili, jamii nyingi zinakabiliwa na changamoto kubwa za mabadiliko ya tabianchi na magonjwa. Kwa sababu hiyo, ni lazima tuchukue hatua madhubuti katika maisha ya kila siku ili kulinda dunia yetu.\n\nKuna njia mbalimbali za kutunza mazingira nyumbani na kazini. Kwanza, tunapaswa kupunguza matumizi ya mifuko ya plastiki na kuanza kurejeleza taka. Badala ya kutupa taka ovyo, ni vyema kutenganisha taka za kikaboni na zile zisizooza. Pili, kutumia nishati kwa busara, kama vile kuzima taa na vyombo vya umeme wakati havihitajiki, husaidia kuokoa rasilimali. Tatu, kupanda miti na kutunza mimea husafisha hewa na kuzuia mmomonyoko wa udongo.\n\nKwa hitimisho, kila kitendo kidogo tunachofanya kina mchango mkubwa katika hifadhi ya mazingira. Tukishirikiana na kuwajibika kikamilifu, tutalinda dunia kwa ajili ya vizazi vya sasa na vijavyo." },
    { id: "reading-1", type: "question", kicker: "Kusoma · Ufahamu", title: "Swali 1", prompt: "Ni changamoto gani mbili kuu zinazotokana na uchafuzi wa mazingira?", answer: "Mabadiliko ya tabianchi na magonjwa." },
    { id: "reading-2", type: "question", kicker: "Kusoma · Ufahamu", title: "Swali 2", prompt: "Ni njia gani mbili za kushughulikia taka nyumbani?", answer: "Kupunguza plastiki, kurejeleza taka au kutenganisha taka za kikaboni na zile zisizooza (taja mbili)." },
    { id: "reading-3", type: "question", kicker: "Kusoma · Ufahamu", title: "Swali 3", prompt: "Kwa nini tunapaswa kuzima taa zisizohitajika?", answer: "Ili kuokoa rasilimali." },
    { id: "reading-4", type: "question", kicker: "Kusoma · Ufahamu", title: "Swali 4", prompt: "Kupanda miti kuna faida gani mbili?", answer: "Husafisha hewa na kuzuia mmomonyoko wa udongo." },
    { id: "reading-5", type: "question", kicker: "Kusoma · Ufahamu", title: "Swali 5", prompt: "Ujumbe mkuu wa hitimisho ni upi?", answer: "Kila kitendo kidogo kina umuhimu; tukishirikiana tutalinda dunia kwa vizazi vya sasa na vijavyo." },
    { id: "speaking", type: "presentation", kicker: "Kuzungumza", title: "Pendekezo kwa jamii", content: "Eleza tabia mbili au tatu za kulinda mazingira.\nTaja faida, changamoto na pendekezo.\nTumia angalau viunganishi vitatu vya B1." },
    { id: "writing", type: "writing", kicker: "Kuandika", title: "Insha au ripoti", content: "Andika maneno 120–160 kuhusu jinsi unavyotunza mazingira.\nEleza umuhimu, njia, faida na ushauri kwa jamii." },
  ],
  workbookConnection: { workbookUrl: "https://www.falowen.app/campus/course/swahili/b1/day-27", subtitle: "Endelea na kitabu cha kozi cha B1, somo la 27." },
});
