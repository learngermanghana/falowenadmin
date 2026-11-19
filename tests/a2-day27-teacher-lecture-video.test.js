import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {getTeachingSlideById} from "../src/data/teachingSlides.js";
import {buildTeachingPresenterStages} from "../src/utils/teachingPresenter.js";

test("A2 Day 27 has the approved teacher lecture without replacing music or Hören",()=>{
 const slide=getTeachingSlideById("a2-day-27-digitale-kommunikation");
 assert.equal(slide.teacherLectureVideoId,"ZfgJc9_nN0I");
 const stages=buildTeachingPresenterStages(slide,slide.topic);
 const idx=stages.findIndex(s=>s.id==="teacher-lecture");
 assert.ok(idx>0);
 assert.equal(stages[idx-1].id,"intro");
 assert.equal(stages[idx].type,"teacher-lecture");
 assert.equal(stages[idx].videoId,"ZfgJc9_nN0I");
 assert.ok(stages.some(s=>s.variant==="interactive-music-video"));
 assert.ok(stages.some(s=>s.variant==="interactive-listening"));
});
test("Teacher lecture is embedded separately in the slide presenter",()=>{
 const file=readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx",import.meta.url),"utf8");
 assert.match(file,/stage\.type === "teacher-lecture"/);
 assert.match(file,/youtube-nocookie\.com\/embed/);
 assert.match(file,/allowFullScreen/);
});
