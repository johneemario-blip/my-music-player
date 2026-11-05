import { useEffect, useMemo } from 'react';

import { LibraryScreen } from '@/features/library/LibraryScreen';
import { useLibrary, type LibraryDeps } from '@/features/library/useLibrary';
import { usePlayer } from '@/features/player/usePlayer';
import type { Track } from '@/lib/track';
import { configureAudioSession, createExpoPlayerAdapter } from '@/services/audio/expoPlayerAdapter';
import { probeDuration } from '@/services/audio/probeDuration';
import { getLibrarySource } from '@/services/files';
import { loadSelectedDirectory, saveSelectedDirectory } from '@/services/storage/settingsStorage';

const noTracks: Track[] = [];

export default function HomeScreen() {
  const deps = useMemo<LibraryDeps>(
    () => ({
      source: getLibrarySource(),
      storage: { load: loadSelectedDirectory, save: saveSelectedDirectory },
      probeDuration,
    }),
    [],
  );
  const adapter = useMemo(() => createExpoPlayerAdapter(), []);
  const library = useLibrary(deps);
  const tracks = library.state.status === 'ready' ? library.state.tracks : noTracks;
  const player = usePlayer(tracks, adapter);

  useEffect(() => {
    void configureAudioSession();
  }, []);

  return (
    <LibraryScreen
      library={library}
      source={deps.source}
      activeTrackId={player.currentTrack?.id ?? null}
      onTrackPress={player.playTrack}
    />
  );
}
