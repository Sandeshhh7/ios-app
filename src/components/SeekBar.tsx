import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface SeekBarProps {
  positionMillis: number;
  durationMillis: number;
  onSeek: (positionMillis: number) => void;
  accentColor?: string;
}

function formatMillis(millis: number): string {
  if (!millis || isNaN(millis) || millis < 0) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const padMin = String(minutes).padStart(2, '0');
  const padSec = String(seconds).padStart(2, '0');
  return `${padMin}:${padSec}`;
}

export const SeekBar: React.FC<SeekBarProps> = ({
  positionMillis,
  durationMillis,
  onSeek,
  accentColor = '#6366F1',
}) => {
  const trackRef = useRef<any>(null);
  const safeDuration = durationMillis > 0 ? durationMillis : 1;
  const progressRatio = Math.max(0, Math.min(1, positionMillis / safeDuration));
  const progressPercent = `${(progressRatio * 100).toFixed(2)}%`;

  const handleSeekPress = (e: any) => {
    // Check if web nativeEvent or RN nativeEvent
    const clientX = e?.nativeEvent?.locationX !== undefined
      ? e.nativeEvent.locationX
      : (e?.clientX || 0);

    // If we have track element layout width
    const targetWidth = e?.currentTarget?.clientWidth || 320;
    const ratio = Math.max(0, Math.min(1, clientX / targetWidth));
    const targetMillis = Math.round(ratio * durationMillis);
    onSeek(targetMillis);
  };

  return (
    <View style={styles.container}>
      <Pressable
        ref={trackRef}
        onPress={handleSeekPress}
        style={styles.touchableArea}
      >
        <View style={styles.trackBackground}>
          <View
            style={[
              styles.trackFill,
              { width: progressPercent, backgroundColor: accentColor },
            ]}
          />
          <View
            style={[
              styles.scrubThumb,
              { left: progressPercent, borderColor: accentColor },
            ]}
          />
        </View>
      </Pressable>

      <View style={styles.timeLabelsRow}>
        <Text style={styles.timeText}>{formatMillis(positionMillis)}</Text>
        <Text style={styles.timeText}>{formatMillis(durationMillis)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  touchableArea: {
    height: 24,
    justifyContent: 'center',
    width: '100%',
  },
  trackBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrubThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
});
