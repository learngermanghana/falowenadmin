import { createHash } from "node:crypto";
import scoreSheetUpsert from "../functions/scoreSheetUpsert.cjs";
import { requireOwner, tokenForGoogle, PROJECT, OWNER } from "./staff-management.js";
const statuses = new Set(["new","reviewing","shortlisted","approved","declined"]);
const allowedLevels = new Set(["A1","A2","B1","B2","C1","C2","Other"]);
const origins = new Set(["https://www.falowen.app","https://falowen.app"]);
const attempts = new Map();
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
function field(body,key,max,min=1){const v=typeof body[key]==="string"?body[key].trim():"";if(v.length<min||v.length>max)fail("Please complete the "+key+" field correctly.");return v;}
// Exactly one ordinary mailbox; reject list separators, control characters and spreadsheet formula prefixes.
const safeRecipient = value => typeof value==="string" && value.length<=254 && /^[a-z0-9][a-z0-9._%+'-]*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(value);
export function validateApplication(body){
 if(!body||typeof body!=="object"||Array.isArray(body)||body.website||body.consent!==true)fail("Invalid application or missing consent.");
 const email=field(body,"email",254).toLowerCase();
 if(!safeRecipient(email))fail("Enter a valid email address.");
 if(!Array.isArray(body.levels)||!body.levels.length||body.levels.length>7||body.levels.some(v=>!allowedLevels.has(v)))fail("Choose valid teaching levels.");
 const videoUrl=field(body,"videoUrl",1000);let url;try{url=new URL(videoUrl);}catch{fail("Enter a valid video link.");}
 if(url.protocol!=="https:"||url.username||url.password||!["youtube.com","www.youtube.com","m.youtube.com","youtu.be","vimeo.com","www.vimeo.com","drive.google.com","loom.com","www.loom.com"].includes(url.hostname))fail("Use an HTTPS video link from YouTube, Vimeo, Google Drive or Loom.");
 return {name:field(body,"name",120,2),email,country:field(body,"country",100),languages:field(body,"languages",160),levels:[...new Set(body.levels)].join(", "),qualifications:field(body,"qualifications",1500),experience:field(body,"experience",2000),availability:field(body,"availability",250),rate:field(body,"rate",100),videoUrl:url.href,consent:"yes"};
}
function throttle(req){const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);
 const key=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim();const v=attempts.get(key)||{count:0,until:now+15*60*1000};if(v.count>=8||attempts.size>=5000&&!attempts.has(key))fail("Too many requests. Please try again later.",429);v.count++;attempts.set(key,v);}
