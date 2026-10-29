// Free, deterministic production directions for the existing Google Lyria request.
// Chord changes, tempo and instrument balance are creative guidance, not guarantees
// or independent audio-stem controls. No new API, storage or backend work.
export const MUSIC_PRODUCTION_PROFILES = Object.freeze([
  { id: 'auto', label: 'Original lesson arrangement (automatic)', description: 'Keep the curated genre for this lesson.' },
  {
    id: 'chill-808',
    label: 'Chill 808 · piano + flute',
    description: 'Warm sub-bass, relaxed modern beat, acoustic piano chords and airy flute replies.',
    direction: 'Contemporary mellow chill R&B / lo-fi Afro-fusion; 82 BPM in D minor. Main four-bar progression: Dm9 – Bbmaj7 – Fmaj9 – Cadd9. Use warm acoustic piano for voiced extended chords, intimate clean single lead vocal, a controlled tuned 808 sub-bass following chord roots with occasional passing notes, tight muted kick, gentle rim/snare on the backbeat, restrained shuffled hi-hats, and a breathy flute motif replying to vocal phrases. Keep the 808 rounded and present without masking the words; no aggressive trap drops, distortion, booming bass or frantic rap. Add a tasteful harmonic lift in the chorus and a brief piano/flute turnaround in the bridge.'
  },
  {
    id: 'piano-flute',
    label: 'Acoustic piano · flute ballad',
    description: 'Expressive real-piano harmony, gentle flute melodies, spacious arrangement.',
    direction: 'Warm intimate acoustic piano and airy expressive flute soul ballad; 78 BPM in C major. Main four-bar progression: Am7 – Fmaj7 – Cadd9 – Gsus4 resolving to G. Open with solo felt acoustic piano, add a delicate flute answer between lines, then subtle warm bass and brushed percussion for the chorus. Use tasteful inversions and smooth voice-leading; make the second chorus fuller without louder percussion. Human, emotional, adult contemporary melody, never a school chant.'
  },
  {
    id: 'neo-soul',
    label: 'Modern neo-soul · rich chords',
    description: 'Sophisticated seventh/ninth chords, Rhodes or piano, gentle pocket groove.',
    direction: 'Smooth contemporary neo-soul / relaxed R&B at 86 BPM in D major. Main four-bar progression: Em9 – A13 – Dmaj9 – Gmaj7. Rich but uncluttered electric and acoustic piano voicings, syncopated soft bass guitar, light swung drums, occasional muted guitar and short expressive flute fills. Give the chorus a memorable uplifting melody over the same harmonic center, with subtle inversions and a tasteful turnaround. One warm articulate lead singer; mature songwriting rather than rhyming drills.'
  },
  {
    id: 'afro-soul',
    label: 'Modern Afro-soul · mellow groove',
    description: 'Gentle contemporary African rhythmic pulse, piano, guitar and flute accents.',
    direction: 'Modern warm Afro-soul / mellow Afro-pop at 96 BPM in G major. Main four-bar progression: Gmaj7 – Em7 – Cmaj7 – Dadd9. Lead with acoustic piano and warm rhythmic guitar; restrained syncopated percussion and a steady rounded bass pulse create movement. Introduce a light flute counter-melody in the second verse and add fuller harmony in the chorus without crowding the lead. Natural, professional song production, not nursery-rhyme repetition or party drums.'
  },
  {
    id: 'piano-pop',
    label: 'Acoustic piano · modern pop',
    description: 'Clear pop structure, warm piano, tasteful bass and gentle percussion.',
    direction: 'Acoustic piano-driven melodic adult pop at 88 BPM in G major. Main four-bar progression: G – D/F# – Em7 – Cadd9. Use a close recorded acoustic grand piano, gentle bass guitar, occasional acoustic guitar textures and delicate brushed drums. A memorable but not childish melodic refrain, a lifted second chorus, occasional suspended chords and a clear resolved piano ending. No forced rhyming or monotonous identical loops.'
  }
]);
export function getMusicProductionProfile(id = 'auto') {
  return MUSIC_PRODUCTION_PROFILES.find(profile => profile.id === id)
    || MUSIC_PRODUCTION_PROFILES[0];
}
