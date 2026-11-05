import { createAudioPlayer } from 'expo-audio';

export type DurationProbe = (uri: string) => Promise<number | null>;

const probeTimeoutMs = 5000;

/** Loads the file without playing it and reports its duration; `null` when it cannot be read. */
export const probeDuration: DurationProbe = (uri) =>
  new Promise((resolve) => {
    const player = createAudioPlayer(uri);
    let settled = false;
    const finish = (durationMs: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.remove();
      player.remove();
      resolve(durationMs);
    };
    const timer = setTimeout(() => finish(null), probeTimeoutMs);
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.error) finish(null);
      else if (status.isLoaded && status.duration > 0) finish(Math.round(status.duration * 1000));
    });
  });
