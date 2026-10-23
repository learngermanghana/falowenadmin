import test from "node:test";
import assert from "node:assert/strict";
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
