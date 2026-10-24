import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

const moduleUrl=pathToFileURL(new URL("../src/data/socialGrammarVideoDictionary.js",import.meta.url).pathname);
const {SOCIAL_GRAMMAR_VIDEOS,GRAMMAR_CATEGORIES,filterGrammarVideos,grammarVideoScript,grammarVideoCaption}=await import(moduleUrl.href);
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("The content creator contains exactly 50 distinct authored A1–B1 grammar mini-lessons",()=>{
 assert.equal(SOCIAL_GRAMMAR_VIDEOS.length,50);
 assert.equal(new Set(SOCIAL_GRAMMAR_VIDEOS.map(x=>x.id)).size,50);
 assert.ok(GRAMMAR_CATEGORIES.length>=5);
 for(const x of SOCIAL_GRAMMAR_VIDEOS){
  assert.match(x.id,/^GR-\d{3}$/);
  assert.ok(["A1","A2","B1"].includes(x.level));
  for(const prop of ["category","title","hook","rule","example"])assert.ok(x[prop]?.length>10,`${x.id}: ${prop}`);
  const script=grammarVideoScript(x);
  assert.match(script,/0–3s/);
  assert.match(script,/24–30s/);
  assert.ok(script.includes(x.rule)&&script.includes(x.example));
  assert.match(grammarVideoCaption(x),/#Falowen/);
 }
});
test("Dictionary starts with requested mögen and gern teaching contrast",()=>{
 const first=SOCIAL_GRAMMAR_VIDEOS[0];
 assert.match(first.title,/mögen.*gern/);
 assert.match(first.rule,/conjugated verb/);
 assert.match(first.example,/Ich mag Kaffee/);
 assert.match(first.example,/Ich trinke gern Kaffee/);
});
test("Search/filter returns correct German contrasts without AI",()=>{
 assert.equal(filterGrammarVideos({search:"mögen"}).length,1);
 assert.ok(filterGrammarVideos({level:"A2",category:"Cases"}).length>=4);
 assert.ok(filterGrammarVideos({search:"Wechselpräpositionen"}).some(x=>x.example.includes("auf den Tisch")));
 assert.equal(filterGrammarVideos({level:"B2"}).length,0);
});
test("Course creator opens grammar dictionary by default and retains traditional lesson source",()=>{
 const src=read("src/components/SocialCourseContentCreator.jsx");
 const picker=read("src/components/SocialGrammarVideoDictionary.jsx");
 assert.match(src,/useState\("grammar"\)/);
 assert.match(src,/creatorMode === "grammar" \? <SocialGrammarVideoDictionary/);
 assert.match(src,/Course Lesson Creator/);
 assert.match(picker,/Download NotebookLM pack/);
 assert.match(picker,/Copy caption/);
 assert.match(picker,/grammarVideoScript\(selected,values\)/);
 assert.match(picker,/localStorage\.setItem\(SAVE_KEY/);
 assert.doesNotMatch(picker,/fetch\(|MediaRecorder|openai\.com|API_KEY/);
 assert.match(picker,/not a rendered MP4/);
});
