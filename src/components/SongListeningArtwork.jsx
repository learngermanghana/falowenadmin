import { useEffect, useState } from 'react';

const ARTWORK_MAP = 'https://music.falowen.app/music/covers/artwork-map.json';
let artworkMapPromise;
function loadArtworkMap() {
  if (!artworkMapPromise) {
    artworkMapPromise = fetch(ARTWORK_MAP).then(response => {
      if (!response.ok) throw new Error('Artwork unavailable');
      return response.json();
    }).catch(error => { artworkMapPromise = null; throw error; });
  }
  return artworkMapPromise;
}

// Use the same public artwork map as Falowen Music, keyed by the actual MP3.
export default function SongListeningArtwork({ objectKey, title, description, level, day }) {
  const [artwork, setArtwork] = useState('');
  useEffect(() => {
    let active = true;
    setArtwork('');
    if (!objectKey || !['A1', 'A2', 'B1'].includes(String(level || '').toUpperCase())) return () => { active = false; };
    loadArtworkMap().then(map => {
      const name = map?.byObjectKey?.[objectKey] || map?.default;
      if (active && typeof name === 'string' && /^[a-z-]+$/.test(name))
        setArtwork('https://music.falowen.app/music/covers/photos/' + name + '.jpg');
    }).catch(() => {});
    return () => { active = false; };
  }, [objectKey, level]);
  if (!objectKey || !['A1', 'A2', 'B1'].includes(String(level || '').toUpperCase())) return null;
  return <div className="published-song-lesson__listening-art">
    {artwork && <img src={artwork} alt={`Cover: ${title}`} onError={() => setArtwork('')} />}
    <div>
      <span>FALOWEN MUSIC · {level} · TAG {day}</span>
      <h4>{title}</h4>
      <p>{description || 'Ein Falowen-Lernlied zum Hören und Deutschlernen.'}</p>
    </div>
  </div>;
}
