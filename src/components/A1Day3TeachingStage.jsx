import { useState } from 'react';
import { A1_DAY3_PRONOUN_ROWS, A1_DAY3_QUIZ } from '../data/a1Day3Classroom.js';
import './A1Day3TeachingStage.css';

function PeoplePicture({kind='one',label}) {
  const people=kind==='trio'?[24,48,72]:kind==='pair'?[34,64]:kind==='group'?[18,38,58,78]:[48];
  return <svg className="a1-day3-people" viewBox="0 0 100 100" role="img" aria-label={label||'Personen'} focusable="false">
    {people.map((x,i)=><g key={x} transform={`translate(${x-48} 0)`} className={`person person-${i%3}`}>
      <circle cx="48" cy="25" r="11"/><path d="M31 83V57c0-12 7-19 17-19s17 7 17 19v26z"/>
      <path d="M38 59v24M58 59v24" className="person-detail"/>
    </g>)}
  </svg>;
}
function Card({children,className=''}){return <article className={`a1-day3-card ${className}`}>{children}</article>;}
function PronounTile({row}){return <Card className={`tone-${row.color}`}><PeoplePicture kind={row.person} label={row.pronouns.join(', ')}/><strong>{row.pronouns.join(' · ')}</strong><span>Endung <b>{row.ending}</b></span></Card>;}
const ENDINGS=[
  ['ich','-e','lern','lerne','Ich lerne Deutsch.'],
  ['du','-st','lern','lernst','Du lernst Deutsch.'],
  ['er / sie / es','-t','lern','lernt','Er lernt Deutsch.'],
  ['wir','-en','lern','lernen','Wir lernen Deutsch.'],
  ['ihr','-t','lern','lernt','Ihr lernt Deutsch.'],
  ['sie / Sie','-en','lern','lernen','Sie lernen Deutsch.'],
];
export default function A1Day3TeachingStage({step}){
  const [selected,setSelected]=useState(-1);
  const [revealed,setRevealed]=useState(false);
  const [questionIndex,setQuestionIndex]=useState(0);
  if(step==='intro')return <section className="a1-day3-lesson"><h1>Verbendungen im Präsens</h1><p>Das Pronomen zeigt, welche Endung das Verb bekommt.</p><div className="a1-day3-hero"><PeoplePicture kind="trio" label="Personen sprechen Deutsch"/><div><strong>Pronomen</strong><span>→</span><strong>Verbendung</strong><span>→</span><strong>ganzer Satz</strong></div></div></section>;
  if(step==='pronouns')return <section className="a1-day3-lesson"><h1>Eine Person oder mehrere?</h1><p>Schau dir die Personen an und lies die Pronomen.</p><div className="a1-day3-grid"><Card><PeoplePicture label="Eine Person"/><strong>ich · du · er · sie · es</strong><span>eine Person</span></Card><Card><PeoplePicture kind="group" label="Mehrere Personen"/><strong>wir · ihr · sie</strong><span>mehrere Personen</span></Card><Card><PeoplePicture label="Höfliche Anrede"/><strong>Sie</strong><span>höfliche Anrede · Verb wie bei sie</span></Card></div></section>;
  if(step==='endings')return <section className="a1-day3-lesson"><h1>Das Muster der Verbendungen</h1><p>Der Stamm bleibt. Die Endung ändert sich.</p><div className="a1-day3-ending-grid">{A1_DAY3_PRONOUN_ROWS.map((row,i)=><PronounTile row={row} key={i}/>)}</div><div className="a1-day3-formula">-e · -st · -t · -en · -t · -en</div></section>;
  if(step==='lernen')return <section className="a1-day3-lesson"><h1>lernen mit allen Pronomen</h1><p>Infinitiv: lernen → Stamm: lern-</p><div className="a1-day3-table-wrap"><table className="a1-day3-table"><thead><tr><th>Pronomen</th><th>Endung</th><th>Stamm + Endung = Verb</th><th>Beispiel</th></tr></thead><tbody>{ENDINGS.map(([p,e,stem,form,sentence])=><tr key={p}><th>{p}</th><td>{e}</td><td><strong>{stem}<em className="a1-day3-ending">{e}</em> = {form}</strong></td><td>{sentence}</td></tr>)}</tbody></table></div><p className="a1-day3-small">The verb ending matches the pronoun. Keep the whole form together when you say it.</p></section>;
  if(step==='sie-sie')return <section className="a1-day3-lesson"><h1>sie oder Sie?</h1><div className="a1-day3-grid"><Card><PeoplePicture label="Eine Frau"/><strong>sie = she</strong><span>Sie lernt Deutsch.</span></Card><Card><PeoplePicture kind="group" label="Mehrere Personen"/><strong>sie = they</strong><span>Sie lernen Deutsch.</span></Card><Card><PeoplePicture label="Höfliche Anrede"/><strong>Sie = formal you</strong><span>Sie lernen Deutsch.</span></Card></div><div className="a1-day3-note"><strong>Achte auf Groß- und Kleinschreibung.</strong><span>Am Satzanfang ist auch das Pronomen sie großgeschrieben: Schau auf den Kontext und die Verbform.</span></div></section>;
  if(step==='corrections')return <section className="a1-day3-lesson"><h1>Falsch → richtig</h1><p>Finde das Pronomen. Dann ändere die Verbendung.</p><div className="a1-day3-grid"><Card><span className="a1-day3-wrong">Wir lernt Deutsch.</span><span className="a1-day3-arrow">↓</span><strong>Wir lernen Deutsch.</strong><small>wir → -en</small></Card><Card><span className="a1-day3-wrong">Ihr lernen Deutsch.</span><span className="a1-day3-arrow">↓</span><strong>Ihr lernt Deutsch.</strong><small>ihr → -t</small></Card><Card><span className="a1-day3-wrong">Du lernen Deutsch.</span><span className="a1-day3-arrow">↓</span><strong>Du lernst Deutsch.</strong><small>du → -st</small></Card></div></section>;
  if(step==='arbeiten')return <section className="a1-day3-lesson"><h1>arbeiten: ein zusätzliches e</h1><p>Bei du und ihr kommt ein e dazu. So lässt sich das Verb leichter sprechen.</p><div className="a1-day3-grid">{[['ich','arbeite'],['du','arbeitest'],['er / sie / es','arbeitet'],['wir','arbeiten'],['ihr','arbeitet'],['sie / Sie','arbeiten']].map(([p,v])=><Card key={p}><PeoplePicture kind={p.includes('/')?'trio':p==='wir'||p==='ihr'?'group':'one'} label={p}/><strong>{p}</strong><span className="a1-day3-verb">{v}</span></Card>)}</div><div className="a1-day3-formula">du arbeitest · ihr arbeitet</div></section>;
  if(step==='heissen')return <section className="a1-day3-lesson"><h1>heißen: ß bleibt</h1><p>Bei du, er/sie/es und ihr lautet die Form <b>heißt</b>.</p><div className="a1-day3-grid">{[['ich','heiße'],['du','heißt'],['er / sie / es','heißt'],['wir','heißen'],['ihr','heißt'],['sie / Sie','heißen']].map(([p,v])=><Card key={p}><PeoplePicture kind={p.includes('/')?'trio':p==='wir'||p==='ihr'?'group':'one'} label={p}/><strong>{p}</strong><span className="a1-day3-verb">{v}</span></Card>)}</div></section>;
  if(step==='practice'){const q=A1_DAY3_QUIZ[questionIndex];return <section className="a1-day3-lesson"><h1>Wähle die passende Verbform</h1><span className="a1-day3-clue">Frage {questionIndex+1} von {A1_DAY3_QUIZ.length}</span><Card className="a1-day3-question-card"><strong>{q.prompt}</strong><div className="a1-day3-choice-row">{q.options.map((option,j)=><button type="button" className={selected===j?'is-selected':''} aria-pressed={selected===j} key={option} onClick={()=>{setSelected(j);setRevealed(false);}}>{option}</button>)}</div><div className="a1-day3-actions"><button type="button" disabled={selected<0} onClick={()=>setRevealed(true)}>Antwort zeigen</button><button type="button" disabled={questionIndex===0} onClick={()=>{setQuestionIndex(i=>i-1);setSelected(-1);setRevealed(false);}}>Zurück</button><button type="button" disabled={questionIndex===A1_DAY3_QUIZ.length-1} onClick={()=>{setQuestionIndex(i=>i+1);setSelected(-1);setRevealed(false);}}>Nächste Frage</button></div>{revealed&&<p role="status">{selected===q.answer?'Richtig!':'Noch einmal versuchen.'} {q.explain}</p>}</Card></section>;}
  return <section className="a1-day3-lesson"><h1>Pronomen → Endung → Verb</h1><div className="a1-day3-ending-grid">{['ich → -e → lerne','du → -st → lernst','er/sie/es → -t → lernt','wir → -en → lernen','ihr → -t → lernt','sie/Sie → -en → lernen'].map(t=><Card key={t}><strong>{t}</strong></Card>)}</div><p>Jetzt du: Sage die sechs Formen von lernen laut.</p></section>;
}
