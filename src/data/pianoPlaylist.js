const chords = {
  C: [130.81, 261.63, 329.63, 392], Am: [110, 220, 261.63, 329.63],
  F: [87.31, 174.61, 220, 261.63], G: [98, 196, 246.94, 293.66],
  Dm: [73.42, 146.83, 174.61, 220], Em: [82.41, 164.81, 196, 246.94],
  Bb: [116.54, 233.08, 293.66, 349.23], D: [73.42, 146.83, 185, 220],
  Bm: [61.74, 123.47, 146.83, 185], A: [55, 110, 138.59, 164.81],
};

const melodies = {
  hopeful: [659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, null],
  warm: [659.25, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, null],
  calm: [698.46, 659.25, 587.33, 523.25, 587.33, 659.25, 698.46, null],
  lift: [783.99, 880, 987.77, 880, 783.99, 659.25, 587.33, null],
  bright: [1046.5, 987.77, 880, 783.99, 880, 987.77, 1046.5, null],
  reflective: [880, 783.99, 659.25, 587.33, 659.25, 523.25, 493.88, null],
  open: [587.33, 659.25, 739.99, 880, 739.99, 659.25, 587.33, null],
  home: [783.99, 659.25, 587.33, 523.25, 587.33, 659.25, 523.25, null],
};

export const pianoPieces = [
  ["Morning Light", ["C", "Am", "F", "G", "C", "Am", "F", "G"], ["hopeful", "warm", "calm", "lift", "bright", "warm", "calm", "home"]],
  ["Open Road", ["G", "Em", "C", "D", "G", "Em", "C", "D"], ["lift", "warm", "hopeful", "open", "bright", "reflective", "hopeful", "home"]],
  ["Quiet Courage", ["F", "Dm", "Bb", "C", "F", "Dm", "Bb", "C"], ["calm", "reflective", "open", "hopeful", "bright", "warm", "calm", "home"]],
  ["New Horizons", ["D", "Bm", "G", "A", "D", "Bm", "G", "A"], ["open", "warm", "lift", "bright", "hopeful", "reflective", "lift", "home"]],
  ["Evening Glow", ["Am", "F", "C", "G", "Am", "F", "C", "G"], ["reflective", "calm", "hopeful", "home", "bright", "warm", "hopeful", "home"]],
  ["Bright Steps", ["C", "G", "Am", "F", "C", "G", "Am", "F"], ["hopeful", "lift", "bright", "calm", "bright", "open", "warm", "home"]],
];

export const pianoPlaylist = pianoPieces.flatMap(([title, progression, themes]) =>
  progression.map((name, index) => ({ title, chord: chords[name], melody: melodies[themes[index]] })),
);
