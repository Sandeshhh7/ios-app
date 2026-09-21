import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Music,
  Library,
  ListMusic,
  Plus,
  FolderOpen,
  CheckCircle,
  Heart,
  MoreHorizontal,
  Search,
  ChevronDown,
  X,
  Trash2,
  Sparkles,
  Disc,
  Activity,
  Sliders,
  Radio,
  FileAudio,
  Headphones,
  UploadCloud,
  Share2,
} from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const iconMap: Record<string, React.ComponentType<{ size?: number | string; color?: string; className?: string }>> = {
  // Playback
  'play': Play,
  'pause': Pause,
  'play-skip-forward': SkipForward,
  'play-skip-back': SkipBack,
  'shuffle': Shuffle,
  'repeat': Repeat,
  'repeat-one': Repeat1,
  
  // Audio / Volume
  'volume-high': Volume2,
  'volume-medium': Volume1,
  'volume-low': Volume1,
  'volume-mute': VolumeX,
  'headset': Headphones,
  'radio': Radio,
  'pulse': Activity,
  'disc': Disc,

  // Navigation & Actions
  'musical-notes': Music,
  'library': Library,
  'list': ListMusic,
  'add': Plus,
  'add-circle': Plus,
  'folder-open': FolderOpen,
  'checkmark-circle': CheckCircle,
  'heart': Heart,
  'heart-outline': Heart,
  'ellipsis-horizontal': MoreHorizontal,
  'search': Search,
  'chevron-down': ChevronDown,
  'close': X,
  'trash': Trash2,
  'sparkles': Sparkles,
  'options': Sliders,
  'cloud-upload': UploadCloud,
  'share-outline': Share2,
  'document-text': FileAudio,
};

export const Ionicons = ({ name, size = 24, color = '#FFFFFF', style }: IconProps) => {
  // Normalize name (strip -outline, -sharp etc if needed)
  const normalized = name.replace('-outline', '').replace('-sharp', '');
  const IconComponent = iconMap[name] || iconMap[normalized] || Music;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontSize: size,
        lineHeight: 1,
        ...style,
      }}
    >
      <IconComponent size={size} color={color} />
    </span>
  );
};

export default {
  Ionicons,
};
