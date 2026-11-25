import { auth } from "../firebaseAuth.js";
export async function presentationRequest(path,body){
 const user=auth?.currentUser;
 if(!user) throw new Error("Sign in with your Falowen account.");
 const token=await user.getIdToken();
 const res=await fetch("/api/class-presentation/"+path,{method:body===undefined?"GET":"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok||!data.ok) throw new Error(data.error||"Presentation request failed. Please try again.");
 return data;
}
export async function emailPresentationLink(session,link){
 const user=auth?.currentUser;
 const claims=(await user?.getIdTokenResult())?.claims||{};
 const {getAdminRole}=await import("../utils/authRoles.js");
 if(getAdminRole(claims)!=="admin") throw new Error("Only an admin can send class emails. Copy the link to Zoom instead.");
 const {saveAnnouncementRow}=await import("./communicationService.js");
 return saveAnnouncementRow({topic:"A2 classroom presentation",subject:"Prepare your A2 presentation",announcement:"Open the link, sign in with your Falowen account, write your presentation and save it. Your teacher will invite you to read it aloud in class.",className:session.className,date:session.sessionDate,link,linkLabel:"Write my presentation",sessionId:session.id,showAppButton:false});
}
