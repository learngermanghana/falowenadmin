import { useState } from "react";

const PROFILES = [
  { name: "Lena", emoji: "🏊", clues: "Ich bin gern im Wasser. Ich trainiere zweimal pro Woche und mache diesen Sport seit einem Jahr.", sport: "Schwimmen", reason: "weil es gesund ist und ich mich entspannen kann", since: "seit einem Jahr", frequency: "zweimal pro Woche" },
  { name: "Ben", emoji: "⚽", clues: "Ich spiele in einer Mannschaft. Jeden Samstag trainieren wir zusammen. Ich mache das seit drei Jahren.", sport: "Fußball", reason: "weil ich gern mit Freunden spiele", since: "seit drei Jahren", frequency: "jeden Samstag" },
  { name: "Amira", emoji: "🚲", clues: "Ich fahre draußen und brauche zwei Räder. Ich mache das seit letztem Sommer.", sport: "Radfahren", reason: "weil ich gern draußen bin", since: "seit letztem Sommer", frequency: "dreimal pro Woche" },
  { name: "Jonas", emoji: "🏃", clues: "Ich brauche nur Sportschuhe. Ich bewege mich gern im Park und mache das seit sechs Monaten.", sport: "Joggen", reason: "weil ich fit bleiben möchte", since: "seit sechs Monaten", frequency: "dreimal pro Woche" },
  { name: "Mia", emoji: "🧘", clues: "Ich mache ruhige Übungen auf einer Matte. Ich trainiere seit zwei Monaten.", sport: "Yoga", reason: "weil ich mich danach besser fühle", since: "seit zwei Monaten", frequency: "einmal pro Woche" },
  { name: "David", emoji: "🏸", clues: "Ich spiele mit einem Schläger und einem Federball. Das mache ich seit meiner Kindheit.", sport: "Badminton", reason: "weil es schnell und spannend ist", since: "seit meiner Kindheit", frequency: "zweimal pro Woche" },
];
const SPORTS = ["Schwimmen", "Fußball", "Radfahren", "Joggen", "Yoga", "Badminton"];
export default function A2SportMatchmaker() {
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [reveal, setReveal] = useState(false);
  const [score, setScore] = useState(0);
  const [marked, setMarked] = useState({});
  const current = PROFILES[index];
  const select = next => { setIndex(next); setGuess(""); setReveal(false); };
  const show = () => {
    if (!guess) return;
    if (!marked[index] && guess === current.sport) setScore(value => value + 1);
    setMarked(state => ({ ...state, [index]: true }));
    setReveal(true);
  };
  return <section aria-label="Sport-Matchmaker game" style={{maxWidth:1050, margin:"auto", width:"100%", display:"grid", gap:18}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div><p style={{fontWeight:800,letterSpacing:2,color:"#38bdf8",margin:0}}>A2 · SPIELERISCH SPRECHEN</p><h1 style={{fontSize:"clamp(1.8rem,3vw,3rem)",margin:"4px 0"}}>🏆 Sport-Matchmaker</h1><p style={{margin:0}}>Wer macht welchen Sport? Begründe mit <strong>weil</strong> und <strong>seit + Dativ</strong>.</p></div>
      <strong style={{borderRadius:16,padding:"12px 18px",background:"#0f3156",color:"white"}}>{score} / {PROFILES.length} Punkte</strong>
    </header>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:18}}>
      <article style={{padding:25,borderRadius:22,background:"linear-gradient(135deg,#163b75,#0b1841)",color:"white",minHeight:285,display:"grid",alignContent:"center",gap:18,boxShadow:"0 14px 35px #0002"}}>
        <div style={{fontSize:52}}>{current.emoji}</div>
        <h2 style={{margin:0,fontSize:30}}>Wer bin ich? {current.name}</h2>
        <p lang="de" style={{fontSize:21,lineHeight:1.6,margin:0}}>{current.clues}</p>
      </article>
      <div style={{display:"grid",alignContent:"start",gap:12}}>
        <h2 style={{margin:0}}>1. Sport auswählen</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
          {SPORTS.map(sport=><button type="button" key={sport} onClick={()=>!reveal&&setGuess(sport)} disabled={reveal} aria-pressed={guess===sport} style={{padding:"12px 8px",borderRadius:12,border:guess===sport?"3px solid #2563eb":"1px solid #9fb7d5",background:guess===sport?"#dbeafe":"white",color:"#122a4d",fontWeight:700,cursor:"pointer"}}>{sport}</button>)}
        </div>
        {!reveal?<button type="button" disabled={!guess} onClick={show} style={{padding:14,borderRadius:12,border:0,background:"#1d4ed8",color:"white",fontWeight:800}}>Antwort zeigen →</button>:<div aria-live="polite" style={{padding:18,borderRadius:14,background:"#ecfdf5",border:"1px solid #10b981",color:"#064e3b",display:"grid",gap:8}}>
          <strong>{guess===current.sport?"✓ Richtig!":"Die Lösung: "+current.sport}</strong>
          <p style={{margin:0}}>Ich mache <b>{current.sport}</b> {current.frequency}, {current.reason}.</p>
          <p style={{margin:0}}>Ich mache diesen Sport <b>{current.since}</b>.</p>
        </div>}
      </div>
    </div>
    <div style={{padding:16,border:"1px solid #bbd4f5",borderRadius:16,display:"grid",gap:8}}>
      <strong>2. Partner-Challenge · Sprecht miteinander</strong>
      <p style={{margin:0}}>Welchen Sport machst du? Wie oft? Seit wann? Warum gefällt er dir?</p>
      <details><summary style={{cursor:"pointer",fontWeight:700}}>3. Schreib-Brücke: E-Mail an Jan anzeigen</summary><p>Hallo Jan, mein Lieblingssport ist … Ich mache ihn …, weil … Hast du nächsten Samstag Zeit? Wollen wir zusammen Sport machen? Liebe Grüße</p></details>
    </div>
    <footer style={{display:"flex",gap:12,alignItems:"center",justifyContent:"space-between"}}>
      <button type="button" disabled={index===0} onClick={()=>select(index-1)}>← Zurück</button>
      <span style={{fontWeight:800}}>Runde {index+1} / {PROFILES.length}</span>
      {index<PROFILES.length-1?<button type="button" onClick={()=>select(index+1)}>Nächste Person →</button>:<button type="button" onClick={()=>{setIndex(0);setScore(0);setMarked({});setGuess("");setReveal(false);}}>Noch einmal spielen ↻</button>}
    </footer>
  </section>;
}
