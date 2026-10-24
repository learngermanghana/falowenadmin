import {useMemo,useState} from "react";
import {SOCIAL_GRAMMAR_VIDEOS,GRAMMAR_CATEGORIES,filterGrammarVideos,grammarVideoScript,grammarVideoCaption} from "../data/socialGrammarVideoDictionary.js";

const SAVE_KEY="falowen-social-grammar-videos-v1";
const initialStatuses=()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||"{}")||{}}catch{return {}}};
function download(name,body){
 const blob=new Blob([body],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
const filename=item=>`falowen-grammar-${item.id.toLowerCase()}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`;
export default function SocialGrammarVideoDictionary(){
 const [search,setSearch]=useState("");
 const [level,setLevel]=useState("all");
 const [category,setCategory]=useState("all");
 const [selectedId,setSelectedId]=useState("GR-001");
 const [edits,setEdits]=useState({});
 const [platform,setPlatform]=useState("Instagram");
 const [statuses,setStatuses]=useState(initialStatuses);
 const [message,setMessage]=useState("");
 const [captionOverride,setCaptionOverride]=useState("");
 const filtered=useMemo(()=>filterGrammarVideos({search,level,category}),[search,level,category]);
 const selected=SOCIAL_GRAMMAR_VIDEOS.find(x=>x.id===selectedId)||SOCIAL_GRAMMAR_VIDEOS[0];
 const current=edits[selected.id]||{};
 const values={hook:current.hook??selected.hook,rule:current.rule??selected.rule,example:current.example??selected.example,platform};
 const script=grammarVideoScript(selected,values);
 const caption=captionOverride||grammarVideoCaption(selected,values);
 const state=statuses[selected.id]||"Not started";
 const progress=SOCIAL_GRAMMAR_VIDEOS.filter(x=>statuses[x.id]==="Published").length;
 const choose=id=>{setSelectedId(id);setMessage("");setCaptionOverride("");};
 const change=(key,value)=>{setEdits(x=>({...x,[selected.id]:{...(x[selected.id]||{}),[key]:value}}));setMessage("");setCaptionOverride("");};
 const copy=async(value,kind)=>{try{await navigator.clipboard.writeText(value);setMessage(kind+" copied.");}catch{setMessage("Copy is unavailable in this browser. Select the text and copy manually.");}};
 const mark=(status)=>{
  const next={...statuses,[selected.id]:status};
  setStatuses(next);
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(next));setMessage(`Topic marked ${status} in this browser.`);}
  catch{setMessage("Browser storage unavailable. You can still export the script.");}
 };
 const pack=[
  "FALOWEN · GERMAN GRAMMAR VIDEO PRODUCTION PACK",
  `Topic: ${selected.title} | ${selected.level} | ${selected.category}`,
  "Format: 9:16 vertical video, approximately 30 seconds",
  "Use the exact teacher-reviewed examples below. Do not change grammar or add unverified rules.",
  "Keep the German text large, pronounce it clearly and use simple animations.",
  "Show Falowen branding and www.falowen.app at the end.",
  "No claim that this is an official Goethe lesson or question.",
  "",
  "=== VIDEO SCRIPT ===",script,
  "",
  "=== READY-TO-POST CAPTION ===",caption,
  "",
  "=== QUALITY CHECK ===",
  "[ ] German articles, cases and verb forms checked",
  "[ ] Subtitles and speech match",
  "[ ] Duration and safe vertical framing checked",
  "[ ] MP4 export checked before Instagram/TikTok upload",
  "[ ] Any added music is licensed",
 ].join("\n");
 return <section className="social-grammar-workspace">
   <div className="social-grammar-summary">
     <div><strong>50 ready-to-build grammar videos</strong><p>A1–B1 · Choose a topic, edit the mini-lesson, and create your video. No AI credits or recording storage needed to prepare scripts.</p></div>
     <span>{progress} / 50 published</span>
   </div>
   <div className="social-grammar-grid">
     <section className="social-panel social-grammar-library">
       <h3>1. Select a grammar topic</h3>
       <div className="social-form-row"><label htmlFor="social-grammar-search">Search the dictionary</label><input id="social-grammar-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="e.g. mögen, gern, dativ, weil…" /></div>
       <div className="social-grammar-filters">
         <label>Level<select value={level} onChange={e=>setLevel(e.target.value)}><option value="all">All levels</option>{["A1","A2","B1"].map(x=><option key={x}>{x}</option>)}</select></label>
         <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All topics</option>{GRAMMAR_CATEGORIES.map(x=><option key={x}>{x}</option>)}</select></label>
       </div>
       <p className="social-grammar-count">{filtered.length} topics found · Select a topic to load its ready-made script.</p>
       <div className="social-grammar-results" role="list">
         {filtered.map(item=><button type="button" role="listitem" key={item.id} className="social-grammar-option" aria-pressed={selected.id===item.id} onClick={()=>choose(item.id)}>
           <span><strong>{item.title}</strong><small>{item.level} · {item.category}</small></span><span className="social-grammar-status">{statuses[item.id]==="Published"?"Published":statuses[item.id]==="Ready"?"Ready":item.id}</span>
         </button>)}
         {!filtered.length&&<p>No matching topics. Try another level or search.</p>}
       </div>
     </section>
     <section className="social-panel social-grammar-editor">
       <h3>2. Edit your {selected.level} video</h3>
       <p className="social-source-note">{selected.id} · {selected.title} · Estimated 30-second short</p>
       <div className="social-form-row"><label htmlFor="grammar-hook">Video hook (first 3 seconds)</label><textarea id="grammar-hook" rows={2} value={values.hook} onChange={e=>change("hook",e.target.value)} /></div>
       <div className="social-form-row"><label htmlFor="grammar-rule">Simple grammar explanation</label><textarea id="grammar-rule" rows={3} value={values.rule} onChange={e=>change("rule",e.target.value)} /></div>
       <div className="social-form-row"><label htmlFor="grammar-example">On-screen German examples</label><textarea id="grammar-example" rows={3} value={values.example} onChange={e=>change("example",e.target.value)} /></div>
       <div className="social-grammar-filters"><label>Platform<select value={platform} onChange={e=>setPlatform(e.target.value)}><option>Instagram</option><option>TikTok</option><option>YouTube Shorts</option></select></label><label>Production status<select value={state} onChange={e=>mark(e.target.value)}><option>Not started</option><option>Ready</option><option>Published</option></select></label></div>
       <button type="button" className="social-button-quiet" onClick={()=>{setEdits(x=>({...x,[selected.id]:{}}));setCaptionOverride("");setMessage("Original authored draft restored.");}}>Reset to authored content</button>
     </section>
     <section className="social-panel social-grammar-preview">
       <h3>3. Build your video from this script</h3>
       <pre className="social-script-preview">{script}</pre>
       <div className="social-actions">
         <button type="button" className="social-primary-button" onClick={()=>download(filename(selected)+"-notebooklm.txt",pack)}>Download NotebookLM pack</button>
         <button type="button" className="social-button-quiet" onClick={()=>copy(script,"Video script")}>Copy script</button>
         <button type="button" className="social-button-quiet" onClick={()=>download(filename(selected)+"-script.txt",script)}>Download script</button>
       </div>
       <div className="social-caption-block">
         <div className="social-preview-header"><h3>4. Post caption</h3><button type="button" className="social-button-quiet" onClick={()=>copy(caption,"Caption")}>Copy caption</button></div>
         <textarea aria-label="Grammar video post caption" rows={7} value={caption} onChange={e=>setCaptionOverride(e.target.value)} />
       </div>
       <p className="social-grammar-disclaimer">The pack contains a production script and caption—not a rendered MP4. Record or create the video in your preferred editor, then export a genuine H.264 MP4 for Instagram or TikTok. Verify the German before publishing.</p>
       {message&&<p role="status" className="social-inline-info">{message}</p>}
     </section>
   </div>
 </section>;
}
