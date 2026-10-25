// Browser-only MP4 export safety. Never disguise WebM or arbitrary media as .mp4.
export const SOCIAL_MP4_CANDIDATES=Object.freeze([
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4",
]);
export function chooseSocialMp4Mime(isSupported){
  if(typeof isSupported!=="function")return "";
  return SOCIAL_MP4_CANDIDATES.find(type=>isSupported(type))||"";
}
export async function requireValidSocialMp4(blob){
  if(!blob || !blob.size || !/^video\/mp4(?:;|$)/i.test(blob.type||"")){
    throw new Error("This browser did not encode a real MP4. Nothing was downloaded. Try a browser with MP4 (H.264) recording support.");
  }
  // ISOBMFF files begin with a 32-bit box size followed by 'ftyp'.
  // A WebM downloaded with an .mp4 suffix would fail this check.
  const bytes=new Uint8Array(await blob.slice(0,12).arrayBuffer());
  if(bytes.length<8 || String.fromCharCode(...bytes.slice(4,8))!=="ftyp"){
    throw new Error("Video container is not MP4. The export was stopped to avoid an Instagram/TikTok upload failure.");
  }
  return blob;
}

export const SOCIAL_WEBM_CANDIDATES = Object.freeze([
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
]);
export function chooseSocialVideoFormat(isSupported, preferred="auto") {
  if (typeof isSupported !== "function") return null;
  const mp4 = chooseSocialMp4Mime(isSupported);
  const webm = SOCIAL_WEBM_CANDIDATES.find(type => isSupported(type)) || "";
  if (preferred === "mp4") return mp4 ? {mime:mp4,extension:"mp4"} : null;
  if (preferred === "webm") return webm ? {mime:webm,extension:"webm"} : null;
  return mp4 ? {mime:mp4,extension:"mp4"} : webm ? {mime:webm,extension:"webm"} : null;
}
export async function requireValidSocialVideo(blob, format) {
  if (format?.extension === "mp4") return requireValidSocialMp4(blob);
  if (format?.extension !== "webm" || !blob?.size || !/^video\/webm(?:;|$)/i.test(blob.type || ""))
    throw new Error("Video encoding failed. No file was downloaded.");
  const header = new Uint8Array(await blob.slice(0,4).arrayBuffer());
  if (header.length !== 4 || header[0] !== 0x1a || header[1] !== 0x45 || header[2] !== 0xdf || header[3] !== 0xa3)
    throw new Error("The recording is not a valid WebM video.");
  return blob;
}
