import type { Result } from '@/lib/result';
import type { Track } from '@/lib/track';
import type { SavedDirectory } from '@/services/storage/settingsStorage';

export type DirectoryRef = SavedDirectory;

export type LibraryError = 'access-denied' | 'not-found' | 'picker-failed';

export interface LibrarySource {
  /** Opens the system folder picker. `null` value = the user cancelled. */
  pickDirectory(): Promise<Result<DirectoryRef | null, LibraryError>>;
  /** Lists supported audio files in the directory and all its subdirectories, sorted by name. */
  listAudioFiles(directory: DirectoryRef): Promise<Result<Track[], LibraryError>>;
  hasAccess(directory: DirectoryRef): Promise<boolean>;
}
