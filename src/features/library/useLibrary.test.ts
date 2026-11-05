import { act, renderHook, waitFor } from '@testing-library/react-native';

import { err, ok, type Result } from '@/lib/result';
import type { Track } from '@/lib/track';
import type { DirectoryRef, LibraryError, LibrarySource } from '@/services/files/LibrarySource';
import type { SavedDirectory } from '@/services/storage/settingsStorage';

import { needsNewDirectory, useLibrary, type LibraryDeps, type LibraryStorage } from './useLibrary';

const rock: DirectoryRef = { kind: 'saf', uri: 'content://tree/Rock' };
const jazz: DirectoryRef = { kind: 'saf', uri: 'content://tree/Jazz' };
const empty: DirectoryRef = { kind: 'saf', uri: 'content://tree/Empty' };
const rockFavourites: DirectoryRef = { kind: 'saf', uri: 'content://tree/Rock/Favourites' };

function track(name: string, folder: string): Track {
  const uri = `content://tree/${folder}/${name}.mp3`;
  return { id: uri, uri, name, durationMs: null };
}

function fakeSource(
  folders: Record<string, Track[] | LibraryError>,
  picked: Result<DirectoryRef | null, LibraryError> = ok(rock),
): LibrarySource & { pickDirectory: jest.Mock } {
  return {
    pickDirectory: jest.fn(async () => picked),
    listAudioFiles: async (directory) => {
      const content = folders[directory.uri];
      if (content === undefined) return err('not-found');
      return typeof content === 'string' ? err(content) : ok(content);
    },
    hasAccess: async (directory) => Array.isArray(folders[directory.uri]),
  };
}

function memoryStorage(initial: SavedDirectory | null = null): LibraryStorage & {
  saved: SavedDirectory | null;
} {
  const storage = {
    saved: initial,
    load: async () => storage.saved,
    save: async (directory: SavedDirectory) => {
      storage.saved = directory;
    },
  };
  return storage;
}

const folders = {
  [rock.uri]: [track('a rock', 'Rock'), track('b rock', 'Rock')],
  [jazz.uri]: [track('a jazz', 'Jazz')],
  [empty.uri]: [],
  [rockFavourites.uri]: [track('a rock', 'Rock')],
};

function deps(overrides: Partial<LibraryDeps> = {}): LibraryDeps {
  return {
    source: fakeSource(folders),
    storage: memoryStorage(),
    probeDuration: async () => 185000,
    ...overrides,
  };
}

async function renderLibrary(libraryDeps: LibraryDeps) {
  const hook = await renderHook(() => useLibrary(libraryDeps));
  await waitFor(() => expect(hook.result.current.busy).toBe(false));
  return hook;
}

describe('useLibrary', () => {
  it('starts idle when no folder was saved', async () => {
    const { result } = await renderLibrary(deps());

    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('restores the saved folder on start and lists its tracks', async () => {
    const { result } = await renderLibrary(deps({ storage: memoryStorage(rock) }));

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const state = result.current.state;
    expect(state.status === 'ready' && state.tracks.map((item) => item.name)).toEqual([
      'a rock',
      'b rock',
    ]);
  });

  it('fills in durations after the list is shown', async () => {
    const { result } = await renderLibrary(deps({ storage: memoryStorage(rock) }));

    await waitFor(() => {
      const state = result.current.state;
      expect(state.status === 'ready' && state.tracks.map((item) => item.durationMs)).toEqual([
        185000, 185000,
      ]);
    });
  });

  it('picks a folder through the system picker, saves it and lists it', async () => {
    const storage = memoryStorage();
    const { result } = await renderLibrary(deps({ storage }));

    await act(() => result.current.chooseDirectory());

    expect(result.current.state.status).toBe('ready');
    expect(storage.saved).toEqual(rock);
  });

  it('uses a folder chosen in-app without opening the system picker', async () => {
    const source = fakeSource(folders);
    const { result } = await renderLibrary(deps({ source }));

    await act(() => result.current.chooseDirectory(jazz));

    expect(source.pickDirectory).not.toHaveBeenCalled();
    const state = result.current.state;
    expect(state.status === 'ready' && state.directory).toEqual(jazz);
  });

  it('replaces the list when the folder changes instead of appending', async () => {
    const { result } = await renderLibrary(deps({ storage: memoryStorage(rock) }));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(() => result.current.chooseDirectory(jazz));

    const state = result.current.state;
    expect(state.status === 'ready' && state.tracks.map((item) => item.name)).toEqual(['a jazz']);
  });

  it('reports an empty folder as empty', async () => {
    const { result } = await renderLibrary(deps());

    await act(() => result.current.chooseDirectory(empty));

    expect(result.current.state).toEqual({ status: 'empty', directory: empty });
  });

  it('keeps the current list when the user cancels the picker', async () => {
    const source = fakeSource(folders, ok(null));
    const storage = memoryStorage(jazz);
    const { result } = await renderLibrary(deps({ source, storage }));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(() => result.current.chooseDirectory());

    const state = result.current.state;
    expect(state.status === 'ready' && state.directory).toEqual(jazz);
    expect(storage.saved).toEqual(jazz);
  });

  it.each<LibraryError>(['access-denied', 'not-found'])(
    'asks for a new folder when the saved one fails with %s',
    async (error) => {
      const source = fakeSource({ [rock.uri]: error });
      const { result } = await renderLibrary(deps({ source, storage: memoryStorage(rock) }));

      await waitFor(() => expect(result.current.state.status).toBe('error'));
      expect(needsNewDirectory(result.current.state)).toBe(true);
    },
  );

  it('does not overwrite a newer folder with durations of the previous one', async () => {
    const pendingProbes = new Map<string, ((value: number) => void)[]>();
    const slowProbe = (uri: string) =>
      new Promise<number>((resolve) => {
        pendingProbes.set(uri, [...(pendingProbes.get(uri) ?? []), resolve]);
      });
    const rockTrackUri = folders[rock.uri]?.[0]?.uri ?? '';
    const { result } = await renderLibrary(
      deps({ storage: memoryStorage(rock), probeDuration: slowProbe }),
    );
    await waitFor(() => expect(pendingProbes.has(rockTrackUri)).toBe(true));

    await act(() => result.current.chooseDirectory(rockFavourites));
    await act(async () => pendingProbes.get(rockTrackUri)?.[0]?.(999000));

    const state = result.current.state;
    expect(state.status === 'ready' && state.tracks).toEqual([
      { ...track('a rock', 'Rock'), durationMs: null },
    ]);
  });
});
