import type { Result } from '@/lib/result';
import type { Track } from '@/lib/track';
import type { SavedDirectory } from '@/services/storage/settingsStorage';

export type DirectoryRef = SavedDirectory;

export type LibraryError = 'access-denied' | 'not-found' | 'picker-failed' | 'import-failed';

export interface LibrarySource {
  /** Opens the system folder picker. `null` value = the user cancelled. */
  pickDirectory(): Promise<Result<DirectoryRef | null, LibraryError>>;
  /** Lists supported audio files in the directory and all its subdirectories, sorted by name. */
  listAudioFiles(directory: DirectoryRef): Promise<Result<Track[], LibraryError>>;
  hasAccess(directory: DirectoryRef): Promise<boolean>;
}

export interface FolderOption {
  /** Path shown to the user, e.g. `Albums/Live`; empty string = the app's root folder. */
  label: string;
  directory: DirectoryRef;
}

export interface ImportSummary {
  imported: number;
  skipped: number;
}

/** A source whose folders are chosen from an in-app list instead of a system picker. */
export interface FolderListingSource extends LibrarySource {
  listFolders(): Promise<Result<FolderOption[], LibraryError>>;
}

/** A source that can copy files picked by the user into the library. */
export interface FileImportingSource extends LibrarySource {
  /** Opens the system file picker and copies supported audio files into `target`. */
  importFiles(target: DirectoryRef): Promise<Result<ImportSummary, LibraryError>>;
}

/**
 * iOS cannot grant access to arbitrary folders, so the library lives in the app's Documents
 * folder (visible in the Files app). `documents` refs store a path RELATIVE to Documents,
 * because the absolute container path changes when the app is reinstalled or updated.
 */
export type DocumentsLibrarySource = FolderListingSource & FileImportingSource;

export function canListFolders(source: LibrarySource): source is FolderListingSource {
  return 'listFolders' in source && typeof source.listFolders === 'function';
}

export function canImportFiles(source: LibrarySource): source is FileImportingSource {
  return 'importFiles' in source && typeof source.importFiles === 'function';
}
