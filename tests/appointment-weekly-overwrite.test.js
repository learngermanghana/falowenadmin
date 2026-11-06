import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(new URL("../apps-script/appointment-booking.gs",import.meta.url),"utf8");

function scriptFixture() {
  const sheets=new Map();
  let counter=0;
  function getSheet(name) {
    if(!sheets.has(name)) {
      const sheet={data:[],getLastRow(){return this.data.length;},setFrozenRows(){}};
      sheet.getRange=(row,col,height=1,width=1)=>{
        const range={
          getDisplayValues:()=>Array.from({length:height},(_,i)=>
            Array.from({length:width},(_,j)=>String(sheet.data[row+i-1]?.[col+j-1]??""))),
          setNumberFormat:()=>range,
          setValue:value=>range.setValues([[value]]),
          setValues:values=>{
            values.forEach((cells,i)=>{
              const index=row+i-1;
              if(!sheet.data[index]) sheet.data[index]=[];
              cells.forEach((cell,j)=>{sheet.data[index][col+j-1]=String(cell);});
            });
            return range;
          }
        };
        return range;
      };
      sheets.set(name,sheet);
    }
    return sheets.get(name);
  }
  const context=vm.createContext({
    console,
    SpreadsheetApp:{getActiveSpreadsheet:()=>({
      getSheetByName:name=>sheets.get(name),
      insertSheet:name=>getSheet(name)
    })},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    Utilities:{
      getUuid:()=>("00000000-0000-4000-8000-"+String(++counter).padStart(12,"0")),
      formatDate:(date,zone,format)=>format==="HH:mm"
        ?date.toISOString().slice(11,16):date.toISOString().slice(0,10)
    }
  });
  vm.runInContext(source,context);
  return {context,sheets,getSheet};
}
function nextWeekday(weekday) {
  const now=new Date();
  const utcMidnight=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  const delta=(weekday-now.getUTCDay()+7)%7+7;
  return new Date(utcMidnight+delta*86400000).toISOString().slice(0,10);
}
function rowWith(headers,values){return headers.map(key=>String(values[key]??""));}

test("one overwrite removes every unselected Wednesday 2 PM and keeps confirmed bookings",()=>{
  const {context,getSheet}=scriptFixture();
  const rules=getSheet("AppointmentRules");
  const slots=getSheet("AppointmentSlots");
  const ruleHeaders=["ruleId","weekdays","times","durationMinutes","topic","meetingUrl","status","createdAt"];
  const slotHeaders=["slotId","date","time","durationMinutes","topic","meetingUrl","status","bookingId","createdAt","originRuleId"];
  rules.data.push(ruleHeaders, rowWith(ruleHeaders,{
    ruleId:"legacy-rule-1",weekdays:"1,3",times:"14:00,15:00",
    durationMinutes:30,topic:"Old",status:"active"
  }),rowWith(ruleHeaders,{
    ruleId:"legacy-rule-2",weekdays:"3,4",times:"14:00",
    durationMinutes:30,topic:"Old",status:"active"
  }));
  const mon=nextWeekday(1),wed=nextWeekday(3),thu=nextWeekday(4),fri=nextWeekday(5);
  slots.data.push(slotHeaders,
    rowWith(slotHeaders,{slotId:"wed2",date:wed,time:"14:00",durationMinutes:30,status:"open",originRuleId:"legacy-rule-1"}),
    rowWith(slotHeaders,{slotId:"mon2",date:mon,time:"14:00",durationMinutes:30,status:"open",originRuleId:"legacy-rule-1"}),
    rowWith(slotHeaders,{slotId:"wed3booked",date:wed,time:"15:00",durationMinutes:30,status:"booked",bookingId:"booking-1",originRuleId:"legacy-rule-1"}),
    rowWith(slotHeaders,{slotId:"thu2",date:thu,time:"14:00",durationMinutes:30,status:"open",originRuleId:"legacy-rule-2"}),
    rowWith(slotHeaders,{slotId:"fri2manual",date:fri,time:"14:00",durationMinutes:30,status:"open"})
  );
  const result=context.appointmentSaveWeeklySchedule_({
    weeklySlots:[{weekday:1,time:"14:00"},{weekday:3,time:"15:00"}],
    durationMinutes:30,topic:"New",meetingUrl:"https://example.com/meeting"
  });
  assert.equal(result.ok,true);
  assert.equal(slots.data.find(row=>row[0]==="wed2")[6],"deleted");
  assert.equal(slots.data.find(row=>row[0]==="thu2")[6],"deleted");
  assert.equal(slots.data.find(row=>row[0]==="fri2manual")[6],"deleted");
  assert.equal(slots.data.find(row=>row[0]==="wed3booked")[6],"booked");
  assert.equal(slots.data.find(row=>row[0]==="mon2")[6],"open");
  assert.equal(slots.data.find(row=>row[0]==="mon2")[4],"New");
  assert.equal(rules.data.slice(1).filter(row=>row[6]==="active").length,1);
  assert.equal(context.appointmentList_(false).slots.some(slot=>
    new Date(slot.date+"T12:00:00Z").getUTCDay()===3&&slot.time==="14:00"),false);
  const count=slots.data.length;
  context.appointmentSaveWeeklySchedule_({
    weeklySlots:[{weekday:1,time:"14:00"},{weekday:3,time:"15:00"}],
    durationMinutes:30,topic:"New",meetingUrl:"https://example.com/meeting"
  });
  assert.equal(slots.data.length,count,"saving unchanged timetable should not duplicate slots");
  context.appointmentSaveWeeklySchedule_({
    weeklySlots:[],durationMinutes:30,topic:"New",meetingUrl:""
  });
  assert.equal(context.appointmentList_(false).slots.length,0,"empty timetable closes all open availability");
  assert.equal(slots.data.find(row=>row[0]==="wed3booked")[6],"booked");
});
