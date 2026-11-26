import { SWAHILI_CLASSROOM_SUPPORT } from "../data/swahiliClassroomSupport.js";
import { standardizeSwahiliStages } from "./swahiliPresenterSequence.js";

export function isSwahiliRadioStage(stage) {
  return /^radio(?:-|$)/.test(stage.id || "") || stage.type === "radio-questions" ||
    Boolean(stage.radioVideoId || stage.radioUrl) || /Falowen Radio/i.test(stage.title || "");
}

export function buildSwahiliClassroomStages(lesson) {
  const support = SWAHILI_CLASSROOM_SUPPORT[lesson.id];
  const isA1 = !lesson.id.includes("-b1-");
  const source = lesson.stages || lesson.classroomStages || [];
  let stages = source.filter(stage => !(isA1 && isSwahiliRadioStage(stage)));
  if (!stages.some(s => s.id === "knowledge" && s.listening || /^(?:listening|teacher-listening)$/.test(s.id))) {
    stages.push({id:"listening",type:"media-pending",title:"Kusikiliza",kicker:"Kusikiliza · Hören",content:"Sauti ya somo itaongezwa baadaye."});
  }
  if (support) {
    const reading = stages.find(s => s.id === "reading");
    const checks = support.checks || stages.filter(s => /^reading-/.test(s.id)).flatMap(s => s.items || (s.prompt && s.answer ? [s] : [])).map(q => [q.prompt,q.answer]);
    if (reading) {
      const text = support.text || reading.content || reading.items?.join("\n\n") || "";
      stages = stages.filter(s => !/^reading-/.test(s.id));
      stages = stages.map(s => s === reading ? {...s,type:"classroom-reading",content:text,glossary:support.glossary,checks,prompt:undefined,answer:undefined,english:undefined}:s);
    }
    const [title,roleA,roleB,phrase] = support.role;
    // Preserve the original restaurant scenario engine, and retain its
    // source material on the dedicated presentation stage.
    const existingScenario = stages.find(s => s.id === "scenario" || s.id === "pair-plan");
    if (existingScenario) {
      stages = stages.map(s => s === existingScenario ? {...s,type:"classroom-roleplay",roleA,roleB,phrase}:s);
    } else {
      stages.push({id:"scenario",type:"classroom-roleplay",kicker:"Kuzungumza · Role-play",title,roleA,roleB,phrase});
    }
    if (!stages.some(s => s.id === "presentation")) {
      stages.push({id:"presentation",type:"presentation",kicker:"Uwasilishaji · Presentation",title:"Uwasilishaji",content:support.presentation || "Eleza ulichojifunza. Tumia maneno ya somo."});
    }
  }
  // Role-play comes before the final student presentation, independently
  // of the source array ordering. Writing and workbook follow afterwards.
  const ordered = standardizeSwahiliStages(stages);
  const presentation = ordered.find(s => s.id === "presentation");
  if (presentation) {
    const lastSpeaking = ordered.findIndex(s => s.id === "writing" || s.id === "workbook" || s.id === "summary");
    if (lastSpeaking >= 0 && ordered.indexOf(presentation) < lastSpeaking) {
      ordered.splice(ordered.indexOf(presentation),1);
      const target = ordered.findIndex(s => s.id === "writing" || s.id === "workbook" || s.id === "summary");
      ordered.splice(target,0,presentation);
    }
  }
  return ordered;
}

export function splitSwahiliReading(text, glossary) {
  const terms = [...glossary].sort((a,b)=>b[0].length-a[0].length);
  const tokens = [];
  let i = 0;
  const letters = /[\p{L}\p{N}]/u;
  while (i < text.length) {
    const term = terms.find(([word]) => text.slice(i,i+word.length).toLowerCase() === word.toLowerCase() &&
      (!i || !letters.test(text[i-1])) && (i+word.length === text.length || !letters.test(text[i+word.length])));
    if (term) {
      tokens.push({text:text.slice(i,i+term[0].length),word:term[0],meaning:term[1]});
      i += term[0].length;
    } else {
      if (tokens.length && !tokens[tokens.length-1].word) tokens[tokens.length-1].text += text[i];
      else tokens.push({text:text[i]});
      i++;
    }
  }
  return tokens;
}
