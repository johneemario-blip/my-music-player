import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import type { Track } from '@/lib/track';
import {
  idleStatus,
  type PlayerAdapter,
  type PlayerStatus,
  type StatusListener,
} from '@/services/audio/PlayerAdapter';

import { usePlayer } from './usePlayer';

function track(name: string): Track {
  return { id: name, uri: `file:///music/${name}.mp3`, name, durationMs: 3000 };
}

const tracks = [track('a'), track('b'), track('c')];

function fakeAdapter() {
  const listeners = new Set<StatusListener>();
  const adapter = {
    load: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(async () => undefined),
    seekTo: jest.fn(async () => undefined),
    release: jest.fn(),
    setNowPlaying: jest.fn(),
    nativeStatus: { ...idleStatus },
    getStatus: (): PlayerStatus => adapter.nativeStatus,
    onStatus: (listener: StatusListener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit: (status: Partial<PlayerStatus>) =>
      listeners.forEach((listener) => listener({ ...idleStatus, isLoaded: true, ...status })),
  } satisfies PlayerAdapter & { emit: unknown; nativeStatus: PlayerStatus };
  return adapter;
}

async function renderPlayer(adapter = fakeAdapter()) {
  const hook = await renderHook(() => usePlayer(tracks, adapter));
  return { ...hook, adapter };
}

describe('usePlayer', () => {
  it('loads and plays the tapped track', async () => {
    const { result, adapter } = await renderPlayer();

    await act(async () => result.current.playTrack(1));

    expect(adapter.load).toHaveBeenCalledWith('file:///music/b.mp3');
    expect(adapter.play).toHaveBeenCalled();
    expect(result.current.currentTrack?.name).toBe('b');
  });

  it('pauses and resumes without reloading the file', async () => {
    const { result, adapter } = await renderPlayer();
    await act(async () => result.current.playTrack(0));

    await act(async () => result.current.togglePlay());
    await act(async () => result.current.togglePlay());

    expect(adapter.pause).toHaveBeenCalledTimes(1);
    expect(adapter.load).toHaveBeenCalledTimes(1);
    expect(adapter.play).toHaveBeenCalledTimes(2);
  });

  it('stop asks the adapter to stop (rewind)', async () => {
    const { result, adapter } = await renderPlayer();
    await act(async () => result.current.playTrack(0));

    await act(async () => result.current.stop());

    expect(adapter.stop).toHaveBeenCalled();
    expect(result.current.state.positionMs).toBe(0);
  });

  it('loads the next file automatically when the current one finishes', async () => {
    const { result, adapter } = await renderPlayer();
    await act(async () => result.current.playTrack(0));

    await act(async () => adapter.emit({ didJustFinish: true }));

    expect(adapter.load).toHaveBeenLastCalledWith('file:///music/b.mp3');
    expect(result.current.currentTrack?.name).toBe('b');
  });

  it('stops at the end of the list', async () => {
    const { result, adapter } = await renderPlayer();
    await act(async () => result.current.playTrack(2));

    await act(async () => adapter.emit({ didJustFinish: true }));

    expect(adapter.stop).toHaveBeenCalled();
    expect(adapter.load).toHaveBeenCalledTimes(1);
    expect(result.current.state.playback).toBe('stopped');
  });

  it('skips a file that fails to load and plays the next one', async () => {
    const { result, adapter } = await renderPlayer();
    await act(async () => result.current.playTrack(0));

    await act(async () => adapter.emit({ isLoaded: false, error: 'Cannot decode' }));

    expect(adapter.load).toHaveBeenLastCalledWith('file:///music/b.mp3');
    expect(result.current.state.failedTrackName).toBe('a');
  });

  it('seeks the adapter and moves the position right away', async () => {
    const { result, adapter } = await renderPlayer();
    await act(async () => result.current.playTrack(0));

    await act(async () => result.current.seek(1500));

    expect(adapter.seekTo).toHaveBeenCalledWith(1500);
    expect(result.current.state.positionMs).toBe(1500);
  });

  it('does not touch the native player before anything is played', async () => {
    const { adapter } = await renderPlayer();

    expect(adapter.play).not.toHaveBeenCalled();
    expect(adapter.pause).not.toHaveBeenCalled();
    expect(adapter.stop).not.toHaveBeenCalled();
  });

  it('keeps playing without reloading when the library list is refreshed', async () => {
    const adapter = fakeAdapter();
    const { result, rerender } = await renderHook(
      ({ list }: { list: Track[] }) => usePlayer(list, adapter),
      { initialProps: { list: tracks } },
    );
    await act(async () => result.current.playTrack(1));
    const playCalls = adapter.play.mock.calls.length;

    await act(async () =>
      rerender({ list: tracks.map((item) => ({ ...item, durationMs: 4000 })) }),
    );

    expect(adapter.load).toHaveBeenCalledTimes(1);
    expect(adapter.play).toHaveBeenCalledTimes(playCalls);
    expect(result.current.currentTrack?.durationMs).toBe(4000);
  });

  it('pauses the native player when the playing track leaves the list', async () => {
    const adapter = fakeAdapter();
    const { result, rerender } = await renderHook(
      ({ list }: { list: Track[] }) => usePlayer(list, adapter),
      { initialProps: { list: tracks } },
    );
    await act(async () => result.current.playTrack(0));

    await act(async () => rerender({ list: [track('other')] }));

    expect(adapter.pause).toHaveBeenCalled();
    expect(result.current.currentTrack).toBeNull();
  });

  it('follows pause and play pressed on the lock screen', async () => {
    const { result, adapter } = await renderPlayer();
    await act(async () => result.current.playTrack(0));
    await act(async () => adapter.emit({ isPlaying: true, positionMs: 500 }));
    await act(async () => adapter.emit({ isPlaying: false, positionMs: 900 }));
    expect(result.current.state.playback).toBe('paused');

    await act(async () => adapter.emit({ isPlaying: true, positionMs: 900 }));
    expect(result.current.state.playback).toBe('playing');
    expect(adapter.load).toHaveBeenCalledTimes(1);
  });

  it('shows the playing track on the lock screen and updates it on track change', async () => {
    const { result, adapter } = await renderPlayer();

    await act(async () => result.current.playTrack(0));
    await act(async () => adapter.emit({ didJustFinish: true }));

    expect(adapter.setNowPlaying).toHaveBeenNthCalledWith(1, { title: 'a' });
    expect(adapter.setNowPlaying).toHaveBeenNthCalledWith(2, { title: 'b' });
  });

  it('ends the lock-screen session when the playing track leaves the list', async () => {
    const adapter = fakeAdapter();
    const { result, rerender } = await renderHook(
      ({ list }: { list: Track[] }) => usePlayer(list, adapter),
      { initialProps: { list: tracks } },
    );
    await act(async () => result.current.playTrack(0));

    await act(async () => rerender({ list: [track('other')] }));

    expect(adapter.setNowPlaying).toHaveBeenLastCalledWith(null);
  });

  it('re-reads the native position when the app returns to the foreground', async () => {
    const appStateListeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementationOnce((_type, listener) => {
      appStateListeners.push(listener as (state: string) => void);
      return { remove: jest.fn() };
    });
    const { result, adapter } = await renderPlayer();
    await act(async () => result.current.playTrack(0));
    await act(async () => adapter.emit({ isPlaying: true, positionMs: 1000, durationMs: 3000 }));
    adapter.nativeStatus = {
      ...idleStatus,
      isLoaded: true,
      isPlaying: true,
      positionMs: 2500,
      durationMs: 3000,
    };

    await act(async () => appStateListeners.forEach((listener) => listener('active')));

    expect(result.current.state.positionMs).toBe(2500);
    expect(result.current.state.playback).toBe('playing');
  });

  it('releases the adapter on unmount', async () => {
    const { adapter, unmount } = await renderPlayer();

    await act(async () => unmount());

    expect(adapter.release).toHaveBeenCalled();
  });
});
