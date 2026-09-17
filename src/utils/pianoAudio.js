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
  player.source.disconnect();
  players.delete(context);
}

export function stopWaitingMusicPlaylist(context) {
  if (!context) return;
  cleanupPlayer(context);
}

export async function startWaitingMusicPlaylist(
  context,
  destination,
  { playlist = [], onTrackChange = () => {}, onError = () => {} } = {},
) {
  if (!context || !destination) throw new Error("Waiting room audio is not available.");

  const tracks = validTracks(playlist);
  if (!tracks.length) throw new Error("No waiting room music tracks are configured.");

  const existing = players.get(context);
  if (existing) return existing;

  const audio = new Audio();
  audio.preload = "auto";
  audio.volume = 1;
  audio.playsInline = true;

  const source = context.createMediaElementSource(audio);
  source.connect(destination);

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
  };

  const playTrack = async (nextIndex) => {
    if (player.stopped) return;
    player.index = ((nextIndex % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[player.index];
    audio.src = track.src;
    audio.currentTime = 0;
    onTrackChange(track, player.index);
    await audio.play();
    player.failedTracks = 0;
  };

  player.handleEnded = () => {
    playTrack(player.index + 1).catch((error) => {
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

  audio.addEventListener("ended", player.handleEnded);
  audio.addEventListener("error", player.handleError);
  context.addEventListener("statechange", player.handleContextState);
  players.set(context, player);

  try {
    await playTrack(0);
  } catch (error) {
    cleanupPlayer(context);
    throw error;
  }

  return player;
}
