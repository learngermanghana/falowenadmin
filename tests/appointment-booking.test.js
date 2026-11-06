import test from "node:test";
import assert from "node:assert/strict";
import { validateAppointmentAction, groupWeeklySlots } from "../api/appointments.js";

const slotId = "6b1f4e75-e741-4ac2-bfea-6a4e927e47e1";

test("visitor booking accepts only a valid slot, name and email", () => {
  const payload = validateAppointmentAction("book", {
    slotId, name:"Ada Lovelace", email:" ADA@EXAMPLE.COM ", phone:"+233 555", notes:"Course consultation"
  });
  assert.equal(payload.email,"ada@example.com");
  assert.equal(payload.slotId,slotId);
  assert.equal(payload.action,"book");
  assert.throws(()=>validateAppointmentAction("book",{slotId,name:"A",email:"bad"}),/name and a valid email/);
  assert.throws(()=>validateAppointmentAction("book",{slotId,name:"Ada",email:"a@example.com",website:"spam"}),/Invalid booking request/);
});
test("admin slot creation only accepts GMT date, time and approved duration", () => {
  const payload = validateAppointmentAction("addSlot", {
    date:"2026-12-01",time:"14:30",durationMinutes:30,topic:"Falowen admissions",
    meetingUrl:"https://meet.google.com/abc-defg-hij"
  });
  assert.equal(payload.durationMinutes,30);
  assert.equal(payload.topic,"Falowen admissions");
  assert.throws(()=>validateAppointmentAction("addSlot",{date:"2026-12-01",time:"14:30",durationMinutes:25}),/duration/);
  assert.throws(()=>validateAppointmentAction("addSlot",{date:"2026-12-01",time:"14:30",durationMinutes:30,meetingUrl:"http://example.com"}),/HTTPS/);
});
test("invalid, unknown and delete actions are not accepted", () => {
  assert.deepEqual(validateAppointmentAction("deleteSlot",{slotId}),{action:"deleteSlot",slotId});
  assert.throws(()=>validateAppointmentAction("deleteSlot",{slotId:"foo"}),/Invalid slot/);
  assert.throws(()=>validateAppointmentAction("broadcast",{}),/Unknown appointment action/);
});


test("weekly recurring rules accept selected weekdays and nonoverlapping afternoon times", () => {
  const payload = validateAppointmentAction("addRecurringRule", {
    weekdays:[1,2,3,4,5,5],times:["16:00","14:00","15:00","15:00"],
    durationMinutes:30,topic:"Falowen consultation",meetingUrl:""
  });
  assert.deepEqual(payload.weekdays,[1,2,3,4,5]);
  assert.deepEqual(payload.times,["14:00","15:00","16:00"]);
  assert.equal(payload.durationMinutes,30);
  assert.throws(()=>validateAppointmentAction("addRecurringRule",{
    weekdays:[],times:["14:00"],durationMinutes:30
  }),/weekday/);
  assert.throws(()=>validateAppointmentAction("addRecurringRule",{
    weekdays:[1],times:["14:00","14:30"],durationMinutes:60
  }),/overlap/);
  assert.throws(()=>validateAppointmentAction("addRecurringRule",{
    weekdays:[1],times:["14:00"],durationMinutes:30,meetingUrl:"http://zoom.us/j/123"
  }),/HTTPS/);
  assert.throws(()=>validateAppointmentAction("addRecurringRule",{
    weekdays:[8],times:["14:00"],durationMinutes:30
  }),/weekday/);
});
test("stopping recurring slots requires a UUID and does not permit arbitrary actions", () => {
  assert.deepEqual(validateAppointmentAction("stopRecurringRule",{ruleId:slotId}),{
    action:"stopRecurringRule",ruleId:slotId
  });
  assert.throws(()=>validateAppointmentAction("stopRecurringRule",{ruleId:"bad"}),/Invalid recurring schedule/);
});

test("saving a weekly timetable keeps exact day/time pairs and can clear all", () => {
  const payload = validateAppointmentAction("saveWeeklySchedule",{
    weeklySlots:[
      {weekday:3,time:"14:00"},
      {weekday:1,time:"14:00"},
      {weekday:1,time:"15:00"},
      {weekday:3,time:"14:00"}
    ],durationMinutes:30,topic:"Falowen consultation"
  });
  assert.deepEqual(payload.weeklySlots,[
    {weekday:1,time:"14:00"},{weekday:1,time:"15:00"},{weekday:3,time:"14:00"}
  ]);
  assert.deepEqual(validateAppointmentAction("saveWeeklySchedule",{
    weeklySlots:[],durationMinutes:30
  }).weeklySlots,[]);
  // Removing Wednesday 2 PM must not remove Monday 2 PM or Wednesday 3 PM.
  const withoutWednesdayTwo=validateAppointmentAction("saveWeeklySchedule",{
    weeklySlots:[{weekday:1,time:"14:00"},{weekday:3,time:"15:00"}],durationMinutes:30
  });
  assert.equal(withoutWednesdayTwo.weeklySlots.some(x=>x.weekday===3&&x.time==="14:00"),false);
  assert.equal(withoutWednesdayTwo.weeklySlots.length,2);
});
test("weekly timetable rejects bad pairs and only overlapping times on the same day", () => {
  const data=weeklySlots=>({weeklySlots,durationMinutes:60});
  assert.throws(()=>validateAppointmentAction("saveWeeklySchedule",data([{weekday:8,time:"14:00"}])),/valid day and time/);
  assert.throws(()=>validateAppointmentAction("saveWeeklySchedule",data([{weekday:3,time:"29:00"}])),/valid day and time/);
  assert.throws(()=>validateAppointmentAction("saveWeeklySchedule",data([{weekday:3,time:"14:00"},{weekday:3,time:"14:30"}])),/overlap/);
  assert.doesNotThrow(()=>validateAppointmentAction("saveWeeklySchedule",data([{weekday:1,time:"14:00"},{weekday:3,time:"14:30"}])));
  assert.throws(()=>validateAppointmentAction("saveWeeklySchedule",{...data([]),meetingUrl:"http://bad.example"}),/HTTPS/);
});

test("legacy scheduling groups the same weekday patterns without losing one time",()=>{
  const grouped=groupWeeklySlots([
    {weekday:1,time:"14:00"},{weekday:1,time:"15:00"},
    {weekday:2,time:"14:00"},{weekday:2,time:"15:00"},
    {weekday:3,time:"15:00"},{weekday:3,time:"14:00"},
    {weekday:4,time:"14:00"}
  ]);
  assert.deepEqual(grouped,[
    {weekdays:[1,2,3],times:["14:00","15:00"]},
    {weekdays:[4],times:["14:00"]}
  ]);
  const missingWednesdayTwo=groupWeeklySlots([
    {weekday:1,time:"14:00"},{weekday:3,time:"15:00"},
    {weekday:4,time:"14:00"}
  ]);
  assert.deepEqual(missingWednesdayTwo,[
    {weekdays:[1,4],times:["14:00"]},
    {weekdays:[3],times:["15:00"]}
  ]);
});
