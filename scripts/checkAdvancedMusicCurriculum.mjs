import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {B2_CANONICAL_MUSIC_LESSONS} from '../src/data/b2CanonicalMusicCurriculum.js';
import {C1_CANONICAL_TITLES} from '../src/data/c1CanonicalCurriculum.js';
const learner=process.argv[2];
if(!learner)throw Error('Usage: node scripts/checkAdvancedMusicCurriculum.mjs /path/to/falowenexamtrainer');
const source=async path=>import(pathToFileURL(resolve(learner,path)));
const b2=await source('web/src/data/b2LessonContentAlignment.js');
const c1=await source('web/src/data/c1ContentRefresh.js');
assert.deepEqual(B2_CANONICAL_MUSIC_LESSONS.map(({day,chapter,title})=>({day,chapter,title})),
 Object.values(b2.B2_LESSON_CONTENT_ALIGNMENT).map(({day,chapter,title})=>({day,chapter,title})));
assert.deepEqual(C1_CANONICAL_TITLES,c1.C1_CANONICAL_TITLES);
console.log('All 56 B2/C1 music lesson topics match the learner Course Book.');
