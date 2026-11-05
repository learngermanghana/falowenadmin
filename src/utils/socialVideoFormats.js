import { addSocialMusic } from "./socialMusicLibrary.js";
import { requireValidSocialVideo } from "./socialMp4Export.js";

// All three social studios use one aspect contract. Dimensions are actual export
// pixels, never only a CSS preview label.
export const SOCIAL_VIDEO_ASPECTS = Object.freeze([
  { id: "tiktok", label: "TikTok / Reels / Shorts · 9:16", width: 9, height: 16 },
  { id: "portrait", label: "Instagram feed · 4:5", width: 4, height: 5 },
  { id: "square", label: "Square post · 1:1", width: 1, height: 1 },
  { id: "landscape", label: "YouTube landscape · 16:9", width: 16, height: 9 },
]);
export const SOCIAL_VIDEO_QUALITIES = Object.freeze([
  { id: "standard", label: "HD (faster export)" },
  { id: "full", label: "Full HD (higher quality)" },
]);
export function socialVideoDimensions(aspectId = "tiktok", quality = "standard") {
  const aspect = SOCIAL_VIDEO_ASPECTS.find(row => row.id === aspectId) || SOCIAL_VIDEO_ASPECTS[0];
  const full = quality === "full";
  const pixels = {
    tiktok: full ? [1080, 1920] : [720, 1280],
    portrait: full ? [1080, 1350] : [720, 900],
    square: full ? [1080, 1080] : [720, 720],
    landscape: full ? [1920, 1080] : [1280, 720],
  }[aspect.id];
  return { id: aspect.id, label: aspect.label, width: pixels[0], height: pixels[1], ratio: aspect.width / aspect.height };
}

// Adapt a portrait poster to TikTok/square/landscape WITHOUT stretching text or
// cropping any registration information. The full poster stays foregrounded.
export function drawSocialPosterVideoFrame(ctx, poster, width, height, elapsed = 0, seconds = 15) {
  if (!ctx || !poster || !poster.width || !poster.height) return false;
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#071a3a";
  ctx.fillRect(0, 0, width, height);

  // Dimmed ambient fill is deliberately behind the full, legible poster.
  const cover = Math.max(width / poster.width, height / poster.height);
  const coverW = poster.width * cover, coverH = poster.height * cover;
  ctx.globalAlpha = 0.17;
  ctx.drawImage(poster, (width - coverW)/2, (height - coverH)/2, coverW, coverH);
  ctx.globalAlpha = 1;

  const fit = Math.min(width / poster.width, height / poster.height);
  const progress = Math.max(0, Math.min(1, Number(elapsed) / Math.max(1, Number(seconds))));
  const scale = fit * (0.982 + 0.012 * progress);
  const w = poster.width * scale, h = poster.height * scale;
  ctx.drawImage(poster, (width - w)/2, (height - h)/2, w, h);
  ctx.restore();
  return true;
}

// Local-only poster/campaign recording shared by Ads & Motivation and Classes.
// The song is fetched and decoded once, then its chosen segment loops in Web
// Audio; no AI service, R2 credentials, server render or uploaded video.
export async function recordSocialPosterVideo({
  posters, aspect = "tiktok", quality = "standard", seconds = 15,
  format, musicSelection = { id:"none" },
} = {}) {
  if (!Array.isArray(posters) || !posters.length || posters.some(p => !p?.width || !p?.height))
    throw new Error("Create your poster preview before exporting a video.");
  if (!Number.isFinite(Number(seconds)) || Number(seconds) < 4 || Number(seconds) > 60)
    throw new Error("Video length must be between 4 and 60 seconds.");
  if (!format?.mime || !format?.extension || typeof document === "undefined"
    || typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream)
    throw new Error("This browser cannot record the selected video format. Choose Auto or WebM.");
  const { width, height } = socialVideoDimensions(aspect, quality);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas video rendering is unavailable.");
  const duration = Number(seconds);
  const paint = (elapsed) => {
    const position = Math.max(0, Math.min(duration, elapsed));
    const sceneLength = duration / posters.length;
    const index = Math.min(posters.length - 1, Math.floor(position / sceneLength));
    const sceneTime = position - index * sceneLength;
    drawSocialPosterVideoFrame(ctx, posters[index], width, height, sceneTime, sceneLength);
  };
  paint(0);
  let videoStream, outputStream, recorder, audioContext, animationFrame=0, timer=0;
  try {
    videoStream = canvas.captureStream(24);
    if (!videoStream.getVideoTracks().length) throw new Error("The browser could not capture a video track.");
    outputStream = videoStream;
    let soundtrack = null;
    if (musicSelection.id && musicSelection.id !== "none") {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) throw new Error("This browser cannot embed music into video.");
      audioContext = new AudioContextCtor();
      await audioContext.resume();
      const audioOutput = audioContext.createMediaStreamDestination();
      soundtrack = await addSocialMusic(audioContext, audioOutput, musicSelection.id, duration, 0.22,
        { selection: musicSelection, tracks: [musicSelection.track].filter(Boolean) });
      await audioContext.resume();
      if (audioContext.state !== "running") throw new Error("Audio playback is blocked. Keep the browser tab active.");
      outputStream = new MediaStream([...videoStream.getVideoTracks(), ...audioOutput.stream.getAudioTracks()]);
    }
    recorder = new MediaRecorder(outputStream, { mimeType: format.mime, videoBitsPerSecond: quality === "full" ? 5800000 : 3300000 });
    const chunks = [];
    const finished = new Promise((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = event => reject(new Error(event.error?.message || "Video recording failed."));
      recorder.onstop = () => chunks.length ? resolve(new Blob(chunks, { type: recorder.mimeType || format.mime }))
        : reject(new Error("The browser did not encode a video."));
    });
    recorder.start(250);
    soundtrack?.start();
    const started = performance.now();
    const frameTick = now => {
      if (recorder.state === "inactive") return;
      const elapsed = Math.min(duration, (now - started) / 1000);
      paint(elapsed);
      if (elapsed < duration) animationFrame = requestAnimationFrame(frameTick);
    };
    animationFrame = requestAnimationFrame(frameTick);
    timer = setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, duration * 1000 + 180);
    const blob = await finished;
    await requireValidSocialVideo(blob, format);
    return { blob, width, height, extension: format.extension };
  } finally {
    clearTimeout(timer);
    cancelAnimationFrame(animationFrame);
    if (recorder && recorder.state !== "inactive") { try { recorder.stop(); } catch { /* already stopped */ } }
    outputStream?.getTracks().forEach(track => track.stop());
    videoStream?.getTracks().forEach(track => track.stop());
    if (audioContext) await audioContext.close().catch(()=>{});
  }
}
