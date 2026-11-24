// Classroom planning topics mirror the learner A1 curriculum in
// falowenexamtrainer/web/src/data/swahili/a1Curriculum.js.
export const swahiliClassDictionary = Object.freeze([
  "Alfabeti, sauti na matamshi",
  "Salamu",
  "Utambulisho",
  "Nchi na Lugha",
  "Familia yangu",
  "Mgahawani · Restaurant",
  "Chakula na Vinywaji",
  "Namba na Umri",
  "Marafiki",
  "Sokoni",
  "Dukani",
  "Siku, Miezi na Tarehe",
  "Kutaja Saa na Shughuli za Kila Siku",
  "Vitu vya Nyumbani",
  "Shughuli za Kila Siku",
  "Saa na Siku",
  "Burudani na Mapendeleo",
  "Mjini",
  "Usafiri",
  "Hospitalini",
].map((title, index) => Object.freeze({
  assignment_id: `SWAHILI-DAY-${index + 1}`,
  en: `Somo la ${index + 1} · ${title}`,
})));
