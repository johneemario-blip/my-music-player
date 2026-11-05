import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearSelectedDirectory,
  loadSelectedDirectory,
  saveSelectedDirectory,
  selectedDirectoryKey,
} from './settingsStorage';

describe('settingsStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns null when nothing was saved', async () => {
    await expect(loadSelectedDirectory()).resolves.toBeNull();
  });

  it('reads back a saved Android SAF directory', async () => {
    const directory = {
      kind: 'saf',
      uri: 'content://com.android.externalstorage.documents/tree/primary%3AMusic',
    } as const;

    await saveSelectedDirectory(directory);

    await expect(loadSelectedDirectory()).resolves.toEqual(directory);
  });

  it('replaces the previous directory with the new one', async () => {
    await saveSelectedDirectory({ kind: 'documents', uri: 'Old' });
    await saveSelectedDirectory({ kind: 'documents', uri: 'New' });

    await expect(loadSelectedDirectory()).resolves.toEqual({
      kind: 'documents',
      uri: 'New',
    });
  });

  it('keeps the whole iOS app folder, stored as an empty relative path', async () => {
    await saveSelectedDirectory({ kind: 'documents', uri: '' });

    await expect(loadSelectedDirectory()).resolves.toEqual({ kind: 'documents', uri: '' });
  });

  it('returns null after clearing', async () => {
    await saveSelectedDirectory({ kind: 'documents', uri: 'Rock' });
    await clearSelectedDirectory();

    await expect(loadSelectedDirectory()).resolves.toBeNull();
  });

  it.each([
    ['broken JSON', '{"kind":"saf",'],
    ['a JSON string', '"content://music"'],
    ['null', 'null'],
    ['unknown kind', '{"kind":"dropbox","uri":"x"}'],
    ['missing uri', '{"kind":"saf"}'],
    ['empty SAF uri', '{"kind":"saf","uri":""}'],
    ['non-string uri', '{"kind":"saf","uri":42}'],
  ])('returns null for a corrupted entry: %s', async (_label, raw) => {
    await AsyncStorage.setItem(selectedDirectoryKey, raw);

    await expect(loadSelectedDirectory()).resolves.toBeNull();
  });
});