function bodyOf(req){let body=req.body;if(typeof body==="string"){if(body.length>16000)fail("Application is too large.",413);try{body=JSON.parse(body);}catch{fail("Invalid application.");}}if(!body||JSON.stringify(body).length>16000)fail("Invalid or oversized application.");return body;}
const base=()=>`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(PROJECT)}/databases/(default)/documents/falowenTeacherApplications`;
const fields=obj=>Object.fromEntries(Object.entries(obj).map(([key,value])=>[key,{stringValue:String(value)}]));
const unpack=doc=>({id:doc.name.split("/").pop(),version:doc.updateTime,...Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,v.stringValue||""]))});
async function db(url,token,method="GET",body){const response=await fetch(url,{method,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error("Application storage unavailable."),{status:503,dbStatus:response.status});return data;}
const setting = name => String(process.env["ANNOUNCEMENT_WEBHOOK_"+name]||process.env["VITE_ANNOUNCEMENT_WEBHOOK_"+name]||"").trim();
export function buildTeacherEmailBatch(item, owner=OWNER){
 if(!safeRecipient(item.email)||!safeRecipient(owner)||!item.id||!item.createdAt)fail("Invalid notification recipient or application.");
 const eventId="teacher-application-"+createHash("sha256").update(item.id+":"+item.createdAt).digest("hex");
 const common={class:"",date:item.createdAt.slice(0,10),attach_certificate:"FALSE",email_type:"general",show_progress:"FALSE",show_review:"FALSE",show_app_button:"FALSE",show_class:"FALSE",show_date:"FALSE"};
 const applicant={...common,email:item.email,event_id:eventId+":row_1",topic:"We received your Falowen teaching application",subject:"We received your Falowen teaching application",announcement:"Thank you for your interest in teaching with Falowen. We have received your application and reference video link. Our team will review your details and contact you if a suitable opportunity becomes available. This acknowledgement is not an offer of employment. Thank you for your interest in our teaching network. — Learn Language Education Academy"};
 const admin={...common,email:owner,event_id:eventId+":row_2",topic:"New teacher application — Falowen",subject:"New teacher application — Falowen",announcement:"A new teacher application has been received. Sign in to Falowen Admin to review the application and reference video.",link:"https://admin.falowen.app/teacher-applications",link_label:"Review application"};
 return {event_id:eventId,source:"falowen-admin",row:applicant,rows:[applicant,admin]};
}
export function confirmedTeacherEmailBatch(receipt){
 if(receipt?.ok!==true)return false;
 const count=Number(receipt.count),duplicates=Number(receipt.duplicates??0);
 return Number.isInteger(count)&&count>=0&&Number.isInteger(duplicates)&&duplicates>=0&&count+duplicates===2;
}
async function notifyTeacher(item,token){
 let emailStatus="unconfirmed";
 try{
  const url=setting("URL"),secret=setting("TOKEN");
  if(!url||!secret)throw new Error("Missing announcement configuration");
  const batch=buildTeacherEmailBatch(item);
  const result=await scoreSheetUpsert.postAppsScript(url,{...batch,token:secret,...(setting("SHEET_NAME")?{sheet_name:setting("SHEET_NAME")}:{ }),...(setting("SHEET_GID")?{sheet_gid:setting("SHEET_GID")}:{ })});
  if(confirmedTeacherEmailBatch(result.body))emailStatus="queued";
 }catch{/* Application is already saved. Owner can retry with the same row IDs. */}
 try{
  return unpack(await db(base()+"/"+item.id+"?currentDocument.exists=true&updateMask.fieldPaths=emailStatus",token,"PATCH",{fields:fields({emailStatus})}));
 }catch{return {...item,emailStatus:"unconfirmed"};}
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","private, no-store");res.setHeader("X-Content-Type-Options","nosniff");
 try{
  if(req.method==="POST"&&!req.headers.authorization){
   if(!origins.has(String(req.headers.origin||"")))fail("Submit through the Falowen teaching page.",403);
   if(!String(req.headers["content-type"]||"").startsWith("application/json"))fail("Invalid content type.",415);
   throttle(req);const application=validateApplication(bodyOf(req));if(!PROJECT)fail("Application service unavailable.",503);
   const token=await tokenForGoogle();const id=createHash("sha256").update(application.email).digest("hex");
   let created;
   const now=new Date().toISOString();
   try{created=await db(base()+"?documentId="+id,token,"POST",{fields:fields({...application,status:"new",notes:"",createdAt:now,updatedAt:now,emailStatus:"pending"})});}
   catch(e){if(e.dbStatus!==409)throw e;return res.status(200).json({ok:true});}
   await notifyTeacher(unpack(created),token);
   return res.status(200).json({ok:true});
  }
  if(!["GET","PATCH","DELETE"].includes(req.method))return res.status(405).json({ok:false,error:"Method not allowed."});
  await requireOwner(req);const token=await tokenForGoogle();
  if(req.method==="GET"){
   const page=typeof req.query?.pageToken==="string"?req.query.pageToken:"";
   const data=await db(base()+"?pageSize=50&orderBy=createdAt%20desc"+(page?"&pageToken="+encodeURIComponent(page):""),token);
   return res.status(200).json({ok:true,applications:(data.documents||[]).map(unpack),nextPageToken:data.nextPageToken||""});
  }
  const body=bodyOf(req);if(!/^[a-f0-9]{64}$/.test(body.id||""))fail("Invalid application ID.");
  if(req.method==="DELETE"){await db(base()+"/"+body.id,token,"DELETE");return res.status(200).json({ok:true});}
  if(body.action==="retryEmails"){
   const item=unpack(await db(base()+"/"+body.id,token));
   if(!["pending","unconfirmed"].includes(item.emailStatus))fail("Only unconfirmed email requests can be retried.",409);
   const application=await notifyTeacher(item,token);
   return res.status(200).json({ok:true,application});
  }
  if(!statuses.has(body.status)||typeof body.notes!=="string"||body.notes.length>2000)fail("Invalid review status or notes.");
  if(typeof body.version!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(body.version))fail("Refresh the application before saving.",409);
  let result;
  try { result=await db(base()+"/"+body.id+"?currentDocument.updateTime="+encodeURIComponent(body.version)+"&updateMask.fieldPaths=status&updateMask.fieldPaths=notes&updateMask.fieldPaths=updatedAt",token,"PATCH",{fields:fields({status:body.status,notes:body.notes,updatedAt:new Date().toISOString()})}); }
  catch(e){if([400,404,409,412].includes(e.dbStatus))fail("This application changed. Refresh before saving your review.",409);throw e;}
  return res.status(200).json({ok:true,application:unpack(result)});
 }catch(e){const status=e.status||500;return res.status(status).json({ok:false,error:status>=500?"Application service is temporarily unavailable. Please try again.":e.message});}
}
