import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';
import { useTheme } from '@/lib/theme';
import { formatDuration } from '@/lib/track';

import type { Player } from './usePlayer';

interface Props {
  player: Player;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

interface TransportButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled: boolean;
  testID: string;
  large?: boolean;
}

function TransportButton({ icon, label, onPress, disabled, testID, large }: TransportButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      hitSlop={8}
      style={({ pressed }) => [styles.transport, { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={large ? 40 : 28} color={theme.accent} />
    </Pressable>
  );
}

export function PlayerBar({ player }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, currentTrack } = player;
  const [dragPositionMs, setDragPositionMs] = useState<number | null>(null);
  const hasTrack = currentTrack !== null;
  const isPlaying = state.playback === 'playing';
  const positionMs = dragPositionMs ?? state.positionMs;
  const durationMs = Math.max(state.durationMs, 1);

  const finishSeek = (value: number) => {
    setDragPositionMs(null);
    player.seek(value);
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.separator,
          paddingBottom: insets.bottom + 8,
        },
      ]}
      testID={testIds.playerBar}
    >
      <Text
        numberOfLines={1}
        style={[styles.title, { color: hasTrack ? theme.text : theme.textMuted }]}
        testID={testIds.playerTitle}
      >
        {currentTrack?.name ?? strings.player.nothingPlaying}
      </Text>
      {state.failedTrackName !== null && (
        <Text accessibilityRole="alert" style={[styles.failure, { color: theme.danger }]}>
          {strings.player.cannotPlay(state.failedTrackName)}
        </Text>
      )}
      <Slider
        accessibilityLabel={strings.player.seek}
        disabled={!hasTrack}
        minimumValue={0}
        maximumValue={durationMs}
        value={Math.min(positionMs, durationMs)}
        onSlidingStart={setDragPositionMs}
        onValueChange={(value) =>
          setDragPositionMs((dragging) => (dragging === null ? null : value))
        }
        onSlidingComplete={finishSeek}
        minimumTrackTintColor={theme.accent}
        maximumTrackTintColor={theme.separator}
        thumbTintColor={theme.accent}
        tapToSeek
        testID={testIds.playerSlider}
        style={styles.slider}
      />
      <View style={styles.times}>
        <Text style={[styles.time, { color: theme.textMuted }]} testID={testIds.playerPosition}>
          {formatDuration(positionMs)}
        </Text>
        <Text style={[styles.time, { color: theme.textMuted }]} testID={testIds.playerDuration}>
          {formatDuration(state.durationMs)}
        </Text>
      </View>
      <View style={styles.controls}>
        <TransportButton
          icon="play-skip-back"
          label={strings.player.previous}
          onPress={player.previous}
          disabled={!hasTrack}
          testID={testIds.playerPrevious}
        />
        <TransportButton
          icon={isPlaying ? 'pause-circle' : 'play-circle'}
          label={isPlaying ? strings.player.pause : strings.player.play}
          onPress={player.togglePlay}
          disabled={!hasTrack}
          testID={testIds.playerPlayPause}
          large
        />
        <TransportButton
          icon="stop"
          label={strings.player.stop}
          onPress={player.stop}
          disabled={!hasTrack}
          testID={testIds.playerStop}
        />
        <TransportButton
          icon="play-skip-forward"
          label={strings.player.next}
          onPress={player.next}
          disabled={!hasTrack}
          testID={testIds.playerNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  failure: { fontSize: 13, marginTop: 4 },
  slider: { height: 40, marginTop: 4 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 13, fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 4,
  },
  transport: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
