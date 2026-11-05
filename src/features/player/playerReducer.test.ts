import type { Track } from '@/lib/track';
import { idleStatus, type PlayerStatus } from '@/services/audio/PlayerAdapter';

import {
  createPlayerReducer,
  initialPlayerState,
  restartThresholdMs,
  type PlayerAction,
  type PlayerState,
} from './playerReducer';

const reducer = createPlayerReducer();

function track(name: string, durationMs: number | null = 180000): Track {
  return { id: name, uri: `file:///music/${name}.mp3`, name, durationMs };
}

const queue = [track('a'), track('b'), track('c')];

function run(...actions: PlayerAction[]): PlayerState {
  return actions.reduce(reducer, { ...initialPlayerState, queue });
}

function status(overrides: Partial<PlayerStatus>): PlayerAction {
  return { type: 'status', status: { ...idleStatus, isLoaded: true, ...overrides } };
}

describe('playerReducer', () => {
  it('starts the tapped track from 0 and requests a load', () => {
    const state = run({ type: 'playTrack', index: 1 });

    expect(state).toMatchObject({ currentIndex: 1, playback: 'playing', positionMs: 0 });
    expect(state.loadRequest).toBe(1);
    expect(state.durationMs).toBe(180000);
  });

  it('pauses keeping the position and resumes from it without reloading', () => {
    const playing = run({ type: 'playTrack', index: 0 }, status({ positionMs: 42000 }));
    const paused = reducer(playing, { type: 'togglePlay' });
    const resumed = reducer(paused, { type: 'togglePlay' });

    expect(paused).toMatchObject({ playback: 'paused', positionMs: 42000 });
    expect(resumed).toMatchObject({ playback: 'playing', positionMs: 42000 });
    expect(resumed.loadRequest).toBe(playing.loadRequest);
  });

  it('stop rewinds to 0 and play afterwards continues from the start', () => {
    const stopped = run({ type: 'playTrack', index: 0 }, status({ positionMs: 42000 }), {
      type: 'stop',
    });
    const playedAgain = reducer(stopped, { type: 'togglePlay' });

    expect(stopped).toMatchObject({ playback: 'stopped', positionMs: 0, currentIndex: 0 });
    expect(playedAgain).toMatchObject({ playback: 'playing', positionMs: 0 });
  });

  it('starts the next track automatically when the current one finishes', () => {
    const state = run({ type: 'playTrack', index: 0 }, status({ didJustFinish: true }));

    expect(state).toMatchObject({ currentIndex: 1, playback: 'playing', positionMs: 0 });
    expect(state.loadRequest).toBe(2);
  });

  it('stops after the last track finishes', () => {
    const state = run({ type: 'playTrack', index: 2 }, status({ didJustFinish: true }));

    expect(state).toMatchObject({ currentIndex: 2, playback: 'stopped', positionMs: 0 });
    expect(state.loadRequest).toBe(1);
  });

  it('skips an unplayable file, remembering its name for a message', () => {
    const state = run({ type: 'playTrack', index: 0 }, status({ error: 'Cannot decode' }));

    expect(state).toMatchObject({ currentIndex: 1, playback: 'playing', failedTrackName: 'a' });
  });

  it('stops when the unplayable file was the last one', () => {
    const state = run({ type: 'playTrack', index: 2 }, status({ error: 'Cannot decode' }));

    expect(state).toMatchObject({ playback: 'stopped', failedTrackName: 'c' });
  });

  it('clears the failure message when the user starts another track', () => {
    const state = run({ type: 'playTrack', index: 0 }, status({ error: 'Cannot decode' }), {
      type: 'playTrack',
      index: 2,
    });

    expect(state.failedTrackName).toBeNull();
  });

  it('next and previous move through the queue', () => {
    const afterNext = run({ type: 'playTrack', index: 0 }, { type: 'next' });
    const afterPrevious = reducer(afterNext, { type: 'previous' });

    expect(afterNext.currentIndex).toBe(1);
    expect(afterPrevious.currentIndex).toBe(0);
  });

  it('next on the last track stops instead of wrapping around', () => {
    expect(run({ type: 'playTrack', index: 2 }, { type: 'next' })).toMatchObject({
      currentIndex: 2,
      playback: 'stopped',
    });
  });

  it('previous after the first seconds restarts the current track', () => {
    const state = run(
      { type: 'playTrack', index: 1 },
      status({ positionMs: restartThresholdMs + 1 }),
      { type: 'previous' },
    );

    expect(state).toMatchObject({ currentIndex: 1, positionMs: 0, loadRequest: 2 });
  });

  it('previous on the first track restarts it', () => {
    expect(run({ type: 'playTrack', index: 0 }, { type: 'previous' })).toMatchObject({
      currentIndex: 0,
      loadRequest: 2,
    });
  });

  it('ignores transport actions when nothing was started', () => {
    const state = run(
      { type: 'togglePlay' },
      { type: 'stop' },
      { type: 'next' },
      { type: 'previous' },
    );

    expect(state).toMatchObject({ currentIndex: null, playback: 'idle', loadRequest: 0 });
  });

  it('updates position and duration from status, keeping the known duration when native reports 0', () => {
    const state = run({ type: 'playTrack', index: 0 }, status({ positionMs: 5000, durationMs: 0 }));

    expect(state).toMatchObject({ positionMs: 5000, durationMs: 180000 });
  });

  it('does not flip to paused while the just-loaded track has not started yet', () => {
    const state = run({ type: 'playTrack', index: 0 }, status({ isPlaying: false }));

    expect(state.playback).toBe('playing');
  });

  it('follows a pause from outside the app (call, lock screen) once playback had started', () => {
    const state = run(
      { type: 'playTrack', index: 0 },
      status({ isPlaying: true, positionMs: 1000 }),
      status({ isPlaying: false, positionMs: 1200 }),
    );

    expect(state).toMatchObject({ playback: 'paused', positionMs: 1200 });
  });

  it('follows a resume from outside the app', () => {
    const state = run(
      { type: 'playTrack', index: 0 },
      status({ isPlaying: true }),
      status({ isPlaying: false }),
      status({ isPlaying: true, positionMs: 1500 }),
    );

    expect(state.playback).toBe('playing');
  });

  it('keeps our own resume until the native player confirms it', () => {
    const paused = run({ type: 'playTrack', index: 0 }, status({ isPlaying: true }), {
      type: 'togglePlay',
    });
    const confirmedPause = reducer(paused, status({ isPlaying: false }));
    const resumed = reducer(confirmedPause, { type: 'togglePlay' });

    expect(reducer(resumed, status({ isPlaying: false })).playback).toBe('playing');
    expect(reducer(paused, status({ isPlaying: true })).playback).toBe('paused');
  });

  it('ignores status updates that are not loaded yet', () => {
    const state = run(
      { type: 'playTrack', index: 0 },
      status({ isLoaded: false, positionMs: 9000 }),
    );

    expect(state.positionMs).toBe(0);
  });

  it('keeps playing the same track when the library list is refreshed', () => {
    const refreshed = [track('a'), track('b', 99000), track('c')];
    const state = run({ type: 'playTrack', index: 1 }, { type: 'setQueue', tracks: refreshed });

    expect(state).toMatchObject({ currentIndex: 1, playback: 'playing', loadRequest: 1 });
    expect(state.queue).toBe(refreshed);
  });

  it('follows the playing track to its new position when the list order changes', () => {
    const state = run(
      { type: 'playTrack', index: 0 },
      { type: 'setQueue', tracks: [track('z'), track('a')] },
    );

    expect(state.currentIndex).toBe(1);
  });

  it('resets to idle when the playing track disappears with a folder change', () => {
    const state = run(
      { type: 'playTrack', index: 0 },
      { type: 'setQueue', tracks: [track('x'), track('y')] },
    );

    expect(state).toMatchObject({ currentIndex: null, playback: 'idle', positionMs: 0 });
  });

  it('seek moves the position, never below 0', () => {
    const state = run({ type: 'playTrack', index: 0 }, { type: 'seek', positionMs: 60000 });

    expect(state.positionMs).toBe(60000);
    expect(reducer(state, { type: 'seek', positionMs: -10 }).positionMs).toBe(0);
  });

  it('uses the injected queue strategy', () => {
    const wrapAround = createPlayerReducer({
      next: (index, length) => (index + 1) % length,
      previous: (index, length) => (index - 1 + length) % length,
    });
    const state = [{ type: 'playTrack', index: 2 } as const, { type: 'next' } as const].reduce(
      wrapAround,
      { ...initialPlayerState, queue },
    );

    expect(state.currentIndex).toBe(0);
  });
});
