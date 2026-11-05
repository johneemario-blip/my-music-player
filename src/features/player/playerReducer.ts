import type { Track } from '@/lib/track';
import type { PlayerStatus } from '@/services/audio/PlayerAdapter';

import { sequentialQueue, type QueueStrategy } from './queueStrategy';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped';

export interface PlayerState {
  queue: Track[];
  currentIndex: number | null;
  playback: PlaybackStatus;
  positionMs: number;
  durationMs: number;
  /** Incremented whenever the current track must be (re)loaded and started from 0. */
  loadRequest: number;
  /** Name of the last track that could not be played, for a message to the user. */
  failedTrackName: string | null;
}

export type PlayerAction =
  | { type: 'setQueue'; tracks: Track[] }
  | { type: 'playTrack'; index: number }
  | { type: 'togglePlay' }
  | { type: 'stop' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'seek'; positionMs: number }
  | { type: 'status'; status: PlayerStatus };

/** Pressing "previous" later than this restarts the current track instead of going back. */
export const restartThresholdMs = 3000;

export const initialPlayerState: PlayerState = {
  queue: [],
  currentIndex: null,
  playback: 'idle',
  positionMs: 0,
  durationMs: 0,
  loadRequest: 0,
  failedTrackName: null,
};

function startTrack(state: PlayerState, index: number): PlayerState {
  const track = state.queue[index];
  if (track === undefined) return state;
  return {
    ...state,
    currentIndex: index,
    playback: 'playing',
    positionMs: 0,
    durationMs: track.durationMs ?? 0,
    loadRequest: state.loadRequest + 1,
  };
}

function endOfQueue(state: PlayerState): PlayerState {
  return { ...state, playback: 'stopped', positionMs: 0 };
}

function advance(state: PlayerState, strategy: QueueStrategy): PlayerState {
  if (state.currentIndex === null) return state;
  const nextIndex = strategy.next(state.currentIndex, state.queue.length);
  return nextIndex === null ? endOfQueue(state) : startTrack(state, nextIndex);
}

function goBack(state: PlayerState, strategy: QueueStrategy): PlayerState {
  if (state.currentIndex === null) return state;
  if (state.positionMs > restartThresholdMs) return startTrack(state, state.currentIndex);
  const previousIndex = strategy.previous(state.currentIndex, state.queue.length);
  return startTrack(state, previousIndex ?? state.currentIndex);
}

function replaceQueue(state: PlayerState, tracks: Track[]): PlayerState {
  const currentId = state.currentIndex === null ? null : state.queue[state.currentIndex]?.id;
  const keptIndex = tracks.findIndex((track) => track.id === currentId);
  if (keptIndex >= 0) return { ...state, queue: tracks, currentIndex: keptIndex };
  if (state.currentIndex === null) return { ...state, queue: tracks };
  return { ...initialPlayerState, queue: tracks, loadRequest: state.loadRequest };
}

function togglePlay(state: PlayerState): PlayerState {
  if (state.currentIndex === null) return state;
  if (state.playback === 'playing') return { ...state, playback: 'paused' };
  return { ...state, playback: 'playing' };
}

function applyStatus(state: PlayerState, status: PlayerStatus, strategy: QueueStrategy) {
  if (state.currentIndex === null) return state;
  if (status.error !== null) {
    const failed = state.queue[state.currentIndex]?.name ?? null;
    return { ...advance(state, strategy), failedTrackName: failed };
  }
  if (status.didJustFinish) return advance(state, strategy);
  if (!status.isLoaded) return state;
  return {
    ...state,
    positionMs: status.positionMs,
    durationMs: status.durationMs > 0 ? status.durationMs : state.durationMs,
  };
}

export function createPlayerReducer(strategy: QueueStrategy = sequentialQueue) {
  return function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
    switch (action.type) {
      case 'setQueue':
        return replaceQueue(state, action.tracks);
      case 'playTrack':
        return { ...startTrack(state, action.index), failedTrackName: null };
      case 'togglePlay':
        return togglePlay(state);
      case 'stop':
        return state.currentIndex === null
          ? state
          : { ...state, playback: 'stopped', positionMs: 0 };
      case 'next':
        return advance(state, strategy);
      case 'previous':
        return goBack(state, strategy);
      case 'seek':
        return { ...state, positionMs: Math.max(0, action.positionMs) };
      case 'status':
        return applyStatus(state, action.status, strategy);
      default: {
        const unhandled: never = action;
        return unhandled;
      }
    }
  };
}
