import { render, screen, userEvent, within } from '@testing-library/react-native';

import { ok } from '@/lib/result';
import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';
import type { Track } from '@/lib/track';
import type {
  DirectoryRef,
  DocumentsLibrarySource,
  FolderOption,
  LibrarySource,
} from '@/services/files/LibrarySource';

import { LibraryScreen } from './LibraryScreen';
import type { Library, LibraryState } from './useLibrary';

const folder: DirectoryRef = { kind: 'saf', uri: 'content://tree/Music' };

const tracks: Track[] = [
  { id: '1', uri: 'content://tree/Music/a.mp3', name: 'Alpha Song', durationMs: 185000 },
  { id: '2', uri: 'content://tree/Music/b.wav', name: 'Beta Song', durationMs: 62000 },
  { id: '3', uri: 'content://tree/Music/c.m4a', name: 'Gamma Song', durationMs: null },
];

function library(state: LibraryState, overrides: Partial<Library> = {}): Library {
  return {
    state,
    chooseDirectory: jest.fn(async () => undefined),
    reload: jest.fn(async () => undefined),
    busy: false,
    ...overrides,
  };
}

const systemPickerSource: LibrarySource = {
  pickDirectory: jest.fn(async () => ok(folder)),
  listAudioFiles: jest.fn(async () => ok([])),
  hasAccess: jest.fn(async () => true),
};

function documentsSource(): DocumentsLibrarySource & { importFiles: jest.Mock } {
  return {
    ...systemPickerSource,
    listFolders: jest.fn(async () =>
      ok<FolderOption[]>([
        { label: '', directory: { kind: 'documents', uri: '' } },
        { label: 'Rock', directory: { kind: 'documents', uri: 'Rock' } },
      ]),
    ),
    importFiles: jest.fn(async () => ok({ imported: 2, skipped: 1 })),
  };
}

describe('LibraryScreen', () => {
  it('lists tracks with names without extension and m:ss durations', async () => {
    await render(
      <LibraryScreen
        library={library({ status: 'ready', directory: folder, tracks })}
        source={systemPickerSource}
      />,
    );

    expect(screen.getByRole('button', { name: 'Alpha Song, 3:05' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Beta Song, 1:02' })).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: `Gamma Song, ${strings.library.unknownDuration}` }),
    ).toBeOnTheScreen();
    expect(within(screen.getByTestId(testIds.trackRow(0))).getByText('3:05')).toBeOnTheScreen();
  });

  it('shows the no-folder state with a choose button', async () => {
    await render(
      <LibraryScreen library={library({ status: 'idle' })} source={systemPickerSource} />,
    );

    expect(screen.getByRole('header', { name: strings.library.emptyTitle })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: strings.library.chooseFolder })).toBeOnTheScreen();
  });

  it('shows the empty-folder state', async () => {
    await render(
      <LibraryScreen
        library={library({ status: 'empty', directory: folder })}
        source={systemPickerSource}
      />,
    );

    expect(screen.getByRole('header', { name: strings.library.noTracksTitle })).toBeOnTheScreen();
  });

  it('asks to choose the folder again when access was lost', async () => {
    await render(
      <LibraryScreen
        library={library({ status: 'error', directory: folder, error: 'access-denied' })}
        source={systemPickerSource}
      />,
    );

    expect(screen.getByRole('header', { name: strings.library.accessLostTitle })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: strings.library.retry })).toBeNull();
  });

  it('offers retry for other errors', async () => {
    const lib = library({ status: 'error', directory: folder, error: 'picker-failed' });
    await render(<LibraryScreen library={lib} source={systemPickerSource} />);

    await userEvent.setup().press(screen.getByRole('button', { name: strings.library.retry }));

    expect(lib.reload).toHaveBeenCalled();
  });

  it('shows a loading indicator while scanning', async () => {
    await render(
      <LibraryScreen
        library={library({ status: 'loading', directory: folder })}
        source={systemPickerSource}
      />,
    );

    expect(screen.getByTestId(testIds.libraryLoading)).toBeOnTheScreen();
  });

  it('opens the system picker when the source has no in-app folder list (Android)', async () => {
    const lib = library({ status: 'idle' });
    await render(<LibraryScreen library={lib} source={systemPickerSource} />);

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: strings.library.chooseFolder }));

    expect(lib.chooseDirectory).toHaveBeenCalledWith();
    expect(screen.queryByRole('button', { name: strings.library.importFiles })).toBeNull();
  });

  it('chooses a folder from the in-app list on iOS', async () => {
    const lib = library({ status: 'idle' });
    await render(<LibraryScreen library={lib} source={documentsSource()} />);
    const user = userEvent.setup();

    await user.press(screen.getByRole('button', { name: strings.library.chooseFolder }));
    expect(
      await screen.findByRole('button', { name: strings.folderPicker.appFolder }),
    ).toBeOnTheScreen();
    await user.press(await screen.findByRole('button', { name: 'Rock' }));

    expect(lib.chooseDirectory).toHaveBeenCalledWith({ kind: 'documents', uri: 'Rock' });
  });

  it('imports files on iOS into the current folder and reloads the list', async () => {
    const source = documentsSource();
    const lib = library({ status: 'ready', directory: { kind: 'documents', uri: 'Rock' }, tracks });
    await render(<LibraryScreen library={lib} source={source} />);

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: strings.library.importFiles }));

    expect(source.importFiles).toHaveBeenCalledWith({ kind: 'documents', uri: 'Rock' });
    expect(lib.reload).toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(strings.library.importResult(2, 1));
  });

  it('imports into the app folder and opens it when nothing was chosen yet', async () => {
    const source = documentsSource();
    const lib = library({ status: 'idle' });
    await render(<LibraryScreen library={lib} source={source} />);

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: strings.library.importFiles }));

    expect(source.importFiles).toHaveBeenCalledWith({ kind: 'documents', uri: '' });
    expect(lib.chooseDirectory).toHaveBeenCalledWith({ kind: 'documents', uri: '' });
  });

  it('highlights the active track', async () => {
    await render(
      <LibraryScreen
        library={library({ status: 'ready', directory: folder, tracks })}
        source={systemPickerSource}
        activeTrackId="2"
      />,
    );

    expect(screen.getByRole('button', { name: 'Beta Song, 1:02' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Alpha Song, 3:05' })).not.toBeSelected();
  });
});
