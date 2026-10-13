import { fetchStudentLeads } from "./studentLeadService.js";

// Staff-only request to the existing Falowen Vercel API. No Firestore listener,
// no server polling, and no new paid backend.
const ENDPOINT = "https://www.falowen.app/api/placement-attempts";
export async function fetchPlacementAttempts(auth) {
  const user=auth?.currentUser;
  if(!user)throw Error("Staff sign-in is required for placement monitoring.");
  const token=await user.getIdToken();
  const response=await fetch(ENDPOINT,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store"});
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body.ok!==true||!Array.isArray(body.attempts))throw Error(body.error||"Placement monitoring is unavailable.");
  return body;
}
const normalEmail=v=>String(v||"").trim().toLowerCase();
const normalPhone=v=>String(v||"").replace(/\D/g,"").replace(/^0(?=\d{9}$)/,"233");
export function leadForPlacement(attempt,leads=[]) {
  if(!attempt?.consent)return null;
  const id=String(attempt.leadId||attempt.id||"");
  const email=normalEmail(attempt.email),phone=normalPhone(attempt.phone);
  return leads.find(lead=>{
    const source=String(lead.source||"").toLowerCase();
    return (id && (lead.leadId===id||lead.id===id))
      || (email && email===normalEmail(lead.email))
      || (phone && phone===normalPhone(lead.number));
  })||null;
}
export function placementConversionStage(attempt,lead) {
  if(!attempt?.consent)return "Anonymous result";
  const status=String(lead?.status||"").toLowerCase(),payment=String(lead?.paymentStatus||"").toLowerCase();
  if(lead?.studentCode||/student_registered|registered|converted|enrolled/.test(status)){
    if(/paid|success|complete/.test(payment))return "Active / paid student";
    return "Registered";
  }
  if(/paid|success|complete/.test(payment))return "Paid · registration review";
  if(/application|registration_started/.test(status))return "Application started";
  return "Follow up";
}
export const placementStatus=(attempt,now=Date.now())=>
  attempt.completedAt?"completed":(attempt.startedAt&&Date.parse(attempt.startedAt)+20*60000<=now?"expired":"in_progress");
export const normalizePlacementResults=(attempts=[],leads=[])=>attempts.map(attempt=>{
  const lead=leadForPlacement(attempt,leads);
  return {...attempt,lead,conversionStage:placementConversionStage(attempt,lead)};
});
export async function fetchPlacementLeads(){
  try{return (await fetchStudentLeads()).leads||[];}catch(_){return [];}
}
