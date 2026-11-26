// Exact keys mirror the staff-only server classroom recording registry.
// Do not substitute a different workbook recording when a key is missing.
export const CLASSROOM_RECORDING_KEYS=Object.freeze({
  "SWAHILI-B1-28": "swahili/B1/day-28/swahili-listening kuntasa.mp3",
  "SWAHILI-B1-27": "swahili/B1/day-27/kuntunza.mp3",
  "SWAHILI-B1-26": "swahili/B1/day-26/swahili-listening matitizo.mp3",
  "B1-28": "b1/day-28/klimafreundlich-leben.mp3",
  "B1-27": "b1/day-27/umweltfreundlich-im-alltag.mp3",
  "B1-26": "a2/day-26/reiseprobleme-und-losungen.mp3",
  "A2-2": "a2/dat-02/personen-beschreiben.mp3",
  "A2-3": "a2/day-03/dinge-und-personen-vergleichen.mp3",
  "A2-4": "a2/day-04/wo-mochten-wir-uns-treffen.mp3",
  "A2-5": "a2/day-05/was-machst-du-in-deiner-freizeit.mp3",
  "A2-7": "a2/day-07/eine-wohnung-suchen.mp3",
  "A2-8": "a2/day-08/im-restaurant-bestellen-und-reagieren.mp3",
  "A2-9": "a2/day-09/urlaub.mp3",
  "A2-10": "a2/day-10/eine-stadt-entdecken-und-etwas-erleben.mp3",
  "A2-18": "a2/day-18/bank-telefonat.mp3",
  "A2-20": "a2/day-20/reklamation-falsches-hemd.mp3",
  "A2-19": "a2/day-19/einkaufen-wo-und-wie.mp3",
  "A2-21": "a2/day-21/ein-wochenende-planen.mp3",
  "A2-23": "a2/day-23/wie-kommst-du-zur-schule-oder-zur-arbeit.mp3",
  "A2-24": "a2/day-24/einen-urlaub-planen.mp3",
  "A2-27": "a2/day-27/digitale-kommunikation.mp3",
  "A2-25": "a2/day-25/tagesablauf.mp3",
  "B1-25": "b1/day-25/online-shopping-verbraucherservice.mp3"
});
export function classroomRecordingPath(listening, swahili=false) {
  const level=swahili?"SWAHILI-"+listening?.level:listening?.level;
  const day=Number(listening?.day);
  if(!Number.isInteger(day)||!Object.hasOwn(CLASSROOM_RECORDING_KEYS,level+"-"+day)||CLASSROOM_RECORDING_KEYS[level+"-"+day]!==listening.audioKey)return "";
  return "https://www.falowen.app/api/course-media/classroom/"+level.toLowerCase()+"/"+day+"/audio-url";
}
