import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '@/lib/strings';
import { useTheme } from '@/lib/theme';
import { formatDuration, type Track } from '@/lib/track';

export const trackRowHeight = 60;

interface Props {
  track: Track;
  index: number;
  isActive: boolean;
  onPress?: (index: number) => void;
  testID?: string;
}

export function trackDurationLabel(durationMs: number | null): string {
  return durationMs === null ? strings.library.unknownDuration : formatDuration(durationMs);
}

function TrackRowComponent({ track, index, isActive, onPress, testID }: Props) {
  const theme = useTheme();
  const duration = trackDurationLabel(track.durationMs);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={strings.library.trackLabel(track.name, duration)}
      accessibilityState={{ selected: isActive }}
      onPress={onPress ? () => onPress(index) : undefined}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.separator },
        (isActive || pressed) && { backgroundColor: theme.highlight },
      ]}
    >
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>
          {track.name}
        </Text>
      </View>
      <Text style={[styles.duration, { color: theme.textMuted }]}>{duration}</Text>
    </Pressable>
  );
}

export const TrackRow = memo(TrackRowComponent);

const styles = StyleSheet.create({
  row: {
    height: trackRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  texts: { flex: 1 },
  name: { fontSize: 16 },
  duration: { fontSize: 14, fontVariant: ['tabular-nums'] },
});
