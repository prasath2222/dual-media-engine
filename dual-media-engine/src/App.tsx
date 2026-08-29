import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, Grid, Columns, Rows, HelpCircle, Youtube, Sparkles, SlidersHorizontal,
  Save, FolderOpen, ListMusic, X, Cloud, CloudUpload, CheckCircle2
} from 'lucide-react';
import { 
  MediaSourceConfig, PlayerChannelState, ChannelColorName, SavedLayoutConfig, 
  SavedPlayerConfig, AppProductionState, GoogleUserProfile 
} from './types';
import { UnifiedPlayer, PlayerHandle } from './components/UnifiedPlayer';
import { SourceSelectionModal } from './components/SourceSelectionModal';
import { GlobalControls, LayoutMode } from './components/GlobalControls';
import { AudioArchitectureModal } from './components/AudioArchitectureModal';
import { SavedConfigsModal } from './components/SavedConfigsModal';
import { PlaylistManager } from './components/PlaylistManager';
import { GoogleAuthButton } from './components/GoogleAuthButton';
import { CloudSyncModal } from './components/CloudSyncModal';
import { GoogleAuthService } from './lib/googleAuthService';
import { CloudSyncService } from './lib/cloudSyncService';
import { PlaylistStorageService } from './lib/playlistStorage';
import { ConfigStorageService } from './lib/configStorage';
import { COLOR_PALETTE } from './lib/channelThemes';

interface PlayerInstance {
  id: string;
  channelNumber: number;
  channelName: string;
  color: ChannelColorName;
  source: MediaSourceConfig;
}

export const DEFAULT_STREAM_POOL: MediaSourceConfig[] = [
  {
    type: 'youtube',
    youtubeId: 'gCNeDWCI0vo',
    url: 'https://www.youtube.com/live/gCNeDWCI0vo',
    title: 'YouTube Stream 1 (gCNeDWCI0vo)'
  },
  {
    type: 'youtube',
    youtubeId: 'enJPczyZrWs',
    url: 'https://youtu.be/enJPczyZrWs',
    title: 'YouTube Stream 2 (enJPczyZrWs)'
  },
  {
    type: 'youtube',
    youtubeId: 'eNpqwF66c9g',
    url: 'https://youtu.be/eNpqwF66c9g',
    title: 'YouTube Stream 3 (eNpqwF66c9g)'
  },
  {
    type: 'youtube',
    youtubeId: 'spaElsXxb9k',
    url: 'https://youtu.be/spaElsXxb9k',
    title: 'YouTube Stream 4 (spaElsXxb9k)'
  },
  {
    type: 'youtube',
    youtubeId: 'iufOnP-lVtk',
    url: 'https://youtu.be/iufOnP-lVtk',
    title: 'YouTube Stream 5 (iufOnP-lVtk)'
  },
  {
    type: 'youtube',
    youtubeId: '1lyu1KKwC74',
    url: 'https://youtu.be/1lyu1KKwC74',
    title: 'YouTube Stream 6 (1lyu1KKwC74)'
  },
  {
    type: 'youtube',
    youtubeId: 'f2ra_2woJIE',
    url: 'https://youtu.be/f2ra_2woJIE',
    title: 'YouTube Stream 7 (f2ra_2woJIE)'
  },
  {
    type: 'youtube',
    youtubeId: 'j7IP4L2Ct-0',
    url: 'https://youtu.be/j7IP4L2Ct-0',
    title: 'YouTube Stream 8 (j7IP4L2Ct-0)'
  },
  {
    type: 'youtube',
    youtubeId: '41ZY18JqI2A',
    url: 'https://youtu.be/41ZY18JqI2A',
    title: 'YouTube Stream 9 (41ZY18JqI2A)'
  },
  {
    type: 'youtube',
    youtubeId: 'MwtKJG_87fw',
    url: 'https://youtu.be/MwtKJG_87fw',
    title: 'YouTube Stream 10 (MwtKJG_87fw)'
  },
  {
    type: 'youtube',
    youtubeId: 'BcQnHzrc24Y',
    url: 'https://youtu.be/BcQnHzrc24Y',
    title: 'YouTube Stream 11 (BcQnHzrc24Y)'
  },
  {
    type: 'youtube',
    youtubeId: 'uZsY4S4ckMU',
    url: 'https://youtu.be/uZsY4S4ckMU',
    title: 'YouTube Stream 12 (uZsY4S4ckMU)'
  }
];

