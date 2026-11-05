import * as DocumentPicker from 'expo-document-picker';

import { fakeFs, resetFakeFs } from '@/test/fakeFileSystem';

import { iosLibrarySource } from './iosLibrarySource';

jest.mock('expo-file-system', () => jest.requireActual('@/test/fakeFileSystem'));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

const documentsRoot = 'file:///var/mobile/Containers/Data/Application/APP-UUID/Documents';
const getDocumentAsync = jest.mocked(DocumentPicker.getDocumentAsync);

function pickedAsset(name: string) {
  const uri = `file:///var/mobile/Library/Caches/DocumentPicker/${encodeURIComponent(name)}`;
  fakeFs.external.add(uri);
  return { name, uri, lastModified: 0 };
}

beforeEach(() => {
  getDocumentAsync.mockReset();
  resetFakeFs(
    {
      'root track.mp3': 'file',
      Rock: { 'b side.m4a': 'file', Live: { 'a encore.flac': 'file' } },
      Jazz: {},
      '.Trash': { 'deleted.mp3': 'file' },
    },
    documentsRoot,
  );
});

describe('iosLibrarySource.listFolders', () => {
  it('lists the Documents root first, then all nested subfolders, hidden ones skipped', async () => {
    const result = await iosLibrarySource.listFolders();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((folder) => folder.label)).toEqual(['', 'Jazz', 'Rock', 'Rock/Live']);
    expect(result.value[3]?.directory).toEqual({ kind: 'documents', uri: 'Rock/Live' });
  });
});

describe('iosLibrarySource.listAudioFiles', () => {
  it('lists files dropped into the app folder (Documents root, recursive)', async () => {
    const result = await iosLibrarySource.listAudioFiles({ kind: 'documents', uri: '' });

    expect(result.ok && result.value.map((track) => track.name)).toEqual([
      'a encore',
      'b side',
      'root track',
    ]);
  });

  it('lists only the chosen subfolder, stored relative to Documents', async () => {
    const result = await iosLibrarySource.listAudioFiles({ kind: 'documents', uri: 'Rock' });

    expect(result.ok && result.value.map((track) => track.name)).toEqual(['a encore', 'b side']);
    expect(result.ok && result.value[1]?.uri).toBe(`${documentsRoot}/Rock/b%20side.m4a`);
  });

  it('returns not-found when the subfolder was deleted in the Files app', async () => {
    await expect(
      iosLibrarySource.listAudioFiles({ kind: 'documents', uri: 'Gone' }),
    ).resolves.toEqual({ ok: false, error: 'not-found' });
    await expect(iosLibrarySource.hasAccess({ kind: 'documents', uri: 'Gone' })).resolves.toBe(
      false,
    );
  });
});

describe('iosLibrarySource.importFiles', () => {
  it('copies picked supported files into the target folder and skips unsupported ones', async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [pickedAsset('new song.mp3'), pickedAsset('booklet.pdf'), pickedAsset('take.wav')],
    });

    const result = await iosLibrarySource.importFiles({ kind: 'documents', uri: 'Jazz' });

    expect(result).toEqual({ ok: true, value: { imported: 2, skipped: 1 } });
    expect(getDocumentAsync).toHaveBeenCalledWith({
      type: 'audio/*',
      multiple: true,
      copyToCacheDirectory: true,
    });
    const listed = await iosLibrarySource.listAudioFiles({ kind: 'documents', uri: 'Jazz' });
    expect(listed.ok && listed.value.map((track) => track.name)).toEqual(['new song', 'take']);
  });

  it('keeps an existing file and stores the import under a numbered name', async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [pickedAsset('root track.mp3')],
    });

    await iosLibrarySource.importFiles({ kind: 'documents', uri: '' });

    const listed = await iosLibrarySource.listAudioFiles({ kind: 'documents', uri: '' });
    expect(listed.ok && listed.value.map((track) => track.name)).toContain('root track (2)');
    expect(listed.ok && listed.value.map((track) => track.name)).toContain('root track');
  });

  it('reports nothing imported when the user cancels the picker', async () => {
    getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

    await expect(iosLibrarySource.importFiles({ kind: 'documents', uri: '' })).resolves.toEqual({
      ok: true,
      value: { imported: 0, skipped: 0 },
    });
  });

  it('returns import-failed instead of throwing when copying fails', async () => {
    getDocumentAsync.mockResolvedValue({ canceled: false, assets: [pickedAsset('x.mp3')] });
    fakeFs.failCopy = true;

    await expect(iosLibrarySource.importFiles({ kind: 'documents', uri: '' })).resolves.toEqual({
      ok: false,
      error: 'import-failed',
    });
  });
});

describe('iosLibrarySource.pickDirectory', () => {
  it('defaults to the whole app folder', async () => {
    await expect(iosLibrarySource.pickDirectory()).resolves.toEqual({
      ok: true,
      value: { kind: 'documents', uri: '' },
    });
  });
});
