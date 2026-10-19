import { useEffect, useMemo, useRef, useState } from "react";

const SHEET_ID = "1I1yAnqzSh3DPjwWRh9cdRSfzNSPsi7o4r5Taj9Y36NU";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
const CSV_URL = import.meta.env.VITE_GERMAN_VOCABS_CSV_URL || `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;
const THEMES = { coral: { name: "Bold Coral", bg: "#ff674f", ink: "#18202e", accent: "#18202e", panel: "#fff9ed" }, emerald: { name: "Premium Emerald", bg: "#103c32", ink: "#fff8e8", accent: "#e5c67b", panel: "#fff8e8" }, sunshine: { name: "Sunny Illustration", bg: "#fff7df", ink: "#172842", accent: "#bd430d", panel: "#ffe078" } };
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
// CSV parser is also used by import validation.
// eslint-disable-next-line react-refresh/only-export-components
export function parseVocabularyCSV(csv) {
  const rows = parseCSV(csv.replace(/^\uFEFF/, ""));
  const header = (rows.shift() || []).map(value => value.trim().toLowerCase());
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
// Fit every character, including long German compound words, into its allotted box.
function fitText(ctx, text, x, y, width, height, maxSize, color, weight = "normal") {
  const content = String(text || "").trim();
  if (!content) return;
  let lines = [], size = maxSize;
  for (; size >= 1; size -= 1) {
    ctx.font = `${weight} ${size}px ${ctx.posterFont || "Arial"}`;
    lines = [""];
    for (const char of content) {
      const current = lines.length - 1;
      if (char === "\n") { lines.push(""); continue; }
      if (ctx.measureText(lines[current] + char).width > width && lines[current]) {
        const split = lines[current].lastIndexOf(" ");
        if (split > 0) {
          const tail = lines[current].slice(split + 1);
          lines[current] = lines[current].slice(0, split);
          lines.push(tail + char);
        } else lines.push(char);
      } else lines[current] += char;
    }
    if (lines.length * size * 1.18 <= height && lines.every(line => ctx.measureText(line).width <= width)) break;
  }
  ctx.fillStyle = color; ctx.textBaseline = "top";
  lines.forEach((line, i) => ctx.fillText(line.trim(), x, y + i * size * 1.18));
  ctx.textBaseline = "alphabetic";
}
function nounDetails(data) {
  const article = /^(der|die|das)\s+/i.exec(data.german)?.[1]?.toLowerCase()
    || /^(der|die|das)\s+/i.exec(data.article)?.[1]?.toLowerCase();
  const parts = (data.article || "").split(/\s*[·;]\s*|\s*Plural:\s*/i);
  return { article, title: article && !/^(der|die|das)\s+/i.test(data.german) ? `${article} ${data.german}` : data.german,
    plural: parts.length > 1 ? parts.slice(1).join(" · ") : "" };
}
async function loadImage(url) {
  if (!url || !/^(https:\/\/|data:image\/(?:png|jpeg|webp);base64,)/i.test(url)) return null;
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timeout = setTimeout(() => resolve(null), 12000);
    img.onload = () => { clearTimeout(timeout); resolve(img); };
    img.onerror = () => { clearTimeout(timeout); resolve(null); };
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
  const [template, setTemplate] = useState("coral");
  const [uploadedImage, setUploadedImage] = useState("");
  const [format, setFormat] = useState("portrait");
  const [overrides, setOverrides] = useState({});
  const [ready, setReady] = useState(false);
  const [imageWarning, setImageWarning] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(CSV_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Sheet request failed (${response.status}).`);
        const content = await response.text();
        const parsed = parseVocabularyCSV(content);
        setWords(parsed);
        if (!parsed.length) setError("The vocabulary sheet has no populated rows.");
      } catch (err) {
        if (err.name !== "AbortError") setError("Cannot load the vocabulary sheet. Publish its A–Q columns as CSV (or configure VITE_GERMAN_VOCABS_CSV_URL). " + err.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, []);
  const available = useMemo(() => words.filter(w => w.level.toUpperCase() === level && w.status.toLowerCase() === "ready" && w.exampleDE && w.exampleEN), [words, level]);
  const filtered = useMemo(() => available.filter(w => (w.german + " " + w.english).toLowerCase().includes(search.toLowerCase())), [available, search]);
  useEffect(() => { setSelected(""); setOverrides({}); }, [level]);
  const word = available.find(w => String(w.id) === selected) || filtered[0] || available[0];
  const data = useMemo(() => word ? { ...word, ...overrides } : null, [word, overrides]);
  useEffect(() => { setOverrides({}); setUploadedImage(""); }, [word?.id]);
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
      const theme = THEMES[template];
      const details = nounDetails(data);
      ctx.posterFont = template === "emerald" ? "Georgia" : "Arial";
      const left = 64, inner = width - left * 2;
      ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, width, height);
      fitText(ctx, "FALOWEN", left, 48, 650, 48, 38, theme.ink, "bold");
      fitText(ctx, data.level, width - 145, 48, 90, 48, 38, theme.ink, "bold");
      const image = await loadImage(uploadedImage || data.imageUrl);
      if (!active) return;
      const heroTop = 130, heroHeight = Math.round(height * .29);
      if (image) {
        const ratio = Math.max(inner / image.width, heroHeight / image.height);
        ctx.save(); ctx.beginPath(); ctx.roundRect(left, heroTop, inner, heroHeight, 30); ctx.clip();
        ctx.drawImage(image, left + (inner - image.width * ratio) / 2, heroTop + (heroHeight - image.height * ratio) / 2, image.width * ratio, image.height * ratio);
        ctx.restore();
      } else {
        // A typographic cover stays intentional when a word has no approved image.
        rounded(ctx, left, heroTop, inner, heroHeight, 30, theme.panel);
        ctx.strokeStyle = template === "sunshine" ? "#172842" : "#eab69a"; ctx.lineWidth = 5;
        [0, 1, 2].forEach(i => { ctx.beginPath(); ctx.arc(width - 170, heroTop + heroHeight / 2, 65 + i * 45, 0, Math.PI * 2); ctx.stroke(); });
        fitText(ctx, "EIN WORT.\nJEDEN TAG.", left + 40, heroTop + 35, inner - 220, heroHeight - 60, 72, "#172842", "bold");
        if (uploadedImage || data.imageUrl) setImageWarning(true);
      }
      const wordTop = heroTop + heroHeight + 28;
      fitText(ctx, "WORT DES TAGES", left, wordTop, inner, 35, 26, theme.ink, "bold");
      const titleHeight = Math.round(height * .115);
      fitText(ctx, details.title, left, wordTop + 49, inner, titleHeight, 112, theme.ink, "bold");
      let y = wordTop + 49 + titleHeight + 8;
      fitText(ctx, data.english, left, y, inner, 64, 44, theme.ink);
      y += 70;
      if (details.article) {
        const genderColors = { der: "#175cbd", die: "#b52642", das: "#176c42" };
        rounded(ctx, left, y, 110, 46, 14, "#ffffff");
        fitText(ctx, details.article, left + 20, y + 6, 80, 35, 28, genderColors[details.article], "bold");
      }
      fitText(ctx, details.plural ? `Plural: ${details.plural}` : data.type, left + (details.article ? 130 : 0), y + 5, inner - (details.article ? 130 : 0), 40, 27, theme.ink);
      const boxTop = y + 65, boxBottom = height - 150;
      rounded(ctx, left, boxTop, inner, boxBottom - boxTop, 26, theme.panel);
      const boxHeight = boxBottom - boxTop;
      fitText(ctx, "SO SAGST DU ES", left + 30, boxTop + 20, inner - 60, 30, 23, "#42534b", "bold");
      const sentenceHeight = (boxHeight - 80) / 2;
      fitText(ctx, data.exampleDE, left + 30, boxTop + 62, inner - 60, sentenceHeight, 40, "#172842", "bold");
      fitText(ctx, data.exampleEN, left + 30, boxTop + 65 + sentenceHeight, inner - 60, sentenceHeight, 31, "#42534b");
      fitText(ctx, `Write a sentence with ${details.title}.`, left, height - 122, inner, 43, 28, theme.ink, "bold");
      fitText(ctx, "SAVE IT. SAY IT. REMEMBER IT.", left, height - 57, 650, 30, 22, theme.ink);
      fitText(ctx, "falowen.app", width - 260, height - 60, 200, 32, 27, theme.ink, "bold");
      setReady(true);
    })();
    return () => { active = false; };
  }, [data,format,template,uploadedImage]);
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
    <div><h2 style={{margin:"0 0 6px"}}>Vocabulary Post Studio</h2><p style={{margin:0,color:"#64748b"}}>Uses approved German_Vocabs sheet content only. No AI and no generated sentences.</p></div>
    {error && <div role="alert" style={{padding:12,background:"#fef2f2",color:"#991b1b",borderRadius:8}}>{error} <a href={SHEET_URL} target="_blank" rel="noreferrer">Open source sheet</a></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,300px),1fr))",gap:20,alignItems:"start"}}>
      <div style={{display:"grid",gap:12,padding:18,border:"1px solid #e2e8f0",borderRadius:14,background:"white"}}>
        <label>Level <select value={level} onChange={e=>setLevel(e.target.value)} style={{display:"block",width:"100%",padding:10}}>{["A1","A2","B1","B2","C1"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Search ready vocabulary <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search German or English" style={{display:"block",width:"100%",padding:10,boxSizing:"border-box"}} /></label>
        <label>Word <select value={word?.id || ""} disabled={!available.length} onChange={e=>setSelected(e.target.value)} style={{display:"block",width:"100%",padding:10}}>
          {filtered.map(w=><option value={w.id} key={w.id}>{w.german} — {w.english}</option>)}
        </select></label>
        <button type="button" disabled={!available.length} onClick={()=>{const pool=available.filter(w=>w.id!==word?.id && !w.lastPosted); const next=pool.length?pool:available.filter(w=>w.id!==word?.id); if(next.length) setSelected(String(next[Math.floor(Math.random()*next.length)].id));}}>Pick another word</button>
        <small>{loading?"Loading vocabulary…":`${available.length} ready words in ${level}`}. Only sheet rows marked Ready with both translations are eligible.</small>
        <label>Design template <select value={template} onChange={e=>setTemplate(e.target.value)} style={{display:"block",width:"100%",padding:10}}>{Object.entries(THEMES).map(([key, theme])=><option key={key} value={key}>{theme.name}</option>)}</select></label>
        <label>Upload a photo or illustration <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{
          const file=e.target.files?.[0]; if (!file) return;
          if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>10*1024*1024) { setError("Choose a PNG, JPEG or WebP image under 10 MB."); return; }
          const reader=new FileReader(); const wordId=word?.id;
          reader.onload=()=>{ if (canvasRef.current?.dataset.wordId === String(wordId)) { setUploadedImage(String(reader.result)); setError(""); } };
          reader.onerror=()=>setError("Could not read this image. Please try another file."); reader.readAsDataURL(file);
        }} /></label>
        {uploadedImage && <button type="button" onClick={()=>setUploadedImage("")}>Use sheet image instead</button>}
        <small>Use a relevant image for the strongest post. Uploads apply to this export only.</small>
        <label>Post format <select value={format} onChange={e=>setFormat(e.target.value)} style={{display:"block",width:"100%",padding:10}}><option value="portrait">Instagram portrait · 1080×1350</option><option value="square">Square · 1080×1080</option><option value="story">Story · 1080×1920</option></select></label>
        {data && <><h3 style={{margin:"8px 0 0"}}>Edit this export only</h3>{field("german","German word")}{field("english","English meaning")}{field("exampleDE","German sentence")}{field("exampleEN","English sentence")}{field("article","Article / Plural (e.g. die Hochzeit · die Hochzeiten)")}{field("imageUrl","Image URL (optional)")}<small>Edits here do not change your Google Sheet.</small></>}
      </div>
      <div style={{display:"grid",gap:12,padding:18,border:"1px solid #e2e8f0",borderRadius:14,background:"white"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><strong>Live PNG preview</strong><button type="button" onClick={download} disabled={!ready}>Export PNG</button></div>
        {imageWarning && <small style={{color:"#92400e"}}>Image URL could not be displayed. Using a text backdrop instead.</small>}
        {!data && !loading && <p>No ready vocabulary found. Complete the example sentences and set Content Status to Ready in the sheet.</p>}
        <canvas ref={canvasRef} data-word-id={word?.id} style={{width:"100%",height:"auto",borderRadius:10,background:"#102b27"}} aria-label="Vocabulary post preview" />
        {data && <button type="button" onClick={()=>navigator.clipboard?.writeText([`${data.german} — ${data.english}`,data.exampleDE,data.exampleEN,`Write a sentence with ${nounDetails(data).title}.`,"Learn German with Falowen. #LearnGerman #GermanVocabulary #Falowen"].filter(Boolean).join("\n\n"))}>Copy post caption</button>}
        <a href={SHEET_URL} target="_blank" rel="noreferrer">Edit vocabulary in Google Sheets</a>
      </div>
    </div>
  </section>;
}
