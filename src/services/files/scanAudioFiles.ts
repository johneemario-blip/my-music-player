import { Directory, File } from 'expo-file-system';

import {
  isSupportedAudioFile,
  sortTracks,
  trackNameFromFileName,
  type AudioPlatform,
  type Track,
} from '@/lib/track';

const maxDepth = 20;

function isHidden(name: string): boolean {
  return name.startsWith('.');
}

function collect(directory: Directory, platform: AudioPlatform, depth: number, out: Track[]) {
  for (const entry of directory.list()) {
    if (isHidden(entry.name)) continue;
    if (entry instanceof Directory) {
      if (depth < maxDepth) collect(entry, platform, depth + 1, out);
      continue;
    }
    if (entry instanceof File && isSupportedAudioFile(entry.name, platform)) {
      out.push({
        id: entry.uri,
        uri: entry.uri,
        name: trackNameFromFileName(entry.name),
        durationMs: null,
      });
    }
  }
}

/** Throws when the directory cannot be read (missing, permission revoked). */
export function scanAudioFiles(root: Directory, platform: AudioPlatform): Track[] {
  const tracks: Track[] = [];
  collect(root, platform, 0, tracks);
  return sortTracks(tracks);
}
