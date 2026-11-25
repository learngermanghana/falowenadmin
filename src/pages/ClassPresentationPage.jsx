import {useEffect,useState} from "react";
import {useParams} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx";
import {presentationRequest} from "../services/classPresentationService.js";
import "./ClassPresentationPage.css";
export default function ClassPresentationPage(){
 const {id}=useParams(),{user,loading,login,logout}=useAuth();
 return <main className="class-presentation-student"><header><strong>FALOWEN</strong><span>A2 · Write &amp; Present</span></header>{loading?<p>Loading…</p>:user?<StudentEditor key={id+":"+user.uid} id={id} logout={logout}/>:<SignIn login={login}/>}</main>;
}
function SignIn({login}){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 return <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError("");try{await login(email.trim().toLowerCase(),password);}catch{setError("Could not sign in. Check your Falowen email and password.");}finally{setBusy(false);}}}><h1>Sign in to prepare your presentation</h1><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button disabled={busy}>{busy?"Signing in…":"Sign in"}</button>{error&&<p role="alert">{error}</p>}</form>;
}
function StudentEditor({id,logout}){
 const [session,setSession]=useState(null),[answer,setAnswer]=useState(""),[saved,setSaved]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(true),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setBusy(true);setError("");presentationRequest("student/"+encodeURIComponent(id)).then(data=>{if(active){setSession(data.session);setAnswer(data.answer||"");setSaved(data.answer||"");}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[id,retry]);
 async function save(e){e.preventDefault();const text=answer.trim();setBusy(true);setError("");try{await presentationRequest("student/"+encodeURIComponent(id),{answer:text});setSaved(text);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <><div className="class-presentation-account"><span>Classroom activity · not graded</span><button type="button" onClick={logout}>Sign out</button></div>{!session?<><p>{busy?"Loading your presentation…":error}</p>{!busy&&<button type="button" onClick={()=>setRetry(x=>x+1)}>Try again</button>}</>:<form onSubmit={save}><small>{session.className} · {session.assignmentId}</small><h1>{session.prompt}</h1><p>Schreibe 5–7 Sätze. Write your own answer, save it and get ready to read it aloud.</p>{session.keywords.length>0&&<p><strong>Stichpunkte:</strong> {session.keywords.join(" · ")}</p>}{session.questions.length>0&&<ul>{session.questions.map((q,i)=><li key={i}>{q}</li>)}</ul>}<label>Meine Präsentation<textarea rows={9} value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={3000} required disabled={busy} placeholder="Schreibe hier deinen Text …"/></label><small>{answer.length}/3000 Zeichen</small><button disabled={busy||!answer.trim()||answer.trim()===saved}>{busy?"Saving…":"Save presentation"}</button>{saved&&answer.trim()===saved&&<p role="status" className="class-presentation-success">✓ Saved. Your teacher can now display your answer. You can edit and save again.</p>}{error&&<p role="alert">{error}</p>}</form>}</>;
}
