// Source: teacher-provided Day 26 recording and verbatim dialogue. Classroom only.
export const SWAHILI_B1_DAY26_AUDIO_KEY = "swahili/B1/day-26/swahili-listening matitizo.mp3";
const transcript = [
  [
    "A",
    "Habari ya asubuhi, Juma. Nimesikia kuwa safari yako ya kwenda Mombasa wiki ijayo imepata matatizo kidogo."
  ],
  [
    "B",
    "Habari za asubuhi, Amina. Ndiyo, kweli. Treni ya asubuhi imejaa yote, kwa hiyo lazima nifikirie njia nyingine ya kusafiri."
  ],
  [
    "A",
    "Je, umezungumza na kampuni ya mabasi badala ya treni? Mabasi yaendayo pwani ni mengi na nafuu kuliko ndege."
  ],
  [
    "B",
    "Nimeangalia mabasi, lakini natilia shaka usalama barabarani wakati huu wa mvua. Njia kuu ina matope mengi na foleni ndefu."
  ],
  [
    "A",
    "Unasema kweli kuhusu mvua. Lakini vipi kuhusu kupanda ndege ndogo ya ndani? Bei imepungua kidogo wiki hii."
  ],
  [
    "B",
    "Ndege ni nzuri na ya haraka sana, lakini bajeti yangu ya mwezi huu ni finyu sana kwa gharama ile."
  ],
  [
    "A",
    "Nakuelewa vizuri. Labda unaweza kusafiri siku moja mapema kabla ya mvua kubwa haijaanza kunyesha tena."
  ],
  [
    "B",
    "Wazo lako ni zuri kabisa. Nitakata tiketi ya basi la usiku wa leo badala ya kusubiri hadi kesho asubuhi."
  ],
  [
    "A",
    "Hiyo ni suluhisho nzuri zaidi. Nakutakia safari njema na uwasili salama huko Mombasa."
  ],
  [
    "B",
    "Asante sana kwa ushauri wako mzuri na msaada wako leo, Amina. Tutaongeana tukifika."
  ]
];
const source = [
  [
    "Treni ya asubuhi haina nafasi tena.",
    "Kweli",
    1
  ],
  [
    "Juma hana wasiwasi kuhusu usalama barabarani wakati wa mvua.",
    "Si kweli",
    3
  ],
  [
    "Juma hawezi kumudu gharama ya ndege kwa sababu bajeti yake ni finyu.",
    "Kweli",
    5
  ],
  [
    "Amina anapendekeza Juma asafiri siku moja baadaye.",
    "Si kweli",
    6
  ],
  [
    "Juma anaamua kukata tiketi ya basi la usiku wa leo.",
    "Kweli",
    7
  ]
];
const options = Object.freeze(["Kweli","Si kweli"]);
export const SWAHILI_B1_DAY26_LISTENING = Object.freeze({
  level: "B1", day: 26, title: "Matatizo ya safari · Amina na Juma",
  audioKey: SWAHILI_B1_DAY26_AUDIO_KEY,
  playbackNote: "Soma kauli tano kwanza. Sikiliza mazungumzo, kisha amua kama kila kauli ni kweli au si kweli.",
  previewWords: ["bajeti finyu","kutilia shaka","foleni","mpango mbadala","kukata tiketi"],
  transcript,
  questions: source.map(([prompt,answer,line]) => ({
    prompt, options, answer, correctIndex: options.indexOf(answer), evidence: transcript[line][1],
    explanation: "Ushahidi: “" + transcript[line][1] + "”",
    hint: "Sikiliza kwa makini maneno yanayohusiana na kauli hii.",
  })),
});
const readingPassage = [
  "Katika ulimwengu wa leo, kusafiri imekuwa sehemu ya maisha ya kila siku ya watu wengi, iwe kwa ajili ya kazi, masomo, au mapumziko. Hata hivyo, mara nyingi wasafiri wanakabiliwa na matatizo mbalimbali kabla ya safari au wakati wa safari zao. Ni muhimu kutambua changamoto hizi na kutafuta suluhisho madhubuti ili kuhakikisha safari inakuwa ya amani na usalama.",
  "Tatizo la kwanza ambalo huwakumba wasafiri wengi ni kuchelewa au kufutwa kwa usafiri, kama vile ndege, mabasi, au treni. Hali hii mara nyingi husababishwa na hali mbaya ya hewa, matatizo ya kiufundi, au msongamano wa magari. Ili kusuluhisha tatizo hili, msafiri anapaswa kuanza safari mapema na kukagua ratiba za usafiri mara kwa mara mtandaoni kabla ya kuondoka nyumbani. Pia, ni wazo zuri kuwa na mpango mbadala endapo usafiri wa kwanza utachelewa.",
  "Tatizo la pili ni upotevu wa mizigo au nyaraka muhimu kama vile pasipoti na tiketi. Kupoteza pasipoti katika nchi ya ugenini ni changamoto kubwa sana. Suluhisho la tatizo hili ni kutengeneza nakala za nyaraka zote muhimu (katika karatasi na kwenye simu au barua pepe) na kuweka vitu vyenye thamani kubwa kwenye begi la mkononi (hand luggage). Pia, kuweka lebo yenye jina na nambari ya simu kwenye kila begi husaidia kupata mizigo haraka ikipotea.",
  "Kwa hitimisho, ingawa safari zinaweza kuwa na changamoto na usumbufu, kujiandaa vizuri mapema ni ufunguo wa kutatua matatizo mengi. Tukipanga safari zetu kwa umakini na kuwa na subira, tutaweza kufurahia safari zetu bila msongo wa mawazo."
];
const readingChecks = [
  ["Kwa nini watu wengi husafiri?","Kwa ajili ya kazi, masomo au mapumziko."],
  ["Taja sababu mbili za kuchelewa au kufutwa kwa usafiri.","Hali mbaya ya hewa, matatizo ya kiufundi au msongamano wa magari (taja mbili)."],
  ["Unawezaje kujilinda dhidi ya kupoteza nyaraka muhimu?","Tengeneza nakala za nyaraka na weka vitu vya thamani kwenye begi la mkononi."],
  ["Kwa nini kuweka lebo kwenye kila begi ni muhimu?","Husaidia kupata mizigo haraka ikipotea."],
  ["Ujumbe mkuu wa hitimisho ni upi?","Kujiandaa mapema, kupanga vizuri na kuwa na subira husaidia kutatua matatizo ya safari."],
];
export const swahiliB1Day26 = Object.freeze({
  id: "swahili-b1-day-26", course: "SWAHILI", level: "B1", day: "B1 · Day 26", dayNumber: 26, assignmentId: "SWAHILI-B1-9.26",
  title: "Matatizo ya safari na suluhisho zake",
  objective: "Eleza tatizo la safari, sababu zake na suluhisho linalowezekana.",
  stages: [
    { id:"intro", type:"intro", kicker:"Utangulizi · B1", title:"Matatizo ya safari", heading:"Matatizo ya safari na suluhisho zake", content:"Eleza safari ambayo haikuenda kama ulivyopanga." },
    { id:"music", type:"media-pending", kicker:"Muziki · B1", title:"Wimbo wa somo", content:"Wimbo wa somo hili bado haujawekwa. Endelea na zoezi la kusikiliza." },
    { id:"knowledge", type:"classroom-listening", kicker:"Kusikiliza · B1", title:"Matatizo ya safari · Amina na Juma", listening:SWAHILI_B1_DAY26_LISTENING },
    { id:"reading", type:"reading-text", kicker:"Kusoma · B1", title:"Matatizo ya safari na suluhisho zake", content:readingPassage.join("\n\n") },
    ...readingChecks.map(([prompt,answer],i)=>({id:"reading-"+(i+1),type:"question",kicker:"Kusoma · Ufahamu",title:"Swali "+(i+1),prompt,answer})),
    { id:"vocabulary",type:"reading-text",kicker:"Msamiati",title:"Maneno muhimu",content:"Kuahirisha safari · Kufutwa kwa usafiri\nMsongamano wa magari · Mizigo\nNyaraka muhimu · Mpango mbadala\nUsafiri wa kuaminika · Malipo ya ziada" },
    { id:"grammar",type:"question",kicker:"Sarufi",title:"Viunganishi vya B1",content:"Hata hivyo / ingawa — tofauti\nKwa sababu — sababu\nKwa sababu hiyo — matokeo\nIli — lengo",prompt:"Unganisha: Basi lilichelewa. Tulitafuta usafiri mwingine. (Kwa sababu hiyo)",answer:"Basi lilichelewa. Kwa sababu hiyo, tulitafuta usafiri mwingine." },
    { id:"grammar-past",type:"question",kicker:"Sarufi",title:"Wakati uliopita",content:"-li-: Nilipoteza tiketi.\nUkanushi -ku-: Sikupoteza tiketi.",prompt:"Kanusha: Tulichelewa.",answer:"Hatukuchelewa." },
    { id:"mistakes",type:"question",kicker:"Makosa ya kawaida",title:"Sahihisha sentensi",prompt:"Nilipiga simu ili ninapata msaada.",answer:"Nilipiga simu ili nipate msaada." },
    { id:"practice",type:"question",kicker:"Mazoezi",title:"Unganisha sentensi",prompt:"Tulikuwa tumechoka. Tulifika salama. (Ingawa)",answer:"Ingawa tulikuwa tumechoka, tulifika salama." },
    { id:"speaking",type:"presentation",kicker:"Kuzungumza",title:"Tatizo la safari",content:"Eleza safari ambayo haikuenda kama ulivyopanga.\nTaja tatizo, sababu, suluhisho na ushauri.\nTumia angalau viunganishi vitatu vya B1." },
    { id:"scenario",type:"presentation",kicker:"Kuzungumza · Jozi",title:"Tatizo kituoni",content:"A: Basi lako limefutwa; una miadi muhimu. Omba msaada.\nB: Wewe ni mfanyakazi wa kampuni ya usafiri. Pendekeza basi jingine au kurejesha nauli.\nKubalianeni kuhusu muda na gharama." },
    { id:"writing",type:"writing",kicker:"Kuandika",title:"Insha au ripoti",content:"Andika maneno 120–160 kuhusu tatizo ulilokumbana nalo safarini.\nEleza safari, tatizo, sababu, suluhisho na matokeo." },
    { id:"workbook",type:"summary",kicker:"Kitabu cha kozi",title:"Kujikagua",content:"Nimeeleza tatizo na sababu yake.\nNimependekeza suluhisho.\nNimetumia viunganishi vya B1." },
  ],
  workbookConnection:{workbookUrl:"https://www.falowen.app/campus/course/swahili/b1/day-26",subtitle:"Endelea na kitabu cha kozi cha B1, somo la 26."},
});
