export type SourceType = 'youtube' | 'local' | 'direct' | 'hls' | 'dash' | 'empty';

export interface SourceItem {
  type: SourceType;
  url: string;
  title: string;
  file?: File;
  fileBlobUrl?: string;
  fileName?: string;
  youtubeId?: string;
  youtubePlaylistId?: string;
  isLive?: boolean;
}

export type MediaSourceConfig = SourceItem;

export type ChannelColorName = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'orange';

export interface PlayerChannelState {
  id: string; // Dynamic player ID (e.g. "1", "2", "3", "4" or "A", "B", etc.)
  channelNumber: number;
  channelName: string;
  color: ChannelColorName;
  source: SourceItem;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0 to 100
  currentTime: number; // seconds
  duration: number; // seconds
  isLive: boolean;
  playbackRate: number;
  isLoading: boolean;
  buffering?: boolean;
  error: string | null;
}

export interface DualPlayerGlobalState {
  isAllPlaying: boolean;
  isSynchronized: boolean;
  masterVolume: number; // 0 to 100
}

export interface SamplePreset {
  id?: string;
  title: string;
  category: 'YouTube' | 'YouTube Live' | 'Custom' | 'HLS (.m3u8)' | 'DASH (.mpd)' | 'Direct MP4' | string;
  type: SourceType;
  url: string;
  youtubeId?: string;
  youtubePlaylistId?: string;
  description: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface SavedPlayerConfig {
  id: string;
  channelNumber: number;
  channelName: string;
  color: ChannelColorName;
  source: SourceItem;
}

export interface SavedLayoutConfig {
  id: string;
  name: string;
  createdAt: string;
  layoutMode: 'grid' | 'split' | 'single';
  players: SavedPlayerConfig[];
}

export interface PlaylistVideoItem {
  id: string;
  title: string;
  url: string;
  youtubeId?: string;
  youtubePlaylistId?: string;
  type: SourceType;
  thumbnailUrl?: string;
  channelTitle?: string;
  addedAt: string;
}

export interface CustomPlaylist {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isCustom?: boolean;
  videos: PlaylistVideoItem[];
}

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  isGuest?: boolean;
}

export interface ChannelAudioSetting {
  id: string;
  volume: number;
  isMuted: boolean;
}

export interface AppProductionState {
  version: number;
  lastSavedAt: string;
  userEmail?: string;
  layoutMode: 'grid' | 'split' | 'single';
  players: SavedPlayerConfig[];
  audioSettings?: ChannelAudioSetting[];
  playlists: CustomPlaylist[];
  savedLayouts: SavedLayoutConfig[];
  autoSaveEnabled?: boolean;
}

export interface CloudSnapshot {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  channelCount: number;
  layoutMode: string;
  state: AppProductionState;
}

export type CloudSyncStatus = 'synced' | 'saving' | 'offline' | 'error' | 'idle';
