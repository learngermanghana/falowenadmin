// Local, free editorial checklist. Structural detection cannot judge whether
// lyrics actually tell a compelling story; the teacher remains the reviewer.
const STORY_SECTIONS = ['Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Outro'];

export function musicStorySections(lyrics = '') {
  const content = String(lyrics || '');
  const sections = {};
  const marker = /\[(Verse 1|Chorus|Verse 2|Bridge|Outro)\]/g;
  let last = null, match;
  while ((match = marker.exec(content))) {
    if (last) {
      const text = content.slice(last.end, match.index).trim();
      // The chorus deliberately occurs twice; display its first occurrence.
      if (text && !sections[last.name]) sections[last.name] = text;
    }
    last = { name: match[1], end: marker.lastIndex };
  }
  if (last) {
    const text = content.slice(last.end).trim();
    if (text && !sections[last.name]) sections[last.name] = text;
  }
  return sections;
}

function excerpt(text) {
  return String(text || '').split('\n').map(line => line.trim())
    .filter(Boolean).slice(0, 4).join(' / ');
}

export function reviewMusicStory(lyrics = '') {
  const sections = musicStorySections(lyrics);
  const issues = [];
  if (!sections['Verse 1']) issues.push('Add a Verse 1 that introduces someone, a place and a reason to act.');
  if (!sections['Verse 2']) issues.push('Add a Verse 2 where the situation changes or someone makes a decision.');
  if (!sections.Chorus) issues.push('Add a chorus with a meaningful emotional hook, not just a list of lesson words.');
  if (!sections.Outro) issues.push('End the situation in an Outro: what happened to the characters?');
  if (/(?:bei|mit|durch)\s+Falowen\b/i.test(sections.Outro || '')) {
    issues.push('The outro sounds like a Falowen advertisement instead of the end of the story.');
  }
  const numberDrill = (sections.Chorus || '').match(/\b(?:euro|uhr|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\b/gi) || [];
  if (numberDrill.length >= 3) {
    issues.push('The chorus repeats several numbers or prices. Check whether it also expresses what the character feels or wants.');
  }

  const stages = [
    { title: 'Person, place and goal', question: 'Who is here, and what do they need?', text: excerpt(sections['Verse 1']) },
    { title: 'Emotional hook', question: 'What line makes a listener care?', text: excerpt(sections.Chorus) },
    { title: 'A meaningful change', question: 'What happens beyond describing the topic?', text: excerpt(sections['Verse 2']) },
    { title: 'Choice or response', question: 'What does someone do to handle it? A bridge is optional.', text: excerpt(sections.Bridge || sections['Verse 2']) },
    { title: 'Real-world outcome', question: 'How does this particular situation end?', text: excerpt(sections.Outro) },
  ];

  return {
    stages,
    issues,
    sectionCount: STORY_SECTIONS.filter(section => Boolean(sections[section])).length,
    hasBridge: Boolean(sections.Bridge),
    hasBasicStructure: ['Verse 1', 'Verse 2', 'Chorus', 'Outro'].every(name => Boolean(sections[name])),
  };
}
