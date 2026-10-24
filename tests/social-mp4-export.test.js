import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chooseSocialMp4Mime,requireValidSocialMp4} from "../src/utils/socialMp4Export.js";

test("choose only actual MP4 format, not WebM when browser lacks MP4",()=>{
  assert.equal(chooseSocialMp4Mime(type=>type==="video/mp4"),"video/mp4");
  assert.equal(chooseSocialMp4Mime(type=>type.includes("webm")),"");
});
test("accept an MP4 ISO BMFF ftyp box and reject renamed WebM",async()=>{
  const mp4=new Blob([Uint8Array.from([0,0,0,12,102,116,121,112,105,115,111,109])],{type:"video/mp4"});
  assert.equal(await requireValidSocialMp4(mp4),mp4);
  await assert.rejects(()=>requireValidSocialMp4(new Blob(["WebM"],{type:"video/mp4"})),/not MP4/i);
  await assert.rejects(()=>requireValidSocialMp4(new Blob(["WebM"],{type:"video/webm"})),/real MP4/i);
});
test("both video components inspect container bytes before download",()=>{
  for(const path of ["SocialVocabularyVideoCreator.jsx","SocialGermanChallenges.jsx"]){
    const src=readFileSync(new URL("../src/components/"+path,import.meta.url),"utf8");
    assert.match(src,/await requireValidSocialMp4\(blob\)/,path);
  }
});
