import { applySoundscapeToPcm } from "./hoerenSoundscape.js";

// Offline audio assembly. Gemini 3.8 unary TTS outputs 24 kHz, mono, 16-bit WAV.
// Doing the pauses and repeats locally avoids additional Google synthesis charges.
export function formatStudioTranscript(source) {
  // A pasted comma delimiter may have spaces or tabs after it, but must
  // immediately follow sentence-ending punctuation (or a completed pause).
  // Restrict delimiter whitespace to horizontal whitespace so we never consume
  // newlines separating already-formatted turns. Preserve spoken lists such as
  // "Modell A: günstig, B: schnell".
  return String(source || "").replace(/\r\n/g, "\n")
    .replace(/(?<=[.!?]),[ \t]*(?=(?:[ABC]:[ \t]|\[PAUSE[ \t]+\d{1,2}\]))/gi, "\n")
    .replace(/(\[PAUSE[ \t]+\d{1,2}\]),[ \t]*(?=[ABC]:[ \t])/gi, "$1\n")
    // Pause markers are timing metadata, not synthesized speech. Split them
    // before ANY paid clip requests, including pasted "A: [PAUSE 3]".
    .replace(/[ \t]*(\[PAUSE[ \t]+\d{1,2}\])(?!,)[ \t]*/gi, "\n$1\n")
    .replace(/(^|\n)[ \t]*[ABC]:[ \t]*(?=\n|$)/gi, "$1")
    .replace(/\n{2,}/g, "\n").trim();
}

// Repair common pasted exam narration without guessing at dialogue in sentences.
export function repairStudioTranscript(source) {
  return formatStudioTranscript(source)
    .replace(/([.!?]|\[PAUSE[ \t]+\d{1,2}\]),[ \t]*(?=(?:Beispiel\b|Nummer[ \t]+(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\b))/gi, "$1\n")
    .replace(/,[ \t]*(?=(?:Nummer[ \t]+\d+\.|Sie hören\b|Ende von Hören Teil\b))/gi, "\n")
    .replace(/(^|\n)[ \t]*(Nummer[ \t]+\d+[.!]?|Ende von Hören Teil[ \t]+\d+[.!]?|Hören Teil[ \t]+\d+[^\n]*?)[ \t]*(?=\n|$)/gi, (_match, start, narration) => `${start}A: ${narration}`)
    .replace(/(\[PAUSE[ \t]+\d{1,2}\])[ \t]*,[ \t]*(?=Nummer[ \t]+\d+)/gi, "$1\n")
    .replace(/(^|\n)[ \t]*(?=Sie hören(?:\s|$))/gi, "$1A: ");
}

// Explicit teacher action: label unlabelled standalone narration, without
// guessing at speaker changes inside the existing spoken dialogue.
export function repairUnlabelledStudioLines(source) {
  return repairStudioTranscript(source).split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed || /^(?:[ABC]:\s*.+|\[PAUSE\s+\d{1,2}\])$/i.test(trimmed)) return line;
    return `A: ${trimmed}`;
  }).join("\n");
}
export function sameSpokenTranscript(a, b) {
  try {
    const normalize = value => parseStudioTranscript(formatStudioTranscript(value)).map(line => line.type === "pause" ? `PAUSE:${line.seconds}` : `${line.speaker}:${line.text.replace(/\s+/g, " ").trim()}`).join("\n");
    return normalize(a) === normalize(b);
  } catch { return false; }
}

export function parseStudioTranscript(source) {
  const lines = repairUnlabelledStudioLines(source).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 64) throw new Error("Maximum 64 transcript lines.");
  if (!lines.length) throw new Error("Enter a script or generate one first.");
  return lines.map((line, index) => {
    const pause = line.match(/^\[PAUSE\s+(\d{1,2})\]$/i);
    if (pause) {
      const seconds = Number(pause[1]);
      if (seconds < 1 || seconds > 20) throw new Error("Pauses must last 1–20 seconds.");
      return { type: "pause", seconds };
    }
    const turn = line.match(/^([ABC]):\s*(.+)$/i);
    if (!turn) throw new Error(`Line ${index + 1}: use A: text, B: text, or [PAUSE 3].`);
    if (turn[2].length > 320) throw new Error(`Line ${index + 1} is too long (max 320 characters).`);
    return { type: "speech", speaker: turn[1].toUpperCase(), text: turn[2] };
  });
}

