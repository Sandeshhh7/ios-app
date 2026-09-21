export type AudioFormat = 'FLAC' | 'MP3' | 'WAV' | 'AAC' | 'OGG' | 'M4A' | 'ALAC';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // In seconds
  uri: string;
  artwork: string;
  format: AudioFormat;
  formatTag: string; // e.g., "FLAC 24-bit/96kHz" or "MP3 320kbps"
  isLossless: boolean;
  bitrate?: string;
  sampleRate?: string;
  fileSize?: string;
  isLocal?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type PlayerTab = 'now_playing' | 'library' | 'queue';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isLoading: boolean;
}
