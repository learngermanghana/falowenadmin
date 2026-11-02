import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('src/components/MusicLyricsVideoStudio.jsx','utf8');
const loader=source.slice(source.indexOf('  async function loadTracks(){'),source.indexOf('  async function exportVideo(){'));
async function run(fetch){
  const state={};
  const context={fetch,AbortSignal,audioFilenameObjectKey:k=>k.startsWith('music/'),...Object.fromEntries(['LoadingTracks','CatalogError','CatalogLoaded','Tracks'].map(k=>['set'+k,v=>state[k]=v]))};
  await vm.runInNewContext(loader+';loadTracks()',context);
  return state;
}
test('catalog failure and retry provide visible feedback without clearing the uploaded audio',async()=>{
  const failed=await run(async()=>{throw Error('Failed to fetch');});
  assert.match(failed.CatalogError,/Could not load Falowen songs/);
  assert.equal(failed.LoadingTracks,false);
  assert.equal(failed.CatalogLoaded,false);
  const track={id:'b1',objectKey:'music/b1/day-15/song.mp3',audioUrl:'https://www.falowen.app/api/music?track=b1'};
  const success=await run(async(url,options)=>{assert.ok(options.signal);return {ok:true,json:async()=>({ok:true,tracks:[track]})};});
  assert.equal(success.Tracks.length,1);
  assert.equal(success.CatalogError,'');
  assert.equal(success.CatalogLoaded,true);
  assert.equal(success.LoadingTracks,false);
  assert.ok(source.indexOf('{catalogError && <p role="alert"')>source.indexOf('Load available Falowen songs'));
});
test('empty catalog is distinguishable from a failed or malformed response',async()=>{
  const empty=await run(async()=>({ok:true,json:async()=>({ok:true,tracks:[]})}));
  assert.equal(empty.CatalogLoaded,true);
  assert.equal(empty.Tracks.length,0);
  const malformed=await run(async()=>({ok:true,json:async()=>({ok:false})}));
  assert.equal(malformed.CatalogLoaded,false);
  assert.match(malformed.CatalogError,/unavailable/);
});
