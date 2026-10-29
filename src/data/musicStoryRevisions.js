// New-recording lyric overlays. Do not alter the original course songbook:
// teaching slides and approved recordings may depend on its exact words.
const CAFE_BUS_STORY = `[Verse 1]
Es ist halb drei im Café.
Mia schaut auf ihre Uhr.
"Mein Bus fährt um drei.
Können wir bitte zahlen?"

[Chorus]
"Keine Sorge, Mia,
ich bleibe noch bei dir.
Wir schaffen das zusammen.
Ich helfe dir, versprochen."

[Verse 2]
Der Kellner bringt die Rechnung.
"Zwei Tees kosten vier Euro.
Der Kuchen kostet drei Euro.
Zusammen sind es sieben."

[Bridge]
Mia sucht in ihrer Tasche.
"Oh nein, mein Geld ist nicht da!"
"Ich bezahle heute für uns."
Sie sagt: "Danke, das ist nett!"

[Chorus]
"Keine Sorge, Mia,
ich bleibe noch bei dir.
Wir schaffen das zusammen.
Ich helfe dir, versprochen."

[Outro]
Wir laufen zur Haltestelle.
Der Bus steht noch da.
Mia steigt ein und winkt mir.
"Bis morgen! Vielen Dank!"`;

export const MUSIC_STORY_REVISION_LABEL = 'Story-first draft · new recording only';

export function revisedMusicStoryLyrics(original, assignmentKey) {
  const input = String(original || '').trimEnd();
  if (!input) return input;
  if (assignmentKey === 'A1-3.5') return CAFE_BUS_STORY;

  const lines = input.split('\n');
  const outroIndex = lines.lastIndexOf('[Outro]');
  if (outroIndex < 0) return input;

  // Strip the single generic promo ending only; the named plot and original
  // released audio remain available from the unmodified songbook entry.
  for (let i = lines.length - 1; i > outroIndex; i--) {
    if (lines[i].includes('Falowen')) {
      if (assignmentKey === 'A1-2' && /Eins, zwei, drei/.test(lines[i])) {
        lines[i] = 'Jetzt kenne ich deine Nummer.';
      } else {
        lines.splice(i, 1);
      }
      break;
    }
  }
  return lines.join('\n').trimEnd();
}
