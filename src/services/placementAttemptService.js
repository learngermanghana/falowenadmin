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
// Payment status must be a complete successful value, never a substring.
 // "unpaid", "not paid", "partially paid", "incomplete", etc. must not become paid.
const SETTLED_PAYMENT_STATUSES = new Set([
  "paid", "fully paid", "paid in full", "payment paid", "payment received",
  "payment complete", "payment completed", "completed", "success",
  "successful", "succeeded", "payment success", "payment successful",
  "settled", "confirmed paid",
]);

export function isSettledPlacementPayment(value) {
  const normalized = String(value || "").trim().toLowerCase()
    .replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return SETTLED_PAYMENT_STATUSES.has(normalized);
}

export function placementConversionStage(attempt,lead) {
  if(!attempt?.consent)return "Anonymous result";
  const status=String(lead?.status||"").toLowerCase();
  const isPaid=isSettledPlacementPayment(lead?.paymentStatus);
  if(lead?.studentCode||/student_registered|registered|converted|enrolled/.test(status)){
    return isPaid ? "Active / paid student" : "Registered";
  }
  if(isPaid)return "Paid · registration review";
  if(/application|registration_started/.test(status))return "Application started";
  return "Follow up";
}
export const placementStatus=(attempt,now=Date.now())=>
  attempt.completedAt?"completed":(attempt.startedAt&&Date.parse(attempt.startedAt)+20*60000<=now?"expired":"in_progress");
export const normalizePlacementResults=(attempts=[],leads=null)=>attempts.map(attempt=>{
  // Null means the Leads feed could not be verified (or has not loaded yet).
  // An actual, successfully loaded empty array is different: no matching leads.
  const available=Array.isArray(leads);
  const lead=available ? leadForPlacement(attempt,leads) : null;
  return {
    ...attempt,
    lead,
    conversionStage: !available && attempt.consent
      ? "Conversion unavailable"
      : placementConversionStage(attempt,lead),
  };
});

export const countRegisteredOrPaidPlacements=(rows=[],leadsAvailable=true)=>{
  if(!leadsAvailable)return null;
  return rows.filter(row=>[
    "Registered", "Active / paid student", "Paid · registration review",
  ].includes(row.conversionStage)).length;
};

export async function fetchPlacementLeads(fetchLeads=fetchStudentLeads){
  // Do not turn a failed Leads request into []: staff would see paid students as unconverted.
  const result=await fetchLeads();
  if(!Array.isArray(result?.leads)){
    throw new Error("The Leads feed returned an invalid response.");
  }
  return result.leads;
}
