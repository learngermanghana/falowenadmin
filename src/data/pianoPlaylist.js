export const waitingMusicPlaylist = Object.freeze([
  {
    id: "relaxing-saxophone-love-songs",
    title: "Relaxing Saxophone Love Songs",
    src: "/Most%20Beautiful%20Saxophone%20Playlist%20Relaxing%20Love%20Songs%20(Kenny%20G%20Style%20Ambient)(1).mp3",
  },
]);

// Keep the legacy exports while the check-in display migrates from the old
// generated-piano naming. These now point at real audio tracks in /public.
export const pianoPlaylist = waitingMusicPlaylist;
export const pianoPieces = waitingMusicPlaylist.map((track) => [track.title, [], []]);
