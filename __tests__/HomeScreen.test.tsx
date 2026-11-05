import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen } from '@testing-library/react-native';

import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';
import { selectedDirectoryKey } from '@/services/storage/settingsStorage';
import { resetFakeFs } from '@/test/fakeFileSystem';

import HomeScreen from '../app/index';

jest.mock('expo-file-system', () => jest.requireActual('@/test/fakeFileSystem'));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-asset', () => ({ Asset: { loadAsync: jest.fn() } }));
jest.mock('@/services/audio/probeDuration', () => ({
  probeDuration: jest.fn(async () => 125000),
}));

describe('HomeScreen (app entry)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetFakeFs(
      { 'first song.mp3': 'file', Sub: { 'second song.wav': 'file' } },
      'file:///app/Documents',
    );
  });

  it('shows the empty state with a choose-folder button when nothing was chosen', async () => {
    await render(<HomeScreen />);

    expect(
      await screen.findByRole('header', { name: strings.library.emptyTitle }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId(testIds.libraryScreen)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: strings.library.chooseFolder })).toBeOnTheScreen();
  });

  it('lists the tracks of the remembered folder on start', async () => {
    await AsyncStorage.setItem(
      selectedDirectoryKey,
      JSON.stringify({ kind: 'documents', uri: '' }),
    );

    await render(<HomeScreen />);

    expect(await screen.findByRole('button', { name: 'first song, 2:05' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'second song, 2:05' })).toBeOnTheScreen();
  });
});
