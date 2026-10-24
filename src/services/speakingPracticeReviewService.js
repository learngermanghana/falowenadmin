// Staff-only read access to saved examiner snapshots.
// No requests run until the reviewer explicitly selects a student and searches.
const REVIEW_URL=String(import.meta.env.VITE_SPEAKING_REVIEW_URL ||
  "https://www.falowen.app/api/internal/speaking-review").trim();

export async function loadSpeakingPracticeReview({auth,student,level="all"}={}){
  const who=String(student||"").trim();
  if(who.length<3)throw new Error("Enter the student's registered email, UID, student code, or exact full name.");
  const user=auth?.currentUser;
  if(!user)throw new Error("Sign in to Falowen Admin before reviewing student speaking.");
  const token=await user.getIdToken();
  const params=new URLSearchParams({student:who,level});
  const response=await fetch(`${REVIEW_URL}?${params.toString()}`,{
    method:"GET",headers:{Authorization:`Bearer ${token}`,Accept:"application/json"},
    cache:"no-store",
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.ok!==true){
    throw new Error(data.error||`Speaking review request failed (HTTP ${response.status}).`);
  }
  return data;
}
