import { validateLyricCues } from "./songLyrics.js";
// Browser-only music video frames. No external rendering service or upload.
export function videoLyricLines(lyrics = "") {
  return String(lyrics).replace(/\\n/g, "\n").split(/\r?\n/)
    .map(line => line.trim()).filter(line => line && !/^\[.*\]$/.test(line));
}
export function lyricScenes(lyrics = "", duration = 0, starts = []) {
  const lines = videoLyricLines(lyrics);
  const groups = [];
  for (let i = 0; i < lines.length; i += 3) {
    groups.push({
      index: groups.length,
      lines: lines.slice(i, i + 3),
      start: Number.isFinite(Number(starts[groups.length]))
        ? Math.max(0, Number(starts[groups.length]))
        : 0,
    });
  }
  if (!Array.isArray(starts) || !starts.length) {
    groups.forEach((group, index) => {
      group.start = duration > 0 ? Math.round(index * duration / groups.length * 100) / 100 : index * 6;
    });
  }
  return groups;
}
export function findLyricScene(scenes = [], seconds = 0) {
  let index = 0;
  scenes.forEach((scene, i) => { if (seconds >= scene.start) index = i; });
  return index;
}
export function videoRecorderFormat(isSupported) {
  if (typeof isSupported !== "function") return null;
  const mimes = [
    ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "mp4"],
    ["video/mp4;codecs=avc1.42E01E", "mp4"],
    ["video/mp4", "mp4"],
    ["video/webm;codecs=vp9,opus", "webm"],
    ["video/webm;codecs=vp8,opus", "webm"],
    ["video/webm", "webm"],
  ];
  const found = mimes.find(([mime]) => isSupported(mime));
  return found ? {mime:found[0],extension:found[1]} : null;
}
function drawFit(ctx, content, y, maxWidth, fontBase, weight = 700) {
  let size=fontBase;
  ctx.font = weight + " " + size + "px system-ui, sans-serif";
  while (ctx.measureText(content).width > maxWidth && size > 29) {
    size -= 2; ctx.font = weight + " " + size + "px system-ui, sans-serif";
  }
  ctx.fillText(content, ctx.canvas.width / 2, y, maxWidth);
}
export function drawMusicVideoFrame(ctx, {title = "Falowen Music", level = "", day = "", scenes = [], time = 0, duration = 0} = {}) {
  const {width:w,height:h} = ctx.canvas;
  ctx.clearRect(0,0,w,h);
  const shade = ctx.createLinearGradient(0,0,w,h);
  shade.addColorStop(0,"#102f34"); shade.addColorStop(0.65,"#164638"); shade.addColorStop(1,"#081d29");
  ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  ctx.fillStyle="rgba(199,241,120,0.08)";
  ctx.beginPath();ctx.ellipse(w*0.7,h*0.22,w*0.45,h*0.18,-0.4,0,2*Math.PI);ctx.fill();
  ctx.fillStyle="#c8eb7a";ctx.textAlign="center";ctx.textBaseline="middle";
  drawFit(ctx,"F A L O W E N  ·  M U S I C",h*0.115,w-70,22,800);
  ctx.fillStyle="#ffffff";drawFit(ctx,title,h*0.20,w-80,42,800);
  const scene=scenes[findLyricScene(scenes,time)];
  if(scene){
    const lineSpacing=90;
    const firstY=h*0.48-(scene.lines.length-1)*lineSpacing/2;
    scene.lines.forEach((line,i)=>{
      ctx.fillStyle=i===0?"#d9f99d":"#ffffff";
      drawFit(ctx,line,firstY+i*lineSpacing,w-100,48,700);
    });
  }else{
    ctx.fillStyle="#ffffff";drawFit(ctx,"Listen · Learn · Practise",h*0.5,w-100,36);
  }
  ctx.fillStyle="rgba(255,255,255,0.8)";
  drawFit(ctx,[level,day!==""?"Day "+day:""].filter(Boolean).join(" · "),h*0.79,w-80,23,600);
  ctx.fillStyle="rgba(255,255,255,0.22)";ctx.fillRect(85,h*0.89,w-170,6);
  ctx.fillStyle="#d9f99d";ctx.fillRect(85,h*0.89,(w-170)*Math.min(1,Math.max(0,time/Math.max(1,duration))),6);
  ctx.fillStyle="rgba(255,255,255,0.75)";drawFit(ctx,"music.falowen.app",h*0.936,w-80,19,500);
}
export async function isRealMp4Blob(blob) {
  if (!blob || !/video\/mp4/.test(blob.type)) return false;
  const bytes = new Uint8Array(await blob.slice(0,12).arrayBuffer());
  return bytes.length >= 8 && String.fromCharCode(...bytes.slice(4,8)) === "ftyp";
}

// Shared by the public music API, course book and teacher slides.
export function timedLyricsPack(objectKey, lyrics, cues) {
  if (!/^music\/(a1|a2|b1|b2|c1|c2)\/day-(0[1-9]|1[0-9]|2[0-8])\/[^/]{1,150}\.mp3$/i.test(objectKey))
    throw Error("Choose the exact published MP3 object key.");
  const lines=videoLyricLines(lyrics);
  const checked=validateLyricCues(cues,lines);
  if (!lines.length || checked.length!==lines.length)
    throw Error("Mark every lyric line in order before exporting shared timing.");
  return {version:1,objectKey,lyrics,cues:checked};
}
