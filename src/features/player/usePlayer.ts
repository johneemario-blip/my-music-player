import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState } from 'react-native';

import type { Track } from '@/lib/track';
import type { PlayerAdapter, PlayerStatus } from '@/services/audio/PlayerAdapter';

import { createPlayerReducer, initialPlayerState, type PlayerState } from './playerReducer';
import { sequentialQueue, type QueueStrategy } from './queueStrategy';

export interface Player {
  state: PlayerState;
  currentTrack: Track | null;
  playTrack(index: number): void;
  togglePlay(): void;
  stop(): void;
  next(): void;
  previous(): void;
  seek(positionMs: number): void;
}

function useAdapterSync(adapter: PlayerAdapter, state: PlayerState) {
  const handledLoad = useRef(0);
  const { loadRequest, playback } = state;
  const currentUri =
    state.currentIndex === null ? null : (state.queue[state.currentIndex]?.uri ?? null);

  useEffect(() => {
    if (loadRequest !== handledLoad.current) {
      handledLoad.current = loadRequest;
      if (currentUri !== null && playback === 'playing') {
        adapter.load(currentUri);
        adapter.play();
        return;
      }
    }
    switch (playback) {
      case 'playing':
        adapter.play();
        break;
      case 'paused':
        adapter.pause();
        break;
      case 'stopped':
        void adapter.stop();
        break;
      case 'idle':
        if (handledLoad.current > 0) adapter.pause();
        break;
    }
  }, [adapter, loadRequest, playback, currentUri]);
}

function useNowPlaying(adapter: PlayerAdapter, title: string | null) {
  const announced = useRef(false);
  useEffect(() => {
    if (title !== null) {
      adapter.setNowPlaying({ title });
      announced.current = true;
    } else if (announced.current) {
      adapter.setNowPlaying(null);
      announced.current = false;
    }
  }, [adapter, title]);
}

/** Status events can be missed while the app is suspended; read the real state on return. */
function useForegroundResync(adapter: PlayerAdapter, onStatus: (status: PlayerStatus) => void) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') onStatus(adapter.getStatus());
    });
    return () => subscription.remove();
  }, [adapter, onStatus]);
}

export function usePlayer(
  tracks: Track[],
  adapter: PlayerAdapter,
  strategy: QueueStrategy = sequentialQueue,
): Player {
  const reducer = useMemo(() => createPlayerReducer(strategy), [strategy]);
  const [state, dispatch] = useReducer(reducer, initialPlayerState);

  const applyStatus = useCallback(
    (status: PlayerStatus) => dispatch({ type: 'status', status }),
    [],
  );
  const currentTitle =
    state.currentIndex === null ? null : (state.queue[state.currentIndex]?.name ?? null);

  useEffect(() => dispatch({ type: 'setQueue', tracks }), [tracks]);
  useEffect(() => adapter.onStatus(applyStatus), [adapter, applyStatus]);
  useEffect(() => () => adapter.release(), [adapter]);
  useAdapterSync(adapter, state);
  useNowPlaying(adapter, currentTitle);
  useForegroundResync(adapter, applyStatus);

  const seek = useCallback(
    (positionMs: number) => {
      dispatch({ type: 'seek', positionMs });
      void adapter.seekTo(positionMs);
    },
    [adapter],
  );

  return {
    state,
    currentTrack: state.currentIndex === null ? null : (state.queue[state.currentIndex] ?? null),
    playTrack: useCallback((index: number) => dispatch({ type: 'playTrack', index }), []),
    togglePlay: useCallback(() => dispatch({ type: 'togglePlay' }), []),
    stop: useCallback(() => dispatch({ type: 'stop' }), []),
    next: useCallback(() => dispatch({ type: 'next' }), []),
    previous: useCallback(() => dispatch({ type: 'previous' }), []),
    seek,
  };
}
