// Built-in Falowen music from the existing public/ directory. No paid media service.
export const SOCIAL_MUSIC_TRACKS = Object.freeze([
  { id: "none", label: "No background music", src: "" },
  { id: "gemeinsam", label: "Gemeinsam schaffen wir das", src: "/Gemeinsam%20schaffen%20wir%20das.mp3" },
  { id: "willkommen", label: "Willkommen bei Falowen", src: "/Willkommen%20bei%20Falowen(1).mp3" },
]);

export async function addSocialMusic(context, destination, trackId, seconds, volume = 0.22) {
  const track = SOCIAL_MUSIC_TRACKS.find(item => item.id === trackId);
  if (!track?.src) return null;
  const response = await fetch(track.src);
  if (!response.ok) throw new Error("Cannot load Falowen music: " + track.label);
  let buffer;
  try {
    buffer = await context.decodeAudioData(await response.arrayBuffer());
  } catch {
    throw new Error("Cannot decode Falowen music: " + track.label);
  }
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.setValueAtTime(volume, context.currentTime + Math.max(0, seconds - .35));
  gain.gain.linearRampToValueAtTime(0.0001, context.currentTime + seconds);
  source.connect(gain);
  gain.connect(destination);
  source.start();
  source.stop(context.currentTime + seconds + .05);
  return source;
}
