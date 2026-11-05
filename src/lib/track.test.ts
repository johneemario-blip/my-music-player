import {
  formatDuration,
  isSupportedAudioFile,
  sortTracks,
  trackNameFromFileName,
  type Track,
} from './track';

function track(name: string): Track {
  return { id: name, uri: `file:///music/${name}.mp3`, name, durationMs: 1000 };
}

describe('isSupportedAudioFile', () => {
  it.each(['song.mp3', 'Song.MP3', 'take.wav', 'a.m4a', 'b.aac', 'c.flac'])(
    'accepts %s on both platforms',
    (fileName) => {
      expect(isSupportedAudioFile(fileName, 'ios')).toBe(true);
      expect(isSupportedAudioFile(fileName, 'android')).toBe(true);
    },
  );

  it.each(['notes.txt', 'cover.jpg', 'playlist.m3u', 'noextension', 'trailingdot.'])(
    'rejects %s',
    (fileName) => {
      expect(isSupportedAudioFile(fileName, 'ios')).toBe(false);
      expect(isSupportedAudioFile(fileName, 'android')).toBe(false);
    },
  );

  it('accepts ogg only on Android', () => {
    expect(isSupportedAudioFile('track.ogg', 'android')).toBe(true);
    expect(isSupportedAudioFile('track.ogg', 'ios')).toBe(false);
  });

  it('skips hidden files even with an audio extension', () => {
    expect(isSupportedAudioFile('._song.mp3', 'ios')).toBe(false);
    expect(isSupportedAudioFile('.mp3', 'android')).toBe(false);
  });
});

describe('trackNameFromFileName', () => {
  it('drops only the last extension', () => {
    expect(trackNameFromFileName('01 Intro.mp3')).toBe('01 Intro');
    expect(trackNameFromFileName('live.at.home.wav')).toBe('live.at.home');
  });

  it('keeps names without extension', () => {
    expect(trackNameFromFileName('README')).toBe('README');
  });
});

describe('sortTracks', () => {
  it('sorts alphabetically, case-insensitive, with numeric order, without mutating input', () => {
    const input = [
      track('b side'),
      track('10 Last'),
      track('Alpha'),
      track('2 Second'),
      track('alpha 2'),
    ];

    const sorted = sortTracks(input);

    expect(sorted.map((item) => item.name)).toEqual([
      '2 Second',
      '10 Last',
      'Alpha',
      'alpha 2',
      'b side',
    ]);
    expect(input[0]?.name).toBe('b side');
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [null, '0:00'],
    [undefined, '0:00'],
    [Number.NaN, '0:00'],
    [-5000, '0:00'],
    [999, '0:00'],
    [185000, '3:05'],
    [600000, '10:00'],
    [3725000, '62:05'],
  ])('formats %p as %s', (durationMs, expected) => {
    expect(formatDuration(durationMs)).toBe(expected);
  });
});
