export const strings = {
  appTitle: 'My Music Player',
  library: {
    chooseFolder: 'Choose folder',
    importFiles: 'Import files',
    emptyTitle: 'No folder selected',
    emptyHint: 'Choose a folder with your music to see the tracks.',
    loading: 'Loading tracks',
    noTracksTitle: 'No audio files here',
    noTracksHint: 'This folder has no MP3, WAV or other supported audio files.',
    accessLostTitle: "Can't open the folder",
    accessLostHint: 'The folder was moved or access was removed. Choose it again.',
    errorTitle: 'Something went wrong',
    errorHint: 'The folder could not be read.',
    retry: 'Try again',
    unknownDuration: '–:––',
    trackCount: (count: number) => (count === 1 ? '1 track' : `${count} tracks`),
    importResult: (imported: number, skipped: number) =>
      skipped === 0
        ? `Imported ${imported} ${imported === 1 ? 'file' : 'files'}`
        : `Imported ${imported}, skipped ${skipped} unsupported`,
    importFailed: 'Import failed. Try again.',
    trackLabel: (name: string, duration: string) => `${name}, ${duration}`,
  },
  folderPicker: {
    title: 'Choose folder',
    appFolder: 'All music (app folder)',
    cancel: 'Cancel',
    hint: 'Add music in the Files app: On My iPhone › My Music Player.',
  },
} as const;
