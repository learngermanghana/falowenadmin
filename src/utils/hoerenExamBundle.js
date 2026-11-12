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
  let offset=0;
  return parts.map((part,index)=>{
    const firstNumber=offset;
    offset+=part.questions.length;
    return {
    heading:`Hören ${part.label || "Teil"} ${index+1} - ${part.topic||"Übung"}`,
    lines:part.questions.flatMap((q,i)=>{
      const item=[`${firstNumber+i+1}. ${q.question}`];
      if(!answers){
        if(q.kind==="richtig-falsch")item.push("    [ ] Richtig      [ ] Falsch");
        else q.options.forEach((option,j)=>item.push(`    [ ] ${"abc"[j]}) ${option}`));
      }else item.push(`    Lösung: ${answerFor(q)}`);
      return [...item,""];
    })
  };
  });
}
const slideFont = (size, bold) => `${bold ? "bold " : ""}${size}px Arial`;

function newSlide(level, mock, title, instruction) {
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f7f7ef";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00766d";
  ctx.font = slideFont(38, true);
  ctx.fillText("Falowen", 65, 70);
  ctx.font = slideFont(32);
  ctx.fillText(`${level}   /   Hören   /   Mock ${mock}`, 1400, 70, 455);
  ctx.fillStyle = "#17363a";
  ctx.font = slideFont(52, true);
  ctx.fillText(title, 65, 145, 1790);
  ctx.font = slideFont(32);
  ctx.fillText(instruction, 65, 202, 1790);
  return { canvas, ctx };
}

function slideLines(ctx, text, width) {
  const lines = [];
  let line = "";
  for (const word of String(text).trim().split(/\s+/)) {
    const joined = line ? line + " " + word : word;
    if (line && ctx.measureText(joined).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = joined;
    }
  }
  lines.push(line);
  return lines;
}

function partLayout(ctx, questions, offset, size, columns, sharedChoices) {
  const width = columns === 1 ? 1790 : 865;
  const pages = [[]];
  let col = 0;
  let y = 252;
  function advance() {
    col = (col + 1) % columns;
    if (!col) pages.push([]);
    y = 252;
  }
  for (const [index, question] of questions.entries()) {
    const number = offset + index + 1;
    const blocks = [[number + ".  " + question.question, true]];
    if (!sharedChoices) {
      const options = question.kind === "richtig-falsch"
        ? ["Richtig oder falsch?"]
        : question.options.map((option, j) => `${"ABC"[j]})  ${option}`);
      blocks.push(...options.map(option => [option, false]));
    }
    const rows = [];
    for (const [text, bold] of blocks) {
      const font = slideFont(size + (bold ? 2 : 0), bold);
      ctx.font = font;
      const indent = bold ? 0 : 30;
      for (const line of slideLines(ctx, text, width - indent)) {
        rows.push({ line, font, indent, height: Math.ceil(size * 1.2) });
      }
    }
    const height = rows.reduce((sum, row) => sum + row.height, 0);
    if (y > 252 && y + height > 1035) advance();
    for (const row of rows) {
      if (y + row.height > 1035) advance();
      pages[pages.length - 1].push({ ...row, x: 65 + 930 * col + row.indent, y, width: width - row.indent });
      y += row.height;
    }
    y += 18;
  }
  return pages;
}

function slidePng(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error("Cannot export PNG")), "image/png"
  ));
}

