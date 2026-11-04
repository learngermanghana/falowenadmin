import test from 'node:test';import assert from 'node:assert/strict';
import {drawMusicVideoFrame,VIDEO_EXPORT_PRESETS} from '../src/utils/musicLyricsVideo.js';
function context(width,height){const text=[],rects=[],images=[];return {canvas:{width,height},text,rects,images,clearRect(){},createLinearGradient(){return {addColorStop(){}};},fillRect(...args){rects.push({args,color:this.fillStyle});},drawImage(...args){images.push(args);},beginPath(){},arc(){},fill(){},measureText(value){return {width:String(value).length*(parseFloat(this.font?.match(/[\d.]+px/)?.[0])||20)*.55};},fillText(value,x,y,max){text.push({value,x,y,max,font:this.font});}};}
for(const preset of Object.values(VIDEO_EXPORT_PRESETS))test(preset.label+' draws safe title, German, English and artwork layers',()=>{
 const ctx=context(preset.width,preset.height);
 const scenes=[{start:0,lines:['Das Wochenende kann beginnen.','Wir fahren zusammen an den See.','Heute haben wir endlich frei.'],lineCues:[{start:0,end:2},{start:3,end:5},{start:6,end:8}],englishLines:['The weekend can begin.','We are going to the lake together.','Today we are finally free.']}];
 drawMusicVideoFrame(ctx,{title:'Endlich Wochenende',level:'A2',day:21,artwork:{width:1000,height:700},scenes,time:3.5,duration:170});
 assert.equal(ctx.images.length,1);
 const english=ctx.text.find(row=>row.value==='We are going to the lake together.');assert.ok(english);
 assert.ok(ctx.text.filter(row=>scenes[0].lines.includes(row.value)).every(row=>row.y<english.y));
 assert.ok(ctx.text.every(row=>row.y>0 && row.y<preset.height && row.max<=preset.width || row.value==='F'));
 assert.ok(ctx.rects.some(row=>row.color==='rgba(181,239,195,.14)'));
 const gap=context(preset.width,preset.height);drawMusicVideoFrame(gap,{scenes,time:2.5});
 assert.ok(!gap.rects.some(row=>row.color==='rgba(181,239,195,.14)'));
 assert.ok(!gap.text.some(row=>row.value==='ENGLISH'));
});
