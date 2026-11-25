// Once-weekly attendance + class participation digest.
// Manual owner preview and explicit send only; no scheduled invocation.
// Preserve tutor manual overrides, check-in records and class-specific email settings.
import { verifyFirebaseAdminUser, bearerToken } from "./integration-hub.js";
import { project, env, googleAccessToken, firestoreGet, docValue, listStudents, hasClass, norm, timeMs, err } from "./checkin-invitations.js";
import { isAppAssessment } from "../src/utils/appAssessment.js";
import { readyWeeklyPeriods, receiptKey, mondayKey } from "../src/utils/weeklyAttendanceOutbox.js";

const GHS = "Africa/Accra";
const excludedStatuses = new Set(["cancelled","canceled","deleted","superseded","postponed"]);
const dateOf = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const ms = timeMs(value);
  if (!Number.isFinite(ms)) return "";
  const parts = new Intl.DateTimeFormat("en-GB",{timeZone:GHS,year:"numeric",month:"2-digit",day:"2-digit"})
    .formatToParts(new Date(ms));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const stamp = (ms) => new Date(ms).toISOString().slice(0,10);
const weekWindow = (now = new Date(), weeksAgo = 0) => {
  const midnight = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  const monday = midnight - ((now.getUTCDay() + 6) % 7) * 86400000 - weeksAgo*7*86400000;
  return {weekStart:stamp(monday), weekEnd:stamp(monday + 6*86400000)};
};
async function listCollection(path, token, max=6000) {
  let rows = [], page = "";
  do {
    const q = new URLSearchParams({pageSize:"300", ...(page ? {pageToken:page} : {})});
    const result = await firestoreGet(path + "?" + q, token, true);
    rows.push(...(result?.documents || []).map(d=>({...docValue(d),_id:d.name.split("/").pop()})));
    if (rows.length>max) err("Weekly report scan limit exceeded; review collection size.",409);
    page=result?.nextPageToken || "";
  } while(page);
  return rows;
}
const personKeys = (student) => [student.studentCode,student.studentcode,student.uid,student._id,student.email]
  .map(norm).filter(Boolean);
const entryKeys = (id,entry) => [id,entry?.studentCode,entry?.studentId,entry?.uid,entry?.studentUid,entry?.email]
  .map(norm).filter(Boolean);
const asEntries = (value) => value && typeof value==="object" && !Array.isArray(value) ? Object.entries(value) : [];
function matchingEntry(source, student) {
  const keys = new Set(personKeys(student));
  return asEntries(source).find(([id,value])=>entryKeys(id,value).some(key=>keys.has(key)))?.[1] || null;
}
const statusOf = (value) => {
  if (value === true) return "present";
  if (value === false) return "absent";
  const status=norm(value?.status || value?.attendanceStatus || value?.attendance);
  if (["present","late","absent","excused"].includes(status)) return status;
  if (value?.present === true || value?.attended === true) return "present";
  if (value?.present === false) return "absent";
  return "";
};
const present = (value) => ["present","late"].includes(statusOf(value));
const asTime = (v) => {const t=timeMs(v);return Number.isFinite(t)?t:NaN;};
function attendanceStatus({session, attendance={}, checkins=[], student, lateMinutes=15}) {
  // Tutor register is authoritative even when it differs from self-check-in.
  const manual=matchingEntry(attendance.students,student) || matchingEntry(attendance.attendance,student);
  if(manual!=null) {
    const explicit=statusOf(manual);
    if(explicit) return explicit;
  }
  const keys=new Set(personKeys(student));
  const check=checkins.filter(c=>entryKeys(c._id,c).some(k=>keys.has(k)))
    .sort((a,b)=>(asTime(a.checkedInAt||a.submittedAt||a.createdAt)||Infinity)-(asTime(b.checkedInAt||b.submittedAt||b.createdAt)||Infinity))[0];
  if(check) {
    const when=asTime(check.checkedInAt||check.submittedAt||check.createdAt);
    const start=asTime(session.startsAt||session.startAt);
    return Number.isFinite(when)&&Number.isFinite(start)&&when>start+lateMinutes*60000?"late":"present";
  }
  const record=(attendance.records||[]).find(r=>entryKeys("",r).some(k=>keys.has(k)));
  if(record) return statusOf(record)||"absent";
  return "absent";
}
const active = (row) => !["inactive","archived","withdrawn","removed","cancelled","canceled","deleted","blocked","suspended","trial_expired"].includes(norm(row.status||row.studentStatus||row.enrollmentStatus));
const held = (session,now=Date.now()) => {
  const state=norm(session.status||session.sessionStatus);
  if(excludedStatuses.has(state)||session.superseded===true||session.isSuperseded===true||session.isAppAssessment===true||session.appAssessment===true||isAppAssessment(session)) return false;
  const actual=session.completionSource==="manual"?asTime(session.completedAt):NaN;
  const end=Number.isFinite(actual)?actual:asTime(session.endsAt||session.endAt);
  if(!Number.isFinite(end)||end>now) return false;
  return ["completed","finished","ended"].includes(state);
};
// Manual reports can include past lessons with actual attendance evidence, even if the tutor forgot to click Complete.
const elapsedManualCandidate = (session, now) => {
  const state=norm(session.status||session.sessionStatus);
  if(excludedStatuses.has(state)||session.superseded||session.isSuperseded||session.isAppAssessment||session.appAssessment===true||isAppAssessment(session))return false;
  const end=asTime(session.endsAt||session.endAt);
  return Number.isFinite(end)&&end<=now;
};
const hasRecordedAttendance = ({attendance={},checkins=[]}={}) => checkins.length>0 || Object.keys(attendance.students||{}).length>0 || Object.keys(attendance.attendance||{}).length>0 || (attendance.records||[]).length>0;
const manualReportWeekStarts = (from,through,now=new Date()) => {
  const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && mondayKey(value+"T00:00:00Z")===value;
  if(!valid(from)||!valid(through)||from>through||through>weekWindow(now).weekStart) return [];
  const count = Math.round((Date.parse(through)-Date.parse(from))/604800000)+1;
  if(count<1||count>16)return [];
  return Array.from({length:count},(_,i)=>stamp(Date.parse(from)+i*604800000));
};
const classIds=(klass)=>[klass._id,klass.id,klass.classId,klass.classRecordId,klass.name,klass.className]
  .map(v=>String(v||"").trim()).filter(Boolean);
