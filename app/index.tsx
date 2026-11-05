import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';

export default function HomeScreen() {
  return (
    <View style={styles.container} testID={testIds.libraryScreen}>
      <Text accessibilityRole="header" style={styles.title}>
        {strings.library.emptyTitle}
      </Text>
      <Text style={styles.hint}>{strings.library.emptyHint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  title: { fontSize: 18, fontWeight: '600' },
  hint: { textAlign: 'center', opacity: 0.7 },
});
