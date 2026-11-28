import { createHash } from "node:crypto";
import { requireOwner, tokenForGoogle, PROJECT } from "./staff-management.js";
const statuses = new Set(["new","reviewing","shortlisted","approved","declined"]);
const allowedLevels = new Set(["A1","A2","B1","B2","C1","C2","Other"]);
const origins = new Set(["https://www.falowen.app","https://falowen.app"]);
const attempts = new Map();
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
function field(body,key,max,min=1){const v=typeof body[key]==="string"?body[key].trim():"";if(v.length<min||v.length>max)fail("Please complete the "+key+" field correctly.");return v;}
export function validateApplication(body){
 if(!body||typeof body!=="object"||Array.isArray(body)||body.website||body.consent!==true)fail("Invalid application or missing consent.");
 const email=field(body,"email",254).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail("Enter a valid email address.");
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
// Count matching index entries server-side, without downloading applicant records.
export const newApplicationCountQuery = () => ({
 structuredAggregationQuery: {
  structuredQuery: {
   from: [{collectionId:"falowenTeacherApplications"}],
   where: {fieldFilter:{field:{fieldPath:"status"},op:"EQUAL",value:{stringValue:"new"}}}
  },
  aggregations: [{alias:"newCount",count:{}}]
 }
});
export function parseNewApplicationCount(rows){
 const raw=Array.isArray(rows)?rows.find(row=>row?.result?.aggregateFields?.newCount)?.result.aggregateFields.newCount.integerValue:undefined;
 if(typeof raw!=="string"||!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw)))fail("Application count unavailable.",503);
 return Number(raw);
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","private, no-store");res.setHeader("X-Content-Type-Options","nosniff");
 try{
  if(req.method==="POST"&&!req.headers.authorization){
   if(!origins.has(String(req.headers.origin||"")))fail("Submit through the Falowen teaching page.",403);
   if(!String(req.headers["content-type"]||"").startsWith("application/json"))fail("Invalid content type.",415);
   throttle(req);const application=validateApplication(bodyOf(req));if(!PROJECT)fail("Application service unavailable.",503);
   const token=await tokenForGoogle();const id=createHash("sha256").update(application.email).digest("hex");
   try{await db(base()+"?documentId="+id,token,"POST",{fields:fields({...application,status:"new",notes:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()})});}
   catch(e){if(e.dbStatus!==409)throw e;}
   return res.status(200).json({ok:true});
  }
  if(!["GET","PATCH","DELETE"].includes(req.method))return res.status(405).json({ok:false,error:"Method not allowed."});
  await requireOwner(req);const token=await tokenForGoogle();
  if(req.method==="GET"){
   const view=req.query?.view ?? new URL(req.url||"/","https://admin.falowen.app").searchParams.get("view");
   if(view==="count"){
    const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(PROJECT)}/databases/(default)/documents:runAggregationQuery`;
    const rows=await db(url,token,"POST",newApplicationCountQuery());
    return res.status(200).json({ok:true,newCount:parseNewApplicationCount(rows)});
   }
   const page=typeof req.query?.pageToken==="string"?req.query.pageToken:"";
   const data=await db(base()+"?pageSize=50&orderBy=createdAt%20desc"+(page?"&pageToken="+encodeURIComponent(page):""),token);
   return res.status(200).json({ok:true,applications:(data.documents||[]).map(unpack),nextPageToken:data.nextPageToken||""});
  }
  const body=bodyOf(req);if(!/^[a-f0-9]{64}$/.test(body.id||""))fail("Invalid application ID.");
  if(req.method==="DELETE"){await db(base()+"/"+body.id,token,"DELETE");return res.status(200).json({ok:true});}
  if(!statuses.has(body.status)||typeof body.notes!=="string"||body.notes.length>2000)fail("Invalid review status or notes.");
  if(typeof body.version!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(body.version))fail("Refresh the application before saving.",409);
  let result;
  try { result=await db(base()+"/"+body.id+"?currentDocument.updateTime="+encodeURIComponent(body.version)+"&updateMask.fieldPaths=status&updateMask.fieldPaths=notes&updateMask.fieldPaths=updatedAt",token,"PATCH",{fields:fields({status:body.status,notes:body.notes,updatedAt:new Date().toISOString()})}); }
  catch(e){if([400,404,409,412].includes(e.dbStatus))fail("This application changed. Refresh before saving your review.",409);throw e;}
  return res.status(200).json({ok:true,application:unpack(result)});
 }catch(e){const status=e.status||500;return res.status(status).json({ok:false,error:status>=500?"Application service is temporarily unavailable. Please try again.":e.message});}
}
