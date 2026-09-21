import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '../types';

interface FormatBadgeProps {
  track: Track;
  detailed?: boolean;
}

export const FormatBadge: React.FC<FormatBadgeProps> = ({ track, detailed = false }) => {
  const isFlac = track.format === 'FLAC';
  const isLossless = track.isLossless;

  return (
    <View style={[styles.badgeContainer, isLossless ? styles.losslessBadge : styles.lossyBadge]}>
      {isLossless && (
        <Ionicons
          name="sparkles"
          size={11}
          color="#F59E0B"
          style={styles.icon}
        />
      )}
      <Text style={[styles.badgeText, isLossless ? styles.losslessText : styles.lossyText]}>
        {detailed ? track.formatTag : track.format}
      </Text>
      {detailed && track.sampleRate && (
        <View style={styles.separatorDot} />
      )}
      {detailed && track.sampleRate && (
        <Text style={styles.specText}>{track.sampleRate}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  losslessBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  lossyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  icon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  losslessText: {
    color: '#FBBF24',
  },
  lossyText: {
    color: '#9CA3AF',
  },
  separatorDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  specText: {
    fontSize: 10,
    color: '#D1D5DB',
    fontWeight: '500',
  },
});
