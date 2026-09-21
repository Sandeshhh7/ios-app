import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '../types';
import { FormatBadge } from './FormatBadge';

interface TrackItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onPress: () => void;
  onRemoveFromQueue?: () => void;
  index?: number;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  isActive,
  isPlaying,
  onPress,
  onRemoveFromQueue,
  index,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        isActive && styles.activeContainer,
      ]}
    >
      {/* Index or active indicator */}
      <View style={styles.leadingContainer}>
        {isActive ? (
          <View style={styles.playingIndicator}>
            <Ionicons
              name={isPlaying ? 'pulse' : 'pause'}
              size={18}
              color={track.isLossless ? '#F59E0B' : '#60A5FA'}
            />
          </View>
        ) : (
          <Text style={styles.indexText}>
            {index !== undefined ? String(index + 1).padStart(2, '0') : ''}
          </Text>
        )}
      </View>

      {/* Album Artwork */}
      <View style={styles.artworkWrapper}>
        <Image
          source={{ uri: track.artwork }}
          style={styles.artwork}
        />
        {track.isLossless && (
          <View style={styles.losslessPip}>
            <Ionicons name="sparkles" size={8} color="#F59E0B" />
          </View>
        )}
      </View>

      {/* Metadata */}
      <View style={styles.metaContainer}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            isActive && (track.isLossless ? styles.activeLosslessTitle : styles.activeTitle),
          ]}
        >
          {track.title}
        </Text>
        <View style={styles.subMetaRow}>
          <Text numberOfLines={1} style={styles.artist}>
            {track.artist}
          </Text>
          <View style={styles.bullet} />
          <FormatBadge track={track} detailed={false} />
        </View>
      </View>

      {/* Trailing actions / duration */}
      <View style={styles.trailingContainer}>
        <Text style={styles.durationText}>
          {formatDuration(track.duration)}
        </Text>
        {onRemoveFromQueue && (
          <Pressable
            onPress={(e: any) => {
              if (e?.stopPropagation) e.stopPropagation();
              onRemoveFromQueue();
            }}
            style={styles.removeButton}
          >
            <Ionicons name="close" size={16} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  activeContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  leadingContainer: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  indexText: {
    fontSize: 12,
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  playingIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkWrapper: {
    width: 46,
    height: 46,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E2230',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  losslessPip: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    padding: 2,
  },
  metaContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  activeTitle: {
    color: '#818CF8',
    fontWeight: '700',
  },
  activeLosslessTitle: {
    color: '#FBBF24',
    fontWeight: '700',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artist: {
    fontSize: 12,
    color: '#9CA3AF',
    maxWidth: 120,
  },
  bullet: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  trailingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  durationText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontVariant: ['tabular-nums'],
  },
  removeButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
