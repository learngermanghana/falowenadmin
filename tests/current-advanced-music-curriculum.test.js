import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {getStudioCourseCatalog} from '../src/utils/hoerenCourseCatalog.js';
import {getReusableSongDrafts} from '../src/data/reusableMusicSongbook.js';
import {B2_CANONICAL_MUSIC_LESSONS} from '../src/data/b2CanonicalMusicCurriculum.js';
import {C1_CANONICAL_TITLES} from '../src/data/c1CanonicalCurriculum.js';
import {getB2PresenterSlide} from '../src/data/b2PresenterSlides.js';
import {isRetiredAdvancedMusicDraft} from '../src/utils/supersededAdvancedMusic.js';

test('all 56 B2/C1 studio days match the current Course Book curriculum',()=>{
 for(const level of ['B2','C1']){
  const lessons=getStudioCourseCatalog(level);
  assert.equal(lessons.length,28);
  assert.deepEqual(lessons.map(l=>l.day),Array.from({length:28},(_,i)=>i+1));
  const songs=getReusableSongDrafts(level);
  for(const [i,lesson] of lessons.entries()){
   const expected=level==='B2'?B2_CANONICAL_MUSIC_LESSONS[i].title:C1_CANONICAL_TITLES[i];
   assert.equal(lesson.germanTitle,expected);
   assert.equal(songs[i].assignmentKey,lesson.assignmentKey);
   assert.equal(songs[i].curriculumTopic,expected);
   if(level==='B2'){
    assert.equal(lesson.chapter,B2_CANONICAL_MUSIC_LESSONS[i].chapter);
    assert.ok(getB2PresenterSlide(lesson.assignmentKey).title.endsWith(expected));
   }
   assert.equal(isRetiredAdvancedMusicDraft(lesson.assignmentKey,songs[i].lyrics),false);
  }
 }
 assert.match(getStudioCourseCatalog('B2')[0].title,/Umweltschutz/);
 assert.match(getReusableSongDrafts('B2')[0].lyrics,/Verpackung/);
 assert.doesNotMatch(getReusableSongDrafts('B2')[0].lyrics,/Identität|Ausweis/);
});

test('build patch keeps canonical metadata rather than restoring a legacy dictionary',()=>{
 const before=readFileSync('src/data/courseDictionary.js','utf8');
 execFileSync(process.execPath,['scripts/patchB2ExamDomainRedesign.mjs']);
 assert.equal(readFileSync('src/data/courseDictionary.js','utf8'),before);
});

test("retired cloud lyrics are rejected while custom edits and current C1 remain available",()=>{
 const retired="[Verse 1]\nIm Ausweis steht mein voller Name,\ndoch keiner kennt die ganze Geschichte.\nIm Spiegel seh ich alte Spuren,\ndie man von außen selten sieht.\n\n[Chorus]\nIch bin mehr als ein einziges Wort,\nmehr als das Bild, das andere sehen.\nWas mich geprägt hat, bleibt ein Teil von mir,\ndoch wohin ich gehe, darf ich wählen.\n\n[Verse 2]\nZu Hause sprach ich anders als im Büro,\npasste den Ton den Räumen an.\nBis jemand fragte: „Wer bist du wirklich?“\nIch musste lachen und schwieg dann.\nVielleicht entsteht Identität dort,\nwo Widersprüche nebeneinander wohnen.\n\n[Chorus]\nIch bin mehr als ein einziges Wort,\nmehr als das Bild, das andere sehen.\n\n[Outro]\nHeute muss ich mich nicht festlegen.\nMein eigener Name klingt weit genug.";
 assert.equal(isRetiredAdvancedMusicDraft("B2-1.1",retired),true);
 assert.equal(isRetiredAdvancedMusicDraft("B2-1.1",retired+"\nMy own edited ending."),false);
 assert.equal(isRetiredAdvancedMusicDraft("C1 1",retired),false);
});
