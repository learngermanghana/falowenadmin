import test from "node:test";
import assert from "node:assert/strict";
import { validateAppointmentAction } from "../api/appointments.js";

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
