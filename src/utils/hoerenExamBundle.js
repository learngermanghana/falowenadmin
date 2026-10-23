// Browser-side ZIP, printable PDFs and 1920x1080 CapCut PNG slides.
// No ZIP/PDF SaaS, extra server endpoint, or Gemini generation charges.
const enc = new TextEncoder();
const bytes = x => x instanceof Uint8Array ? x : enc.encode(String(x));
const u16 = (a,p,n) => { a[p]=n&255;a[p+1]=(n>>>8)&255; };
const u32 = (a,p,n) => {u16(a,p,n);u16(a,p+2,n>>>16);};
const crcTable = Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export const crc32 = data => {let c=0xffffffff;for(const v of data)c=crcTable[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
export async function zipFiles(entries) {
  if (!Array.isArray(entries)||!entries.length) throw new Error("Nothing to export.");
  const records=[];const central=[];let offset=0;
  for(const [name,source] of entries){
    if(!/^[\w\-.\/]+$/.test(name)||name.includes(".."))throw new Error("Unsafe ZIP filename");
    const payload=source instanceof Blob ? new Uint8Array(await source.arrayBuffer()) : bytes(source);
    const filename=enc.encode(name),header=new Uint8Array(30+filename.length);
    u32(header,0,0x04034b50);u16(header,4,20);u16(header,6,0x800);u16(header,8,0);
    u32(header,14,crc32(payload));u32(header,18,payload.length);u32(header,22,payload.length);
    u16(header,26,filename.length);header.set(filename,30);
    const dir=new Uint8Array(46+filename.length);
    u32(dir,0,0x02014b50);u16(dir,4,20);u16(dir,6,20);u16(dir,8,0x800);
    u32(dir,16,crc32(payload));u32(dir,20,payload.length);u32(dir,24,payload.length);
    u16(dir,28,filename.length);u32(dir,42,offset);dir.set(filename,46);
    records.push(header,payload);central.push(dir);offset+=header.length+payload.length;
  }
  const directorySize=central.reduce((sum,x)=>sum+x.length,0);
  const end=new Uint8Array(22);u32(end,0,0x06054b50);
  u16(end,8,entries.length);u16(end,10,entries.length);u32(end,12,directorySize);u32(end,16,offset);
  return new Blob([...records,...central,end],{type:"application/zip"});
}
function pdfEscape(value){
  const win={"€":128,"„":132,"“":147,"”":148,"–":150,"—":151,"‘":145,"’":146,"…":133};
  let result="";
  for(const ch of String(value).replace(/\s+/g," ")){
    const cp=win[ch]??ch.codePointAt(0);
    if(cp===40||cp===41||cp===92){result+="\\"+String.fromCharCode(cp);continue}
    if(cp<32||cp>255){result+="?";continue}
    if(cp>126)result+="\\"+cp.toString(8).padStart(3,"0");
    else result+=String.fromCharCode(cp);
  }
  return result;
}
function wrapText(text,max=91){
  const words=String(text).split(/\s+/),lines=[];let line="";
  for(const word of words){
    if((line+" "+word).trim().length>max&&line){lines.push(line);line=word}else line+=(line?" ":"")+word;
  }
  if(line)lines.push(line);
  return lines.length?lines:[""];
}
export function printPdf(title,sections){
  const textLines=[title,"Falowen · Original German exam-style practice (not an official Goethe-Institut paper)",""];
  for(const section of sections){
    textLines.push(section.heading);
    textLines.push(...section.lines,"");
  }
  const lines=textLines.flatMap((line)=>wrapText(line,88));
  const chunks=[];let page=[];
  for(const line of lines){if(page.length>=53){chunks.push(page);page=[]}page.push(line)}
  if(page.length)chunks.push(page);
  const objects=[];
  const add=s=>{objects.push(s);return objects.length};
  const font=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const pagesId=add("PAGES-PLACEHOLDER");
  const pageIds=[];
  for(const [index,chunk] of chunks.entries()){
    const stream=["BT","/F1 10 Tf","13 TL","45 783 Td",...chunk.map((line,i)=>`(${pdfEscape(line)}) Tj${i<chunk.length-1?" T*":""}`),"ET"].join("\n");
    const length=bytes(stream).length;
    const streamId=add(`<< /Length ${length} >>\nstream\n${stream}\nendstream`);
    const pageId=add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${streamId} 0 R >>`);
    pageIds.push(pageId);
  }
  objects[pagesId-1]=`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(i=>i+" 0 R").join(" ")}] >>`;
  const root=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let raw="%PDF-1.4\n",offsets=[0];
  for(let i=0;i<objects.length;i++){offsets.push(bytes(raw).length);raw+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
  const xref=bytes(raw).length;
  raw+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  raw+=offsets.slice(1).map(v=>String(v).padStart(10,"0")+" 00000 n \n").join("");
  raw+=`trailer\n<< /Size ${objects.length+1} /Root ${root} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([bytes(raw)],{type:"application/pdf"});
}
const normal = q => ({question:q.question,options:q.options,kind:q.kind});
function answerFor(q){
  if(q.kind==="richtig-falsch")return q.answer;
  return "abc"[Number(q.correctIndex)];
}
function paperSections(parts,answers=false){
  return parts.map((part,index)=>({
    heading:`Hören ${part.label || "Teil"} ${index+1} - ${part.topic||"Übung"}`,
    lines:part.questions.flatMap((q,i)=>{
      const item=[`${i+1}. ${q.question}`];
      if(!answers){
        if(q.kind==="richtig-falsch")item.push("    [ ] Richtig      [ ] Falsch");
        else q.options.forEach((option,j)=>item.push(`    [ ] ${"abc"[j]}) ${option}`));
      }else item.push(`    Lösung: ${answerFor(q)}`);
      return [...item,""];
    })
  }));
}
function wrapCanvas(ctx,txt,x,y,maxWidth,lineHeight){
  const words=String(txt).split(/\s+/);let line="";
  for(const word of words){
    const test=line?line+" "+word:word;
    if(ctx.measureText(test).width>maxWidth && line){ctx.fillText(line,x,y);y+=lineHeight;line=word}
    else line=test;
  }
  if(line){ctx.fillText(line,x,y);y+=lineHeight}
  return y;
}
function paintSlide(level,mock,part,questions,offset,solved=false){
  const c=document.createElement("canvas");c.width=1920;c.height=1080;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#f7fbff";ctx.fillRect(0,0,1920,1080);
  ctx.fillStyle="#071a3c";ctx.fillRect(0,0,1920,160);
  ctx.fillStyle="#ffffff";ctx.font="bold 65px Arial";
  ctx.fillText(`Falowen  ·  ${level} Mock ${mock}  ·  ${solved?"Lösungen":"Hören Teil "+part}`,70,100);
  ctx.fillStyle="#147ac7";ctx.fillRect(0,160,1920,16);
  ctx.fillStyle="#132d51";ctx.font="36px Arial";
  ctx.fillText(solved?"Lösungsschlüssel · Nach dem Hören kontrollieren":"Aufgaben lesen, Audio hören und Antworten notieren",70,238);
  const columns=[{x:74,width:846},{x:1008,width:846}];
  questions.forEach((q,i)=>{
    const col=columns[Math.floor(i/3)],within=i%3;
    const x=col.x,limit=col.width;
    let y=308+within*235;
    ctx.fillStyle="#d9ecfa";ctx.fillRect(x-8,y-47,80,65);
    ctx.fillStyle="#082348";ctx.font="bold 42px Arial";ctx.fillText(String(offset+i+1),x,y);
    ctx.font="bold 34px Arial";y=wrapCanvas(ctx,q.question,x+96,y-8,limit-110,41);
    ctx.font="30px Arial";ctx.fillStyle="#23405c";y+=6;
    if(solved){ctx.fillStyle="#1973bb";ctx.font="bold 37px Arial";ctx.fillText("Lösung: "+answerFor(q),x+96,y+28);}
    else if(q.kind==="richtig-falsch"){ctx.fillText("□ Richtig          □ Falsch",x+96,y+28)}
    else {q.options.forEach((t,j)=>{y=wrapCanvas(ctx,`□ ${"abc"[j]}) ${t}`,x+96,y+25,limit-125,34)})}
  });
  ctx.fillStyle="#56708e";ctx.font="28px Arial";
  ctx.fillText("Original Falowen practice · Mehr Prüfungsübungen: falowen.app",70,1036);
  return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error("Cannot export PNG")), "image/png"));
}
export async function buildExamZip({level,mock,parts,includeSlides=true}){
  if(!Array.isArray(parts)||!parts.length||parts.some(p=>!(p.audio instanceof Blob)||!p.questions?.length||!p.approved))throw new Error("Review and approve every part with questions and MP3 before exporting.");
  const folder=`Falowen-${level}-Mock-${String(mock).padStart(2,"0")}`;
  const entries=[],publicParts=[],teacherKeys=[];
  let totalQuestions=0;
  for(const [i,p] of parts.entries()){
    const number=i+1,part=`Teil-${number}`,key=`${level.toLowerCase()}/mock-hoeren/mock-${String(mock).padStart(2,"0")}/teil-${number}.mp3`;
    entries.push([`${folder}/${part}/teil-${number}.mp3`,p.audio]);
    entries.push([`${folder}/${part}/script.txt`,p.script]);
    entries.push([`${folder}/${part}/fragen.json`,JSON.stringify(p.questions.map(normal),null,2)]);
    publicParts.push({part:number,questionCount:p.questions.length,mediaKey:key,topic:p.topic||"",repeats:p.repeats||1});
    teacherKeys.push({part:number,answers:p.questions.map((q,j)=>({number:totalQuestions+j+1,answer:answerFor(q),evidence:q.evidence||""}))});
    totalQuestions+=p.questions.length;
    if(includeSlides){
      for(let start=0;start<p.questions.length;start+=5){
        const img=await paintSlide(level,mock,number,p.questions.slice(start,start+5),totalQuestions-p.questions.length+start);
        entries.push([`${folder}/YouTube-Slides/teil-${number}-seite-${1+Math.floor(start/5)}.png`,img]);
        const solution=await paintSlide(level,mock,number,p.questions.slice(start,start+5),totalQuestions-p.questions.length+start,true);
        entries.push([`${folder}/YouTube-Slides/loesungen-teil-${number}-seite-${1+Math.floor(start/5)}.png`,solution]);
      }
    }
  }
  const manifest={level,mockId:`mock-${String(mock).padStart(2,"0")}`,task:"Hören",type:"original-practice",questionCount:totalQuestions,parts:publicParts};
  entries.push([`${folder}/manifest.json`,JSON.stringify(manifest,null,2)]);
  entries.push([`${folder}/Antwortschluessel.json`,JSON.stringify(teacherKeys,null,2)]);
  entries.push([`${folder}/Fragen.pdf`,printPdf(`Falowen ${level} Mock ${mock} - Hören · Fragen`,paperSections(parts))]);
  entries.push([`${folder}/Loesungen.pdf`,printPdf(`Falowen ${level} Mock ${mock} - Hören · Lösungen`,paperSections(parts,true))]);
  entries.push([`${folder}/README.txt`,`Falowen original Goethe-style Hören practice, NOT official Goethe-Institut material.\nTeacher-reviewed on this device.\nNo material was automatically published to students.\nKeep Antwortschluessel.json and Loesungen.pdf private until learners finish.\nCloudflare object keys in manifest.json are planned upload destinations, not proof of upload.\nAudio is already repeated according to each Teil's local repeat setting; do not duplicate in CapCut.\n`]);
  return {blob:await zipFiles(entries),filename:`${folder}.zip`,questionCount:totalQuestions};
}
