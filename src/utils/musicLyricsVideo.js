import { validateLyricCues } from "./songLyrics.js";
export const VIDEO_EXPORT_PRESETS = Object.freeze({
  youtube: Object.freeze({label:"YouTube landscape · 16:9",width:1280,height:720,ratio:"16/9",suffix:"youtube"}),
  tiktok: Object.freeze({label:"TikTok / Shorts / Reels · 9:16",width:720,height:1280,ratio:"9/16",suffix:"vertical"}),
  square: Object.freeze({label:"Square social post · 1:1",width:960,height:960,ratio:"1/1",suffix:"square"}),
});

// Browser-only music video frames. No external rendering service or upload.
export function videoLyricLines(lyrics = "") {
  return String(lyrics).replace(/\\n/g, "\n").split(/\r?\n/)
    .map(line => line.trim()).filter(line => line && !/^\[.*\]$/.test(line));
}
// Use verified timings only for the exact public recording and its recorded lyrics.
export function verifiedPublishedVideoTiming(data, objectKey) {
  if (!objectKey || data?.objectKey !== objectKey || typeof data?.lyrics !== "string") return null;
  const lines = videoLyricLines(data.lyrics);
  const cues = validateLyricCues(data.cues, lines);
  return lines.length && cues.length === lines.length ? {lyrics:data.lyrics,cues} : null;
}
// The metadata endpoint binds translations to an exact MP3 path and German text.
export function publishedVideoEnglish(data, objectKey, lyrics) {
  if (!objectKey || data?.objectKey!==objectKey) return "";
  const german=videoLyricLines(lyrics), lines=data.englishTranslation?.lines;
  if (!german.length || !Array.isArray(lines) || lines.length!==german.length ||
      lines.some((line,i)=>line?.de!==german[i] || typeof line.en!=="string" || !line.en.trim())) return "";
  return lines.map(line=>line.en).join("\n");
}
// Keep published exports on the owned API rather than fetching R2 redirects.
export function musicVideoAudioUrl(activeUrl, track) {
  const expected="https://www.falowen.app/api/music?track="+track?.id;
  return track?.id && activeUrl===expected ? expected+"&download=1" : activeUrl;
}
export function lyricScenes(lyrics = "", duration = 0, starts = [], cues = [], translations = []) {
  const lines = videoLyricLines(lyrics);
  const groups = [];
  for (let i = 0; i < lines.length; i += 3) {
    groups.push({
      index: groups.length,
      lines: lines.slice(i, i + 3),
      lineCues: cues.length === lines.length ? cues.slice(i, i + 3) : [],
      englishLines: translations.length === lines.length ? translations.slice(i, i + 3) : [],
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
// Never guess a sung line from the position of its three-line screen.
export function activeVideoLyricIndex(scene, time) {
  if (!Number.isFinite(time) || !scene?.lineCues?.length) return -1;
  const cues=scene.lineCues;
  for(let i=cues.length-1;i>=0;i--){
    const cue=cues[i];
    if(time<cue.start)continue;
    if(cue.end!==undefined && time>=cue.end)return -1;
    return i;
  }
  return -1;
}
// An English line must be supplied for EVERY German sung line, in the same order.
// This keeps English subtitles tied to the actual selected lyrics, not another draft.
export function videoEnglishLines(text = "", germanLines = []) {
  const english=String(text||"").trim().split(/\r?\n/).map(line=>line.trim());
  return germanLines.length && english.length===germanLines.length && english.every(Boolean) ? english : [];
}
// Editorial translation for the exact B1 Day 2 studio song, not a generic AI guess.
// Other songs can have their approved translations entered in the editor.
const B1_DAY2_ENGLISH=[
  ["Früher saßen wir oft am Fluss.","We often used to sit by the river."],
  ["Ben und ich erzählten uns alles.","Ben and I told each other everything."],
  ["Dann ist er in eine andere Stadt gezogen,","Then he moved to another city,"],
  ["und unser Kontakt wurde immer seltener.","and we kept in touch less and less."],
  ["Gute Freunde bleiben nicht nur im Bild,","Good friends are not just in photos,"],
  ["sie hören zu, wenn das Leben laut wird.","they listen when life gets loud."],
  ["Ein Anruf kann uns wieder näherbringen.","A phone call can bring us closer again."],
  ["Heute rufe ich ihn nach langer Zeit an.","Today I call him after a long time."],
  ["Er sagt, dass er oft an mich gedacht hat.","He says he has often thought of me."],
  ["Wir lachen über unsere Schulzeit","We laugh about our school days"],
  ["und planen ein Treffen im nächsten Monat.","and plan to meet next month."],
  ["Gute Freunde bleiben nicht nur im Bild,","Good friends are not just in photos,"],
  ["sie hören zu, wenn das Leben laut wird.","they listen when life gets loud."],
  ["Ein Anruf kann uns wieder näherbringen.","A phone call can bring us closer again."],
  ["An der alten Bank am Fluss warten wir.","We wait at the old bench by the river."],
  ["Manche Freundschaften finden zurück.","Some friendships find their way back."],
  ["Bei Falowen erzähle ich, was Freundschaft für mich bedeutet.","At Falowen I explain what friendship means to me."],
];
export function presetVideoEnglish(lyrics, _title, level, day) {
  const lines=videoLyricLines(lyrics);
  // Display titles may change; the level, day and every German line identify this translation.
  if(String(level).toUpperCase()!=="B1" || Number(day)!==2 ||
     lines.length!==B1_DAY2_ENGLISH.length ||
     lines.some((line,i)=>line!==B1_DAY2_ENGLISH[i][0]))return "";
  return B1_DAY2_ENGLISH.map(pair=>pair[1]).join("\n");
}
// Reusable, editable posting text for a downloaded lyrics video.
// Keep links on known public homepages; no invented deep link or exam claim.
export function musicVideoSocialCopy({title = "",level = "",day = ""} = {}) {
  const songTitle = String(title || "").trim() || "Falowen Music";
  const cleanLevel = /^(A1|A2|B1|B2|C1|C2)$/.test(String(level).toUpperCase())
    ? String(level).toUpperCase() : "";
  const numberDay = Number(day);
  const cleanDay = day !== "" && day != null && Number.isInteger(numberDay) && numberDay >= 1 && numberDay <= 28
    ? numberDay : null;
  const subject = cleanLevel ? `German ${cleanLevel} Song` : "Lyrics Video";
  const postingTitle = `${songTitle.slice(0, 64)} | ${subject} | Falowen Music`.slice(0, 100);
  const lesson = cleanLevel ? `\nLevel: ${cleanLevel}${cleanDay ? ` · Day ${cleanDay}` : ""}` : "";
  const description = [
    `Sing along to "${songTitle}" — a Falowen Music lyrics video.`,
    cleanLevel ? "Follow the lyrics on screen and practise your German listening, vocabulary and pronunciation." :
      "Follow the words on screen and enjoy the music.",
    lesson.trim(),
    "Discover more music: https://music.falowen.app/",
    "Learn German with Falowen: https://www.falowen.app/",
    cleanLevel ? `#FalowenMusic #LearnGerman #German${cleanLevel} #GermanMusic` : "#FalowenMusic #LyricsVideo #OriginalMusic",
  ].filter(Boolean).join("\n\n");
  return {title:postingTitle,description};
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
    // Landscape needs a compact lyric stack and a lower English caption;
    // these positions keep every layer inside the chosen export canvas.
    const landscape=w>h;
    const lineSpacing=landscape?65:90;
    const firstY=h*(landscape?0.46:0.48)-(scene.lines.length-1)*lineSpacing/2;
    const active=activeVideoLyricIndex(scene,time);
    scene.lines.forEach((line,i)=>{
      const y=firstY+i*lineSpacing;
      if(i===active){
        ctx.fillStyle="rgba(201,240,128,0.16)";
        ctx.fillRect(w*0.05,y-(landscape?31:39),w*0.90,landscape?62:78);
      }
      ctx.fillStyle=i===active?"#d9f99d":"#ffffff";
      drawFit(ctx,line,y,w*0.88,landscape?45:48,i===active?800:700);
    });
    // Keep the translation below the three German lines, never over the karaoke.
    const english=active>=0 ? scene.englishLines?.[active] : "";
    if(english){
      ctx.fillStyle="rgba(228,244,232,0.78)";
      drawFit(ctx,"ENGLISH",h*(landscape?0.68:0.655),w*0.88,19,700);
      ctx.fillStyle="#ffffff";
      drawFit(ctx,english,h*(landscape?0.74:0.705),w*0.88,landscape?29:31,600);
    }
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
