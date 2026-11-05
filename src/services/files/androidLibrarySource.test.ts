import { fakeFs, resetFakeFs } from '@/test/fakeFileSystem';

import { androidLibrarySource } from './androidLibrarySource';

jest.mock('expo-file-system', () => jest.requireActual('@/test/fakeFileSystem'));

const root = 'content://tree/Music';
const musicDir = { kind: 'saf', uri: root } as const;

describe('androidLibrarySource.listAudioFiles', () => {
  beforeEach(() => {
    resetFakeFs({
      'b song.mp3': 'file',
      'cover.jpg': 'file',
      '.hidden.mp3': 'file',
      Albums: {
        'a intro.wav': 'file',
        Live: { 'c encore.ogg': 'file', 'notes.txt': 'file' },
      },
      '.thumbnails': { 'd ghost.mp3': 'file' },
    });
  });

  it('returns supported audio files from the folder and all subfolders, sorted, hidden skipped', async () => {
    const result = await androidLibrarySource.listAudioFiles(musicDir);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((track) => track.name)).toEqual(['a intro', 'b song', 'c encore']);
    expect(result.value[0]).toEqual({
      id: `${root}/Albums/a%20intro.wav`,
      uri: `${root}/Albums/a%20intro.wav`,
      name: 'a intro',
      durationMs: null,
    });
  });

  it('returns an empty list for an empty folder', async () => {
    resetFakeFs({});

    await expect(androidLibrarySource.listAudioFiles(musicDir)).resolves.toEqual({
      ok: true,
      value: [],
    });
  });

  it('returns access-denied instead of throwing when the grant was revoked', async () => {
    fakeFs.unreadable.add(root);

    await expect(androidLibrarySource.listAudioFiles(musicDir)).resolves.toEqual({
      ok: false,
      error: 'access-denied',
    });
  });

  it('returns access-denied when a subfolder becomes unreadable mid-scan', async () => {
    fakeFs.unreadable.add(`${root}/Albums`);

    await expect(androidLibrarySource.listAudioFiles(musicDir)).resolves.toEqual({
      ok: false,
      error: 'access-denied',
    });
  });

  it('returns not-found for a deleted folder', async () => {
    const result = await androidLibrarySource.listAudioFiles({
      kind: 'saf',
      uri: `${root}/Gone`,
    });

    expect(result).toEqual({ ok: false, error: 'not-found' });
  });
});

describe('androidLibrarySource.hasAccess', () => {
  beforeEach(() => resetFakeFs({ 'a.mp3': 'file' }));

  it('is true for a readable saved folder', async () => {
    await expect(androidLibrarySource.hasAccess(musicDir)).resolves.toBe(true);
  });

  it('is false after the permission was revoked', async () => {
    fakeFs.unreadable.add(root);

    await expect(androidLibrarySource.hasAccess(musicDir)).resolves.toBe(false);
  });
});

describe('androidLibrarySource.pickDirectory', () => {
  beforeEach(() => resetFakeFs({}));

  it('returns the picked SAF tree as a saf directory', async () => {
    fakeFs.pickResult = { uri: 'content://tree/primary%3AMusic' };

    await expect(androidLibrarySource.pickDirectory()).resolves.toEqual({
      ok: true,
      value: { kind: 'saf', uri: 'content://tree/primary%3AMusic' },
    });
  });

  it('returns null when the user cancels the picker', async () => {
    fakeFs.pickResult = { error: new Error('The file picker was cancelled by the user') };

    await expect(androidLibrarySource.pickDirectory()).resolves.toEqual({ ok: true, value: null });
  });

  it('returns picker-failed for other picker errors', async () => {
    fakeFs.pickResult = { error: new Error('The app context is missing.') };

    await expect(androidLibrarySource.pickDirectory()).resolves.toEqual({
      ok: false,
      error: 'picker-failed',
    });
  });
});