const acceptsSession=(s,klass)=>{
  // Prefer canonical immutable identity when available to avoid same-name collisions.
  const canonical=norm(klass._id);
  const stable=[s.classRecordId,s.canonicalClassId].map(norm).filter(Boolean);
  if(stable.length && !stable.includes(canonical))return false;
  return [s.classId,s.classRecordId,s.className].map(norm)
    .some(v=>v && classIds(klass).map(norm).includes(v));
};
const enrolledBefore=(student,session)=>{
  const start=asTime(session.startsAt||session.startAt);
  const explicit=[student.classJoinedAt,student.classAssignedAt,student.classEnrollmentAt,student.classEnrollmentDate,student.classStartDate]
    .map(asTime).filter(Number.isFinite);
  const generic=[student.trialStartedAt,student.enrollDate,student.enrollmentDate,student.registrationDate]
    .map(asTime).filter(Number.isFinite);
  const first=explicit.length?Math.min(...explicit):generic.length?Math.min(...generic):NaN;
  return !Number.isFinite(first) || !Number.isFinite(start) || first<=start;
};
function participationFor(rows,student,klass,start,end) {
  const ids=new Set(personKeys(student)), sessions=new Set();
  let turns=0,correct=0,needsReview=0;
  for(const row of rows){
    const day=dateOf(row.sessionDate||row.markedDate);
    if(!day||day<start||day>end)continue;
    if(!classIds(klass).map(norm).includes(norm(row.classId)))continue;
    if(![row.studentEmailNormalized,row.studentEmail,row.studentCode,row.studentUid].map(norm).some(v=>ids.has(v)))continue;
    sessions.add(String(row.classSessionId||row.sessionId||row._id));
    turns+=Math.max(0,Number(row.turns||0));
    correct+=Math.max(0,Number(row.correct||0));
    needsReview+=Math.max(0,Number(row.needsReview||0));
  }
  return {participatedSessions:sessions.size,turns,correct,needsReview};
}
async function readSessionAttendance(token,klass,session){
  // Legacy records may be keyed by class name or immutable ID.
  const aliases=[...new Set([...classIds(klass),session.classId,session.classRecordId,session.className].filter(Boolean))];
  const all=await Promise.all(aliases.map(async alias=>{
    const prefix="attendance/"+encodeURIComponent(alias)+"/sessions/"+encodeURIComponent(session._id);
    const document=await firestoreGet(prefix,token,true);
    // Firestore permits a checkins subcollection when the parent document
    // was deleted. Do not lose verified attendance in that case.
    const checkins=await listCollection(prefix+"/checkins",token,2000);
    if(!document && !checkins.length)return null;
    return {parent:alias,data:document?docValue(document):{},checkins};
  }));
  const found=all.filter(Boolean);
  const withManual=found.find(x=>x.parent===klass._id && Object.keys(x.data.students||{}).length)
    || found.find(x=>Object.keys(x.data.students||{}).length)
    || found.find(x=>x.parent===klass._id) || found[0];
  return {attendance:withManual?.data||{},checkins:found.flatMap(x=>x.checkins)};
}
function classEmailMode(klass){
  if(klass.attendanceConfirmationEmailEnabled===false)return "off";
  const mode=norm(klass.attendanceConfirmationEmailMode||"weekly");
  return ["off","weekly","each_class"].includes(mode)?mode:"weekly";
}
async function loadDigestData(token,classId){
  return Promise.all([
    classId ? firestoreGet("classes/"+encodeURIComponent(classId),token).then(d=>[{...docValue(d),_id:classId}]) : listCollection("classes",token,300),listStudents(token),
    listCollection("classSessions",token,12000),
    listCollection("classParticipationRecords",token,20000),
  ]);
}
async function buildDigest(token, now=new Date(), weeksAgo=0, { classId = "", requireReady = false, manual = false, data = null } = {}) {
  const {weekStart,weekEnd}=weekWindow(now,weeksAgo);
  const [classes, students, sessions, participation]=data || await loadDigestData(token,classId);
  const rows=[],classSummaries=[];
  for (const klass of classes){
    if(!active(klass))continue;
    const mode=classEmailMode(klass);
    if(mode==="off" || (!manual && mode!=="weekly")){
      classSummaries.push({classId:klass._id,className:klass.name||klass._id,mode,skipped:true});
      continue;
    }
    if(manual && klass.weeklyEngagementSentWeeks?.[receiptKey(weekStart)]?.status==="sent"){
      classSummaries.push({classId:klass._id,className:klass.name||klass._id,mode,alreadySent:true,recipients:0});
      continue;
    }
    if(requireReady && !readyWeeklyPeriods(klass,sessions.filter(s=>acceptsSession(s,klass)),now.getTime(),{since:weekStart}).some(p=>p.weekStart===weekStart)){
      classSummaries.push({classId:klass._id,className:klass.name||klass._id,mode,skipped:true});
      continue;
    }
    const candidates=sessions.filter(s=>acceptsSession(s,klass) &&
      dateOf(s.startsAt||s.startAt||s.date)>=weekStart &&
      dateOf(s.startsAt||s.startAt||s.date)<=weekEnd && (held(s,now.getTime()) || (manual && elapsedManualCandidate(s,now.getTime()))))
      .sort((a,b)=>asTime(a.startsAt)-asTime(b.startsAt));
    const records=await Promise.all(candidates.map(session=>readSessionAttendance(token,klass,session)));
    const included=candidates.map((session,i)=>({session,record:records[i]})).filter(({session,record})=>held(session,now.getTime()) || (manual && hasRecordedAttendance(record)));
    const relevant=included.map(x=>x.session);
    const attendance=included.map(x=>x.record);
    const unverifiedLessons=candidates.length-relevant.length;
    if(!relevant.length){
      classSummaries.push({classId:klass._id,className:klass.name||klass._id,mode,lessonsHeld:0,recipients:0,unverifiedLessons});
      continue;
    }
    const roster=students.filter(student=>active(student)&&hasClass(student,klass,klass._id));
    const seen=new Set();
    let recipients=0;
    for(const student of roster) {
      const email=norm(student.email);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||seen.has(email))continue;
      seen.add(email);
      const eligible=relevant.map((session,i)=>({session,attendance:attendance[i]}))
        .filter(x=>enrolledBefore(student,x.session));
      if(!eligible.length)continue;
      const counts={present:0,late:0,excused:0,absent:0};
      for(const {session,attendance:record} of eligible){
        const status=attendanceStatus({session,...record,student,lateMinutes:Number(klass.attendanceConfirmationLateMinutes??15)});
        counts[status]=(counts[status]||0)+1;
      }
      const participationSummary=participationFor(participation,student,klass,weekStart,weekEnd);
      rows.push({classId:klass._id,className:klass.name||klass.className||klass._id,
        email,name:student.name||student.fullName||"Student",
        lessonsHeld:eligible.length,attended:counts.present+counts.late,
        present:counts.present,late:counts.late,excused:counts.excused,absent:counts.absent,
        ...participationSummary});
      recipients++;
    }
    const classRows=rows.filter(row=>row.classId===klass._id);
    const totals=classRows.reduce((counts,row)=>({
      attended:counts.attended+row.attended,late:counts.late+row.late,
      excused:counts.excused+row.excused,absent:counts.absent+row.absent,
      participationTurns:counts.participationTurns+row.turns,
    }),{attended:0,late:0,excused:0,absent:0,participationTurns:0});
    classSummaries.push({classId:klass._id,className:klass.name||klass._id,mode,
      lessonsHeld:relevant.length,recipients,unverifiedLessons,...totals});
  }
  return {weekStart,weekEnd,rows,classSummaries,scanned:{classes:classes.length,students:students.length,sessions:sessions.length,participationRecords:participation.length}};
}
async function dispatch(rows,period,fetchImpl=fetch){
  const webhook=env("CALENDAR_APPS_SCRIPT_URL"),secret=env("CLASS_SCHEDULE_SYNC_SECRET");
  if(!webhook||!secret)err("Calendar Apps Script email integration not configured.",503);
  let sent=0,skipped=0;
  // Per-recipient batches isolate bad rows and make retries safer. Script
  // maintains week+class+recipient dedupe keys.
  for(const row of rows){
    const response=await fetchImpl(webhook,{method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({action:"sendWeeklyEngagementSummaries",secret,
        weekStart:period.weekStart,weekEnd:period.weekEnd,recipients:[row]}),redirect:"follow"});
    const reply=await response.json().catch(()=>null);
    if(!response.ok||reply?.ok!==true)err("Weekly email delivery failed: "+String(reply?.error||response.status),502);
    sent+=Number(reply.sent||0);skipped+=Number(reply.skipped||0);
  }
  return {sent,skipped};
}
async function markWeeklySent(token,classId,period,count) {
  const field = "weeklyEngagementSentWeeks." + receiptKey(period.weekStart);
  const url = "https://firestore.googleapis.com/v1/projects/"+encodeURIComponent(project())+"/databases/(default)/documents/classes/"+encodeURIComponent(classId)+"?"+new URLSearchParams({"updateMask.fieldPaths":field,"currentDocument.exists":"true"});
  const value = {mapValue:{fields:{status:{stringValue:"sent"},weekStart:{stringValue:period.weekStart},sentAt:{timestampValue:new Date().toISOString()},recipients:{integerValue:String(count)}}}};
  const response = await fetch(url,{method:"PATCH",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({fields:{weeklyEngagementSentWeeks:{mapValue:{fields:{[receiptKey(period.weekStart)]:value}}}}})});
  if(!response.ok)err("Emails were processed but the sent receipt could not be saved. Retry using the same week; Apps Script deduplication applies.",502);
}
async function dispatchAndRecord(rows,period,token){
  let sent=0,skipped=0;
  const groups=new Map();
  for(const row of rows){if(!groups.has(row.classId))groups.set(row.classId,[]);groups.get(row.classId).push(row);}
  for(const [id,recipients] of groups){
    const result=await dispatch(recipients,period);
    if(result.sent+result.skipped!==recipients.length)err("Not all recipients were confirmed. This class remains pending.",502);
    await markWeeklySent(token,id,period,recipients.length);
    sent+=result.sent;skipped+=result.skipped;
  }
  return {sent,skipped};
}
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(!["GET","POST"].includes(req.method))return res.status(405).json({ok:false,error:"GET or POST required."});
  const preview=req.method==="GET" && req.query?.preview==="1";
  const test=req.method==="POST" && req.query?.test==="1";
  const manualSend=req.method==="POST" && req.query?.send==="1" && !test;
  if(!preview&&!test&&!manualSend)return res.status(405).json({ok:false,error:"Use the administrator preview, test or manual send action."});
  try{
    const owner=await verifyFirebaseAdminUser(bearerToken(req));
    if(manualSend && env("WEEKLY_ENGAGEMENT_ENABLED")!=="true")return res.status(409).json({ok:false,error:"Weekly engagement sending is disabled. Verify the Apps Script cutover first."});
    const classId=String(req.query?.classId||"").trim();
    if(classId && (classId.includes("/")||classId.length>180))return res.status(400).json({ok:false,error:"Invalid class ID."});
    if(manualSend && !classId && req.query?.period!=="previous")return res.status(400).json({ok:false,error:"Select a completed week."});
    if(test){
      // Do not send student names, addresses or individual student results.
      // The test is an aggregate fixture for the verified Falowen owner only.
      const fixture={classId:"falowen-test-weekly",className:"Falowen Weekly Email Test",
        email:owner.email,name:"Falowen administrator",lessonsHeld:2,attended:1,
        present:1,late:0,excused:1,absent:0,
        participatedSessions:1,turns:3,correct:2,needsReview:1};
      const delivery=await dispatch([fixture],weekWindow());
      return res.status(200).json({ok:true,test:true,...delivery,weekStart:weekWindow().weekStart,
        description:"One synthetic sample to the authenticated owner; no student records were emailed."});
    }

    const token=await googleAccessToken();
    const now=new Date();
    // Manual range is owner-directed only; each selected calendar week keeps its existing receipt and Apps Script deduplication key.
    if(req.query?.manualRange==="1"){
      const from=String(req.query?.weekStart||"");
      const through=String(req.query?.throughWeekStart||from);
      const weeks=manualReportWeekStarts(from,through,now);
      if(!classId||!weeks.length)return res.status(400).json({ok:false,error:"Select a class and 1–16 reporting weeks up to the current week."});
      const data=await loadDigestData(token,classId);
      const reports=[];
      for(const week of weeks){
        const ago=Math.round((Date.parse(weekWindow(now).weekStart)-Date.parse(week))/604800000);
        reports.push(await buildDigest(token,now,ago,{classId,manual:true,data}));
      }
      const summaries=reports.map(report=>({weekStart:report.weekStart,weekEnd:report.weekEnd,eligibleRecipients:report.rows.length,...report.classSummaries[0]}));
      const eligibleRecipients=reports.reduce((sum,report)=>sum+report.rows.length,0);
      const signature=summaries.map(row=>`${row.weekStart}:${row.eligibleRecipients}:${row.lessonsHeld||0}`).join(",");
      if(preview)return res.status(200).json({ok:true,preview:true,weekStart:from,weekEnd:reports.at(-1).weekEnd,weeks:summaries,eligibleRecipients,signature,sendEnabled:env("WEEKLY_ENGAGEMENT_ENABLED")==="true"});
      if(!eligibleRecipients||String(req.query?.signature||"")!==signature||String(req.query?.recipients)!==String(eligibleRecipients))return res.status(409).json({ok:false,error:"The report changed or has no recipients. Preview again before sending."});
      let sent=0,skipped=0;
      for(const report of reports){if(!report.rows.length)continue;const result=await dispatchAndRecord(report.rows,report,token);sent+=result.sent;skipped+=result.skipped;}
      return res.status(200).json({ok:true,sent,skipped,weeks:summaries.filter(row=>row.eligibleRecipients>0)});
    }
    let weeksAgo=manualSend || (preview && req.query?.period==="previous") ? 1 : 0;
    if(classId){
      const week=String(req.query?.weekStart||"");
      if(!/^\d{4}-\d{2}-\d{2}$/.test(week)||mondayKey(week+"T00:00:00Z")!==week||week>weekWindow(now).weekStart)
        return res.status(400).json({ok:false,error:"Select a valid reporting week."});
      weeksAgo=Math.round((Date.parse(weekWindow(now).weekStart)-Date.parse(week))/604800000);
    }
    const report=await buildDigest(token,now,weeksAgo,{classId,requireReady:Boolean(classId)||weeksAgo>0});
    if(preview)return res.status(200).json({ok:true,preview:true,
      weekStart:report.weekStart,weekEnd:report.weekEnd,
      eligibleRecipients:report.rows.length,classes:report.classSummaries,
      scanned:report.scanned,sendEnabled:env("WEEKLY_ENGAGEMENT_ENABLED")==="true"});
    // A stale preview must never silently send a different period or audience size.
    if(req.query?.weekStart!==report.weekStart || String(req.query?.recipients)!==String(report.rows.length) || !report.rows.length)
      return res.status(409).json({ok:false,error:"The report changed or has no recipients. Preview it again before sending."});
    const delivery=await dispatchAndRecord(report.rows,report,token);
    return res.status(200).json({ok:true,...delivery,weekStart:report.weekStart,
      weekEnd:report.weekEnd,classes:report.classSummaries.length});
  }catch(error){
    console.error("weekly_engagement_summary_failed",{message:error?.message||String(error)});
    return res.status(Number(error.status||error.statusCode)||500).json({ok:false,error:error.message||"Weekly report failed"});
  }
}
export { dateOf, weekWindow, held, attendanceStatus, participationFor, buildDigest, classEmailMode, enrolledBefore, elapsedManualCandidate, hasRecordedAttendance, manualReportWeekStarts };
