import { chooseSocialVideoFormat, requireValidSocialVideo } from "./socialMp4Export.js";
import { socialVideoDimensions } from "./socialVideoFormats.js";

const decoder = new TextDecoder();
const ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const cap = (value, min, max) => Math.max(min, Math.min(max, value));
export const timeLabel = seconds => {
  const t = Math.max(0, Number(seconds) || 0);
  return Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");
};
export const activeLessonSlide = (slides, time) => {
  if (!slides.length) return 0;
  let active = 0;
  slides.forEach((slide, i) => { if (Number(slide.start) <= time + 0.02) active = i; });
  return active;
};
export const activeLessonHighlights = (items, slideIndex, time) =>
  items.filter(h => h.slide === slideIndex && time >= Number(h.start) && time < Number(h.end));

async function zipFiles(file) {
  if (file.size > 70 * 1024 * 1024) throw new Error("Please use a presentation smaller than 70 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error("This does not appear to be a valid PowerPoint (.pptx) file.");
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("PowerPoint ZIP directory is damaged.");
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50)
      throw new Error("A PowerPoint file entry is damaged.");
    const start = localOffset + 30 + view.getUint16(localOffset + 26, true) +
      view.getUint16(localOffset + 28, true);
    if (start + compressedSize > bytes.length || uncompressedSize > 80 * 1024 * 1024)
      throw new Error("A PowerPoint file entry is too large or damaged.");
    if (/^ppt\/(slides\/|media\/|presentation\.xml)/.test(name)) {
      files.set(name, async () => {
        const body = bytes.slice(start, start + compressedSize);
        if (method === 0) return body;
        if (method !== 8 || typeof DecompressionStream === "undefined")
          throw new Error("This browser cannot decompress this presentation.");
        const response = new Response(new Blob([body]).stream().pipeThrough(new DecompressionStream("deflate-raw")));
        const output = new Uint8Array(await response.arrayBuffer());
        if (output.length !== uncompressedSize) throw new Error("A PowerPoint file entry failed validation.");
        return output;
      });
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}
const parseXml = xml => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("PowerPoint XML could not be read.");
  return doc;
};
const xmlText = async getter => parseXml(decoder.decode(await getter()));
const imageMime = name => name.toLowerCase().endsWith(".png") ? "image/png"
  : name.toLowerCase().endsWith(".webp") ? "image/webp"
  : name.toLowerCase().endsWith(".gif") ? "image/gif"
  : name.toLowerCase().endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
const blobDataUrl = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error("Cannot read an image from this PowerPoint."));
  reader.readAsDataURL(blob);
});
function textArtwork(text, number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280; canvas.height = 720;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0b1834"; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = "#70e5f6"; ctx.font = "26px sans-serif";
  ctx.fillText("FALOWEN • SLIDE " + number, 68, 82);
  ctx.fillStyle = "#ffffff"; ctx.font = "36px sans-serif";
  let line = "", y = 180;
  for (const word of (text || "Slide " + number).split(/\s+/)) {
    if (ctx.measureText(line + " " + word).width > 1090) {
      ctx.fillText(line, 68, y); y += 58; line = word;
      if (y > 610) break;
    } else line = line ? line + " " + word : word;
  }
  if (y <= 640) ctx.fillText(line, 68, y);
  return canvas.toDataURL("image/png");
}
/**
 * Free, private PowerPoint import. This importer preserves slides made from
 * full-slide images (including the Falowen reference deck). It falls back to
 * readable text artwork for authored slides; complex charts, SmartArt and
 * animations should be exported from PowerPoint as PNGs for exact fidelity.
 */
export async function importLessonPowerPoint(file) {
  const files = await zipFiles(file);
  const paths = [...files.keys()].filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
  if (!paths.length || paths.length > 160) throw new Error("No supported slides were found (maximum 160).");
  let approximationCount = 0;
  const slides = [];
  for (const path of paths) {
    const document = await xmlText(files.get(path));
    const runs = [...document.getElementsByTagNameNS("*", "t")].map(n => n.textContent?.trim()).filter(Boolean);
    const text = runs.join(" ");
    const number = Number(path.match(/slide(\d+)/)[1]);
    const relsPath = "ppt/slides/_rels/slide" + number + ".xml.rels";
    const relationships = new Map();
    if (files.has(relsPath)) {
      const rels = await xmlText(files.get(relsPath));
      [...rels.getElementsByTagNameNS("*", "Relationship")].forEach(node => {
        const target = node.getAttribute("Target") || "";
        if (/^\.\.\/media\/[^/]+$/i.test(target)) {
          relationships.set(node.getAttribute("Id"), "ppt/media/" + target.split("/").pop());
        }
      });
    }
    const pictures = [...document.getElementsByTagNameNS("*", "pic")];
    const media = pictures.map(node => {
      const blip = node.getElementsByTagNameNS("*", "blip")[0];
      return relationships.get(blip?.getAttributeNS(ns, "embed") || blip?.getAttribute("r:embed"));
    }).filter(Boolean);
    let image = null;
    if (media.length === 1 && files.has(media[0])) {
      image = await blobDataUrl(new Blob([await files.get(media[0])()], { type: imageMime(media[0]) }));
      if (text || pictures.length > 1) approximationCount++;
    } else {
      image = textArtwork(text, number);
      approximationCount++;
    }
    slides.push({ id: "slide-" + number, image, text, script: "", start: 0 });
  }
  return { slides, approximate: approximationCount };
}
export async function importLessonImages(files) {
  const selected = [...files].filter(f => /^image\/(png|jpeg|webp)$/i.test(f.type));
  if (!selected.length || selected.length > 160) throw new Error("Select 1–160 PNG, JPG or WebP slide images.");
  const slides = [];
  for (let i = 0; i < selected.length; i++)
    slides.push({ id: "image-" + i, image: await blobDataUrl(selected[i]), text: "", script: "", start: 0 });
  return slides;
}
export function spreadLessonSlides(slides, duration) {
  return slides.map((slide, index) => ({
    ...slide,
    start: Math.round((index * Math.max(0, duration) / Math.max(1, slides.length)) * 10) / 10,
  }));
}
export function prepareLessonScript(slides) {
  return slides.map((slide, i) => slide.script || (slide.text
    ? "Slide " + (i + 1) + ". " + slide.text
    : "Slide " + (i + 1) + ": [Write or paste the narration for this image-based slide.]"))
    .join("\n\n");
}
export const safeLessonFilename = title => (String(title || "falowen-lesson")
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]+/gi, "-")
  .replace(/^-+|-+$/g, "").slice(0, 65) || "falowen-lesson").toLowerCase();
