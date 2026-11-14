import { SWAHILI_DAY_SIX_FOOD_CARDS, SWAHILI_DAY_SIX_DRINK_CARDS, SWAHILI_DAY_SIX_RESTAURANT_SCENARIOS } from "./swahiliDaySixVisualActivities.js";
// Source-aligned Lesson 6 content adapted from Ruth's "FOOD&DRINKS=LIKE&DISLIKES.pdf",
// "Odering Food.pdf", and "22MGAHAWANI GRAMMAR AND SONG LYRICS.docx".
// These source extracts and the workbook's radio reference were already published
// in Falowen's student app; the former PDF uploads are no longer required here.
// Use the shared A2-style presenter for classroom practice.
const radioUrl = "https://youtu.be/ZesonfipX4I";
const grammarPages = [
  { title:"1 · Kuomba kwa adabu · Polite requests",
    body:"Naomba wali na samaki, tafadhali.\nNaomba maji.\nNaomba bili, tafadhali.",
    rule:"Naomba / Ninaomba politely introduces a request; tafadhali means please.",
    english:"Rice and fish, please. Water, please. The bill, please.",
    question:"How do you ask politely for water?",answer:"Naomba maji, tafadhali." },
  { title:"2 · Nafsi sita · Six persons",
    body:"mimi — I   |   sisi — we\nwewe — you   |   ninyi — you (plural)\nyeye — he / she   |   wao — they",
    rule:"The person prefix in a Swahili verb can identify who is acting.",
    english:"Mimi ninataka wali. — I want rice.",
    question:"Which pronoun means 'we'?",answer:"sisi" },
  { title:"3 · Wakati uliopo · Want / don't want",
    body:"ni + na + taka → ninataka\nsi + taki → sitaki\nNinataka wali. / Sitaki wali.",
    rule:"Affirmative: subject prefix + -na- + verb stem. The regular present negative omits -na- and changes -a to -i.",
    english:"I want rice. / I do not want rice.",
    question:"How do you say 'I don't want meat'?",answer:"Sitaki nyama." },
  { title:"4 · Chakula, vinywaji na bei · Questions",
    body:"Mna chakula gani?\nMna vinywaji gani?\nJumla ni shilingi ngapi?",
    rule:"Mna…? asks staff what they have; ngapi asks how much/how many.",
    english:"What food do you have? What drinks do you have? How much is the total?",
    question:"Ask for the total price in Kiswahili.",answer:"Jumla ni shilingi ngapi?" },
  { title:"5 · Namba na bei · Numbers and prices",
    body:"moja · mbili · tatu · nne · tano\nkumi · ishirini · mia moja · elfu moja\nshilingi elfu tano",
    rule:"Mia means hundred; elfu means thousand. Prices are classroom examples, not a published restaurant price list.",
    english:"one · two · three · four · five / ten · twenty · one hundred · one thousand / five thousand shillings",
    question:"How do you say five thousand shillings?",answer:"shilingi elfu tano" },
  { title:"6 · Upatanisho wa nambari · Agreement",
    body:"kikombe kimoja cha chai\nvikombe viwili vya chai\nvikombe vitatu vya chai",
    rule:"Noun class affects numeral and connector endings: kikombe kimoja cha; vikombe viwili vya.",
    english:"one cup of tea / two cups of tea / three cups of tea",
    question:"How do you ask for two cups of tea?",answer:"Naomba vikombe viwili vya chai." },
  { title:"7 · Kiambishi -ni · Locative",
    body:"mgahawa → mgahawani\nsoko → sokoni\nmeza → mezani",
    rule:"With suitable common nouns, -ni creates a place expression. The verb tells location or movement.",
    english:"restaurant → at/to the restaurant; market → at/to the market; table → at/on the table",
    question:"How do you say 'I am eating at the restaurant'?",answer:"Ninakula mgahawani." },
];
export const SWAHILI_DAY_SIX_SLIDES = Object.freeze([
  {
    id:"intro",type:"intro",kicker:"Utangulizi · Introduction",
    foodCards:SWAHILI_DAY_SIX_FOOD_CARDS,
    title:"Somo la 6 · Mgahawani",
    content:"Chakula · Vinywaji · Kuomba kwa adabu\nTunaagiza chakula mgahawani.",
    english:"At the restaurant: food, drinks, polite requests and ordering.",
    prompt:"Unapenda chakula gani?",answer:"Ninapenda wali kuku / wali samaki / ugali nyama.",
    notes:"Begin with food and drinks already taught in Ruth's PDFs. Students name dishes they recognise before the first dialogue.",
  },
  {
    id:"music",type:"music",kicker:"Muziki · Music",
    title:"Falowen Music",
    notes:"Start on Listen. Open Lyrics for the second play, then use Questions to check what learners heard.",
  },
  {
    id:"listening",type:"listening",kicker:"Kusikiliza · Listening",
    title:"Falowen Radio · Mgahawani",
    radioUrl,
    english:"Read the questions for each round before playing the video.",
    notes:"Use the next slides for two rounds of listening. Return here to play the video for the class.",
  },
  {
    id:"radio-first-listening",type:"radio-questions",kicker:"Falowen Radio · First listening",
    title:"First listening · Q01–Q02",
    radioUrl,
    english:"Read both questions, then listen once and choose one answer for each. Focus on the main idea.",
    content:`Q01 · How does the restaurant conversation begin? [1 point]
A. The customer asks for the bill.
B. The customer and server exchange greetings.
C. The server asks for payment.

Q02 · Which expression asks for the menu? [1 point]
A. Naomba bili, tafadhali.
B. Mna vinywaji gani?
C. Naomba orodha ya vyakula, tafadhali.`,
    prompt:"Check Q01–Q02",
    answer:"Q01 · B. The customer and server exchange greetings.\nQ02 · C. Naomba orodha ya vyakula, tafadhali.",
  },
  {
    id:"radio-second-listening",type:"radio-questions",kicker:"Falowen Radio · Second listening",
    title:"Second listening · Q03–Q05",
    radioUrl,
    english:"Read Q03–Q05, then listen again. Choose True or False for Q03 and Q04.",
    content:`Q03 · Naomba can be used to make a polite request. [1 point]
True / False

Q04 · Sipendi means “I like”. [1 point]
True / False

Q05 · What total price is given in the example? [1 point]
Write the amount in digits or in Swahili.`,
    prompt:"Check Q03–Q05",
    answer:"Q03 · True.\nQ04 · False. Sipendi means “I do not like”.\nQ05 · Replay the price example to check the amount.",
  },
  {
    id:"radio-drinks-and-preferences",type:"radio-questions",kicker:"Falowen Radio · After listening",
    title:"Drinks and preferences · Q06–Q07",
    content:`Q06 · Match each drink to its English meaning. [3 points]
1. maji · 2. juisi ya embe · 3. juisi ya chungwa
A. orange juice · B. water · C. mango juice

Q07 · Fill each gap. Use each word once. [2 points]
Word bank: Sipendi · Ninapenda
1. _____ wali samaki. I like rice with fish.
2. _____ soda. I do not like soda.`,
    prompt:"Check Q06–Q07",
    answer:"Q06 · 1–B, 2–C, 3–A.\nQ07 · 1. Ninapenda. 2. Sipendi.",
  },
  {
    id:"radio-ordering",type:"radio-questions",kicker:"Falowen Radio · After listening",
    title:"Ordering at a restaurant · Q08–Q09",
    content:`Q08 · Put the expressions in the order of a restaurant visit. [1 point]
A. Naomba bili, tafadhali.
B. Kwa heri!
C. Habari yako?
D. Ninaomba wali samaki.
E. Naomba orodha ya vyakula, tafadhali.

Q09 · Arrange the words to ask for two cups of tea. [1 point]
chai · viwili · Naomba · vya · vikombe`,
    prompt:"Check Q08–Q09",
    answer:"Q08 · C → E → D → A → B.\nQ09 · Naomba vikombe viwili vya chai.",
  },
  {
    id:"radio-write",type:"radio-questions",kicker:"Falowen Radio · Write and speak",
    title:"Write three lines · Q10",
    content:`Q10 · Write three short lines. [3 points]
1. Greet the server.
2. Politely order one dish and one drink.
3. Ask for the bill.

Use naomba or ninaomba. Choose your own food and drink.
Useful words: wali, ugali, kuku, samaki, mbogamboga, maji, juisi, soda.`,
    prompt:"Show a model response for Q10",
    answer:"1. Habari yako?\n2. Naomba wali na kuku na maji, tafadhali.\n3. Naomba bili, tafadhali.",
  },
  {
    id:"radio-speak",type:"radio-questions",kicker:"Falowen Radio · Write and speak",
    title:"Restaurant conversation · Q11",
    content:`Q11 · Record a 30–45 second restaurant conversation. [4 points]
Include a greeting, a polite food order, a drink, a question about the total, and a thank-you and goodbye.
Use any reasonable practice price.

In class, perform with a partner. For the app, upload the recording. Say both names at the start of a shared recording. If working alone, record both parts.`,
    english:"Helpful beginnings: Habari yako? / Naomba… / Mna…? / Jumla ni shilingi ngapi? / Asante! / Kwa heri!",
    prompt:"Show a model conversation for Q11",
    answer:"Mteja: Habari yako? Naomba ugali na samaki, tafadhali. Mna maji?\nMhudumu: Ndiyo. Karibu!\nMteja: Asante. Jumla ni shilingi ngapi?\nMhudumu: Jumla ni shilingi elfu tano.\nMteja: Asante! Kwa heri!",
  },
  {
    id:"grammar",type:"grammar",kicker:"Sarufi · Grammar",
    title:"Mgahawani · Grammar notes",
    content:"Kuomba · Nafsi sita · Kutaka / Sitaki\nBei · Namba · Upatanisho · -ni",
    english:"Seven short grammar pages from the original teacher notes, with source examples and one classroom check per page.",
    details:grammarPages,
    notes:"Use the existing grammar page arrows for all seven notes, then reveal the classroom question for each page. The source tables and complete explanations remain in the workbook Grammar tab.",
  },
  {
    id:"reading",type:"reading",kicker:"Kusoma · Reading",
    foodCards:SWAHILI_DAY_SIX_FOOD_CARDS,
    drinkCards:SWAHILI_DAY_SIX_DRINK_CARDS,
    title:"Soma menyu · Read the menu",
    content:"CHAKULA\nwali kuku · ugali samaki · pilau nyama\nVINYWAJI\nmaji · soda · juisi ya embe",
    english:"Practice menu assembled from Ruth's lesson vocabulary. Prices are intentionally omitted because the original food PDFs did not supply menu prices.",
    prompt:"Ni chakula gani kina samaki?",answer:"ugali samaki",
    notes:"Invite a learner to read the sample menu. Ask one student for a dish with fish and another for a drink. This is reading practice, not an invented commercial menu.",
  },
  {
    id:"speaking",type:"speaking",kicker:"Kuzungumza · Speaking",
    title:"Mhudumu na Mteja · Role-play",
    content:"Mhudumu: Wewe unapenda kula nini?\nMteja: Mimi ninapenda kula wali na kuku.\nMhudumu: Wewe unapenda kunywa nini?\nMteja: Mimi ninapenda kunywa juisi ya embe.",
    english:"Original restaurant dialogue: waiter/server and customer. Exchange roles with your partner.",
    prompt:"What will you order? Try using 'Naomba… tafadhali'.",
    answer:"Naomba wali na kuku na juisi ya embe, tafadhali.",
    notes:"Pair work: one student is the server, the other the customer. Swap roles, then add a follow-up question about food or drinks. The polite order is an additional model based on source grammar.",
  },
  {
    id:"writing",type:"writing",kicker:"Kuandika · Writing",
    title:"Andika oda yako · Write your order",
    content:"1. Ninapenda ...\n2. Sipendi ...\n3. Naomba ... tafadhali.",
    english:"Use the existing Day 6 workbook Teil 2 fields to write a food preference, a dislike and a restaurant order.",
    prompt:"Andika: 'I don't want meat.'",answer:"Sitaki nyama.",
    notes:"Students write in the existing workbook, not in a new slide-specific assignment. Keep the current submission fields and review workflow unchanged.",
  },
  {
    id:"presentation",type:"scenario",kicker:"Uwasilishaji · Restaurant scenario",
    scenarios:SWAHILI_DAY_SIX_RESTAURANT_SCENARIOS,
    title:"Agiza chakula mwenyewe",
    content:"1. Salimia mhudumu.\n2. Uliza kuhusu chakula.\n3. Agiza chakula na kinywaji.\n4. Uliza bei na omba bili.",
    english:"Individual demonstration: greet the server, ask about food, order a dish and drink, ask the price and request the bill.",
    prompt:"Naomba bili, tafadhali. Jumla ni shilingi ngapi?",
    answer:"The bill, please. How much is the total?",
    notes:"Use the shared A2-style speaking scenario sequence. Pick a student, reveal model answers only after the student responds, then select another restaurant situation. This is teacher-led, ungraded oral practice; the Day 6 workbook submission remains unchanged.",
  },
  {
    id:"summary",type:"summary",kicker:"Hitimisho · Summary",
    title:"Umejifunza nini leo?",
    content:"Chakula na vinywaji\nNaomba / Sitaki\nNamba na bei\nMgahawani · -ni\nTeil 2 · Teil 3 · Teil 4 · Submit",
    english:"Review restaurant vocabulary, polite orders, negative forms, prices and location. Continue the existing Day 6 learner workbook.",
    prompt:"Taja sentensi moja ya kuagiza chakula kwa adabu.",
    answer:"Naomba wali na samaki, tafadhali.",
    notes:"Check the lesson objective and send learners to the existing Day 6 workbook. The activity and class timer are controlled by shared Falowen Admin presenter tools.",
  }
]);
export const SWAHILI_DAY_SIX_ADMIN_LESSON = Object.freeze({
 id:"swahili-day-6",course:"SWAHILI",language:"Kiswahili",day:"Day 6",dayNumber:6,
 title:"Somo la 6 · Mgahawani",topic:"Mgahawani",
 objective:"Read a menu, express food preferences, order a meal and drink, and ask for the bill.",
 stages:SWAHILI_DAY_SIX_SLIDES,
});
