import { Directory } from 'expo-file-system';

import { err, ok } from '@/lib/result';

import type { DirectoryRef, LibrarySource } from './LibrarySource';
import { scanAudioFiles } from './scanAudioFiles';

function isCancellation(error: unknown): boolean {
  return error instanceof Error && /cancel/i.test(error.message);
}

function canRead(directory: Directory): boolean {
  try {
    if (!directory.exists) return false;
    directory.list();
    return true;
  } catch {
    // A revoked SAF grant surfaces as a thrown SecurityException — that is exactly "no access".
    return false;
  }
}

export const androidLibrarySource: LibrarySource = {
  async pickDirectory() {
    try {
      const picked = await Directory.pickDirectoryAsync();
      return ok<DirectoryRef>({ kind: 'saf', uri: picked.uri });
    } catch (error) {
      if (isCancellation(error)) return ok(null);
      return err('picker-failed');
    }
  },

  async listAudioFiles(directoryRef) {
    const directory = new Directory(directoryRef.uri);
    if (!canRead(directory)) {
      return err(directory.exists ? 'access-denied' : 'not-found');
    }
    try {
      return ok(scanAudioFiles(directory, 'android'));
    } catch {
      return err('access-denied');
    }
  },

  async hasAccess(directoryRef) {
    return canRead(new Directory(directoryRef.uri));
  },
};
