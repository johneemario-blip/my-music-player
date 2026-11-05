import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Track } from '@/lib/track';
import type { DurationProbe } from '@/services/audio/probeDuration';
import type { DirectoryRef, LibraryError, LibrarySource } from '@/services/files/LibrarySource';
import type { SavedDirectory } from '@/services/storage/settingsStorage';

export type LibraryState =
  | { status: 'idle' }
  | { status: 'loading'; directory: DirectoryRef }
  | { status: 'ready'; directory: DirectoryRef; tracks: Track[] }
  | { status: 'empty'; directory: DirectoryRef }
  | { status: 'error'; directory: DirectoryRef; error: LibraryError };

export interface LibraryStorage {
  load(): Promise<SavedDirectory | null>;
  save(directory: SavedDirectory): Promise<void>;
}

export interface LibraryDeps {
  source: LibrarySource;
  storage: LibraryStorage;
  probeDuration: DurationProbe;
}

export interface Library {
  state: LibraryState;
  /** Opens the system picker, or uses `directory` when the folder was chosen in-app. */
  chooseDirectory(directory?: DirectoryRef): Promise<void>;
  reload(): Promise<void>;
  /** True while a picker or initial restore is in progress. */
  busy: boolean;
}

export function needsNewDirectory(state: LibraryState): boolean {
  return (
    state.status === 'error' && (state.error === 'access-denied' || state.error === 'not-found')
  );
}

export function useLibrary({ source, storage, probeDuration }: LibraryDeps): Library {
  const [state, setState] = useState<LibraryState>({ status: 'idle' });
  const [busy, setBusy] = useState(true);
  const generation = useRef(0);

  const fillDurations = useCallback(
    async (scanId: number, tracks: Track[]) => {
      for (const track of tracks) {
        const durationMs = await probeDuration(track.uri);
        if (generation.current !== scanId) return;
        setState((current) => {
          if (current.status !== 'ready' || generation.current !== scanId) return current;
          const updated = current.tracks.map((item) =>
            item.id === track.id ? { ...item, durationMs } : item,
          );
          return { ...current, tracks: updated };
        });
      }
    },
    [probeDuration],
  );

  const scan = useCallback(
    async (directory: DirectoryRef) => {
      const scanId = ++generation.current;
      setState({ status: 'loading', directory });
      const result = await source.listAudioFiles(directory);
      if (generation.current !== scanId) return;
      if (!result.ok) {
        setState({ status: 'error', directory, error: result.error });
        return;
      }
      if (result.value.length === 0) {
        setState({ status: 'empty', directory });
        return;
      }
      setState({ status: 'ready', directory, tracks: result.value });
      void fillDurations(scanId, result.value);
    },
    [source, fillDurations],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await storage.load();
      if (cancelled) return;
      if (saved !== null) await scan(saved);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
      generation.current += 1;
    };
  }, [storage, scan]);

  const chooseDirectory = useCallback(
    async (directory?: DirectoryRef) => {
      setBusy(true);
      try {
        let chosen = directory;
        if (chosen === undefined) {
          const picked = await source.pickDirectory();
          if (!picked.ok) {
            setState((current) =>
              current.status === 'idle'
                ? current
                : { status: 'error', directory: current.directory, error: picked.error },
            );
            return;
          }
          if (picked.value === null) return;
          chosen = picked.value;
        }
        await storage.save(chosen);
        await scan(chosen);
      } finally {
        setBusy(false);
      }
    },
    [source, storage, scan],
  );

  const reload = useCallback(async () => {
    if (state.status !== 'idle') await scan(state.directory);
  }, [state, scan]);

  return useMemo(
    () => ({ state, chooseDirectory, reload, busy }),
    [state, chooseDirectory, reload, busy],
  );
}
