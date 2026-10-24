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