async function appendExamSlides(entries, folder, level, mock, parts, keys) {
  let sequence = 0;
  async function append(canvas, name) {
    const prefix = String(++sequence).padStart(4, "0");
    entries.push([`${folder}/YouTube-Slides/${prefix}-${name}.png`, await slidePng(canvas)]);
  }
  for (const [index, part] of parts.entries()) {
    const { questions } = part;
    const title = `Teil ${index + 1}${part.topic ? "   /   " + part.topic : ""}`;
    let instruction = "Wählen Sie die richtige Antwort.";
    let shared = questions.every(q => q.kind === "richtig-falsch");
    const { canvas, ctx } = newSlide(level, mock, title, "");
    if (shared) {
      instruction = "Ist die Aussage richtig oder falsch?";
    } else if (questions.every(q => q.kind !== "richtig-falsch" &&
        JSON.stringify(q.options) === JSON.stringify(questions[0].options))) {
      const legend = questions[0].options.map((o, i) => `${"ABC"[i]})  ${o}`).join("      ");
      if (ctx.measureText(legend).width <= 1790) {
        instruction = legend;
        shared = true;
      }
    }
    let best;
    for (const size of [38, 34, 30, 28, 26]) {
      for (const columns of [1, 2]) {
        const candidate = partLayout(ctx, questions, keys[index].answers[0].number - 1, size, columns, shared);
        if (!best || candidate.length < best.length) best = candidate;
        if (best.length === 1) break;
      }
      if (best.length === 1) break;
    }
    for (const [page, rows] of best.entries()) {
      const slide = page === 0 ? { canvas, ctx } : newSlide(level, mock, title, "");
      slide.ctx.font = slideFont(32);
      slide.ctx.fillText(instruction, 65, 202, 1790);
      for (const row of rows) {
        slide.ctx.font = row.font;
        slide.ctx.fillText(row.line, row.x, row.y, row.width);
      }
      await append(slide.canvas, `Teil-${index + 1}-Seite-${page + 1}`);
    }
  }
  const columns = [];
  for (const key of keys) {
    for (let start = 0; start < key.answers.length; start += 12) {
      columns.push({ part: key.part, answers: key.answers.slice(start, start + 12) });
    }
  }
  for (let start = 0; start < columns.length; start += 4) {
    const { canvas, ctx } = newSlide(level, mock, "Lösungen", "Vergleichen Sie Ihre Antworten.");
    columns.slice(start, start + 4).forEach((column, col) => {
      const x = 65 + col * 450;
      ctx.font = slideFont(40, true);
      ctx.fillText(`Teil ${column.part}`, x, 290);
      ctx.font = slideFont(38);
      column.answers.forEach((item, i) => {
        const answer = item.answer.length === 1 ? item.answer.toUpperCase() : item.answer;
        ctx.fillText(`${item.number}.   ${answer}`, x, 365 + 58 * i, 420);
      });
    });
    await append(canvas, `Loesungen-${1 + start / 4}`);
  }
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
  }
  if (includeSlides) await appendExamSlides(entries, folder, level, mock, parts, teacherKeys);
  const manifest={level,mockId:`mock-${String(mock).padStart(2,"0")}`,task:"Hören",type:"original-practice",questionCount:totalQuestions,parts:publicParts};
  entries.push([`${folder}/manifest.json`,JSON.stringify(manifest,null,2)]);
  entries.push([`${folder}/Antwortschluessel.json`,JSON.stringify(teacherKeys,null,2)]);
  entries.push([`${folder}/Fragen.pdf`,printPdf(`Falowen ${level} Mock ${mock} - Hören · Fragen`,paperSections(parts))]);
  entries.push([`${folder}/Loesungen.pdf`,printPdf(`Falowen ${level} Mock ${mock} - Hören · Lösungen`,paperSections(parts,true))]);
  entries.push([`${folder}/README.txt`,`Falowen original Goethe-style Hören practice, NOT official Goethe-Institut material.\nTeacher-reviewed on this device.\nNo material was automatically published to students.\nKeep Antwortschluessel.json and Loesungen.pdf private until learners finish.\nCloudflare object keys in manifest.json are planned upload destinations, not proof of upload.\nAudio is already repeated according to each Teil's local repeat setting; do not duplicate in CapCut.\n`]);
  return {blob:await zipFiles(entries),filename:`${folder}.zip`,questionCount:totalQuestions};
}
