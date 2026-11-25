import "./GrammarConjugationCarousel.css";
import {useState} from "react";
export const DAY10_PRETERITE = [
 ["sein",["war","warst","war","waren","wart","waren"],"Wir waren gestern in der Altstadt."],
 ["haben",["hatte","hattest","hatte","hatten","hattet","hatten"],"Wir hatten genug Zeit."],
 ["gehen",["ging","gingst","ging","gingen","gingt","gingen"],"Wir gingen ins Museum."],
 ["fahren",["fuhr","fuhrst","fuhr","fuhren","fuhrt","fuhren"],"Wir fuhren mit dem Bus."],
 ["können",["konnte","konntest","konnte","konnten","konntet","konnten"],"Wir konnten die Stadt besichtigen."],
];
const PERSONS=["ich","du","er / sie / es","wir","ihr","sie / Sie"];
export default function GrammarConjugationCarousel({verbs=DAY10_PRETERITE}){
 const [index,setIndex]=useState(0);
 const [verb,forms,example]=verbs[index];
 return <section aria-label="Präteritum Konjugation" className="presenter-conjugation-carousel">
  <header className="presenter-conjugation-header">
   <h2>{verb} · Präteritum</h2>
   <div className="presenter-conjugation-navigation">
    <button type="button" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>← Zurück</button>
    <strong aria-live="polite">{index+1}/{verbs.length}</strong>
    <button type="button" disabled={index===verbs.length-1} onClick={()=>setIndex(i=>i+1)}>Weiter →</button>
   </div>
  </header>
  <dl className="presenter-conjugation-forms">
    {PERSONS.map((person,i)=><div key={person}><dt>{person}</dt><dd>{forms[i]}</dd></div>)}
  </dl>
  <p className="presenter-conjugation-example"><strong>Beispiel:</strong> {example}</p>
  <nav className="presenter-conjugation-jump" aria-label="Verb auswählen">
   {verbs.map(([v],i)=><button type="button" key={v} aria-pressed={i===index} onClick={()=>setIndex(i)}>{v}</button>)}
  </nav>
 </section>;
}
