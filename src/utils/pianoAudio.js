const players = new WeakMap();

function validTracks(playlist = []) {
  return Array.isArray(playlist)
    ? playlist.filter((track) => track && typeof track.src === "string" && track.src.trim())
    : [];
}

function cleanupPlayer(context) {
  const player = players.get(context);
  if (!player) return;

  player.stopped = true;
  player.audio.removeEventListener("ended", player.handleEnded);
  player.audio.removeEventListener("error", player.handleError);
  context.removeEventListener("statechange", player.handleContextState);
  player.audio.pause();
  player.audio.currentTime = 0;
  player.audio.removeEventListener("timeupdate", player.handleTimeUpdate);
  player.source?.disconnect();
  players.delete(context);
}

export function stopWaitingMusicPlaylist(context) {
  if (!context) return;
  cleanupPlayer(context);
}

export async function skipWaitingMusicPlaylist(context) {
  if (!context) return null;
  const player = players.get(context);
  if (!player || player.stopped || typeof player.playTrack !== "function") return null;
  if (player.tracks.length <= 1) return player.tracks[0] || null;

  await player.playTrack(player.index + 1);
  return player.tracks[player.index] || null;
}

export async function startWaitingMusicPlaylist(
  context,
  destination,
  { playlist = [], onTrackChange = () => {}, onError = () => {}, onTimeUpdate = () => {} } = {},
) {
  if (!context || !destination) throw new Error("Waiting room audio is not available.");

  const tracks = validTracks(playlist);
  if (!tracks.length) throw new Error("No waiting room music tracks are configured.");

  const existing = players.get(context);
  if (existing) return existing;

  const audio = new Audio();
  audio.preload = "auto";
  // Private signed classroom songs use native media playback. They must not
  // depend on public-bucket CORS or expose the private bucket to Web Audio.
  const nativePlayback = tracks.every(track => track.nativePlayback === true);
  if (!nativePlayback) audio.crossOrigin = "anonymous";
  audio.volume = 1;
  audio.playsInline = true;

  const source = nativePlayback ? null : context.createMediaElementSource(audio);
  source?.connect(destination);
  const syncNativeVolume = () => {
    if (nativePlayback) audio.volume = Math.min(1, Math.max(0, Number(destination.gain?.value ?? 1)));
    onTimeUpdate(audio.currentTime);
  };

  const player = {
    audio,
    source,
    tracks,
    index: 0,
    stopped: false,
    failedTracks: 0,
    handleEnded: null,
    handleError: null,
    handleContextState: null,
    handleTimeUpdate: syncNativeVolume,
    playTrack: null,
  };

  const playTrack = async (nextIndex) => {
    if (player.stopped) return;
    player.index = ((nextIndex % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[player.index];
    audio.src = track.src;
    audio.currentTime = 0;
    onTrackChange(track, player.index);
    syncNativeVolume();
    await audio.play();
    player.failedTracks = 0;
  };

  player.playTrack = playTrack;

  player.handleEnded = () => {
    const track = tracks[player.index];
    playTrack(track?.repeat ? player.index : player.index + 1).catch((error) => {
      onError(error?.message || "The next waiting room track could not start.");
    });
  };

  player.handleError = () => {
    if (player.stopped) return;
    player.failedTracks += 1;
    if (player.failedTracks >= tracks.length) {
      onError("None of the waiting room music tracks could be loaded.");
      cleanupPlayer(context);
      return;
    }
    playTrack(player.index + 1).catch((error) => {
      onError(error?.message || "A waiting room track could not start.");
    });
  };

  player.handleContextState = () => {
    if (context.state === "closed") cleanupPlayer(context);
  };

  audio.addEventListener("timeupdate", player.handleTimeUpdate);
  audio.addEventListener("ended", player.handleEnded);
  audio.addEventListener("error", player.handleError);
  context.addEventListener("statechange", player.handleContextState);
  players.set(context, player);

  try {
    try {
      await playTrack(0);
    } catch (initialError) {
      // A not-yet-uploaded day-specific object must not make attendance silent.
      if (tracks.length <= 1) throw initialError;
      await playTrack(1);
    }
  } catch (error) {
    cleanupPlayer(context);
    throw error;
  }

  return player;
}
