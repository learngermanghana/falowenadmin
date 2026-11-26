import { GUIDED_READING, SPEAKING_GUIDE } from "../data/swahiliGuidedClassroom.js";
export function readingUnits(text = "") {
  let number = 0;
  return String(text).split(/\n+/).filter(line=>line.trim()).flatMap((line, paragraph)=>
    line.trim().split(/(?<=[.!?])\s+(?=[A-Z])/u).map(sentence=>({number:++number,paragraph,text:sentence})));
}
export function buildGuidedReading(lessonId, text, support = {}) {
  const units = readingUnits(text);
  const guide = support.guidedReading || GUIDED_READING[lessonId];
  // A changed reading must not display misaligned translations.
  const aligned = guide?.en?.length === units.length;
  const evidence = aligned ? guide.evidence : [];
  return {units:units.map((unit,i)=>({...unit,english:aligned?guide.en[i]:null})),evidence};
}
export function readingParagraphChunks(units) {
  const paragraphs = new Map();
  for(const unit of units) {
    const p=paragraphs.get(unit.paragraph)||[];
    p.push(unit); paragraphs.set(unit.paragraph,p);
  }
  return [...paragraphs.values()].map((items,i)=>({id:"sw-reading-"+(i+1),index:i,label:"Sehemu "+(i+1),text:items.map(u=>u.text).join(" "),numbers:items.map(u=>u.number)}));
}
export function getSpeakingGuide(lessonId, support={}) {
  const guide=support.speakingGuide||SPEAKING_GUIDE[lessonId];
  return {starters:guide?.starters||[],situations:(guide?.situations||[]).map(([title,roleA,roleB,...steps],i)=>({id:"scenario-"+(i+1),title,roleA,roleB,steps:Array.from({length:Math.floor(steps.length/2)},(_,j)=>({question:steps[j*2],answer:steps[j*2+1]}))}))};
}
export function presentationPresets(level) {
  return level==="B1"?[1.5,2]:level==="A2"?[1,1.5]:[0.5,1];
}
