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
    id: 'melodic-house',
    label: 'Melodic chill house · pulsing beat',
    description: 'Steady 4/4 pulse, atmospheric acoustic piano chords, deep melodic bass and gentle flute accents.',
    direction: 'Original melodic chill house / soft deep house around 124 BPM in C minor, 4/4. Use a four-on-the-floor kick on beats 1, 2, 3, 4; gentle clap on 2 and 4; restrained offbeat hi-hats and a rounded syncopated bass line with controlled 808-style sub support. Main four-bar progression: Cm9 – Abmaj7 – Ebadd9 – Bbsus4 resolving to Bb. Warm acoustic piano voicings and spacious pads build the atmosphere, with soft flute answers between lines. Open with a minimal pulse, build into a broad memorable sung chorus, introduce melodic and harmonic variation through the second half, then resolve the final progression. Make an original melody, not an imitation of any existing track.'
  },
  {
    id: 'anthemic-nostalgia',
    label: 'Anthemic nostalgia · melodic hip-hop/pop',
    description: 'Cinematic rising harmony, emotional sung chorus, intimate rhythmic verses and a memorable lift.',
    direction: 'Write an original cinematic nostalgia anthem blending melodic hip-hop, soft pop and contemporary soul, 72 BPM with optional double-time 144 BPM percussion feel, in E minor. Main progression: Em7 – Cmaj9 – Gadd9 – Dsus4 to D, with an alternate Am7 – Cmaj9 – Dsus4 pre-chorus. Start with atmospheric solo acoustic piano and distant pads, then introduce warm sub-bass, crisp restrained half-time hip-hop kick/snare and subtle rhythmic guitar. Keep short conversational verses and a soaring, emotional, clearly sung chorus with a wider piano register and strings/pads. Use dynamic contrast and a meaningful harmonic turnaround; close with a quiet, resolved piano/flute outro. Do not copy any existing chorus, melody, lyrics or sampled recording.'
  },
  {
    id: 'nostalgic-piano-pop',
    label: 'Nostalgic piano pop · flowing chords',
    description: 'An eight-chord emotional piano journey with a gentle rhythm and gradually richer chorus.',
    direction: 'Create an original reflective acoustic piano pop song at 88 BPM in G major. Use a gently flowing eight-chord progression: Gadd9 – D/F# – Em7 – Bm7 – Cmaj7 – G/B – Am7 – Dsus4 resolving to D. Play a natural close-miked acoustic grand piano with graceful left-hand movement and light right-hand arpeggios. Add delicate warm bass, soft rim-click or brushed snare, barely-there atmospheric pads and short breathy flute replies only in gaps between vocal lines. Begin intimate, introduce a quietly memorable verse melody, let the chorus open emotionally with sustained notes and wide piano voicings, then add restrained textures in later sections before a complete harmonic resolution. Keep the vocals vulnerable and unhurried; avoid copying any existing song melody or hook.'
  },
  {
    id: 'fingerstyle-guitar',
    label: 'Fingerstyle acoustic · intimate storytelling',
    description: 'Warm steel-string fingerpicking, emotional adult singer-songwriter melody, no drums.',
    direction: 'Original intimate singer-songwriter acoustic folk-pop, 76 BPM in D major. Main four-bar progression: Dadd9 – A/C# – Bm7 – Gmaj7, with a gentle Em7 – Gadd9 – Asus4 – A pre-chorus lift. Record a real, close, warm steel-string acoustic guitar with a moving fingerpicked bass line and understated high-string arpeggios. Begin alone with guitar and one emotionally honest lead voice; use a second soft guitar harmony only for the last chorus. Avoid drums, handclaps, bells, novelty percussion, group chants and childlike singalong rhythms. Let verse phrasing breathe, write a mature conversational melodic hook and finish with a softly resolved acoustic cadence.'
  },
  {
    id: 'guitar-piano-duet',
    label: 'Acoustic guitar + piano · emotional pop',
    description: 'Moving guitar strums, expressive acoustic piano chords, rich chorus without excess drums.',
    direction: 'Original warm contemporary acoustic pop with two complementary live instruments, 84 BPM in C major. Main eight-bar progression: Cadd9 – G/B – Am7 – Fmaj7 – C/E – Dm7 – Gsus4 – G. Play a restrained steel-string guitar with soft picked notes in the verses and broad, unhurried strums in the chorus; add a close-miked acoustic piano using inversions and gentle answering arpeggios. Sparse warm bass enters for the second verse; light brushed percussion only in the final chorus. Develop a moving verse to pre-chorus to cathartic chorus with natural rising melody, adult emotional color and a beautiful resolution. No nursery-rhyme bounce, childlike claps or forced end-word rhymes.'
  },
  {
    id: 'guitar-neo-soul',
    label: 'Soul guitar · mellow R&B groove',
    description: 'Clean electric guitar chord extensions, rich harmony and a laid-back bass-and-snare pocket.',
    direction: 'Original mellow guitar-led neo-soul / soft R&B at 82 BPM in A minor. Main four-bar progression: Am9 – D13 – Gmaj9 – Cmaj7, with Bm7b5 – E7sus4 – E7 as an occasional turnaround back to Am9. Clean warm electric guitar plays sophisticated muted chord stabs, melodic fills in spaces between the vocals and soft upper-register voicings. Support with rounded melodic electric bass, subtle rim snare and pocket kick, occasional understated acoustic piano and short breathy flute replies. Verse intimate and rhythmic, chorus emotionally wider with extended chords and expressive adult melodic phrasing. No childish call-and-response, novelty whistles or busy guitar solos over lyrics.'
  },
  {
    id: 'afro-acoustic-guitar',
    label: 'Acoustic Afro-soul · guitar groove',
    description: 'Beautiful plucked guitar, subtle syncopated African rhythm, warm bass and smooth vocals.',
    direction: 'Original mellow acoustic Afro-soul / contemporary African guitar pop at 94 BPM in G major. Main four-bar progression: Gmaj9 – D/F# – Em7 – Cadd9, with Am7 – Dsus4 – D as a graceful turnaround. Lead with an organic acoustic guitar playing an intricate melodic picking figure, then gentle syncopated guitar strums, rounded bass and a tasteful soft shaker and rim percussion groove. Give a few expressive flute responses to the guitar motif, but never drown the warm single lead singer. Build the chorus with a wider guitar strum and subtle piano support; keep the groove refined, soulful, human and adult rather than a nursery classroom singalong or chant.'
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
