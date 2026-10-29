import {useEffect,useState} from "react";
import {auth} from "../firebaseAuth.js";

const KEY="b1/day-24/day-25.mp3";
export const B1_DAY24_LISTENING_STATEMENTS=[
  {text:"Jonas verkauft seine alten Kleider dieses Mal online auf einem Flohmarkt.",answer:"Falsch"},
  {text:"Jonas wirft seine Kleidung in einen Altkontainer.",answer:"Richtig"},
  {text:"Ein großer Teil der Altkleider zerstört laut Lisa lokale Märkte im Globalen Süden.",answer:"Richtig"},
  {text:"Jonas wusste von Anfang an genau, was mit der Altkleidung passiert.",answer:"Falsch"},
  {text:"Lisa empfiehlt, Kleidung länger zu tragen oder Tauschpartys zu besuchen.",answer:"Richtig"},
];
export default function B1Day24ListeningStage(){
 const [url,setUrl]=useState("");
 const [error,setError]=useState("");
 const [picked,setPicked]=useState({});
 const [revealed,setRevealed]=useState(false);
 useEffect(()=>{
   let cancelled=false;
   const load=async()=>{
     try {
       if(!auth.currentUser)throw new Error("Bitte zuerst in Falowen Admin anmelden.");
       const response=await fetch("https://www.falowen.app/api/course-media/b1/audio-url?day=24&key="+encodeURIComponent(KEY),{
         headers:{Authorization:"Bearer "+await auth.currentUser.getIdToken()},cache:"no-store"
       });
       const body=await response.json().catch(()=>({}));
       if(!response.ok||!body.url)throw new Error(body.error||"Geschütztes Kurs-Audio nicht verfügbar.");
       const link=new URL(body.url);
       if(link.protocol!=="https:"||link.username||link.password)throw new Error("Ungültiger Audio-Link.");
       if(!cancelled)setUrl(link.href);
     }catch(e){if(!cancelled)setError(e.message||"Audio nicht verfügbar. Öffnen Sie die Hörübung im Kursbuch.");}
   };
   load();
   return()=>{cancelled=true;};
 },[]);
 return <section className="presenter-knowledge" data-b1-day24-conversation="2">
   <div className="presenter-knowledge-heading">
     <span>B1 · Tag 24 · Gespräch 2</span>
     <h1>Hören · Altkleider und Nachhaltigkeit</h1>
     <p>Hört das Gespräch zwischen Jonas und Lisa zweimal. Entscheidet bei jeder Aussage: Richtig oder Falsch. Die Lösungen zeigt die Lehrkraft erst danach.</p>
   </div>
   {url?<audio data-day24-r2-audio="true" controls preload="metadata" src={url} style={{width:"100%",maxWidth:780}} />:<p role="status">{error||"Geschütztes Audio wird geladen…"}</p>}
   <p><a href="https://www.falowen.app/campus/course/lesson/B1/24?view=hoeren&assignmentKey=B1-8.24&assignmentId=B1-8.24&level=B1&radio=done" target="_blank" rel="noreferrer">Im Kursbuch hören und die fünf Antworten einreichen</a></p>
   <div style={{display:"grid",gap:12}}>
     {B1_DAY24_LISTENING_STATEMENTS.map((q,i)=><div key={q.text} style={{background:"rgba(255,255,255,.9)",borderRadius:12,padding:14}}>
       <strong>{i+1}. {q.text}</strong>
       <div style={{display:"flex",gap:12,marginTop:9}}>
        {["Richtig","Falsch"].map(answer=><button key={answer} type="button" aria-pressed={picked[i]===answer}
          onClick={()=>{setPicked(old=>({...old,[i]:answer}));setRevealed(false);}}>{answer}</button>)}
       </div>
       {revealed?<p><strong>{picked[i]===q.answer?"✓ Richtig beantwortet":"Lösung: "+q.answer}</strong></p>:null}
      </div>)}
   </div>
   <button type="button" onClick={()=>setRevealed(true)} style={{marginTop:16}}>Lösungen anzeigen · Lehrkraft</button>
 </section>;
}
