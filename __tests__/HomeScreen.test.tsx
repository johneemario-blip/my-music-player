import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';
import { selectedDirectoryKey } from '@/services/storage/settingsStorage';
import { resetFakeFs } from '@/test/fakeFileSystem';

import HomeScreen from '../app/index';

jest.mock('expo-file-system', () => jest.requireActual('@/test/fakeFileSystem'));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('@/services/audio/probeDuration', () => ({
  probeDuration: jest.fn(async () => 125000),
}));

const mockNativePlayer = {
  replace: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(async () => undefined),
  remove: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockNativePlayer),
  setAudioModeAsync: jest.fn(async () => undefined),
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

  it('starts playing a track when its row is tapped', async () => {
    await AsyncStorage.setItem(
      selectedDirectoryKey,
      JSON.stringify({ kind: 'documents', uri: '' }),
    );
    await render(<HomeScreen />);
    const row = await screen.findByRole('button', { name: 'second song, 2:05' });

    await userEvent.setup().press(row);

    expect(mockNativePlayer.replace).toHaveBeenCalledWith({
      uri: 'file:///app/Documents/Sub/second%20song.wav',
    });
    expect(mockNativePlayer.play).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'second song, 2:05' })).toBeSelected();
    expect(screen.getByTestId(testIds.playerTitle)).toHaveTextContent('second song');
    expect(screen.getByRole('button', { name: strings.player.pause })).toBeEnabled();
  });
});
