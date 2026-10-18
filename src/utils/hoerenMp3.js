// MP3 export happens on the user's device with the open-source lamejs encoder.
// No additional Gemini usage or audio upload. Pinned version: lamejs 1.2.1 (LGPL-3.0).
const ENCODER_URL = "https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js";
let encoderPromise;

function getEncoder() {
  if (window.lamejs?.Mp3Encoder) return Promise.resolve(window.lamejs.Mp3Encoder);
  if (!encoderPromise) {
    encoderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = ENCODER_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (window.lamejs?.Mp3Encoder) resolve(window.lamejs.Mp3Encoder);
        else reject(new Error("MP3 encoder did not initialise. Download WAV instead."));
      };
      script.onerror = () => reject(new Error("MP3 encoder could not load. Check your connection or download WAV."));
      document.head.appendChild(script);
    }).catch((error) => { encoderPromise = null; throw error; });
  }
  return encoderPromise;
}

export async function encodeWavAsMp3(blob) {
  if (!(blob instanceof Blob)) throw new Error("Generate the WAV first.");
  const [Mp3Encoder, buffer] = await Promise.all([getEncoder(), blob.arrayBuffer()]);
  const data = new DataView(buffer);
  const tag = (offset, n) => String.fromCharCode(...new Uint8Array(buffer, offset, n));
  if (buffer.byteLength < 44 || tag(0, 4) !== "RIFF" || tag(8, 4) !== "WAVE" ||
      data.getUint16(22, true) !== 1 || data.getUint32(24, true) !== 24000 ||
      data.getUint16(34, true) !== 16 || tag(36, 4) !== "data") {
    throw new Error("Expected the 24 kHz mono WAV created by Falowen.");
  }
  const audioLength = data.getUint32(40, true);
  if (audioLength > buffer.byteLength - 44 || audioLength % 2) throw new Error("Invalid WAV sound data.");
  const samples = new Int16Array(buffer, 44, audioLength / 2);
  const encoder = new Mp3Encoder(1, 24000, 96);
  const chunks = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const encoded = encoder.encodeBuffer(samples.subarray(i, Math.min(samples.length, i + 1152)));
    if (encoded.length) chunks.push(new Uint8Array(encoded));
  }
  const last = encoder.flush();
  if (last.length) chunks.push(new Uint8Array(last));
  if (!chunks.length) throw new Error("No MP3 data was created.");
  return new Blob(chunks, { type: "audio/mpeg" });
}
