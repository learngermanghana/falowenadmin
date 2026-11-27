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
  objective: "Tambua aina za uchafuzi, eleza sababu na athari, na pendekeza suluhisho linalowezekana.",
  classroomSupport: {
    "glossary": [
      [
        "uchafuzi wa ardhi",
        "land pollution"
      ],
      [
        "uchafuzi wa mazingira",
        "environmental pollution"
      ],
      [
        "uchafuzi",
        "pollution"
      ],
      [
        "wakazi",
        "residents"
      ],
      [
        "mapipa",
        "bins"
      ],
      [
        "moshi",
        "smoke"
      ],
      [
        "mifereji",
        "drains"
      ],
      [
        "mafuriko",
        "flooding"
      ],
      [
        "maji machafu",
        "dirty water / wastewater"
      ],
      [
        "matatizo ya kupumua",
        "breathing problems"
      ],
      [
        "usimamizi wa taka",
        "waste management"
      ],
      [
        "kuchakatwa",
        "to be recycled / processed"
      ],
      [
        "watashirikiana",
        "they will cooperate"
      ]
    ],
    "role": [
      "Mkutano wa mtaa",
      "Eleza tatizo la taka karibu na mto na pendekeza hatua.",
      "Wewe ni kiongozi wa mtaa. Eleza changamoto ya fedha na toa suluhisho linalowezekana.",
      "Kwa sababu … / Kwa hiyo … / Hata hivyo … / Ili …"
    ],
    "presentation": "Zungumza kwa sekunde 90–120.\nEleza tatizo na sababu zake.\nTaja athari kwa afya au mazingira.\nPendekeza suluhisho mbili na ueleze kwa nini zinafaa.\nTumia angalau viunganishi vitatu.",
    "guidedReading": {
      "en": [
        "In the Mtoni neighborhood, residents face land, water and air pollution.",
        "Some people dump rubbish near the river because there are not enough bins.",
        "Others burn plastic waste, which causes smoke that harms health.",
        "When it rains, rubbish blocks drains and causes flooding.",
        "Dirty water increases the risk of disease, and smoke can cause breathing problems.",
        "Therefore, environmental pollution is not only a cleanliness problem but also a public health problem.",
        "To solve this problem, the local authorities should provide more bins and collect rubbish regularly.",
        "Residents should separate food waste and plastic so that waste can be recycled.",
        "However, bins alone are not enough if people do not know how to use them.",
        "For this reason, leaders can organize meetings to educate people about waste management.",
        "If residents and leaders cooperate, the neighborhood can become cleaner and safer."
      ],
      "evidence": [
        0,
        1,
        4,
        6,
        [
          8,
          9
        ]
      ]
    },
    "speakingGuide": {
      "starters": [
        "Tatizo kubwa katika eneo langu ni …",
        "Tatizo hili linatokana na …",
        "Kwa hiyo, …",
        "Ninapendekeza … ili …"
      ],
      "situations": [
        [
          "Taka karibu na mto",
          "Wewe ni mkazi. Eleza tatizo na omba mapipa zaidi.",
          "Wewe ni kiongozi. Eleza changamoto ya bajeti na pendekeza hatua.",
          "Taja sababu ya tatizo.",
          "Watu hutupa taka mtoni kwa sababu hakuna mapipa ya kutosha.",
          "Eleza athari.",
          "Taka huchafua maji na kuziba mifereji.",
          "Fikia mwafaka.",
          "Tuweke mapipa karibu na soko na tupange ratiba ya kukusanya taka."
        ],
        [
          "Moshi katika mtaa",
          "Eleza madhara ya kuchoma taka.",
          "Eleza kwa nini baadhi ya wakazi huchoma taka na pendekeza njia nyingine.",
          "Eleza tatizo.",
          "Moshi wa taka unaweza kusababisha matatizo ya kupumua.",
          "Eleza kizuizi.",
          "Hata hivyo, huduma ya kukusanya taka haitoshi.",
          "Pendekeza suluhisho.",
          "Tupange ukusanyaji wa taka mara kwa mara ili watu wasizichome."
        ],
        [
          "Mifereji iliyoziba",
          "Eleza hatari ya mafuriko kwa wakazi.",
          "Pendekeza hatua za dharura na za muda mrefu.",
          "Taja chanzo.",
          "Taka zinazotupwa ovyo huziba mifereji.",
          "Taja matokeo.",
          "Kwa hiyo, maji hufurika mvua inaponyesha.",
          "Kubalianeni kuhusu suluhisho.",
          "Tusafishe mifereji kwa usalama na tuongeze elimu ya usimamizi wa taka."
        ]
      ]
    }
  },
  stages: [
    {"id":"intro","type":"intro","kicker":"Utangulizi · B1","title":"Uchafuzi wa mazingira: sababu na suluhisho","heading":"Tatizo → Sababu → Athari → Suluhisho","content":"Taja aina tatu za uchafuzi wa mazingira.\nEleza sababu na athari zake.\nPendekeza suluhisho linalowezekana.","prompt":"Ni tatizo gani la mazingira unaloliona katika eneo lako?"},
    {"id":"music","type":"media-pending","kicker":"Muziki · B1","title":"Wimbo wa somo","content":"Wimbo wa somo hili bado haujawekwa. Endelea na zoezi la kusikiliza."},
    {"id":"vocabulary","type":"reading-text","kicker":"Msamiati · B1","title":"Aina za uchafuzi","content":"Uchafuzi wa hewa — moshi wa magari na uchomaji wa taka.\nUchafuzi wa maji — taka na maji machafu kwenye mito.\nUchafuzi wa ardhi — plastiki na taka zinazotupwa ovyo."},
    {"id":"vocabulary-impact","type":"reading-text","kicker":"Msamiati · B1","title":"Sababu, athari na suluhisho","content":"Sababu — chanzo cha tatizo.\nAthari — matokeo ya tatizo.\nMifereji — njia za kupitisha maji.\nUsimamizi wa taka — ukusanyaji, utenganishaji na uchakataji wa taka.\nUshirikiano — kufanya kazi pamoja."},
    {"id":"grammar","type":"grammar","kicker":"Sarufi · B1","title":"Kueleza sababu, matokeo na suluhisho","details":[{"title":"Sababu: kwa sababu / kutokana na","body":"Mto umechafuka kwa sababu watu hutupa taka ndani yake.\nKutokana na uchomaji wa taka, hewa imechafuka.","rule":"Kwa sababu + sentensi; kutokana na + nomino au kitenzi-jina.","question":"Unganisha: Hewa imechafuka. Watu wanachoma taka. (kwa sababu)","answer":"Hewa imechafuka kwa sababu watu wanachoma taka."},{"title":"Matokeo na tofauti: kwa hiyo / hata hivyo","body":"Taka zimeziba mifereji. Kwa hiyo, maji yamefurika.\nKuna mapipa mengi. Hata hivyo, baadhi ya watu bado hutupa taka ovyo.","rule":"Kwa hiyo huonyesha matokeo. Hata hivyo huonyesha tofauti au kizuizi.","question":"Unganisha: Mto umechafuka. Samaki wako hatarini. (kwa hiyo)","answer":"Mto umechafuka. Kwa hiyo, samaki wako hatarini."},{"title":"Lengo na pendekezo: ili / inapaswa","body":"Tuweke mapipa zaidi ili watu watenganishe taka.\nSerikali ya mtaa inapaswa kukusanya taka mara kwa mara.","rule":"Ili + kitenzi cha hali ya utegemezi (watenganishe); inapaswa + kitenzi-jina (kukusanya).","question":"Unganisha: Tunakusanya taka. Tunataka kuzuia uchafuzi. (ili)","answer":"Tunakusanya taka ili tuzuie uchafuzi."}]},
    {"id":"practice-1","type":"question","kicker":"Mazoezi · B1","title":"Sababu au matokeo?","prompt":"Jaza: Maji yamechafuka ______ watu hutupa taka mtoni.","answer":"kwa sababu"},
    {"id":"practice-2","type":"question","kicker":"Mazoezi · B1","title":"Onyesha matokeo","prompt":"Jaza: Taka zimeziba mifereji. ______, mtaa umepata mafuriko.","answer":"Kwa hiyo"},
    {"id":"practice-3","type":"question","kicker":"Mazoezi · B1","title":"Pendekeza suluhisho","prompt":"Kamilisha: Tuweke mapipa zaidi ili …","answer":"Mfano: Tuweke mapipa zaidi ili wakazi watenganishe taka."},
    { id: "knowledge", type: "classroom-listening", kicker: "Kusikiliza · B1", title: "Mazungumzo ya Amina na Juma", listening: SWAHILI_B1_DAY27_LISTENING },
    {"id":"reading","type":"reading-text","kicker":"Kusoma · B1","title":"Uchafuzi katika mtaa wa Mtoni","content":"Katika mtaa wa Mtoni, wakazi wanakabiliwa na uchafuzi wa ardhi, maji na hewa. Baadhi ya watu hutupa taka karibu na mto kwa sababu hakuna mapipa ya kutosha. Wengine huchoma taka za plastiki, jambo linalosababisha moshi unaodhuru afya.\n\nMvua inaponyesha, taka huziba mifereji ya maji na kusababisha mafuriko. Maji machafu huongeza hatari ya magonjwa, na moshi unaweza kusababisha matatizo ya kupumua. Kwa hiyo, uchafuzi wa mazingira si tatizo la usafi pekee bali pia la afya ya jamii.\n\nIli kutatua tatizo hili, serikali ya mtaa inapaswa kuweka mapipa zaidi na kukusanya taka mara kwa mara. Wakazi wanapaswa kutenganisha taka za vyakula na plastiki ili taka ziweze kuchakatwa. Hata hivyo, mapipa pekee hayatoshi kama watu hawajui jinsi ya kuyatumia. Kwa sababu hiyo, viongozi wanaweza kuandaa mikutano ya kutoa elimu kuhusu usimamizi wa taka. Ikiwa wakazi na viongozi watashirikiana, mtaa unaweza kuwa safi na salama zaidi."},
    {"id":"reading-1","type":"question","kicker":"Kusoma · Ufahamu","title":"Swali 1","prompt":"Ni aina gani tatu za uchafuzi zinazotajwa?","answer":"Uchafuzi wa ardhi, maji na hewa."},
    {"id":"reading-2","type":"question","kicker":"Kusoma · Ufahamu","title":"Swali 2","prompt":"Kwa nini baadhi ya wakazi hutupa taka karibu na mto?","answer":"Kwa sababu hakuna mapipa ya kutosha."},
    {"id":"reading-3","type":"question","kicker":"Kusoma · Ufahamu","title":"Swali 3","prompt":"Taja athari mbili za uchafuzi kwa afya.","answer":"Kuongezeka kwa hatari ya magonjwa na matatizo ya kupumua."},
    {"id":"reading-4","type":"question","kicker":"Kusoma · Ufahamu","title":"Swali 4","prompt":"Serikali ya mtaa inapaswa kufanya nini?","answer":"Kuweka mapipa zaidi na kukusanya taka mara kwa mara."},
    {"id":"reading-5","type":"question","kicker":"Kusoma · Ufahamu","title":"Swali 5","prompt":"Kwa nini mapipa pekee hayatoshi, na viongozi wanaweza kufanya nini?","answer":"Watu wanaweza kukosa elimu ya kuyatumia; viongozi wanaweza kuandaa mikutano ya kutoa elimu kuhusu usimamizi wa taka."},
    {"id":"speaking","type":"presentation","kicker":"Kuzungumza · B1","title":"Jadili tatizo la mazingira","content":"Chagua tatizo moja: moshi, maji machafu au taka mitaani.\nEleza sababu moja na athari mbili.\nLinganisha suluhisho mbili na chagua linalowezekana."},
    {"id":"presentation","type":"presentation","kicker":"Uwasilishaji · B1","title":"Tatizo la mazingira katika eneo langu","content":"Zungumza kwa sekunde 90–120.\nEleza tatizo na sababu zake.\nTaja athari kwa afya au mazingira.\nPendekeza suluhisho mbili na ueleze kwa nini zinafaa.\nTumia angalau viunganishi vitatu."},
    {"id":"writing","type":"writing","kicker":"Kuandika · B1","title":"Insha: uchafuzi wa mazingira","content":"Andika insha ya maneno 120–160 kuhusu uchafuzi wa mazingira katika eneo lako.\nEleza tatizo na sababu mbili.\nTaja athari mbili kwa watu au mazingira.\nPendekeza suluhisho mbili na ueleze wajibu wa wakazi au viongozi.\nTumia angalau viunganishi vitatu: kwa sababu, kwa hiyo, hata hivyo, ili.\nHitimisha kwa ushauri."},
    {"id":"summary","type":"summary","kicker":"Muhtasari · B1","title":"Je, unaweza?","content":"Kutaja aina za uchafuzi.\nKuunganisha sababu na matokeo.\nKutoa pendekezo lenye sababu.\nEndelea na mazoezi ya kitabu cha kozi."}
  ],
  workbookConnection: { workbookUrl: "https://www.falowen.app/campus/course/swahili/b1/day-27", subtitle: "Endelea na kitabu cha kozi cha B1, somo la 27." },
});
