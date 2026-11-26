// Source: teacher-provided Day 28 audio and verbatim transcript. Classroom practice only.
export const SWAHILI_B1_DAY28_AUDIO_KEY = "swahili/B1/day-28/swahili-listening kuntasa.mp3";
const transcript = [
  [
    "A",
    "Habari yako Juma. Nimesoma makala kuhusu kupunguza plastiki mjini Dar es Salaam leo."
  ],
  [
    "B",
    "Sijaisoma lakini ninajua tuna tatizo kubwa la taka za plastiki mitaani."
  ],
  [
    "A",
    "Kweli kabisa. Unadhani tunapaswa kufanya nini ili kulinda mazingira yetu nyumbani?"
  ],
  [
    "B",
    "Kwanza kabisa, ninapendekeza tuache kutumia mifuko ya plastiki tunapokwenda sokoni."
  ],
  [
    "A",
    "Nakubaliana nawe kuhusu mifuko hiyo, lakini ni vigumu kubeba vitu vizito mikononi."
  ],
  [
    "B",
    "Tunaweza kutumia vikapu vya asili au mifuko ya kitambaa inayodumu kwa muda mrefu."
  ],
  [
    "A",
    "Hiyo ni hoja nzuri sana. Lakini vipi kuhusu chupa za maji tunazozitumia kila siku?"
  ],
  [
    "B",
    "Badala ya kununua maji ya chupa kila mara, tunaweza kubeba chupa za chuma kutoka nyumbani."
  ],
  [
    "A",
    "Wazo zuri, lakini maji ya bomba hayana usalama wa kutosha hapa kwetu."
  ],
  [
    "B",
    "Unaweza kuchemsha maji na kuyapunguza kabla ya kuyatia kwenye chupa yako ya kudumu."
  ],
  [
    "A",
    "Sijawahi kufikiria hilo. Itatuokoa pesa na kupunguza taka za plastiki."
  ],
  [
    "B",
    "Ndiyo, na pia tunaweza kutenganisha taka za kikaboni na plastiki ili kurahisisha usafishaji."
  ],
  [
    "A",
    "Kazi hiyo inaonekana ngumu mwanzoni, lakini itakuwa tabia nzuri baadaye."
  ],
  [
    "B",
    "Tukianza na hatua ndogo kama hizi, tutalinda mazingira yetu bila shida kubwa."
  ],
  [
    "A",
    "Kesho nitanunua mifuko miwili ya kitambaa na kuanza mabadiliko haya rasmi."
  ],
  [
    "B",
    "Hongera sana kwa uamuzi huo mzuri. Nitafurahi kukusaidia ukianza safari hii."
  ]
];
const source = [
  [
    "Juma tayari amesoma makala kuhusu kupunguza plastiki mjini Dar es Salaam.",
    "Si kweli",
    1
  ],
  [
    "Juma anapendekeza kutumia vikapu vya asili au mifuko ya kitambaa badala ya mifuko ya plastiki.",
    "Kweli",
    5
  ],
  [
    "Juma anataka waendelee kununua maji kwenye chupa za plastiki kila siku.",
    "Si kweli",
    7
  ],
  [
    "Kutenganisha taka za kikaboni na plastiki kutarahisisha usafishaji.",
    "Kweli",
    11
  ],
  [
    "Mzungumzaji A anapanga kununua mifuko mitatu ya kitambaa kesho.",
    "Si kweli",
    14
  ]
];
const options = Object.freeze(["Kweli", "Si kweli"]);
export const SWAHILI_B1_DAY28_LISTENING = Object.freeze({
  level: "B1", day: 28, title: "Kupunguza plastiki · Mazungumzo na Juma",
  audioKey: SWAHILI_B1_DAY28_AUDIO_KEY,
  playbackNote: "Soma kauli tano kwanza. Sikiliza mazungumzo, kisha amua kama kila kauli ni kweli au si kweli.",
  previewWords: ["makala", "mifuko ya kitambaa", "vikapu vya asili", "chupa za chuma", "taka za kikaboni"],
  transcript,
  questions: source.map(([prompt, answer, line]) => ({
    prompt, options, answer, correctIndex: options.indexOf(answer),
    evidence: transcript[line][1],
    explanation: "Ushahidi: “" + transcript[line][1] + "”",
    hint: "Sikiliza kwa makini maneno yanayohusiana na kauli hii.",
  })),
});
