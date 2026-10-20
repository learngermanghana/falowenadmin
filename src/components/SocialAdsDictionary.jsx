import { useEffect, useRef, useState } from "react";
import { SOCIAL_ADS_DICTIONARY } from "../data/socialAdsDictionary.js";

const sizes = { portrait: [1080,1350], square: [1080,1080], story: [1080,1920] };
const fieldStyle = {width:"100%",boxSizing:"border-box",padding:10,border:"1px solid #cbd5e1",borderRadius:9};
function wrap(ctx, str, x, y, width, step, limit=5) {
  let line = "", count = 0;
  for (const word of String(str).split(/\s+/)) {
    const candidate = line ? line+" "+word : word;
    if (line && ctx.measureText(candidate).width > width) {
      ctx.fillText(line,x,y+count*step);count++;line=word;
      if(count>=limit) return y+count*step;
    } else line=candidate;
  }
  if(line) {ctx.fillText(line,x,y+count*step);count++;}
  return y+count*step;
}
function loadPhoto(url) {
  return new Promise((resolve,reject)=>{
    if(!url) {resolve(null);return;}
    const img=new Image();img.crossOrigin="anonymous";
    img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("This image host does not allow direct export. Use a direct image URL or save the free Pexels photo and upload it."));
    img.src=url;
  });
}
export default function SocialAdsDictionary() {
  const [selected,setSelected]=useState(0);
  const [headline,setHeadline]=useState(SOCIAL_ADS_DICTIONARY[0].headline);
  const [subheading,setSubheading]=useState(SOCIAL_ADS_DICTIONARY[0].subheading);
  const [photoUrl,setPhotoUrl]=useState("");
  const [format,setFormat]=useState("portrait");
  const [status,setStatus]=useState(()=>{try{return JSON.parse(localStorage.getItem("falowen-social-ads-status")||"{}");}catch{return {};}});
  const [error,setError]=useState("");
  const [ready,setReady]=useState(false);
  const [captionEdit,setCaptionEdit]=useState("");
  const canvas=useRef(null);
  const fileUrl=useRef("");
  const item=SOCIAL_ADS_DICTIONARY[selected];
  const caption=captionEdit || (item.type==="ad" ? headline+"\n\n"+subheading+"\n\nExplore German learning at https://falowen.app\n\n#LearnGerman #DeutschLernen #Falowen #GermanLanguage" : headline+"\n\n"+subheading+"\n\nKeep learning with Falowen: https://falowen.app\n\n#GermanMotivation #LearnGerman #Falowen");
  const choose=(index)=>{setSelected(index);setHeadline(SOCIAL_ADS_DICTIONARY[index].headline);setSubheading(SOCIAL_ADS_DICTIONARY[index].subheading);setCaptionEdit("");setPhotoUrl("");setError("");};
  const searchLink="https://www.pexels.com/search/"+encodeURIComponent(item.photoSearch.replace(/\s+/g,"-"))+"/";
  useEffect(()=>{
    let alive=true;setReady(false);setError("");
    (async()=>{
      const node=canvas.current;if(!node)return;
      const [w,h]=sizes[format];node.width=w;node.height=h;
      const ctx=node.getContext("2d");if(!ctx)return;
      const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,"#0b214a");gradient.addColorStop(1,"#183f75");ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
      if(photoUrl){
        try {const img=await loadPhoto(photoUrl);if(!alive)return;
          const scale=Math.max(w/img.width,h/img.height);const iw=img.width*scale,ih=img.height*scale;
          ctx.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih);
          ctx.fillStyle="rgba(4,19,46,.70)";ctx.fillRect(0,0,w,h);
        }catch(err){if(alive)setError(err.message);}
      }
      ctx.fillStyle="#f8c84a";ctx.font="bold 45px Arial";ctx.fillText("FALOWEN",80,112);
      ctx.fillStyle="#ffffff";ctx.font="bold 76px Arial";
      wrap(ctx,headline,80,Math.round(h*.40),w-160,88,4);
      ctx.fillStyle="#e6ecf7";ctx.font="38px Arial";
      wrap(ctx,subheading,80,Math.round(h*.64),w-160,49,5);
      ctx.fillStyle="#f8c84a";ctx.fillRect(80,h-185,w-160,92);
      ctx.fillStyle="#102344";ctx.font="bold 41px Arial";ctx.fillText("falowen.app",110,h-126);
      ctx.font="25px Arial";ctx.fillStyle="#cbd5e1";ctx.fillText(item.type==="ad"?"LEARN GERMAN":"GERMAN LEARNING MOTIVATION",80,h-48);
      if(alive)setReady(true);
    })();
    return()=>{alive=false;};
  },[headline,subheading,photoUrl,format,item.type]);
  useEffect(()=>()=>{if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);},[]);
  const upload=(file)=>{if(!file)return;if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);fileUrl.current=URL.createObjectURL(file);setPhotoUrl(fileUrl.current);};
  const mark=(value)=>{const next={...status,[item.id]:value};setStatus(next);try{localStorage.setItem("falowen-social-ads-status",JSON.stringify(next));}catch{}};
  const exportImage=()=>{if(!ready)return;try{canvas.current.toBlob(blob=>{if(!blob){setError("Image export failed.");return;}const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="falowen-"+item.date+"-"+item.type+".png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},"image/png");}catch{setError("This photo prevents canvas export. Upload a downloaded Pexels photo instead.");}};
  return <section style={{display:"grid",gap:16}}>
    <header><h2 style={{margin:"0 0 6px"}}>Ads & Motivation Dictionary</h2><p style={{margin:0,color:"#64748b"}}>21 ready-made Tuesday and Friday posts, October–December 2026. No vocabulary or class advertisements duplicated.</p></header>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(310px,1fr))",gap:18,alignItems:"start"}}>
      <div style={{display:"grid",gap:12,padding:16,border:"1px solid #e2e8f0",borderRadius:14}}>
        <label>Choose scheduled post<select value={selected} onChange={e=>choose(Number(e.target.value))} style={fieldStyle}>{SOCIAL_ADS_DICTIONARY.map((row,index)=><option value={index} key={row.id}>{row.date} · {row.type==="ad"?"Ad":"Motivation"} · {row.headline}</option>)}</select></label>
        <label>Headline<input value={headline} onChange={e=>setHeadline(e.target.value)} style={fieldStyle}/></label>
        <label>Supporting text<textarea rows={3} value={subheading} onChange={e=>setSubheading(e.target.value)} style={fieldStyle}/></label>
        <label>Size<select value={format} onChange={e=>setFormat(e.target.value)} style={fieldStyle}><option value="portrait">Instagram portrait</option><option value="square">Square post</option><option value="story">Story / status</option></select></label>
        <div style={{border:"1px solid #cbd5e1",borderRadius:12,padding:12,display:"grid",gap:10}}>
          <strong>Free Pexels pictures</strong>
          <a href={searchLink} target="_blank" rel="noreferrer">Find free photos for “{item.photoSearch}” on Pexels ↗</a>
          <small>Open a photo, check its licence, then copy its direct image address below. Pexels photo page links are not direct image addresses.</small>
          <label>Direct image URL<input type="url" placeholder="https://images.pexels.com/photos/..." value={photoUrl.startsWith("blob:")?"":photoUrl} onChange={e=>setPhotoUrl(e.target.value)} style={fieldStyle}/></label>
          <label>Or upload a downloaded picture<input type="file" accept="image/*" onChange={e=>upload(e.target.files?.[0])}/></label>
          <small>Some external image URLs block browser canvas export. A downloaded Pexels image uploaded here is the reliable fallback. No Pexels API key required.</small>
        </div>
        <label>Publication status<select value={status[item.id]||"Draft"} onChange={e=>mark(e.target.value)} style={fieldStyle}><option>Draft</option><option>Ready</option><option>Published</option></select></label>
        <small>Status is saved in this browser, not shared across admin accounts.</small>
      </div>
      <div style={{display:"grid",gap:12,padding:16,border:"1px solid #e2e8f0",borderRadius:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><strong>Live preview</strong><button type="button" disabled={!ready} onClick={exportImage}>Export PNG</button></div>
        <canvas ref={canvas} style={{width:"100%",borderRadius:12,background:"#0b214a"}}/>
        {error&&<p role="alert" style={{color:"#b91c1c"}}>{error}</p>}
        <label>Instagram caption<textarea value={caption} rows={7} onChange={e=>setCaptionEdit(e.target.value)} style={fieldStyle}/></label>
        <button type="button" onClick={()=>navigator.clipboard.writeText(caption).catch(()=>setError("Could not copy. Select the caption text manually."))}>Copy caption + hashtags</button>
      </div>
    </div>
  </section>;
}
