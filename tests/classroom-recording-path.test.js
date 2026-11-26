import test from "node:test";
import assert from "node:assert/strict";
import {CLASSROOM_RECORDING_KEYS,classroomRecordingPath} from "../src/utils/classroomRecordingPath.js";
import {SWAHILI_B1_DAY26_LISTENING} from "../src/data/swahiliB1Day26.js";
import {SWAHILI_B1_DAY27_LISTENING} from "../src/data/swahiliB1Day27.js";
import {SWAHILI_B1_DAY28_LISTENING} from "../src/data/swahiliB1Day28Listening.js";
test("registered classroom routes use exact language and day without query parameters",()=>{
 for(const listening of [SWAHILI_B1_DAY26_LISTENING,SWAHILI_B1_DAY27_LISTENING,SWAHILI_B1_DAY28_LISTENING]){
  assert.equal(classroomRecordingPath(listening,true),"https://www.falowen.app/api/course-media/classroom/swahili-b1/"+listening.day+"/audio-url");
  assert.equal(classroomRecordingPath(listening,false),"");
  assert.equal(classroomRecordingPath({...listening,audioKey:"other.mp3"},true),"");
 }
 for(const [id,key] of Object.entries(CLASSROOM_RECORDING_KEYS)){
  const day=Number(id.split("-").at(-1));const sw=id.startsWith("SWAHILI");const level=sw?"B1":id.split("-")[0];
  assert.ok(classroomRecordingPath({level,day,audioKey:key},sw));
 }
});
