import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";
import { A1_DAYS16_TO20_ASSIGNMENTS, getA1Days16To20UnderstandingChecks,
  getA1Days16To20QuickChecks, getA1Days16To20ApplicationChecks } from "../src/data/a1Days16To20Understanding.js";
const slides = getSlidesByCourse("A1");
const expected = { "A1-9":16, "A1-10":16, "A1-11":17, "A1-12.1":18, "A1-12.2":18, "A1-12.3":20 };
const errors = [];
let total = 0;
for(const id of A1_DAYS16_TO20_ASSIGNMENTS){
  const slide = slides.find(s=>s.assignmentId===id);
  if(!slide || slide.dayNumber!==expected[id]){errors.push(id+": wrong curriculum assignment/day");continue;}
  const path=getA1LearningPath(slide);
  if(path?.activityUrl !== A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id] || path?.kind!=="review") {
    errors.push(id+": wrong Course Book URL or invented tutor marking");
  }
  const q=getA1Days16To20UnderstandingChecks(id)||[];
  const quick=getA1Days16To20QuickChecks(id)||[];
  const apply=getA1Days16To20ApplicationChecks(id)||[];
  if(q.length!==11||quick.length!==2||apply.length!==2)errors.push(id+": expected 10+1+2+2 questions");
  const all=[...q,...quick,...apply];
  if(new Set(all.map(x=>String(x.questionDe||"").trim().toLowerCase())).size!==all.length){
    errors.push(id+": duplicate question across class stages");
  }
  if(!String(q[10]?.questionDe||"").startsWith("Exit-Check:"))errors.push(id+": no independent exit");
  for(const item of all){
    if(!item.questionDe||!item.answerDe||!item.noteEn)errors.push(id+": missing authored answer/explanation");
  }
  if(id==="A1-11" && !slide.workbookConnection.parts.map(x=>x.label).join(" ").match(/Lesen.*Hören/)) {
    errors.push(id+": published Lesen/Hören sections missing");
  }
  if(id==="A1-12.3" && slide.workbookConnection.parts.length!==2)errors.push(id+": writing requires two distinct parts");
  total+=all.length;
  console.log((errors.some(x=>x.startsWith(id+":"))?"REVIEW ":"PASS ")+id+" · Day "+slide.dayNumber+" · "+path?.kind+" · 15 authored checks");
}
const mock=slides.find(s=>s.assignmentId==="A1-5.9");
if(!mock || mock.dayNumber!==19 || mock.interactionFlow?.length!==7 || getA1LearningPath(mock)!==null){
  errors.push("A1-5.9: exam-readiness flow was changed");
}
console.log("A1 Days 16–20 audit: 6 normal lessons + unchanged Day 19 mock, "+total+" question/answer/explanation checks.");
if(errors.length){errors.forEach(s=>console.error("ERROR "+s));process.exitCode=1;}
