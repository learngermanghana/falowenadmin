// Locally synthesized, subtle listening-scene atmospheres; no new Google API request.
// Optional user-supplied (licensed) MP3/WAV backgrounds are mixed in the browser only.
export const SCENES = Object.freeze({
  station: "Bahnhof · Train station",
  cafe: "Café · Restaurant",
  supermarket: "Supermarkt · Shop",
  clinic: "Arztpraxis · Waiting room",
  street: "Straße · City street",
  none: "No background sounds",
});

const RATE = 24000;
const TWO_PI = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const hashNoise = (index, seed = 17) => {
  let v = (Math.imul(index ^ seed, 0x45d9f3b) ^ 0x68bc21eb) | 0;
  v ^= v >>> 16;
  return ((v & 65535) / 32767.5) - 1;
};
function bellAt(t, type) {
  if (t < 0 || t > 2.8) return 0;
  const intervals = type === "station" ? [0, 0.58] : [0];
  return intervals.reduce((out, start, index) => {
    const x = t - start;
    if (x < 0 || x > 2) return out;
    const envelope = Math.exp(-3.8 * x) * Math.min(1, x * 110);
    const pitch = type === "station" ? (index ? 659.25 : 783.99) : 988;
    return out + envelope * (
      Math.sin(TWO_PI * pitch * x) * 0.55 +
      Math.sin(TWO_PI * pitch * 2.01 * x) * 0.2 +
      Math.sin(TWO_PI * pitch * 3.94 * x) * 0.07
    );
  }, 0);
}

function ambienceAt(t, i, scene) {
  // Smoothed deterministic noise at very low level approximates distant room / transit hum,
  // without asserting that synthetic beds are authentic field recordings.
  const n = (hashNoise(i >> 3, 89) + hashNoise(i >> 6, 191) + hashNoise(i >> 10, 43)) / 3;
  if (scene === "station") return 0.17 * n + 0.065 * Math.sin(TWO_PI * 71 * t);
  if (scene === "cafe") return 0.12 * n + 0.035 * Math.sin(TWO_PI * 135 * t);
  if (scene === "supermarket") return 0.09 * n + 0.055 * Math.sin(TWO_PI * 100 * t);
  if (scene === "clinic") return 0.065 * n;
  if (scene === "street") return 0.2 * n + 0.04 * Math.sin(TWO_PI * 55 * t);
  return 0;
}

export function applySoundscapeToPcm(pcmBytes, config = {}) {
  const scene = SCENES[config.scene] ? config.scene : "none";
  if (scene === "none") return pcmBytes;
  const volume = clamp(config.volume ?? 0.14, 0, 0.35);
  if (!volume) return pcmBytes;
  const mix = config.ambience !== false;
  const chime = config.bell !== false;
  const endFx = config.ending !== false;
  const user = config.userAudio instanceof Float32Array ? config.userAudio : null;
  const output = pcmBytes.slice();
  const data = new DataView(output.buffer, output.byteOffset, output.byteLength);
  const seconds = output.byteLength / 2 / RATE;
  const endStart = Math.max(0, seconds - 3);
  for (let pos = 0; pos < output.byteLength / 2; pos += 1) {
    const t = pos / RATE;
    const fade = Math.min(1, t / 0.28, (seconds - t) / 0.5);
    let sound = mix ? (user?.length ? user[pos % user.length] * 0.45 : ambienceAt(t, pos, scene)) * Math.max(0, fade) : 0;
    if (chime) sound += bellAt(t, scene) * 0.5;
    if (endFx && scene === "station" && t >= endStart) {
      const x = t - endStart;
      sound += Math.sin(TWO_PI * (82 + x * 16) * x) * 0.1 * Math.sin(Math.PI * x / 3);
    }
    if (sound === 0) continue;
    const speech = data.getInt16(pos * 2, true);
    const combined = Math.round(speech + sound * volume * 32767);
    data.setInt16(pos * 2, Math.max(-32768, Math.min(32767, combined)), true);
  }
  return output;
}

export async function decodeLocalAtmosphere(file) {
  if (!file) return null;
  if (file.size > 15_000_000) throw new Error("Background audio must be under 15 MB.");
  if (!/\.(mp3|wav|m4a|ogg)$/i.test(file.name || "")) throw new Error("Upload an MP3, WAV, M4A or OGG sound.");
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw new Error("Your browser cannot decode background sounds.");
  const context = new Context();
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const size = Math.min(Math.floor(decoded.duration * RATE), RATE * 120);
    if (!size) throw new Error("The background sound is empty.");
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));
    const result = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const source = i * decoded.sampleRate / RATE;
      const a = Math.min(channels[0].length - 1, Math.floor(source));
      const b = Math.min(channels[0].length - 1, a + 1);
      const f = source - a;
      result[i] = channels.reduce((sum, c) => sum + c[a] * (1 - f) + c[b] * f, 0) / channels.length;
    }
    return result;
  } finally {
    await context.close();
  }
}
