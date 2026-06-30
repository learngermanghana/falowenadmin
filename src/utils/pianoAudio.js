export const PIANO_BAR_INTERVAL_MS = 4600;

function note(context, destination, frequency, startsAt, velocity, duration) {
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3800, startsAt);
  filter.frequency.exponentialRampToValueAtTime(1400, startsAt + Math.min(duration, 1.2));
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(0.32 * velocity, startsAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.08 * velocity, startsAt + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
  filter.connect(gain);
  gain.connect(destination);
  [1, 2, 3.01].forEach((ratio, index) => {
    const oscillator = context.createOscillator();
    const level = context.createGain();
    oscillator.type = index ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency * ratio, startsAt);
    level.gain.setValueAtTime([0.18, 0.05, 0.02][index], startsAt);
    oscillator.connect(level);
    level.connect(filter);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration + 0.05);
  });
}

export function schedulePianoBar(context, destination, bar) {
  const startsAt = context.currentTime + 0.25;
  const beat = 0.52;
  [0, 2, 1, 3, 1, 2, 3, 2].forEach((chordIndex, index) =>
    note(context, destination, bar.chord[chordIndex], startsAt + (index * beat), index % 4 === 0 ? 0.9 : 0.55, 1.55));
  bar.melody.forEach((frequency, index) => {
    if (frequency) note(context, destination, frequency, startsAt + 0.12 + (index * beat), 0.45, 1.0);
  });
}