function readClip(wavBytes) {
  const bytes = wavBytes instanceof Uint8Array ? wavBytes : new Uint8Array(wavBytes);
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (pos, n) => String.fromCharCode(...bytes.subarray(pos, pos + n));
  if (bytes.length < 44 || ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WAVE") throw new Error("Invalid WAV recording.");
  let offset = 12, format = null, sound = null;
  while (offset + 8 <= bytes.length) {
    const label = ascii(offset, 4);
    const size = data.getUint32(offset + 4, true);
    const start = offset + 8;
    if (start + size > bytes.length) throw new Error("Invalid WAV chunk length.");
    if (label === "fmt ") {
      if (size < 16) throw new Error("Invalid WAV format.");
      format = { codec: data.getUint16(start, true), channels: data.getUint16(start + 2, true), rate: data.getUint32(start + 4, true), bits: data.getUint16(start + 14, true) };
    }
    if (label === "data") sound = bytes.slice(start, start + size);
    offset = start + size + (size % 2);
  }
  if (!format || !sound || format.codec !== 1 || format.channels !== 1 || format.bits !== 16 || format.rate !== 24_000) {
    throw new Error("Expected 24 kHz mono 16-bit PCM audio from Google.");
  }
  return sound;
}

function writeWav(samples) {
  const output = new Uint8Array(44 + samples.length);
  const d = new DataView(output.buffer);
  const ascii = (pos, s) => { for (let i = 0; i < s.length; i += 1) output[pos + i] = s.charCodeAt(i); };
  ascii(0, "RIFF"); d.setUint32(4, 36 + samples.length, true); ascii(8, "WAVE");
  ascii(12, "fmt "); d.setUint32(16, 16, true); d.setUint16(20, 1, true);
  d.setUint16(22, 1, true); d.setUint32(24, 24_000, true); d.setUint32(28, 48_000, true);
  d.setUint16(32, 2, true); d.setUint16(34, 16, true); ascii(36, "data");
  d.setUint32(40, samples.length, true); output.set(samples, 44);
  return new Blob([output], { type: "audio/wav" });
}

function silence(seconds) {
  // Even byte count for 16-bit PCM; clamp locally to avoid huge allocations.
  return new Uint8Array(Math.round(Math.max(0, Math.min(seconds, 30)) * 24_000) * 2);
}

export function assembleListeningExam(lines, clipBytes, options = {}) {
  const repeats = options.repeats === 2 ? 2 : 1;
  const lineGap = Math.max(0, Math.min(Number(options.lineGap ?? 0.65), 5));
  const repeatGap = Math.max(0, Math.min(Number(options.repeatGap ?? 6), 30));
  const onePass = [];
  let index = 0;
  for (const line of lines) {
    if (line.type === "pause") onePass.push(silence(line.seconds));
    else {
      if (!clipBytes[index]) throw new Error("One of the generated lines is missing.");
      onePass.push(readClip(clipBytes[index]));
      index += 1;
      if (lineGap) onePass.push(silence(lineGap));
    }
  }
  if (!index) throw new Error("The transcript has no spoken lines.");
  const intro = options.soundscape?.scene && options.soundscape.scene !== "none" && options.soundscape.bell !== false && Number(options.soundscape.volume ?? 0.14) > 0 ? [silence(2.35)] : [];
  const pieces = repeats === 2 ? [...intro, ...onePass, silence(repeatGap), ...onePass] : [...intro, ...onePass];
  const size = pieces.reduce((total, part) => total + part.length, 0);
  if (size > 50_000_000) throw new Error("Audio is too long to assemble in the browser.");
  const samples = new Uint8Array(size);
  let offset = 0;
  for (const piece of pieces) { samples.set(piece, offset); offset += piece.length; }
  return writeWav(options.soundscape ? applySoundscapeToPcm(samples, options.soundscape) : samples);
}

export function base64WavToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
