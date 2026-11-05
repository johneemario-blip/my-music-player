import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

import {
  idleStatus,
  type PlayerAdapter,
  type PlayerStatus,
  type StatusListener,
} from './PlayerAdapter';

const statusUpdateIntervalMs = 250;
const maxStartRetries = 3;

export function toPlayerStatus(status: AudioStatus): PlayerStatus {
  return {
    isLoaded: status.isLoaded,
    isPlaying: status.playing,
    positionMs: Math.max(0, Math.round(status.currentTime * 1000)),
    durationMs: Math.max(0, Math.round(status.duration * 1000)),
    didJustFinish: status.didJustFinish,
    error: status.error ?? null,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Plays despite the iOS silent switch and keeps playing with the screen locked or another app
 * in front; a phone call or another player's audio pauses us.
 */
export async function configureAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
    interruptionModeAndroid: 'doNotMix',
    allowsRecording: false,
    shouldPlayInBackground: true,
  });
}

export function createExpoPlayerAdapter(): PlayerAdapter {
  let player: AudioPlayer | null = null;
  const listeners = new Set<StatusListener>();
  const emit = (status: PlayerStatus) => listeners.forEach((listener) => listener(status));
  // iOS: a track's end-of-item pause can land after we already started the next track, which
  // then sits paused at 0:00. Until the player reports playing, a loaded-but-paused status
  // means our play() was swallowed, so it is repeated a few times.
  let startRetriesLeft = 0;

  const retrySwallowedStart = (current: AudioPlayer, status: PlayerStatus) => {
    if (startRetriesLeft === 0) return;
    if (status.isPlaying || status.error !== null) {
      startRetriesLeft = 0;
      return;
    }
    if (status.isLoaded && !status.didJustFinish) {
      startRetriesLeft -= 1;
      current.play();
    }
  };

  const ensurePlayer = (): AudioPlayer => {
    if (player !== null) return player;
    // Without keepAudioSessionActive iOS deactivates the session when a track ends — racing with
    // loading the next track.
    const created = createAudioPlayer(null, {
      updateInterval: statusUpdateIntervalMs,
      keepAudioSessionActive: true,
    });
    created.addListener('playbackStatusUpdate', (native) => {
      const status = toPlayerStatus(native);
      retrySwallowedStart(created, status);
      emit(status);
    });
    player = created;
    return created;
  };

  const guarded = (action: (current: AudioPlayer) => void) => {
    try {
      action(ensurePlayer());
    } catch (error) {
      emit({ ...idleStatus, error: errorMessage(error) });
    }
  };

  return {
    load(uri) {
      guarded((current) => current.replace({ uri }));
    },
    setNowPlaying(info) {
      if (info === null) {
        player?.setActiveForLockScreen(false);
        return;
      }
      guarded((current) =>
        current.setActiveForLockScreen(
          true,
          { title: info.title },
          // Track skipping from the lock screen needs a native AudioPlaylist — not in v1.
          {
            showSeekForward: false,
            showSeekBackward: false,
            showNextTrack: false,
            showPreviousTrack: false,
          },
        ),
      );
    },
    getStatus() {
      return player === null ? idleStatus : toPlayerStatus(player.currentStatus);
    },
    play() {
      startRetriesLeft = maxStartRetries;
      guarded((current) => current.play());
    },
    pause() {
      startRetriesLeft = 0;
      guarded((current) => current.pause());
    },
    async stop() {
      startRetriesLeft = 0;
      const current = ensurePlayer();
      current.pause();
      await current.seekTo(0);
    },
    async seekTo(positionMs) {
      await ensurePlayer().seekTo(Math.max(0, positionMs) / 1000);
    },
    onStatus(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    release() {
      listeners.clear();
      player?.setActiveForLockScreen(false);
      player?.remove();
      player = null;
    },
  };
}
