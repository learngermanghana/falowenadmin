import {useEffect,useState} from 'react';
import {DAY12_CONVERSIONS,DAY12_MINUTES,DAY12_MONTHS,DAY12_ORDINALS} from '../data/a1Day12Classroom.js';
import PublishedSongLessonStage from './PublishedSongLessonStage.jsx';
import './A1Day12ClassroomStage.css';

const HOUR_NAMES=['null','ein','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn','zwanzig','einundzwanzig','zweiundzwanzig','dreiundzwanzig'];
const Box=({children})=><div className="a1day12-box">{children}</div>;
function RevealExercise({items,question,displayAnswer}){
  const [i,setI]=useState(0),[revealed,setRevealed]=useState(false);
  return <Box><p>{question}</p><strong className="a1day12-focus">{items[i][0]}</strong>
    {revealed?<p role="status" className="a1day12-answer">{displayAnswer?displayAnswer(items[i][1]):items[i][1]}</p>:<p className="a1day12-muted">Sag zuerst deine Antwort.</p>}
    <div className="a1day12-actions"><button type="button" onClick={()=>setRevealed(x=>!x)}>{revealed?'Antwort verbergen':'Antwort zeigen'}</button>
    <button type="button" onClick={()=>{setI(x=>(x+1)%items.length);setRevealed(false);}}>Nächste Frage →</button></div>
  </Box>;
}
export default function A1Day12ClassroomStage({step}){
  const [reveal,setReveal]=useState(false);
  useEffect(()=>setReveal(false),[step]);
  if(step==='music')return <PublishedSongLessonStage assignmentKey="A1-8" courseDay={12} compact nextLyricOnly />;
  return <section className="a1day12" lang="de">
    {step==='intro'&&<><h1>Die 24-Stunden-Uhr und das Datum</h1><p>Heute lernen wir:</p><div className="a1day12-grid">
      {['Die Uhrzeit','Genaue Minuten','12 Monate','Das Datum'].map(t=><Box key={t}><h2>{t}</h2></Box>)}</div></>}
    {step==='compare'&&<><h1>12 Stunden und 24 Stunden</h1><div className="a1day12-grid">
      <Box><span className="a1day12-icon">☀️</span><strong className="a1day12-focus">06:00</strong><p>Sechs Uhr morgens</p></Box>
      <Box><span className="a1day12-icon">🌙</span><strong className="a1day12-focus">18:00</strong><p>Achtzehn Uhr · sechs Uhr abends</p></Box></div>
      <p>Für 1–11 Uhr nachmittags/abends: 12 addieren. 3 PM = 15:00.</p></>}
    {step==='all-hours'&&<><h1>Die 24-Stunden-Uhr</h1><div className="a1day12-hours">{Array.from({length:24},(_,h)=><div key={h}><strong>{String(h).padStart(2,'0')}:00</strong><span>{h===0?'null Uhr':HOUR_NAMES[h]+' Uhr'}</span></div>)}</div><p>00:00 = Mitternacht · 12:00 = Mittag.</p></>}
    {step==='convert'&&<><h1>Wie spät ist es?</h1><RevealExercise items={DAY12_CONVERSIONS} question="Sag die Zeit im 24-Stunden-System."/></>}
    {step==='minutes'&&<><h1>Genaue Minuten lesen</h1><Box><strong className="a1day12-focus">13:43</strong><h2>dreizehn Uhr dreiundvierzig</h2><p>Stunde + Uhr + Minuten</p></Box>
      <div className="a1day12-table">{DAY12_MINUTES.slice(0,4).map(([time,spoken])=><div key={time}><strong>{time}</strong><span>{spoken}</span></div>)}</div></>}
    {step==='minute-practice'&&<><h1>Lies die Uhrzeit!</h1><RevealExercise items={DAY12_MINUTES.slice(4)} question="Sprich die digitale Uhrzeit laut."/></>}
    {step==='months'&&<><h1>Die zwölf Monate</h1><div className="a1day12-months">{DAY12_MONTHS.map((m,i)=><Box key={m}><small>{String(i+1).padStart(2,'0')}</small><strong>{m}</strong></Box>)}</div><p>Jeder Monat beginnt mit einem Großbuchstaben.</p></>}
    {step==='months-practice'&&<><h1>Welcher Monat kommt danach?</h1><RevealExercise question="Nenne den nächsten Monat." items={[[3,4],[6,7],[9,10],[11,12]].map(([a,b])=>[DAY12_MONTHS[a-1]+' → ?',DAY12_MONTHS[b-1]])}/></>}
    {step==='ordinals'&&<><h1>Das Datum: Ordinalzahlen</h1><div className="a1day12-table">{DAY12_ORDINALS.map(([n,word])=><div key={n}><strong>{n}</strong><span>{word}</span></div>)}</div>
      <p>4–19 meistens -te · 20–31 meistens -ste. Merke: erste, dritte, siebte, achte.</p></>}
    {step==='calendar'&&<><h1>Welches Datum ist heute?</h1><div className="a1day12-grid">{[['03','MAI','der dritte Mai'],['23','OKTOBER','der dreiundzwanzigste Oktober']].map(([day,month,spoken])=><div className="a1day12-calendar" key={day}><div>{month}</div><strong>{day}</strong><p>{spoken}</p></div>)}</div><p>03.05. = der dritte Mai · 23.10. = der dreiundzwanzigste Oktober.</p></>}
    {step==='timetable'&&<><h1>Wann fährt der Zug?</h1><p>Beispiel-Fahrplan für den Unterricht · keine Live-Verbindungen.</p>
      <div className="a1day12-departures"><div className="a1day12-departure-head"><span>Zug</span><span>Ziel</span><span>Abfahrt</span></div>
      {[['RE 2','Berlin','14:21'],['RE 5','Leipzig','16:35'],['ICE 8','Hamburg','18:10']].map(row=><div key={row[0]}>{row.map(cell=><strong key={cell}>{cell}</strong>)}</div>)}</div>
      <p>Wann fährt RE 2? Und welcher Zug fährt später: RE 5 oder ICE 8?</p></>}
    {step==='workbook'&&<><h1>Lesen und wiederholen</h1><div className="a1day12-grid">
      <Box><h2>Teil 1 · Lesen</h2><p>Drei Nachrichten · 5 Richtig/Falsch-Fragen</p></Box>
      <Box><h2>Teil 2 · Lesen</h2><p>Drei Schilder und Fahrpläne · 3 A/B/C-Fragen</p></Box></div>
      <p>Abschluss: Sage 14:21, den Monat nach März und das Datum 23. Oktober.</p>
      <button type="button" onClick={()=>setReveal(v=>!v)}>{reveal?'Antworten verbergen':'Antworten zeigen'}</button>
      {reveal&&<Box><p>vierzehn Uhr einundzwanzig · April · der dreiundzwanzigste Oktober</p></Box>}
      <a href="https://www.falowen.app/campus/course/a1-day-12-24-hour-clock-and-dates-workbook" target="_blank" rel="noreferrer">Workbook öffnen</a></>}
  </section>;
}