export default function App() {
  // Dynamic list of active players (Starts with the 2 user-requested YouTube streams, expandable to 8)
  const [players, setPlayers] = useState<PlayerInstance[]>([
    {
      id: 'ch-1',
      channelNumber: 1,
      channelName: 'Channel 1',
      color: 'blue',
      source: {
        type: 'youtube',
        youtubeId: 'gCNeDWCI0vo',
        url: 'https://www.youtube.com/live/gCNeDWCI0vo',
        title: 'YouTube Stream 1 (gCNeDWCI0vo)'
      }
    },
    {
      id: 'ch-2',
      channelNumber: 2,
      channelName: 'Channel 2',
      color: 'emerald',
      source: {
        type: 'youtube',
        youtubeId: 'enJPczyZrWs',
        url: 'https://youtu.be/enJPczyZrWs',
        title: 'YouTube Stream 2 (enJPczyZrWs)'
      }
    }
  ]);

  // Player runtime playback states keyed by player id
  const [playerStates, setPlayerStates] = useState<Record<string, PlayerChannelState>>({
    'ch-1': {
      id: 'ch-1',
      channelNumber: 1,
      channelName: 'Channel 1',
      color: 'blue',
      source: {
        type: 'youtube',
        youtubeId: 'gCNeDWCI0vo',
        url: 'https://www.youtube.com/live/gCNeDWCI0vo',
        title: 'YouTube Stream 1 (gCNeDWCI0vo)'
      },
      isPlaying: false,
      isMuted: false,
      volume: 80,
      currentTime: 0,
      duration: 0,
      isLive: false,
      playbackRate: 1,
      isLoading: false,
      buffering: false,
      error: null
    },
    'ch-2': {
      id: 'ch-2',
      channelNumber: 2,
      channelName: 'Channel 2',
      color: 'emerald',
      source: {
        type: 'youtube',
        youtubeId: 'enJPczyZrWs',
        url: 'https://youtu.be/enJPczyZrWs',
        title: 'YouTube Stream 2 (enJPczyZrWs)'
      },
      isPlaying: false,
      isMuted: false,
      volume: 80,
      currentTime: 0,
      duration: 0,
      isLive: false,
      playbackRate: 1,
      isLoading: false,
      buffering: false,
      error: null
    }
  });

  // Dynamic Map of Player Handles for imperative controls (play, pause, seek, volume)
  const playerRefs = useRef<Map<string, PlayerHandle>>(new Map());

  // Layout mode: 'grid' (adaptive 1/2/3/4 cols) or 'split' (2-cols)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

  // Modal dialog states
  const [activeSourceModalPlayerId, setActiveSourceModalPlayerId] = useState<string | null>(null);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [savedConfigsModalOpen, setSavedConfigsModalOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [cloudSyncModalOpen, setCloudSyncModalOpen] = useState(false);
  const [targetPlaylistChannelId, setTargetPlaylistChannelId] = useState<string>('ch-1');
  const [currentUser, setCurrentUser] = useState<GoogleUserProfile | null>(GoogleAuthService.getCurrentUser());
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);

  // Counter to generate unique IDs
  const nextChannelCounterRef = useRef(3);

  // Listen to Google user auth changes
  useEffect(() => {
    const unsub = GoogleAuthService.subscribe((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Initial cloud / local state restore
  useEffect(() => {
    async function initRestore() {
      try {
        const saved = await CloudSyncService.loadLatestState(currentUser);
        if (saved && Array.isArray(saved.players) && saved.players.length > 0) {
          handleRestoreProductionState(saved);
        }
      } catch (err) {
        console.warn('Initial state restore fallback:', err);
      } finally {
        setHasLoadedInitialState(true);
      }
    }
    initRestore();
  }, [currentUser?.id]);

  // Restore complete production state
  const handleRestoreProductionState = useCallback((state: AppProductionState) => {
    if (!state || !state.players || state.players.length === 0) return;

    playerRefs.current.clear();
    setLayoutMode(state.layoutMode || 'grid');

    const seenIds = new Set<string>();
    const loadedPlayers: PlayerInstance[] = state.players.map((p, idx) => {
      let uniqueId = p.id || `ch-${idx + 1}`;
      if (seenIds.has(uniqueId)) {
        uniqueId = `ch-${idx + 1}-${Date.now().toString(36)}`;
      }
      seenIds.add(uniqueId);

      return {
        id: uniqueId,
        channelNumber: p.channelNumber || (idx + 1),
        channelName: p.channelName || `Channel ${idx + 1}`,
        color: p.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
        source: {
          type: p.source.type || 'direct',
          url: p.source.url || '',
          title: p.source.title || `Channel ${idx + 1}`,
          youtubeId: p.source.youtubeId,
          youtubePlaylistId: p.source.youtubePlaylistId,
          fileName: p.source.fileName,
          isLive: p.source.isLive
        }
      };
    });

    const audioSettingsMap = new Map((state.audioSettings || []).map(s => [s.id, s]));

    const loadedStates: Record<string, PlayerChannelState> = {};
    let maxChannelNum = loadedPlayers.length;

    loadedPlayers.forEach((p) => {
      if (p.channelNumber > maxChannelNum) {
        maxChannelNum = p.channelNumber;
      }
      const audioConf = audioSettingsMap.get(p.id);

      loadedStates[p.id] = {
        id: p.id,
        channelNumber: p.channelNumber,
        channelName: p.channelName,
        color: p.color,
        source: p.source,
        isPlaying: false,
        isMuted: audioConf ? audioConf.isMuted : false,
        volume: audioConf ? audioConf.volume : 80,
        currentTime: 0,
        duration: 0,
        isLive: false,
        playbackRate: 1,
        isLoading: false,
        buffering: false,
        error: null
      };
    });

    nextChannelCounterRef.current = maxChannelNum + 1;
    setPlayers(loadedPlayers);
    setPlayerStates(loadedStates);

    if (state.playlists && state.playlists.length > 0) {
      PlaylistStorageService.savePlaylists(state.playlists);
    }
  }, []);

  // Compute production state bundle
  const getCurrentProductionState = useCallback((): AppProductionState => {
    const serializedPlayers: SavedPlayerConfig[] = players.map(p => ({
      id: p.id,
      channelNumber: p.channelNumber,
      channelName: p.channelName,
      color: p.color,
      source: {
        type: p.source.type,
        url: p.source.url || '',
        title: p.source.title || `Channel ${p.channelNumber}`,
        youtubeId: p.source.youtubeId,
        youtubePlaylistId: p.source.youtubePlaylistId,
        fileName: p.source.fileName,
        isLive: p.source.isLive
      }
    }));

    const audioSettings = players.map(p => ({
      id: p.id,
      volume: playerStates[p.id]?.volume ?? 80,
      isMuted: playerStates[p.id]?.isMuted ?? false
    }));

    return {
      version: 1,
      lastSavedAt: new Date().toISOString(),
      userEmail: currentUser?.email || 'guest',
      layoutMode,
      players: serializedPlayers,
      audioSettings,
      playlists: PlaylistStorageService.getPlaylists(),
      savedLayouts: ConfigStorageService.getSavedLayouts(),
      autoSaveEnabled: CloudSyncService.isAutoSaveEnabled()
    };
  }, [players, playerStates, layoutMode, currentUser]);

  // Debounced auto-save on state mutation
  useEffect(() => {
    if (!hasLoadedInitialState) return;
    const bundle = getCurrentProductionState();
    CloudSyncService.triggerDebouncedAutoSave(currentUser, bundle);
  }, [players, layoutMode, hasLoadedInitialState, currentUser, getCurrentProductionState]);

  // Manual 1-click Save All
  const handleSaveAllToCloud = async () => {
    const bundle = getCurrentProductionState();
    await CloudSyncService.saveAllState(currentUser, bundle);
  };

  // Manual 1-click Load Latest from Cloud
  const handleLoadFromCloud = async () => {
    const loaded = await CloudSyncService.loadLatestState(currentUser);
    if (loaded && loaded.players && loaded.players.length > 0) {
      handleRestoreProductionState(loaded);
    }
  };

  // Add a new player instance (Up to 8 simultaneous players)
  const handleAddPlayer = () => {
    if (players.length >= 8) return;

    const newChannelNumber = players.length + 1;
    const existingIds = new Set(players.map(p => p.id));
    let nextNum = nextChannelCounterRef.current;
    while (existingIds.has(`ch-${nextNum}`)) {
      nextNum++;
    }
    nextChannelCounterRef.current = nextNum + 1;
    const newId = `ch-${nextNum}`;
    const colorIndex = (players.length) % COLOR_PALETTE.length;
    const assignedColor = COLOR_PALETTE[colorIndex];

    // Assign next stream from default pool
    const poolIndex = players.length % DEFAULT_STREAM_POOL.length;
    const chosenSource = DEFAULT_STREAM_POOL[poolIndex] || {
      type: 'youtube',
      youtubeId: 'eNpqwF66c9g',
      url: 'https://youtu.be/eNpqwF66c9g',
      title: `Channel ${newChannelNumber}`
    };

    const newPlayer: PlayerInstance = {
      id: newId,
      channelNumber: newChannelNumber,
      channelName: `Channel ${newChannelNumber}`,
      color: assignedColor,
      source: chosenSource
    };

    setPlayers(prev => [...prev, newPlayer]);
    setPlayerStates(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        channelNumber: newChannelNumber,
        channelName: `Channel ${newChannelNumber}`,
        color: assignedColor,
        source: chosenSource,
        isPlaying: false,
        isMuted: false,
        volume: 80,
        currentTime: 0,
        duration: 0,
        isLive: false,
        playbackRate: 1,
        isLoading: false,
        buffering: false,
        error: null
      }
    }));
  };

  // Remove a player instance (minimum 1 player maintained)
  const handleRemovePlayer = (idToRemove: string) => {
    if (players.length <= 1) return;

    playerRefs.current.delete(idToRemove);

    setPlayers(prev => {
      const filtered = prev.filter(p => p.id !== idToRemove);
      // Re-index channel numbers nicely
      return filtered.map((p, idx) => ({
        ...p,
        channelNumber: idx + 1,
        channelName: `Channel ${idx + 1}`
      }));
    });

    setPlayerStates(prev => {
      const copy = { ...prev };
      delete copy[idToRemove];
      return copy;
    });
  };

  // Update state from child player component
  const handleStateChange = (id: string, updates: Partial<PlayerChannelState>) => {
    setPlayerStates(prev => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          ...updates
        }
      };
    });
  };

  // Global Actions across ALL players
  const handlePlayAll = async () => {
    const playPromises: Promise<void>[] = [];
    players.forEach(p => {
      const handle = playerRefs.current.get(p.id);
      if (handle) {
        playPromises.push(handle.play());
      }
    });
    try {
      await Promise.all(playPromises);
    } catch {
      // Browser autoplay policy might restrict some
    }
  };

  const handlePauseAll = () => {
    players.forEach(p => {
      const handle = playerRefs.current.get(p.id);
      handle?.pause();
    });
  };

  const handleSyncAll = () => {
    if (players.length === 0) return;
    const primaryId = players[0].id;
    const primaryHandle = playerRefs.current.get(primaryId);
    const pos = primaryHandle?.getCurrentTime() || 0;

    players.slice(1).forEach(p => {
      const handle = playerRefs.current.get(p.id);
      handle?.seek(pos);
    });
  };

  const handleToggleMuteChannel = (id: string) => {
    const handle = playerRefs.current.get(id);
    handle?.toggleMute();
  };

  // Preset multi-player matrices
  const handleLoadMatrix = (count: number) => {
    playerRefs.current.clear();
    const newPlayers: PlayerInstance[] = [];
    const newStates: Record<string, PlayerChannelState> = {};

    for (let i = 0; i < count; i++) {
      const id = `ch-${i + 1}`;
      const color = COLOR_PALETTE[i % COLOR_PALETTE.length];
      const src = DEFAULT_STREAM_POOL[i % DEFAULT_STREAM_POOL.length] || {
        type: 'youtube',
        youtubeId: 'eNpqwF66c9g',
        url: 'https://youtu.be/eNpqwF66c9g',
        title: `YouTube Stream ${i + 1}`
      };

      newPlayers.push({
        id,
        channelNumber: i + 1,
        channelName: `Channel ${i + 1}`,
        color,
        source: src
      });

      newStates[id] = {
        id,
        channelNumber: i + 1,
        channelName: `Channel ${i + 1}`,
        color,
        source: src,
        isPlaying: false,
        isMuted: false,
        volume: 80,
        currentTime: 0,
        duration: 0,
        isLive: false,
        playbackRate: 1,
        isLoading: false,
        buffering: false,
        error: null
      };
    }

    nextChannelCounterRef.current = count + 1;
    setPlayers(newPlayers);
    setPlayerStates(newStates);
  };

  // Compute active modal player object
  const activeModalPlayer = players.find(p => p.id === activeSourceModalPlayerId);

  // Restore and load a saved layout configuration
  const handleLoadLayout = (config: SavedLayoutConfig) => {
    if (!config || !config.players || config.players.length === 0) return;

    // Clear player references that won't exist anymore
    playerRefs.current.clear();

    // Set layout mode
    setLayoutMode(config.layoutMode || 'grid');

    const seenIds = new Set<string>();

    // Build new players array with guaranteed unique IDs
    const loadedPlayers: PlayerInstance[] = config.players.map((p, idx) => {
      let uniqueId = p.id || `ch-${idx + 1}`;
      if (seenIds.has(uniqueId)) {
        uniqueId = `ch-${idx + 1}-${Date.now().toString(36)}`;
      }
      seenIds.add(uniqueId);

      return {
        id: uniqueId,
        channelNumber: p.channelNumber || (idx + 1),
        channelName: p.channelName || `Channel ${idx + 1}`,
        color: p.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
        source: {
          type: p.source.type || 'direct',
          url: p.source.url || '',
          title: p.source.title || `Channel ${idx + 1}`,
          youtubeId: p.source.youtubeId,
          youtubePlaylistId: p.source.youtubePlaylistId,
          fileName: p.source.fileName,
          isLive: p.source.isLive
        }
      };
    });

    // Build initial player states
    const loadedStates: Record<string, PlayerChannelState> = {};
    let maxChannelNum = loadedPlayers.length;

    loadedPlayers.forEach((p) => {
      if (p.channelNumber > maxChannelNum) {
        maxChannelNum = p.channelNumber;
      }
      loadedStates[p.id] = {
        id: p.id,
        channelNumber: p.channelNumber,
        channelName: p.channelName,
        color: p.color,
        source: p.source,
        isPlaying: false,
        isMuted: false,
        volume: 80,
        currentTime: 0,
        duration: 0,
        isLive: false,
        playbackRate: 1,
        isLoading: false,
        buffering: false,
        error: null
      };
    });

    nextChannelCounterRef.current = maxChannelNum + 1;
    setPlayers(loadedPlayers);
    setPlayerStates(loadedStates);
  };

  // Convert current player list to serializable SavedPlayerConfig array
  const currentSavedPlayers: SavedPlayerConfig[] = players.map(p => ({
    id: p.id,
    channelNumber: p.channelNumber,
    channelName: p.channelName,
    color: p.color,
    source: p.source
  }));

  // Dynamic grid column class based on player count and layout mode
  const getGridClass = () => {
    if (layoutMode === 'split') {
      return 'grid-cols-1 md:grid-cols-2';
    }
    // Adaptive Grid
    if (players.length === 1) return 'grid-cols-1 max-w-4xl mx-auto';
    if (players.length === 2) return 'grid-cols-1 lg:grid-cols-2';
    if (players.length === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (players.length === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  // Convert playerStates map to array for GlobalControls
  const playerStatesList = players.map(p => playerStates[p.id] || {
    id: p.id,
    channelNumber: p.channelNumber,
    channelName: p.channelName,
    color: p.color,
    source: p.source,
    isPlaying: false,
    isMuted: false,
    volume: 80,
    currentTime: 0,
    duration: 0,
    isLive: false,
    playbackRate: 1,
    isLoading: false,
    buffering: false,
    error: null
  });

  return (
    <div className="min-h-screen bg-[#07080e] text-zinc-100 flex flex-col font-sans selection:bg-white/20">
      {/* Top Application Header */}
      <header className="border-b border-white/[0.08] bg-[#0c0d16]/95 backdrop-blur-xl px-4 sm:px-6 py-2.5 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="w-full max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center font-mono font-bold text-white shadow-xs text-xs">
              {players.length}×
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-zinc-100 tracking-tight">Dual Media Engine</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {players.length} Feeds Online
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Simultaneous multi-stream sync &amp; broadcast mixer
              </p>
            </div>
          </div>

          {/* Center Matrix Layout Switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-[#07080e] p-1 rounded-xl border border-white/[0.08] text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2 font-bold">Layout:</span>
            {[
              { count: 1, label: '1 Solo' },
              { count: 2, label: '2 Duo' },
              { count: 3, label: '3 Trio' },
              { count: 4, label: '4 Quad' },
              { count: 6, label: '6 Multi' },
              { count: 8, label: '8 Wall' }
            ].map((item) => (
              <button
                key={item.count}
                id={`btn-matrix-${item.count}`}
                onClick={() => handleLoadMatrix(item.count)}
                className={`px-2.5 py-1 rounded-lg transition-all duration-150 text-[11px] font-mono font-semibold ${
                  players.length === item.count 
                    ? 'bg-white text-zinc-950 font-bold shadow-xs' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Studio Tools & Account Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick + Add Player in header */}
            <button
              id="btn-header-add-player"
              onClick={handleAddPlayer}
              disabled={players.length >= 8}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300 text-xs font-bold transition-all duration-150 active:scale-95 disabled:opacity-40 shadow-xs"
              title="Add another video player"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950" />
              <span>Add Feed</span>
            </button>

            {/* Quick Playlists Button */}
            <button
              id="btn-header-playlists"
              onClick={() => setPlaylistModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all duration-150 active:scale-95"
              title="Open and manage YouTube playlists"
            >
              <ListMusic className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Playlists</span>
            </button>

            {/* Quick Save / Load Configuration in Header */}
            <button
              id="btn-header-save-layout"
              onClick={() => setSavedConfigsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all duration-150 active:scale-95"
              title="Save or restore layouts and feeds"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Snapshots</span>
            </button>

            {/* Google Authentication & Production Cloud Sync Pill */}
            <div className="pl-1 border-l border-white/[0.08]">
              <GoogleAuthButton
                onSaveAll={handleSaveAllToCloud}
                onLoadLatest={handleLoadFromCloud}
                onOpenSnapshots={() => setCloudSyncModalOpen(true)}
                onOpenClientIdConfig={() => setCloudSyncModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Playback Canvas */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4">
        {/* Dynamic Multi-Player Grid */}
        <div className={`grid gap-3.5 sm:gap-4 lg:gap-5 transition-all duration-300 ${getGridClass()}`}>
          {players.map((p) => (
            <div key={p.id} className="w-full">
              <UnifiedPlayer
                ref={(inst) => {
                  if (inst) {
                    playerRefs.current.set(p.id, inst);
                  } else {
                    playerRefs.current.delete(p.id);
                  }
                }}
                id={p.id}
                channelNumber={p.channelNumber}
                channelName={p.channelName}
                source={p.source}
                channelColor={p.color}
                canRemove={players.length > 1}
                onRemovePlayer={() => handleRemovePlayer(p.id)}
                onStateChange={(st) => handleStateChange(p.id, st)}
                onRequestChangeSource={() => setActiveSourceModalPlayerId(p.id)}
              />
            </div>
          ))}
        </div>

        {/* Global Master Control Deck */}
        <GlobalControls
          players={playerStatesList}
          onPlayAll={handlePlayAll}
          onPauseAll={handlePauseAll}
          onSyncAll={handleSyncAll}
          onToggleMuteChannel={handleToggleMuteChannel}
          onAddPlayer={handleAddPlayer}
          canAddPlayer={players.length < 8}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          onOpenAudioModal={() => setAudioModalOpen(true)}
          onOpenSaveModal={() => setSavedConfigsModalOpen(true)}
          onOpenLoadModal={() => setSavedConfigsModalOpen(true)}
          onOpenPlaylistModal={() => setPlaylistModalOpen(true)}
        />
      </main>

      {/* Standalone Playlists Modal Dialog */}
      {playlistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            id="modal-global-playlists"
            className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/95">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <ListMusic className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">Playlists Section (YouTube Style)</h2>
                  <p className="text-xs text-slate-400">Create, edit, delete playlists &amp; add/remove YouTube streams</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Target Channel Selector */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Send video to:</span>
                  <select
                    id="select-target-channel-for-playlist"
                    value={targetPlaylistChannelId}
                    onChange={(e) => setTargetPlaylistChannelId(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {players.map((p, idx) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        CH {p.channelNumber || idx + 1}: {p.channelName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="btn-close-playlist-modal"
                  onClick={() => setPlaylistModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <PlaylistManager
                channelId={targetPlaylistChannelId}
                channelName={players.find(p => p.id === targetPlaylistChannelId)?.channelName || 'Target Channel'}
                channelColor={players.find(p => p.id === targetPlaylistChannelId)?.color || 'blue'}
                onSelectVideo={(newSource) => {
                  setPlayers(prev => prev.map(p => {
                    if (p.id === targetPlaylistChannelId) {
                      return { ...p, source: newSource };
                    }
                    return p;
                  }));
                  setPlayerStates(prev => {
                    const cur = prev[targetPlaylistChannelId];
                    if (!cur) return prev;
                    return {
                      ...prev,
                      [targetPlaylistChannelId]: {
                        ...cur,
                        source: newSource
                      }
                    };
                  });
                  setPlaylistModalOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Source Selection Modal for Selected Player */}
      {activeModalPlayer && (
        <SourceSelectionModal
          channelId={activeModalPlayer.id}
          channelName={activeModalPlayer.channelName}
          channelColor={activeModalPlayer.color}
          currentSource={activeModalPlayer.source}
          isOpen={true}
          onClose={() => setActiveSourceModalPlayerId(null)}
          onSelectSource={(newSource) => {
            setPlayers(prev => prev.map(p => {
              if (p.id === activeModalPlayer.id) {
                return { ...p, source: newSource };
              }
              return p;
            }));
            setPlayerStates(prev => {
              const cur = prev[activeModalPlayer.id];
              if (!cur) return prev;
              return {
                ...prev,
                [activeModalPlayer.id]: {
                  ...cur,
                  source: newSource
                }
              };
            });
          }}
        />
      )}

      {/* Saved Configurations (Save/Load) Modal */}
      <SavedConfigsModal
        isOpen={savedConfigsModalOpen}
        onClose={() => setSavedConfigsModalOpen(false)}
        currentLayoutMode={layoutMode}
        currentPlayers={currentSavedPlayers}
        onLoadLayout={handleLoadLayout}
      />

      {/* Audio Architecture Explanation Modal */}
      <AudioArchitectureModal
        isOpen={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
      />

      {/* Production Cloud Sync & Backup Manager Modal */}
      <CloudSyncModal
        isOpen={cloudSyncModalOpen}
        onClose={() => setCloudSyncModalOpen(false)}
        currentState={getCurrentProductionState()}
        onRestoreState={handleRestoreProductionState}
      />
    </div>
  );
}
