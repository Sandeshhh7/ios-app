import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio, AVPlaybackStatus, Sound } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

import { Track, PlayerTab, RepeatMode, AudioFormat } from './types';
import { INITIAL_TRACKS } from './data/sampleTracks';
import { FormatBadge } from './components/FormatBadge';
import { AudioVisualizer } from './components/AudioVisualizer';
import { SeekBar } from './components/SeekBar';
import { VolumeControl } from './components/VolumeControl';
import { TrackItem } from './components/TrackItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function AudioPlayerRoot() {
  const insets = useSafeAreaInsets();

  // Navigation State
  const [activeTab, setActiveTab] = useState<PlayerTab>('now_playing');

  // Media Collections
  const [library, setLibrary] = useState<Track[]>(INITIAL_TRACKS);
  const [queue, setQueue] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(180000);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isLiked, setIsLiked] = useState<boolean>(false);

  // Audio Instance Ref
  const soundRef = useRef<Sound | null>(null);

  const currentTrack: Track | undefined = queue[currentTrackIndex] || library[0];

  // Configure background playback and iOS audio session
  useEffect(() => {
    async function configureAudioSession() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
          shouldRouteThroughEarpieceIOS: false,
        });
      } catch (e) {
        console.warn('Could not set Audio mode for background playback:', e);
      }
    }
    configureAudioSession();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Update track duration when current track changes
  useEffect(() => {
    if (currentTrack?.duration) {
      setDurationMillis(currentTrack.duration * 1000);
    }
    setPositionMillis(0);
  }, [currentTrack]);

  // Playback status callback
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setIsPlaying(status.isPlaying);
    setPositionMillis(status.positionMillis);

    if (status.durationMillis && status.durationMillis > 0) {
      setDurationMillis(status.durationMillis);
    }

    // Auto-advance when track finishes
    if (status.didJustFinish) {
      handleTrackEnd();
    }
  };

  // Play / Load specified track
  const loadAndPlayTrack = async (track: Track, shouldAutoPlay = true) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        {
          shouldPlay: shouldAutoPlay,
          volume: isMuted ? 0 : volume,
          isLooping: repeatMode === 'one',
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(shouldAutoPlay);
    } catch (error) {
      console.warn('Audio playback initialized in simulated mode:', error);
      setIsPlaying(shouldAutoPlay);
    }
  };

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      if (soundRef.current) {
        soundRef.current.replayAsync();
      }
    } else if (repeatMode === 'all' || currentTrackIndex < queue.length - 1) {
      handleSkipNext();
    } else {
      setIsPlaying(false);
      setPositionMillis(0);
    }
  };

  const handlePlayPause = async () => {
    if (!currentTrack) return;

    if (!soundRef.current) {
      await loadAndPlayTrack(currentTrack, true);
      return;
    }

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleSkipNext = () => {
    if (queue.length === 0) return;

    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % queue.length;
    }

    setCurrentTrackIndex(nextIndex);
    loadAndPlayTrack(queue[nextIndex], true);
  };

  const handleSkipPrevious = () => {
    if (queue.length === 0) return;

    // If progress is greater than 3 seconds, restart current track
    if (positionMillis > 3000) {
      if (soundRef.current) {
        soundRef.current.setPositionAsync(0);
      }
      setPositionMillis(0);
      return;
    }

    const prevIndex = (currentTrackIndex - 1 + queue.length) % queue.length;
    setCurrentTrackIndex(prevIndex);
    loadAndPlayTrack(queue[prevIndex], true);
  };

  const handleSeek = async (targetMillis: number) => {
    setPositionMillis(targetMillis);
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(targetMillis);
    }
  };

  const handleVolumeChange = async (newVol: number) => {
    setVolume(newVol);
    if (isMuted) setIsMuted(false);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newVol);
    }
  };

  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (soundRef.current) {
      await soundRef.current.setIsMutedAsync(nextMuted);
    }
  };

  const handleToggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const handleCycleRepeat = async () => {
    const nextMode: RepeatMode =
      repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    setRepeatMode(nextMode);

    if (soundRef.current) {
      await soundRef.current.setIsLoopingAsync(nextMode === 'one');
    }
  };

  // Import Local Music Files using expo-document-picker
  const handleImportLocalMusic = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/*',
          'audio/flac',
          'audio/x-flac',
          'audio/mp3',
          'audio/mpeg',
          'audio/wav',
          'audio/x-wav',
          'audio/aac',
          'audio/x-m4a',
          'audio/ogg',
        ],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const importedList: Track[] = result.assets.map((asset, idx) => {
          const rawName = asset.name || `Track ${idx + 1}`;
          const ext = rawName.split('.').pop()?.toLowerCase() || 'mp3';

          let format: AudioFormat = 'MP3';
          let formatTag = 'MP3 320kbps';
          let isLossless = false;

          if (ext === 'flac') {
            format = 'FLAC';
            formatTag = 'FLAC 24-bit Lossless Studio';
            isLossless = true;
          } else if (ext === 'wav') {
            format = 'WAV';
            formatTag = 'WAV 24-bit Linear PCM';
            isLossless = true;
          } else if (ext === 'aac' || ext === 'm4a') {
            format = 'AAC';
            formatTag = 'AAC 256kbps Hi-Res';
            isLossless = false;
          } else if (ext === 'ogg') {
            format = 'OGG';
            formatTag = 'OGG Vorbis Q9';
            isLossless = false;
          }

          const cleanBase = rawName.replace(/\.[^/.]+$/, '');
          const parts = cleanBase.split(' - ');
          const artist = parts.length > 1 ? parts[0].trim() : 'Local Audio';
          const title = parts.length > 1 ? parts[1].trim() : cleanBase;

          const sizeTag = asset.size
            ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB`
            : undefined;

          return {
            id: `local-${Date.now()}-${idx}`,
            title,
            artist,
            album: 'Local Files',
            duration: 210,
            uri: asset.uri,
            artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
            format,
            formatTag,
            isLossless,
            sampleRate: isLossless ? '96.0 kHz' : '44.1 kHz',
            bitrate: isLossless ? '2800 kbps' : '320 kbps',
            fileSize: sizeTag,
            isLocal: true,
          };
        });

        setLibrary((prev) => [...importedList, ...prev]);
        setQueue((prev) => [...importedList, ...prev]);

        // Select and immediately play first picked track
        if (importedList.length > 0) {
          setCurrentTrackIndex(0);
          loadAndPlayTrack(importedList[0], true);
        }
      }
    } catch (err) {
      console.warn('Document Picker error:', err);
    }
  };

  const handleSelectTrack = (track: Track) => {
    const queueIdx = queue.findIndex((t) => t.id === track.id);
    if (queueIdx !== -1) {
      setCurrentTrackIndex(queueIdx);
    } else {
      setQueue((prev) => [track, ...prev]);
      setCurrentTrackIndex(0);
    }
    loadAndPlayTrack(track, true);
  };

  const handleRemoveFromQueue = (index: number) => {
    if (queue.length <= 1) return; // Keep at least one
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (index === currentTrackIndex) {
      const nextIdx = index < newQueue.length ? index : 0;
      setCurrentTrackIndex(nextIdx);
      loadAndPlayTrack(newQueue[nextIdx], isPlaying);
    } else if (index < currentTrackIndex) {
      setCurrentTrackIndex((prev) => prev - 1);
    }
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" />

      {/* Outer Mobile Frame container */}
      <View style={styles.phoneFrame}>
        {/* iOS Dynamic Island & Status Bar Top */}
        <View style={[styles.statusBarContainer, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.statusTime}>
            <Text style={styles.statusTimeText}>9:41</Text>
          </View>

          {/* Dynamic Island pill */}
          <Pressable
            onPress={() => setActiveTab('now_playing')}
            style={styles.dynamicIsland}
          >
            <View style={styles.islandArtworkWrapper}>
              <Image
                source={{ uri: currentTrack?.artwork }}
                style={styles.islandArtwork}
              />
            </View>
            <View style={styles.islandInfo}>
              <Text numberOfLines={1} style={styles.islandTitle}>
                {currentTrack?.title || 'No Track'}
              </Text>
            </View>
            <View style={styles.islandWave}>
              <Ionicons
                name={isPlaying ? 'pulse' : 'pause'}
                size={14}
                color={currentTrack?.isLossless ? '#F59E0B' : '#60A5FA'}
              />
            </View>
          </Pressable>

          <View style={styles.statusIcons}>
            <Ionicons name="radio" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Ionicons name="headset" size={14} color="#FFFFFF" />
          </View>
        </View>

        {/* Tab View Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'now_playing' && (
            <ScrollView
              contentContainerStyle={styles.nowPlayingScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Bar */}
              <View style={styles.screenHeaderRow}>
                <Pressable
                  onPress={() => setActiveTab('library')}
                  style={styles.headerIconButton}
                >
                  <Ionicons name="chevron-down" size={22} color="#D1D5DB" />
                </Pressable>

                <View style={styles.headerTitleCenter}>
                  <Text style={styles.headerSuperText}>PLAYING FROM LIBRARY</Text>
                  <Text numberOfLines={1} style={styles.headerSubText}>
                    {currentTrack?.album || 'Audiophile Hi-Res Master'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setActiveTab('queue')}
                  style={styles.headerIconButton}
                >
                  <Ionicons name="list" size={20} color="#D1D5DB" />
                </Pressable>
              </View>

              {/* Main Artwork Display */}
              <View style={styles.artworkContainer}>
                <View style={styles.artworkCard}>
                  <Image
                    source={{ uri: currentTrack?.artwork }}
                    style={styles.albumArtImage}
                  />
                  {/* Subtle Gradient / Glass overlay border */}
                  <View style={styles.artworkGlassRing} />
                </View>
              </View>

              {/* Audio Spectrum Visualizer */}
              <AudioVisualizer
                isPlaying={isPlaying}
                barCount={22}
                isLossless={currentTrack?.isLossless}
              />

              {/* Track Info & Like Action */}
              <View style={styles.trackInfoRow}>
                <View style={styles.titleArtistColumn}>
                  <Text numberOfLines={1} style={styles.currentTrackTitle}>
                    {currentTrack?.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.currentTrackArtist}>
                    {currentTrack?.artist}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setIsLiked(!isLiked)}
                  style={styles.likeButton}
                >
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isLiked ? '#EF4444' : '#9CA3AF'}
                  />
                </Pressable>
              </View>

              {/* Audiophile Format Badge */}
              <View style={styles.badgeRow}>
                {currentTrack && (
                  <FormatBadge track={currentTrack} detailed={true} />
                )}
                {currentTrack?.fileSize && (
                  <Text style={styles.fileSizeBadgeText}>
                    {currentTrack.fileSize}
                  </Text>
                )}
                {currentTrack?.isLocal && (
                  <View style={styles.localFileTag}>
                    <Ionicons name="folder-open" size={10} color="#60A5FA" style={{ marginRight: 3 }} />
                    <Text style={styles.localFileTagText}>Local File</Text>
                  </View>
                )}
              </View>

              {/* Seek Slider with Timestamps */}
              <SeekBar
                positionMillis={positionMillis}
                durationMillis={durationMillis}
                onSeek={handleSeek}
                accentColor={currentTrack?.isLossless ? '#F59E0B' : '#6366F1'}
              />

              {/* Primary Transport Playback Controls */}
              <View style={styles.controlsRow}>
                {/* Shuffle Button */}
                <Pressable
                  onPress={handleToggleShuffle}
                  style={styles.secondaryControlButton}
                >
                  <Ionicons
                    name="shuffle"
                    size={22}
                    color={isShuffle ? '#60A5FA' : '#6B7280'}
                  />
                </Pressable>

                {/* Previous Button */}
                <Pressable
                  onPress={handleSkipPrevious}
                  style={styles.skipButton}
                >
                  <Ionicons name="play-skip-back" size={26} color="#FFFFFF" />
                </Pressable>

                {/* Play / Pause Toggle Button */}
                <Pressable
                  onPress={handlePlayPause}
                  style={[
                    styles.playPauseButton,
                    currentTrack?.isLossless && styles.losslessPlayButton,
                  ]}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color="#090A0F"
                  />
                </Pressable>

                {/* Next Button */}
                <Pressable
                  onPress={handleSkipNext}
                  style={styles.skipButton}
                >
                  <Ionicons name="play-skip-forward" size={26} color="#FFFFFF" />
                </Pressable>

                {/* Repeat Button */}
                <Pressable
                  onPress={handleCycleRepeat}
                  style={styles.secondaryControlButton}
                >
                  <Ionicons
                    name={repeatMode === 'one' ? 'repeat-one' : 'repeat'}
                    size={22}
                    color={repeatMode !== 'off' ? '#60A5FA' : '#6B7280'}
                  />
                </Pressable>
              </View>

              {/* Volume Slider & Mute Toggle */}
              <View style={styles.volumeContainer}>
                <VolumeControl
                  volume={volume}
                  isMuted={isMuted}
                  onVolumeChange={handleVolumeChange}
                  onToggleMute={handleToggleMute}
                />
              </View>
            </ScrollView>
          )}

          {activeTab === 'library' && (
            <View style={styles.listViewWrapper}>
              {/* Library Header */}
              <View style={styles.listHeaderSection}>
                <View>
                  <Text style={styles.listHeaderTitle}>Local Library</Text>
                  <Text style={styles.listHeaderSubtitle}>
                    {library.length} Lossless & Hi-Res Tracks
                  </Text>
                </View>

                {/* Import Local Music Button */}
                <Pressable
                  onPress={handleImportLocalMusic}
                  style={styles.importButton}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.importButtonText}>Import</Text>
                </Pressable>
              </View>

              {/* Tracks List */}
              <FlatList
                data={library}
                keyExtractor={(item: Track) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }: { item: Track; index: number }) => (
                  <TrackItem
                    track={item}
                    index={index}
                    isActive={currentTrack?.id === item.id}
                    isPlaying={isPlaying && currentTrack?.id === item.id}
                    onPress={() => handleSelectTrack(item)}
                  />
                )}
                contentContainerStyle={styles.listContentPadding}
              />
            </View>
          )}

          {activeTab === 'queue' && (
            <View style={styles.listViewWrapper}>
              {/* Queue Header */}
              <View style={styles.listHeaderSection}>
                <View>
                  <Text style={styles.listHeaderTitle}>Up Next Queue</Text>
                  <Text style={styles.listHeaderSubtitle}>
                    Playing track {currentTrackIndex + 1} of {queue.length}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    setQueue(INITIAL_TRACKS);
                    setCurrentTrackIndex(0);
                  }}
                  style={styles.clearQueueButton}
                >
                  <Ionicons name="trash" size={16} color="#EF4444" />
                  <Text style={styles.clearQueueText}>Reset</Text>
                </Pressable>
              </View>

              {/* Queue List */}
              <FlatList
                data={queue}
                keyExtractor={(item: Track, idx: number) => `${item.id}-${idx}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }: { item: Track; index: number }) => (
                  <TrackItem
                    track={item}
                    index={index}
                    isActive={currentTrackIndex === index}
                    isPlaying={isPlaying && currentTrackIndex === index}
                    onPress={() => {
                      setCurrentTrackIndex(index);
                      loadAndPlayTrack(item, true);
                    }}
                    onRemoveFromQueue={() => handleRemoveFromQueue(index)}
                  />
                )}
                contentContainerStyle={styles.listContentPadding}
              />
            </View>
          )}
        </View>

        {/* Persistent Floating Mini-Player Bar (When on Library or Queue) */}
        {activeTab !== 'now_playing' && currentTrack && (
          <Pressable
            onPress={() => setActiveTab('now_playing')}
            style={styles.miniPlayerBar}
          >
            <Image
              source={{ uri: currentTrack.artwork }}
              style={styles.miniArtwork}
            />
            <View style={styles.miniMetaContainer}>
              <Text numberOfLines={1} style={styles.miniTitle}>
                {currentTrack.title}
              </Text>
              <Text numberOfLines={1} style={styles.miniArtist}>
                {currentTrack.artist} • {currentTrack.format}
              </Text>
            </View>

            <Pressable
              onPress={(e: any) => {
                if (e?.stopPropagation) e.stopPropagation();
                handlePlayPause();
              }}
              style={styles.miniPlayButton}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            <Pressable
              onPress={(e: any) => {
                if (e?.stopPropagation) e.stopPropagation();
                handleSkipNext();
              }}
              style={styles.miniSkipButton}
            >
              <Ionicons name="play-skip-forward" size={18} color="#D1D5DB" />
            </Pressable>
          </Pressable>
        )}

        {/* Bottom Tab Bar Navigation */}
        <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={() => setActiveTab('now_playing')}
            style={[styles.tabItem, activeTab === 'now_playing' && styles.tabItemActive]}
          >
            <Ionicons
              name="musical-notes"
              size={22}
              color={activeTab === 'now_playing' ? '#60A5FA' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'now_playing' && styles.tabLabelActive,
              ]}
            >
              Now Playing
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('library')}
            style={[styles.tabItem, activeTab === 'library' && styles.tabItemActive]}
          >
            <Ionicons
              name="library"
              size={22}
              color={activeTab === 'library' ? '#60A5FA' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'library' && styles.tabLabelActive,
              ]}
            >
              Library
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('queue')}
            style={[styles.tabItem, activeTab === 'queue' && styles.tabItemActive]}
          >
            <Ionicons
              name="list"
              size={22}
              color={activeTab === 'queue' ? '#60A5FA' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'queue' && styles.tabLabelActive,
              ]}
            >
              Queue
            </Text>
          </Pressable>
        </View>

        {/* iOS Home Indicator Bar */}
        <View style={styles.homeIndicatorWrapper}>
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AudioPlayerRoot />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#05060A',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 420,
    height: '100%',
    maxHeight: 890,
    backgroundColor: '#0C0E17',
    borderRadius: Platform.OS === 'web' ? 36 : 0,
    overflow: 'hidden',
    borderWidth: Platform.OS === 'web' ? 1.5 : 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.65,
    shadowRadius: 32,
    flexDirection: 'column',
  },
  statusBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  statusTime: {
    width: 60,
  },
  statusTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  dynamicIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  islandArtworkWrapper: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
  },
  islandArtwork: {
    width: '100%',
    height: '100%',
  },
  islandInfo: {
    maxWidth: 100,
  },
  islandTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  islandWave: {
    paddingLeft: 2,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'flex-end',
  },
  tabContentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  nowPlayingScroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  screenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  headerSuperText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  headerSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E7EB',
    marginTop: 2,
  },
  artworkContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 14,
  },
  artworkCard: {
    width: SCREEN_WIDTH > 380 ? 270 : 230,
    height: SCREEN_WIDTH > 380 ? 270 : 230,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    backgroundColor: '#161922',
  },
  albumArtImage: {
    width: '100%',
    height: '100%',
  },
  artworkGlassRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
    marginBottom: 6,
  },
  titleArtistColumn: {
    flex: 1,
    paddingRight: 12,
  },
  currentTrackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  currentTrackArtist: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  likeButton: {
    padding: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginBottom: 10,
  },
  fileSizeBadgeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  localFileTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  localFileTagText: {
    fontSize: 10,
    color: '#60A5FA',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 14,
  },
  secondaryControlButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  skipButton: {
    padding: 8,
  },
  playPauseButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  losslessPlayButton: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  volumeContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 6,
  },
  listViewWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  listHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listHeaderSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearQueueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  clearQueueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  listContentPadding: {
    paddingVertical: 10,
    paddingBottom: 90,
  },
  miniPlayerBar: {
    position: 'absolute',
    bottom: 74,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(24, 28, 42, 0.94)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    zIndex: 20,
  },
  miniArtwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  miniMetaContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  miniArtist: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  miniPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  miniSkipButton: {
    padding: 6,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(12, 14, 23, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  tabItemActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  homeIndicatorWrapper: {
    alignItems: 'center',
    paddingBottom: 6,
    backgroundColor: '#0C0E17',
  },
  homeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
