import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {crc32,zipFiles,printPdf,buildExamZip} from "../src/utils/hoerenExamBundle.js";
const decoder=new TextDecoder();
function entriesOf(blob){
  return blob.arrayBuffer().then(buf=>{
    const a=new Uint8Array(buf),v=new DataView(buf),list=[];
    let p=0;
    while(p+30<=a.length&&v.getUint32(p,true)===0x04034b50){
      const len=v.getUint16(p+26,true),extra=v.getUint16(p+28,true);
      const length=v.getUint32(p+18,true),name=decoder.decode(a.subarray(p+30,p+30+len));
      const data=a.subarray(p+30+len+extra,p+30+len+extra+length);
      assert.equal(v.getUint32(p+14,true),crc32(data),"ZIP CRC must match");
      list.push({name,data});p+=30+len+extra+length;
    }
    assert.equal(v.getUint32(p,true),0x02014b50,"ZIP central directory must exist");
    return list;
  });
}
test("ZIP is a standards-compatible uncompressed archive with UTF-8 filenames",async()=>{
  const archive=await zipFiles([["Falowen-B1/Teil-1/script.txt","Grüße aus München"],["Falowen-B1/Teil-1/teil-1.mp3",new Blob([Uint8Array.of(1,2,3)])]]);
  const list=await entriesOf(archive);
  assert.equal(list.length,2);
  assert.equal(list[0].name,"Falowen-B1/Teil-1/script.txt");
  assert.equal(decoder.decode(list[0].data),"Grüße aus München");
  assert.deepEqual([...list[1].data],[1,2,3]);
  assert.equal(crc32(new TextEncoder().encode("123456789")),0xcbf43926);
  await assert.rejects(()=>zipFiles([["../unsafe.txt","x"]]),/Unsafe/);
});
test("printable PDF has a valid trailer, xref and safely encoded German umlauts",async()=>{
 const pdf=printPdf("Lösungen",[{
   heading:"Hören Teil 1",
   lines:["Eine freundliche Überraschung: Grüße aus München","Antwort: Richtig"]
 }]);
 const raw=decoder.decode(await pdf.arrayBuffer());
 assert.match(raw,/^%PDF-1\.4/);
 assert.match(raw,/\/Type \/Catalog/);
 assert.match(raw,/startxref\n\d+\n%%EOF/);
 const pointer=Number(raw.match(/startxref\n(\d+)/)[1]);
 assert.equal(raw.slice(pointer,pointer+4),"xref");
 assert.match(raw,/\\374/); // ü is escaped as Latin-1 octal for WinAnsi.
});
test("complete pack includes 2 individual MP3 files, scripts, questions, PDFs, manifest and private answer key",async()=>{
 const data=[
   {label:"Teil",topic:"Reisen",repeats:2,approved:true,script:"A: Guten Tag.",questions:[
     {question:"Die Fahrt ist heute.",kind:"richtig-falsch",answer:"Falsch",evidence:"Guten Tag."}
   ],audio:new Blob(["ID3","part1"])},
   {label:"Teil",topic:"Stadtführung",repeats:1,approved:true,script:"B: Willkommen.",questions:[
     {question:"Wo trifft man sich?",kind:"multiple-choice",options:["Bahnhof","Dom","Schule"],correctIndex:1,evidence:"Willkommen"}
   ],audio:new Blob(["ID3","part2"])}
 ];
 await assert.rejects(()=>buildExamZip({level:"B1",mock:"03",parts:data.map((d,i)=>i?{...d,approved:false}:d),includeSlides:false}),/approve/);
 const bundle=await buildExamZip({level:"B1",mock:"03",parts:data,includeSlides:false});
 const list=await entriesOf(bundle.blob);
 assert.equal(bundle.filename,"Falowen-B1-Mock-03.zip");
 const filenames=list.map(x=>x.name);
 assert.ok(filenames.includes("Falowen-B1-Mock-03/Fragen.pdf"));
 assert.ok(filenames.includes("Falowen-B1-Mock-03/Loesungen.pdf"));
 assert.ok(filenames.includes("Falowen-B1-Mock-03/Teil-1/teil-1.mp3"));
 assert.ok(filenames.includes("Falowen-B1-Mock-03/Teil-2/teil-2.mp3"));
 const tasks=JSON.parse(decoder.decode(list.find(x=>x.name.endsWith("/Teil-2/fragen.json")).data));
 assert.equal(tasks[0].question,"Wo trifft man sich?");
 assert.ok(!Object.hasOwn(tasks[0],"correctIndex"),"student task must not expose key");
 const keys=JSON.parse(decoder.decode(list.find(x=>x.name.endsWith("/Antwortschluessel.json")).data));
 assert.equal(keys[1].answers[0].answer,"b");
 const manifest=JSON.parse(decoder.decode(list.find(x=>x.name.endsWith("/manifest.json")).data));
 assert.equal(manifest.parts[0].mediaKey,"b1/mock-hoeren/mock-03/teil-1.mp3");
 assert.equal(manifest.questionCount,2);
});