export function downloadLessonBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}
export async function loadLessonImages(slides) {
  return Promise.all(slides.map(slide => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("A slide image could not be loaded."));
    img.src = slide.image;
  })));
}
export function drawLessonFrame(ctx, images, slides, highlights, time, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#071932"; ctx.fillRect(0, 0, width, height);
  const index = activeLessonSlide(slides, time);
  const img = images[index];
  if (!img) return;
  const factor = Math.min(width / img.width, height / img.height);
  const w = img.width * factor, h = img.height * factor;
  const x = (width - w) / 2, y = (height - h) / 2;
  ctx.drawImage(img, x, y, w, h);
  for (const marker of activeLessonHighlights(highlights, index, time)) {
    const r = { x: x + cap(marker.x, 0, 1) * w, y: y + cap(marker.y, 0, 1) * h,
      w: cap(marker.w, 0, 1) * w, h: cap(marker.h, 0, 1) * h };
    ctx.fillStyle = "rgba(255,213,64,0.24)"; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = "#ffdc45"; ctx.lineWidth = Math.max(3, width / 260);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
}
export async function recordLessonVideo({ slides, highlights, audioData, aspect = "landscape",
  quality = "standard", onProgress = () => {} }) {
  if (!slides.length || !audioData) throw new Error("Attach slides and a narration audio file first.");
  if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream)
    throw new Error("Video capture is not available in this browser.");
  const format = chooseSocialVideoFormat(MediaRecorder.isTypeSupported.bind(MediaRecorder), "auto", { audioRequired: true });
  if (!format) throw new Error("No supported MP4/AAC or WebM/Opus encoder was found. Try Chrome or Firefox.");
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio is required for synchronized narration.");
  const audioContext = new AudioContextClass();
  let recorder, source, stream, canvasStream, animationId = 0, stopTimer;
  try {
    const audioBytes = await (await fetch(audioData)).arrayBuffer();
    const buffer = await audioContext.decodeAudioData(audioBytes);
    if (!buffer.duration || buffer.duration > 3600) throw new Error("Narration must be between 1 second and 60 minutes.");
    const dims = socialVideoDimensions(aspect, quality);
    const canvas = document.createElement("canvas");
    canvas.width = dims.width; canvas.height = dims.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas video capture is unavailable.");
    const images = await loadLessonImages(slides);
    drawLessonFrame(ctx, images, slides, highlights, 0, dims.width, dims.height);
    canvasStream = canvas.captureStream(24);
    const output = audioContext.createMediaStreamDestination();
    source = audioContext.createBufferSource();
    source.buffer = buffer; source.connect(output);
    stream = new MediaStream([...canvasStream.getVideoTracks(), ...output.stream.getAudioTracks()]);
    recorder = new MediaRecorder(stream, { mimeType: format.mime, videoBitsPerSecond: quality === "full" ? 5600000 : 3200000 });
    const pieces = [];
    const done = new Promise((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data?.size) pieces.push(event.data); };
      recorder.onerror = event => reject(new Error(event.error?.message || "Video recording failed."));
      recorder.onstop = () => pieces.length ? resolve(new Blob(pieces, { type: recorder.mimeType || format.mime }))
        : reject(new Error("No video was recorded."));
    });
    await audioContext.resume();
    if (audioContext.state !== "running") throw new Error("The browser blocked audio recording. Try again in an active tab.");
    recorder.start(500);
    const started = performance.now();
    source.start();
    let lastProgress = 0;
    const paint = () => {
      if (recorder.state === "inactive") return;
      const elapsed = Math.min(buffer.duration, (performance.now() - started) / 1000);
      drawLessonFrame(ctx, images, slides, highlights, elapsed, dims.width, dims.height);
      if (elapsed - lastProgress > 0.5) { onProgress(elapsed / buffer.duration); lastProgress = elapsed; }
      if (elapsed < buffer.duration) animationId = requestAnimationFrame(paint);
    };
    animationId = requestAnimationFrame(paint);
    stopTimer = window.setTimeout(() => {
      drawLessonFrame(ctx, images, slides, highlights, buffer.duration, dims.width, dims.height);
      if (recorder.state !== "inactive") recorder.stop();
    }, buffer.duration * 1000 + 160);
    const video = await done;
    await requireValidSocialVideo(video, format);
    onProgress(1);
    return { blob: video, extension: format.extension, duration: buffer.duration, dims };
  } finally {
    window.clearTimeout(stopTimer);
    cancelAnimationFrame(animationId);
    if (recorder && recorder.state !== "inactive") try { recorder.stop(); } catch { /* already stopped */ }
    try { source?.stop(); } catch { /* already stopped */ }
    stream?.getTracks().forEach(track => track.stop());
    canvasStream?.getTracks().forEach(track => track.stop());
    await audioContext.close().catch(() => {});
  }
}