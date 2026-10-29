import { useCallback, useEffect, useMemo, useState } from 'react';

export default function useLobbySlideshow(slides, {paused=false,started=false,intervalMs=14000,sessionKey=""}={}) {
  const idsKey=JSON.stringify(slides.map(slide=>slide.id));
  const ids=useMemo(()=>JSON.parse(idsKey),[idsKey]);
  const [selectedId,setSelectedId]=useState(null);
  const index=Math.max(0,ids.indexOf(selectedId));
  const active=slides[index] || null;
  const lyricsHeld=active?.id==='lyrics';
  useEffect(()=>{setSelectedId(null);},[sessionKey]);
  const setIndex=useCallback(value=>setSelectedId(current=>{
    const oldIndex=Math.max(0,ids.indexOf(current));
    const next=typeof value==='function'?value(oldIndex):value;
    return ids[((next%ids.length)+ids.length)%ids.length] || null;
  }),[ids]);
  useEffect(()=>{
    if(selectedId && !ids.includes(selectedId))setSelectedId(ids[0] || null);
  },[ids,selectedId]);
  useEffect(()=>{
    if(started || paused || lyricsHeld || ids.length<=1)return undefined;
    const timer=window.setInterval(()=>setIndex(i=>i+1),intervalMs);
    return ()=>window.clearInterval(timer);
  },[started,paused,lyricsHeld,ids,intervalMs,setIndex]);
  return {index,active,setIndex,lyricsHeld};
}
