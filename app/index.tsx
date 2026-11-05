import { useMemo } from 'react';

import { LibraryScreen } from '@/features/library/LibraryScreen';
import { useLibrary, type LibraryDeps } from '@/features/library/useLibrary';
import { probeDuration } from '@/services/audio/probeDuration';
import { getLibrarySource } from '@/services/files';
import { loadSelectedDirectory, saveSelectedDirectory } from '@/services/storage/settingsStorage';

export default function HomeScreen() {
  const deps = useMemo<LibraryDeps>(
    () => ({
      source: getLibrarySource(),
      storage: { load: loadSelectedDirectory, save: saveSelectedDirectory },
      probeDuration,
    }),
    [],
  );
  const library = useLibrary(deps);
  return <LibraryScreen library={library} source={deps.source} />;
}
