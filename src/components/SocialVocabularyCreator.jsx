import { useEffect, useMemo, useRef, useState } from "react";
import SocialVocabularyVideoCreator from "./SocialVocabularyVideoCreator.jsx";

const SHEET_ID = "1I1yAnqzSh3DPjwWRh9cdRSfzNSPsi7o4r5Taj9Y36NU";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
const CONFIGURED_CSV_URL = import.meta.env.VITE_GERMAN_VOCABS_CSV_URL || "";
// The spreadsheet is titled German_Vocabs, but its actual worksheet is Sheet1 (gid 0).
// A configured URL may become stale: always keep the known sheet exports as fallbacks.
const CSV_URLS = [...new Set([
  CONFIGURED_CSV_URL,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`,
].filter(Boolean))];
const SIZES = { portrait: [1080, 1350], square: [1080, 1080], story: [1080, 1920] };

function parseCSV(source) {
  const rows = []; let row = []; let value = ""; let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '"') {
      if (quoted && source[i + 1] === '"') { value += '"'; i += 1; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) { row.push(value); value = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && source[i + 1] === "\n") i += 1;
      row.push(value); rows.push(row); row = []; value = "";
    } else value += ch;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}
export function parseVocabularyCSV(csv) {
  const rows = parseCSV(csv.replace(/^\uFEFF/, ""));
  // Some published sheets include explanatory lines before A–Q headings.
  const normalizeHeader = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, " ");
  const headerIndex = rows.findIndex(row => {
    const labels = row.map(normalizeHeader);
    return ["german", "english", "content status"].every(name => labels.includes(name));
  });
  if (headerIndex < 0) throw new Error("Expected German_Vocabs headers were not found.");
  const header = rows.splice(0, headerIndex + 1).pop().map(normalizeHeader);
  const index = name => header.indexOf(name.toLowerCase());
  const get = (row, name) => (row[index(name)] || "").trim();
  if (index("German") < 0 || index("English") < 0 || index("Content Status") < 0) throw new Error("Expected German_Vocabs headers were not found.");
  return rows.filter(row => get(row, "German")).map((row, i) => ({
    id: i + 2, level: get(row, "Level"), german: get(row, "German"), english: get(row, "English"),
    type: get(row, "Word Type"), article: get(row, "Article / Plural"),
    exampleDE: get(row, "Example DE"), exampleEN: get(row, "Example EN"),
    grammar: get(row, "Grammar Tip"), grammarExample: get(row, "Grammar Example DE"),
    imageUrl: get(row, "Image URL"), status: get(row, "Content Status"),
    lastPosted: get(row, "Last Posted"),
  }));
}
function wrap(ctx, text, x, y, width, lineHeight, maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  let line = ""; let lines = 0;
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (ctx.measureText(next).width > width && line) {
      ctx.fillText(line, x, y); y += lineHeight; lines += 1;
      if (lines >= maxLines) return y;
      line = word;
    } else line = next;
  }
  if (line && lines < maxLines) { ctx.fillText(line, x, y); y += lineHeight; }
  return y;
}
async function loadImage(url) {
  if (!url || !/^https:\/\//i.test(url)) return null;
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
function rounded(ctx, x, y, w, h, radius, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x,y,w,h,radius); ctx.fill();
}
export default function SocialVocabularyCreator() {
  const canvasRef = useRef(null);
  const [words, setWords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("A1");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [format, setFormat] = useState("portrait");
  const [studioMode, setStudioMode] = useState("video");
  const [overrides, setOverrides] = useState({});
  const [ready, setReady] = useState(false);
  const [imageWarning, setImageWarning] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        let parsed = null;
        let lastError = null;
        for (const url of CSV_URLS) {
          try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`Sheet request failed (${response.status}).`);
            const body = await response.text();
            if (/^\s*<!doctype html|^\s*<html/i.test(body)) throw new Error("The sheet returned a web page instead of CSV. Publish Sheet1 as CSV.");
            parsed = parseVocabularyCSV(body);
            break;
          } catch (cause) {
            if (cause.name === "AbortError") throw cause;
            lastError = cause;
          }
        }
        if (!parsed) throw lastError || new Error("Cannot read the published vocabulary sheet.");
        setWords(parsed);
        if (!parsed.length) setError("The vocabulary sheet has no populated rows.");
      } catch (err) {
        if (err.name !== "AbortError") setError("Cannot load the vocabulary sheet. Check that Sheet1 (A–Q) is published as CSV. " + err.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, []);
  const available = useMemo(() => words.filter(w => w.level.toUpperCase() === level && w.status.toLowerCase() === "ready" && w.exampleDE && w.exampleEN), [words, level]);
  const filtered = useMemo(() => available.filter(w => (w.german + " " + w.english).toLowerCase().includes(search.toLowerCase())), [available, search]);
  useEffect(() => { setSelected(""); setOverrides({}); }, [level]);
  const word = available.find(w => String(w.id) === selected) || filtered[0] || available[0];
  const data = word ? { ...word, ...overrides } : null;
  useEffect(() => { setOverrides({}); }, [selected]);
  useEffect(() => {
    let active = true;
    if (!data || !canvasRef.current) { setReady(false); return undefined; }
    setReady(false); setImageWarning(false);
    (async () => {
      const [width, height] = SIZES[format];
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#102b27"; ctx.fillRect(0,0,width,height);
      const left = 86, right = width - 86;
      ctx.fillStyle = "#a4dbb4"; ctx.font = "bold 38px Arial"; ctx.fillText("FALOWEN  /  GERMAN", left, 102);
      ctx.font = "bold 28px Arial"; ctx.textAlign = "right"; ctx.fillText(data.level + " · WORT DES TAGES", right, 100); ctx.textAlign = "left";
      const imageTop = 145, imageHeight = Math.round(height * 0.35);
      const image = await loadImage(data.imageUrl);
      if (!active) return;
      if (image) {
        const ratio = Math.max((width - 172) / image.width, imageHeight / image.height);
        ctx.save(); ctx.beginPath(); ctx.roundRect(left,imageTop,width-172,imageHeight,26); ctx.clip();
        ctx.drawImage(image,left + ((width-172)-image.width*ratio)/2,imageTop+(imageHeight-image.height*ratio)/2,image.width*ratio,image.height*ratio);
        ctx.restore();
      } else {
        rounded(ctx,left,imageTop,width-172,imageHeight,26,"#1d4a3d");
        ctx.fillStyle = "#91c7ab"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
        ctx.fillText("DEUTSCH LERNEN",width/2,imageTop+imageHeight/2); ctx.textAlign = "left";
        if (data.imageUrl) setImageWarning(true);
      }
      let y = imageTop + imageHeight + 84;
      ctx.fillStyle = "#fff"; ctx.font = "bold 78px Arial";
      y = wrap(ctx, data.german, left,y,width-172,88,2) + 8;
      ctx.fillStyle = "#a4dbb4"; ctx.font = "42px Arial";
      y = wrap(ctx, data.english,left,y,width-172,49,2) + 36;
      const boxTop = y;
      const remaining = height - boxTop - 105;
      rounded(ctx,left,boxTop,width-172,Math.max(remaining,90),26,"#f7f6ee");
      ctx.fillStyle = "#547365"; ctx.font = "bold 26px Arial"; ctx.fillText("BEISPIELSATZ",left+32,boxTop+49);
      ctx.fillStyle = "#142e26"; ctx.font = "bold 37px Arial";
      let textY = wrap(ctx,data.exampleDE,left+32,boxTop+108,width-236,45,2)+18;
      ctx.fillStyle = "#5f716a"; ctx.font = "29px Arial";
      textY = wrap(ctx,data.exampleEN,left+32,textY,width-236,36,2)+16;
      const tip = data.grammar || data.article || data.grammarExample;
      if (tip && textY < height-158) {
        ctx.fillStyle = "#31634c"; ctx.font = "26px Arial";
        wrap(ctx,tip,left+32,textY,width-236,32,2);
      }
      ctx.fillStyle = "#d0e8db"; ctx.font = "bold 29px Arial"; ctx.fillText("Learn German with Falowen",left,height-46);
      ctx.textAlign = "right"; ctx.fillText("falowen.app",right,height-46); ctx.textAlign = "left";
      setReady(true);
    })();
    return () => { active = false; };
  }, [data?.id,data?.german,data?.english,data?.exampleDE,data?.exampleEN,data?.grammar,data?.article,data?.grammarExample,data?.imageUrl,data?.level,format]);
  const download = () => {
    if (!ready || !data) return;
    try {
      canvasRef.current.toBlob(blob => {
        if (!blob) { setError("Unable to export this image."); return; }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a"); anchor.href = url;
        anchor.download = `falowen-${data.level}-${data.german.toLowerCase().replace(/[^a-z0-9äöüß]+/gi,"-")}.png`;
        anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    } catch { setError("Image export was blocked. Use an image URL that permits cross-origin canvas access."); }
  };
  const field = (key,label) => <label style={{display:"grid",gap:5,fontSize:13,fontWeight:600}}>{label}
    <textarea rows={key==="grammar" ? 3 : 2} value={data?.[key] || ""} onChange={e=>setOverrides(prev=>({...prev,[key]:e.target.value}))} style={{border:"1px solid #cbd5e1",borderRadius:8,padding:10,width:"100%",boxSizing:"border-box"}} />
  </label>;
  return <section style={{display:"grid",gap:16}}>
    <div><h2 style={{margin:"0 0 6px"}}>Falowen Vocabulary Studio</h2><p style={{margin:0,color:"#64748b"}}>Create branded vocabulary Shorts, Reels and story posters from approved German_Vocabs sheet content. Animation and music generation run locally, with no paid video API.</p></div>
    {error && <div role="alert" style={{padding:12,background:"#fef2f2",color:"#991b1b",borderRadius:8}}>{error} <a href={SHEET_URL} target="_blank" rel="noreferrer">Open source sheet</a></div>}
    <div role="group" aria-label="Vocabulary output" style={{display:"flex",flexWrap:"wrap",gap:8}}>
      <button type="button" aria-pressed={studioMode==="video"} onClick={()=>setStudioMode("video")} style={{padding:"11px 15px",borderRadius:10,border:"1px solid #b8d6ec",background:studioMode==="video"?"#1266b6":"#f2f8fc",color:studioMode==="video"?"white":"#1d4e81",fontWeight:800,cursor:"pointer"}}>Animated video</button>
      <button type="button" aria-pressed={studioMode==="poster"} onClick={()=>setStudioMode("poster")} style={{padding:"11px 15px",borderRadius:10,border:"1px solid #b8d6ec",background:studioMode==="poster"?"#1266b6":"#f2f8fc",color:studioMode==="poster"?"white":"#1d4e81",fontWeight:800,cursor:"pointer"}}>Classic PNG poster</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20,alignItems:"start"}}>
      <div style={{display:"grid",gap:12,padding:18,border:"1px solid #e2e8f0",borderRadius:14,background:"white"}}>
        <label>Level <select value={level} onChange={e=>setLevel(e.target.value)} style={{display:"block",width:"100%",padding:10}}>{["A1","A2","B1","B2","C1"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Search ready vocabulary <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search German or English" style={{display:"block",width:"100%",padding:10,boxSizing:"border-box"}} /></label>
        <label>Word <select value={word?.id || ""} disabled={!available.length} onChange={e=>setSelected(e.target.value)} style={{display:"block",width:"100%",padding:10}}>
          {filtered.map(w=><option value={w.id} key={w.id}>{w.german} — {w.english}</option>)}
        </select></label>
        <button type="button" disabled={!available.length} onClick={()=>{const pool=available.filter(w=>w.id!==word?.id && !w.lastPosted); const next=pool.length?pool:available.filter(w=>w.id!==word?.id); if(next.length) setSelected(String(next[Math.floor(Math.random()*next.length)].id));}}>Pick another word</button>
        <small>{loading?"Loading vocabulary…":`${available.length} ready words in ${level}`}. Only sheet rows marked Ready with both translations are eligible.</small>
        {studioMode==="poster" && <label>Post format <select value={format} onChange={e=>setFormat(e.target.value)} style={{display:"block",width:"100%",padding:10}}><option value="portrait">Instagram portrait · 1080×1350</option><option value="square">Square · 1080×1080</option><option value="story">Story · 1080×1920</option></select></label>}
        {data && <><h3 style={{margin:"8px 0 0"}}>Edit this export only</h3>{field("german","German word")}{field("english","English meaning")}{field("exampleDE","German sentence")}{field("exampleEN","English sentence")}{field("grammar","Grammar tip")}{field("imageUrl","Image URL (optional)")}<small>Edits here do not change your Google Sheet.</small></>}
      </div>
      <div style={{display:studioMode==="poster"?"grid":"none",gap:12,padding:18,border:"1px solid #e2e8f0",borderRadius:14,background:"white"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><strong>Live PNG preview</strong><button type="button" onClick={download} disabled={!ready}>Export PNG</button></div>
        {imageWarning && <small style={{color:"#92400e"}}>Image URL could not be displayed. Using a text backdrop instead.</small>}
        {!data && !loading && <p>No ready vocabulary found. Complete the example sentences and set Content Status to Ready in the sheet.</p>}
        <canvas ref={canvasRef} style={{width:"100%",height:"auto",borderRadius:10,background:"#102b27"}} aria-label="Vocabulary post preview" />
        {data && <button type="button" onClick={()=>navigator.clipboard?.writeText([`${data.german} — ${data.english}`,data.exampleDE,data.exampleEN,data.grammar,"Learn German with Falowen. #LearnGerman #GermanVocabulary #Falowen"].filter(Boolean).join("\n\n"))}>Copy post caption</button>}
        <a href={SHEET_URL} target="_blank" rel="noreferrer">Edit vocabulary in Google Sheets</a>
      </div>
      {studioMode==="video" && <SocialVocabularyVideoCreator word={data} />}
    </div>
  </section>;
}
