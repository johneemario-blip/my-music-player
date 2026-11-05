import AsyncStorage from '@react-native-async-storage/async-storage';

export type DirectoryKind = 'saf' | 'documents';

export interface SavedDirectory {
  kind: DirectoryKind;
  uri: string;
}

export const selectedDirectoryKey = 'settings.selectedDirectory.v1';

function isSavedDirectory(value: unknown): value is SavedDirectory {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.uri !== 'string') return false;
  // A `documents` ref holds a path relative to the app folder; '' means the whole app folder.
  if (candidate.kind === 'documents') return true;
  return candidate.kind === 'saf' && candidate.uri.length > 0;
}

function parseSavedDirectory(raw: string): SavedDirectory | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSavedDirectory(parsed) ? { kind: parsed.kind, uri: parsed.uri } : null;
  } catch {
    // A corrupted entry is treated as "nothing saved"; the user simply picks the folder again.
    return null;
  }
}

export async function loadSelectedDirectory(): Promise<SavedDirectory | null> {
  const raw = await AsyncStorage.getItem(selectedDirectoryKey);
  return raw === null ? null : parseSavedDirectory(raw);
}

export async function saveSelectedDirectory(directory: SavedDirectory): Promise<void> {
  await AsyncStorage.setItem(selectedDirectoryKey, JSON.stringify(directory));
}

export async function clearSelectedDirectory(): Promise<void> {
  await AsyncStorage.removeItem(selectedDirectoryKey);
}
