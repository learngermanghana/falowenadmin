// Restaurant items are from Ruth's FOOD&DRINKS=LIKE&DISLIKES and
// Odering Food lesson PDFs. These photographs are representative illustrations
// from Wikimedia Commons, NOT the source PDF photos or certified menu items.
// Commons links are intentionally visible for attribution and replacement.
// The teaching pack can later replace each external image with approved
// local media without changing the card or scenario components.
const commons = (name) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(name) + "?width=640";
const credit = (name) => "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(name);

const PHOTO_CREDITS = Object.freeze({
  "Plate of rice and chicken.jpg": "Halima Waziri",
  "Ugali and Samaki with some side of Sukumawiki.jpg": "Mvuli-Girl",
  "African meal(ugali nyama).jpg": "Wikimedia Commons contributor",
  "Pilau Rice (Mixed Spiced Rice) & Beef.jpg": "Jordan808",
});

export const SWAHILI_DAY_SIX_FOOD_CARDS = Object.freeze([
  { id:"wali-kuku", sw:"Wali kuku", en:"Rice with chicken", category:"food",
    image:commons("Plate of rice and chicken.jpg"),
    credit:credit("Plate of rice and chicken.jpg"), author:PHOTO_CREDITS["Plate of rice and chicken.jpg"] },
  { id:"ugali-samaki", sw:"Ugali samaki", en:"Ugali with fish", category:"food",
    image:commons("Ugali and Samaki with some side of Sukumawiki.jpg"),
    credit:credit("Ugali and Samaki with some side of Sukumawiki.jpg"),author:PHOTO_CREDITS["Ugali and Samaki with some side of Sukumawiki.jpg"] },
  { id:"ugali-nyama", sw:"Ugali nyama", en:"Ugali with meat", category:"food",
    image:commons("African meal(ugali nyama).jpg"),
    credit:credit("African meal(ugali nyama).jpg"),author:PHOTO_CREDITS["African meal(ugali nyama).jpg"] },
  { id:"pilau-nyama", sw:"Pilau nyama", en:"Pilau with meat",category:"food",
    image:commons("Pilau Rice (Mixed Spiced Rice) & Beef.jpg"),
    credit:credit("Pilau Rice (Mixed Spiced Rice) & Beef.jpg"),author:PHOTO_CREDITS["Pilau Rice (Mixed Spiced Rice) & Beef.jpg"] },
]);

export const SWAHILI_DAY_SIX_DRINK_CARDS = Object.freeze([
  { id:"maji",sw:"Maji",en:"Water",category:"drink",icon:"💧" },
  { id:"juisi",sw:"Juisi",en:"Fruit juice",category:"drink",icon:"🥭" },
  { id:"soda",sw:"Soda",en:"Soft drink",category:"drink",icon:"🥤" },
]);

// As with German A2, this is a spoken classroom challenge, not an
// additional graded homework submission. The task language and model
// phrases are derived from Day 6, while scenarios are original class prompts.
const steps = (dish,drink,decline="Sitaki nyama.") => [
  {id:"greet",action:"Salimia mhudumu",question:"You have arrived at a restaurant. Greet the server and ask for the menu.",answer:"Habari! Naomba menyu, tafadhali."},
  {id:"order",action:"Agiza chakula",question:"Order your chosen food politely.",answer:`Naomba ${dish}, tafadhali.`},
  {id:"drink",action:"Agiza kinywaji",question:"Ask for your drink politely.",answer:`Naomba ${drink}, tafadhali.`},
  {id:"decline",action:"Sema usichotaka",question:"Explain what you do not want.",answer:decline},
  {id:"bill",action:"Omba bili",question:"Ask for the bill and the total price.",answer:"Naomba bili, tafadhali. Jumla ni shilingi ngapi?"},
];

export const SWAHILI_DAY_SIX_RESTAURANT_SCENARIOS = Object.freeze([
  { id:"chicken-rice", icon:"🍚", label:"Wali kuku na juisi", context:"You are a customer. Order rice with chicken and juice, then ask for the bill.",
    food:"wali kuku", drink:"juisi", steps:steps("wali kuku","juisi") },
  { id:"no-meat", icon:"🐟", label:"Sitaki nyama", context:"You do not want meat today. Order ugali with fish and water instead.",
    food:"ugali samaki", drink:"maji", steps:steps("ugali samaki","maji","Sitaki nyama.") },
  { id:"another-dish", icon:"🍽️", label:"Chagua chakula kingine", context:"Your first choice is unavailable. Choose pilau with meat and juice instead. The waiter asks what you would like.",
    food:"pilau nyama", drink:"juisi", steps:steps("pilau nyama","juisi","Sitaki ugali.") },
  { id:"two-people", icon:"👥", label:"Watu wawili", context:"Order for two people. One wants rice with chicken and the other ugali with fish. Ask for two cups of tea.",
    food:"wali kuku na ugali samaki", drink:"vikombe viwili vya chai",
    steps:[
      {id:"greet",action:"Salimia mhudumu",question:"Greet the server.",answer:"Habari!"},
      {id:"order",action:"Agiza vyakula",question:"Order both meals.",answer:"Naomba wali kuku na ugali samaki, tafadhali."},
      {id:"drink",action:"Agiza vinywaji",question:"Order two cups of tea using the correct numeral agreement.",answer:"Naomba vikombe viwili vya chai."},
      {id:"bill",action:"Omba bili",question:"Ask for the bill and total price.",answer:"Naomba bili. Jumla ni shilingi ngapi?"},
    ] },
  { id:"only-drink", icon:"🥤", label:"Kinywaji tu", context:"You are not hungry. Ask for juice politely, say you do not want food and ask for the bill.",
    food:null, drink:"juisi",
    steps:[
      {id:"greet",action:"Salimia mhudumu",question:"Greet the server.",answer:"Habari!"},
      {id:"decline",action:"Sema usichotaka",question:"Explain you do not want food.",answer:"Sitaki chakula."},
      {id:"drink",action:"Agiza juisi",question:"Order juice politely.",answer:"Naomba juisi, tafadhali."},
      {id:"bill",action:"Omba bili",question:"Ask for the bill.",answer:"Naomba bili, tafadhali."},
    ] },
]);
