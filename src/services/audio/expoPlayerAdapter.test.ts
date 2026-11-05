import { createAudioPlayer, setAudioModeAsync, type AudioStatus } from 'expo-audio';

import type { PlayerStatus } from './PlayerAdapter';
import {
  configureAudioSession,
  createExpoPlayerAdapter,
  toPlayerStatus,
} from './expoPlayerAdapter';

type StatusCallback = (status: Partial<AudioStatus>) => void;

const mockPlayer = {
  replace: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(async () => undefined),
  remove: jest.fn(),
  setActiveForLockScreen: jest.fn(),
  listener: null as StatusCallback | null,
  addListener: jest.fn((_event: string, callback: StatusCallback) => {
    mockPlayer.listener = callback;
    return { remove: jest.fn() };
  }),
};

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
  setAudioModeAsync: jest.fn(async () => undefined),
}));

function nativeStatus(overrides: Partial<AudioStatus>): AudioStatus {
  return {
    id: 'player-1',
    currentTime: 0,
    playbackState: 'ready',
    timeControlStatus: 'paused',
    reasonForWaitingToPlay: '',
    mute: false,
    duration: 0,
    playing: false,
    loop: false,
    didJustFinish: false,
    isBuffering: false,
    isLoaded: true,
    playbackRate: 1,
    shouldCorrectPitch: true,
    error: null,
    ...overrides,
  } as AudioStatus;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPlayer.listener = null;
});

describe('toPlayerStatus', () => {
  it('maps seconds to milliseconds and playback flags', () => {
    expect(
      toPlayerStatus(nativeStatus({ currentTime: 12.3456, duration: 185.2, playing: true })),
    ).toEqual<PlayerStatus>({
      isLoaded: true,
      isPlaying: true,
      positionMs: 12346,
      durationMs: 185200,
      didJustFinish: false,
      error: null,
    });
  });

  it('passes through the end-of-track flag and errors', () => {
    expect(toPlayerStatus(nativeStatus({ didJustFinish: true })).didJustFinish).toBe(true);
    expect(toPlayerStatus(nativeStatus({ isLoaded: false, error: 'Cannot decode' })).error).toBe(
      'Cannot decode',
    );
  });
});

describe('createExpoPlayerAdapter', () => {
  it('loads a file by URI into a single reused player', () => {
    const adapter = createExpoPlayerAdapter();

    adapter.load('file:///music/a.mp3');
    adapter.load('file:///music/b.wav');

    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(mockPlayer.replace).toHaveBeenNthCalledWith(1, { uri: 'file:///music/a.mp3' });
    expect(mockPlayer.replace).toHaveBeenNthCalledWith(2, { uri: 'file:///music/b.wav' });
  });

  it('forwards native status updates to listeners until they unsubscribe', () => {
    const adapter = createExpoPlayerAdapter();
    const listener = jest.fn();
    const unsubscribe = adapter.onStatus(listener);
    adapter.load('file:///music/a.mp3');

    mockPlayer.listener?.(nativeStatus({ currentTime: 1, duration: 3, playing: true }));
    unsubscribe();
    mockPlayer.listener?.(nativeStatus({ currentTime: 2, duration: 3, playing: true }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ positionMs: 1000 }));
  });

  it('reports a load failure as an error status instead of throwing', () => {
    mockPlayer.replace.mockImplementationOnce(() => {
      throw new Error('Unsupported format');
    });
    const adapter = createExpoPlayerAdapter();
    const listener = jest.fn();
    adapter.onStatus(listener);

    expect(() => adapter.load('file:///music/broken.mp3')).not.toThrow();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unsupported format', isLoaded: false }),
    );
  });

  it('seeks in seconds and never before the start', async () => {
    const adapter = createExpoPlayerAdapter();

    await adapter.seekTo(90500);
    await adapter.seekTo(-200);

    expect(mockPlayer.seekTo).toHaveBeenNthCalledWith(1, 90.5);
    expect(mockPlayer.seekTo).toHaveBeenNthCalledWith(2, 0);
  });

  it('stops by pausing and rewinding to 0', async () => {
    const adapter = createExpoPlayerAdapter();

    await adapter.stop();

    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
  });

  it('shows the track title on the lock screen with play/pause only', () => {
    const adapter = createExpoPlayerAdapter();

    adapter.setNowPlaying({ title: 'Alpha Song' });

    expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { title: 'Alpha Song' },
      expect.objectContaining({ showNextTrack: false, showPreviousTrack: false }),
    );
  });

  it('ends the lock-screen session', () => {
    const adapter = createExpoPlayerAdapter();
    adapter.setNowPlaying({ title: 'Alpha Song' });

    adapter.setNowPlaying(null);

    expect(mockPlayer.setActiveForLockScreen).toHaveBeenLastCalledWith(false);
  });

  it('releases the native player', () => {
    const adapter = createExpoPlayerAdapter();
    adapter.play();

    adapter.release();

    expect(mockPlayer.remove).toHaveBeenCalled();
  });
});

describe('configureAudioSession', () => {
  it('plays in the background, despite the silent switch, and pauses for interruptions', async () => {
    await configureAudioSession();

    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        allowsRecording: false,
        shouldPlayInBackground: true,
      }),
    );
  });
});
