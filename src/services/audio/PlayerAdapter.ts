export interface PlayerStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  /** True exactly once, in the status update emitted when the track reached its end. */
  didJustFinish: boolean;
  /** Load or playback error; the adapter never throws for an unplayable file. */
  error: string | null;
}

export type StatusListener = (status: PlayerStatus) => void;

export interface PlayerAdapter {
  load(uri: string): void;
  play(): void;
  pause(): void;
  /** Pauses and rewinds to the start. */
  stop(): Promise<void>;
  seekTo(positionMs: number): Promise<void>;
  onStatus(listener: StatusListener): () => void;
  release(): void;
}

export const idleStatus: PlayerStatus = {
  isLoaded: false,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  didJustFinish: false,
  error: null,
};
