import { Asset } from 'expo-asset';

import { err, ok } from '@/lib/result';
import { sortTracks, trackNameFromFileName, type Track } from '@/lib/track';

import type { DirectoryRef, FolderListingSource, FolderOption } from './LibrarySource';

// Detox cannot drive the system folder pickers, so e2e builds (EXPO_PUBLIC_E2E=1) use bundled
// short audio fixtures exposed as two in-app folders.
const fixtureModules: Record<string, number> = {
  'alpha-tone.mp3': require('../../../e2e/fixtures/audio/alpha-tone.mp3'),
  'beta-tone.wav': require('../../../e2e/fixtures/audio/beta-tone.wav'),
  'gamma-tone.m4a': require('../../../e2e/fixtures/audio/gamma-tone.m4a'),
};

export const e2eFolders = { fixtures: 'Fixtures', empty: 'Empty' } as const;

const folderContents: Record<string, string[]> = {
  [e2eFolders.fixtures]: Object.keys(fixtureModules),
  [e2eFolders.empty]: [],
};

async function toTrack(fileName: string): Promise<Track> {
  const moduleId = fixtureModules[fileName];
  if (moduleId === undefined) throw new Error(`Unknown e2e fixture ${fileName}`);
  const [asset] = await Asset.loadAsync(moduleId);
  const uri = asset?.localUri ?? asset?.uri ?? '';
  return { id: fileName, uri, name: trackNameFromFileName(fileName), durationMs: null };
}

function folderOption(name: string): FolderOption {
  return { label: name, directory: { kind: 'documents', uri: name } };
}

export const e2eLibrarySource: FolderListingSource = {
  async pickDirectory() {
    return ok<DirectoryRef>(folderOption(e2eFolders.fixtures).directory);
  },

  async listFolders() {
    return ok([folderOption(e2eFolders.fixtures), folderOption(e2eFolders.empty)]);
  },

  async listAudioFiles(directory) {
    const files = folderContents[directory.uri];
    if (files === undefined) return err('not-found');
    return ok(sortTracks(await Promise.all(files.map(toTrack))));
  },

  async hasAccess(directory) {
    return directory.uri in folderContents;
  },
};
