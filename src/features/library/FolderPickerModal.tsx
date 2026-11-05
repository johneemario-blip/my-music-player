import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';
import { useTheme } from '@/lib/theme';
import type { DirectoryRef, FolderOption } from '@/services/files/LibrarySource';

interface Props {
  visible: boolean;
  folders: FolderOption[];
  onSelect: (directory: DirectoryRef) => void;
  onCancel: () => void;
}

function folderLabel(folder: FolderOption): string {
  return folder.label === '' ? strings.folderPicker.appFolder : folder.label;
}

export function FolderPickerModal({ visible, folders, onSelect, onCancel }: Props) {
  const theme = useTheme();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        testID={testIds.folderPicker}
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
            {strings.folderPicker.title}
          </Text>
          <AppButton
            label={strings.folderPicker.cancel}
            onPress={onCancel}
            testID={testIds.folderPickerCancel}
            variant="secondary"
          />
        </View>
        <Text style={[styles.hint, { color: theme.textMuted }]}>{strings.folderPicker.hint}</Text>
        <FlatList
          data={folders}
          keyExtractor={(folder) => folder.directory.uri || 'root'}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(item.directory)}
              testID={testIds.folderOption(item.label)}
              style={({ pressed }) => [
                styles.option,
                { borderBottomColor: theme.separator },
                pressed && { backgroundColor: theme.highlight },
              ]}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>{folderLabel(item)}</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: '700' },
  hint: { paddingHorizontal: 16, paddingBottom: 12, fontSize: 14 },
  option: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 16 },
});
