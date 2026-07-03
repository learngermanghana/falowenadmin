export const PIANO_BAR_INTERVAL_MS = 4600;

const WAITING_MUSIC_SRC = "/The%20Most%20Beautiful%20%26%20Relaxing%20Piano%20Pieces%20(Vol.%201).mp3";
const players = new WeakMap();

export function schedulePianoBar(context, destination) {
  if (!context || !destination || players.has(context)) return;

  const audio = new Audio(WAITING_MUSIC_SRC);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 1;

  const source = context.createMediaElementSource(audio);
  source.connect(destination);
  players.set(context, { audio, source });

  const stopWhenContextCloses = () => {
    if (context.state !== "closed") return;
    audio.pause();
    audio.currentTime = 0;
    players.delete(context);
  };

  context.addEventListener("statechange", stopWhenContextCloses);
  audio.play().catch(() => {
    context.removeEventListener("statechange", stopWhenContextCloses);
    players.delete(context);
  });
}
