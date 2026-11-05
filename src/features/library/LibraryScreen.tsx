import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';
import { useTheme } from '@/lib/theme';
import type { Track } from '@/lib/track';
import {
  canImportFiles,
  canListFolders,
  type DirectoryRef,
  type FolderOption,
  type LibrarySource,
} from '@/services/files/LibrarySource';

import { FolderPickerModal } from './FolderPickerModal';
import { TrackRow, trackRowHeight } from './TrackRow';
import { needsNewDirectory, type Library, type LibraryState } from './useLibrary';

interface Props {
  library: Library;
  source: LibrarySource;
  activeTrackId?: string | null;
  onTrackPress?: (index: number) => void;
}

const appRootFolder: DirectoryRef = { kind: 'documents', uri: '' };

function MessageView({ title, hint }: { title: string; hint: string }) {
  const theme = useTheme();
  return (
    <View style={styles.message} testID={testIds.libraryStatus}>
      <Text accessibilityRole="header" style={[styles.messageTitle, { color: theme.text }]}>
        {title}
      </Text>
      <Text style={[styles.messageHint, { color: theme.textMuted }]}>{hint}</Text>
    </View>
  );
}

function StateView({ state, onRetry }: { state: LibraryState; onRetry: () => void }) {
  const theme = useTheme();
  switch (state.status) {
    case 'idle':
      return <MessageView title={strings.library.emptyTitle} hint={strings.library.emptyHint} />;
    case 'loading':
      return (
        <View style={styles.message}>
          <ActivityIndicator
            accessibilityLabel={strings.library.loading}
            color={theme.accent}
            testID={testIds.libraryLoading}
          />
        </View>
      );
    case 'empty':
      return (
        <MessageView title={strings.library.noTracksTitle} hint={strings.library.noTracksHint} />
      );
    case 'error':
      if (needsNewDirectory(state)) {
        return (
          <MessageView
            title={strings.library.accessLostTitle}
            hint={strings.library.accessLostHint}
          />
        );
      }
      return (
        <View style={styles.message}>
          <MessageView title={strings.library.errorTitle} hint={strings.library.errorHint} />
          <AppButton label={strings.library.retry} onPress={onRetry} testID={testIds.retry} />
        </View>
      );
    case 'ready':
      return null;
  }
}

function LibraryScreenComponent({ library, source, activeTrackId = null, onTrackPress }: Props) {
  const theme = useTheme();
  const { state, chooseDirectory, reload, busy } = library;
  const [folders, setFolders] = useState<FolderOption[] | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const openFolderChooser = useCallback(async () => {
    if (!canListFolders(source)) {
      await chooseDirectory();
      return;
    }
    const listed = await source.listFolders();
    if (listed.ok) setFolders(listed.value);
  }, [source, chooseDirectory]);

  const selectFolder = useCallback(
    async (directory: DirectoryRef) => {
      setFolders(null);
      await chooseDirectory(directory);
    },
    [chooseDirectory],
  );

  const importFiles = useCallback(async () => {
    if (!canImportFiles(source)) return;
    const target = state.status === 'idle' ? appRootFolder : state.directory;
    const result = await source.importFiles(target);
    if (!result.ok) {
      setImportMessage(strings.library.importFailed);
      return;
    }
    if (result.value.imported === 0 && result.value.skipped === 0) return;
    setImportMessage(strings.library.importResult(result.value.imported, result.value.skipped));
    if (state.status === 'idle') await chooseDirectory(appRootFolder);
    else await reload();
  }, [source, state, chooseDirectory, reload]);

  const renderTrack = useCallback(
    ({ item, index }: { item: Track; index: number }) => (
      <TrackRow
        track={item}
        index={index}
        isActive={item.id === activeTrackId}
        onPress={onTrackPress}
        testID={testIds.trackRow(index)}
      />
    ),
    [activeTrackId, onTrackPress],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      testID={testIds.libraryScreen}
    >
      <View style={[styles.toolbar, { borderBottomColor: theme.separator }]}>
        <AppButton
          label={strings.library.chooseFolder}
          onPress={openFolderChooser}
          testID={testIds.chooseFolder}
          disabled={busy}
        />
        {canImportFiles(source) && (
          <AppButton
            label={strings.library.importFiles}
            onPress={importFiles}
            testID={testIds.importFiles}
            disabled={busy}
            variant="secondary"
          />
        )}
      </View>
      {importMessage !== null && (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.importMessage, { color: theme.textMuted }]}
        >
          {importMessage}
        </Text>
      )}
      {state.status === 'ready' ? (
        <FlatList
          data={state.tracks}
          keyExtractor={(track) => track.id}
          renderItem={renderTrack}
          getItemLayout={(_data, index) => ({
            length: trackRowHeight,
            offset: trackRowHeight * index,
            index,
          })}
          testID={testIds.trackList}
          accessibilityLabel={strings.library.trackCount(state.tracks.length)}
        />
      ) : (
        <StateView state={state} onRetry={reload} />
      )}
      <FolderPickerModal
        visible={folders !== null}
        folders={folders ?? []}
        onSelect={selectFolder}
        onCancel={() => setFolders(null)}
      />
    </View>
  );
}

// Memoized: the player re-renders its parent several times per second while a track plays.
export const LibraryScreen = memo(LibraryScreenComponent);

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  importMessage: { paddingHorizontal: 16, paddingTop: 8, fontSize: 14 },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  messageTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  messageHint: { fontSize: 15, textAlign: 'center' },
});
