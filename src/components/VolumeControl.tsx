import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VolumeControlProps {
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  onVolumeChange: (newVolume: number) => void;
  onToggleMute: () => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}) => {
  const effectiveVolume = isMuted ? 0 : volume;
  const progressPercent = `${Math.round(effectiveVolume * 100)}%`;

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return 'volume-mute';
    if (volume < 0.4) return 'volume-low';
    if (volume < 0.75) return 'volume-medium';
    return 'volume-high';
  };

  const handleBarPress = (e: any) => {
    const clientX = e?.nativeEvent?.locationX !== undefined
      ? e.nativeEvent.locationX
      : (e?.clientX || 0);
    const targetWidth = e?.currentTarget?.clientWidth || 200;
    const ratio = Math.max(0, Math.min(1, clientX / targetWidth));
    onVolumeChange(ratio);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onToggleMute} style={styles.muteButton}>
        <Ionicons
          name={getVolumeIcon()}
          size={20}
          color={isMuted ? '#EF4444' : '#D1D5DB'}
        />
      </Pressable>

      <Pressable onPress={handleBarPress} style={styles.sliderTrackTouchable}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: progressPercent }]} />
          <View style={[styles.thumb, { left: progressPercent }]} />
        </View>
      </Pressable>

      <Text style={styles.volumeLabel}>
        {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    gap: 12,
  },
  muteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  sliderTrackTouchable: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: -6,
  },
  volumeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    width: 32,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