test("saved part uses selected theme rather than the static level preset",()=>{
 const src=readFileSync(new URL("../src/components/HoerenBatchPanel.jsx",import.meta.url),"utf8");
 assert.match(src,/topic:\s*topic\.trim\(\),\s*repeats:preset\.repeats/);
 assert.doesNotMatch(src,/topic:preset\.topic,repeats:preset\.repeats/);
});
test("questions and solutions PDFs number items cumulatively across A1 parts",async()=>{
 const parts=[6,4,5].map((count,part)=>({
   label:"Teil",topic:"Meine eigene Auswahl "+(part+1),
   audio:new Blob(["ID3","audio"]),script:"A: Ein neuer Test.",approved:true,repeats:1,
   questions:Array.from({length:count},(_,j)=>({
     question:`Teil${part+1} Frage ${j+1}`,
     kind:"richtig-falsch",answer:j%2===0?"Richtig":"Falsch",evidence:"Ein neuer Test"
   }))
 }));
 const pack=await buildExamZip({level:"A1",mock:"04",parts,includeSlides:false});
 const list=await entriesOf(pack.blob);
 const files=list.filter(e=>/\/(?:Fragen|Loesungen)\.pdf$/.test(e.name));
 assert.equal(files.length,2);
 for(const file of files){
   const text=decoder.decode(file.data);
   for(const [number,question] of [[1,"Teil1 Frage 1"],[6,"Teil1 Frage 6"],
       [7,"Teil2 Frage 1"],[10,"Teil2 Frage 4"],
       [11,"Teil3 Frage 1"],[15,"Teil3 Frage 5"]]){
     assert.ok(text.includes(`(${number}. ${question}) Tj`),
       `${file.name} has wrong numbering for question ${number}`);
   }
   assert.ok(!text.includes("(1. Teil2 Frage 1)"),"Numbering must not restart at Teil 2");
 }
 const key=JSON.parse(decoder.decode(list.find(x=>x.name.endsWith("/Antwortschluessel.json")).data));
 assert.equal(key[0].answers[5].number,6);
 assert.equal(key[1].answers[0].number,7);
 assert.equal(key[2].answers[0].number,11);
 const manifest=JSON.parse(decoder.decode(list.find(x=>x.name.endsWith("/manifest.json")).data));
 assert.equal(manifest.parts[0].topic,"Meine eigene Auswahl 1");
 assert.equal(manifest.parts[1].topic,"Meine eigene Auswahl 2");
});
test("enabled CapCut export includes paired question and solution PNGs with matching cumulative numbering",async()=>{
 const painted=[];
 const previous=globalThis.document;
 globalThis.document={
   createElement:tag=>{
     assert.equal(tag,"canvas");
     const calls=[];
     return {
       width:0,height:0,
       getContext:()=>({
         fillRect:()=>{},
         fillText:(text)=>calls.push(String(text)),
         measureText:text=>({width:String(text).length*12})
       }),
       toBlob:callback=>{
         painted.push(calls);
         callback(new Blob(["mock PNG"],{type:"image/png"}));
       }
     };
   }
 };
 try{
   const parts=[{topic:"Wetter",length:6},{topic:"Stadt",length:4}].map((part,i)=>({
     label:"Teil",topic:part.topic,approved:true,repeats:1,script:"A: Test.",audio:new Blob(["ID3"]),
     questions:Array.from({length:part.length},(_,j)=>({
       question:`Frage ${i+1} ${j+1}`,kind:"richtig-falsch",answer:"Richtig",evidence:"Test"
     }))
   }));
   const pack=await buildExamZip({level:"A1",mock:"05",parts,includeSlides:true});
   const files=await entriesOf(pack.blob);
   const pngs=files.filter(f=>f.name.endsWith(".png"));
   assert.equal(pngs.length,6,"two pages for Teil 1, one page for Teil 2, each with answer slide");
   assert.ok(pngs.some(p=>p.name.endsWith("/loesungen-teil-1-seite-1.png")));
   assert.ok(pngs.some(p=>p.name.endsWith("/loesungen-teil-1-seite-2.png")));
   assert.ok(pngs.some(p=>p.name.endsWith("/loesungen-teil-2-seite-1.png")));
   assert.equal(painted.length,6);
   assert.ok(painted[1].some(x=>x.includes("Lösung: Richtig")));
   assert.ok(painted[2].includes("6"));
   assert.ok(painted[4].includes("7"),"Teil 2 first slide uses question 7");
   assert.ok(painted[5].includes("7"),"Teil 2 answer slide also uses question 7");
 }finally{
   if(previous===undefined)delete globalThis.document;else globalThis.document=previous;
 }
});
