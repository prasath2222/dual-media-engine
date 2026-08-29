import React from 'react';
import { 
  Play, Pause, RefreshCw, VolumeX, Volume2, 
  Plus, Grid, Columns, Info, Save, FolderOpen,
  ListMusic, Sliders
} from 'lucide-react';
import { PlayerChannelState } from '../types';
import { CHANNEL_THEMES } from '../lib/channelThemes';

export type LayoutMode = 'grid' | 'split' | 'single';

interface GlobalControlsProps {
  players: PlayerChannelState[];
  onPlayAll: () => void;
  onPauseAll: () => void;
  onSyncAll: () => void;
  onToggleMuteChannel: (id: string) => void;
  onAddPlayer: () => void;
  canAddPlayer: boolean;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onOpenAudioModal: () => void;
  onOpenSaveModal: () => void;
  onOpenLoadModal: () => void;
  onOpenPlaylistModal: () => void;
}

export function GlobalControls({
  players,
  onPlayAll,
  onPauseAll,
  onSyncAll,
  onToggleMuteChannel,
  onAddPlayer,
  canAddPlayer,
  layoutMode,
  onLayoutModeChange,
  onOpenAudioModal,
  onOpenSaveModal,
  onOpenLoadModal,
  onOpenPlaylistModal
}: GlobalControlsProps) {
  const isAllPlaying = players.length > 0 && players.every(p => p.isPlaying);
  const isAnyPlaying = players.some(p => p.isPlaying);

  return (
    <div 
      id="global-master-controls-bar"
      className="bg-[#11121d]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-2.5 sm:p-3 shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col xl:flex-row items-center justify-between gap-3 sm:gap-4 transition-all select-none"
    >
      {/* Action Buttons Group */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full xl:w-auto justify-center xl:justify-start">
        {/* PLAY ALL */}
        <button
          id="btn-global-play-all"
          onClick={onPlayAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 font-bold text-xs shadow-sm transition-all duration-150 active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-zinc-950" />
          <span>PLAY ALL ({players.length})</span>
        </button>

        {/* PAUSE ALL */}
        <button
          id="btn-global-pause-all"
          onClick={onPauseAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] text-zinc-200 hover:text-white font-semibold text-xs border border-white/[0.08] transition-all duration-150 active:scale-95"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>PAUSE ALL</span>
        </button>

        {/* SYNC ALL */}
        <button
          id="btn-global-sync-all"
          onClick={onSyncAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] text-zinc-200 hover:text-white font-semibold text-xs border border-white/[0.08] transition-all duration-150 group active:scale-95"
          title="Synchronize all secondary players to match Channel 1 timestamp"
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 text-sky-400" />
          <span>SYNC ➔ CH 01</span>
        </button>

        {/* + ADD PLAYER BUTTON */}
        <button
          id="btn-add-player-channel"
          onClick={onAddPlayer}
          disabled={!canAddPlayer}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-150 active:scale-95 ${
            canAddPlayer
              ? 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/[0.08]'
              : 'bg-white/[0.02] text-zinc-600 cursor-not-allowed border border-white/[0.04]'
          }`}
          title={canAddPlayer ? 'Add another simultaneous video player (up to 8)' : 'Maximum 8 simultaneous players reached'}
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>ADD FEED</span>
        </button>

        <div className="h-5 w-px bg-white/[0.1] mx-1 hidden sm:block"></div>

        {/* PLAYLISTS MANAGER BUTTON */}
        <button
          id="btn-global-playlists"
          onClick={onOpenPlaylistModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white font-semibold text-xs border border-white/[0.08] transition-all duration-150 active:scale-95"
          title="Open and manage YouTube-style Playlists"
        >
          <ListMusic className="w-3.5 h-3.5 text-violet-400" />
          <span>Playlists</span>
        </button>

        {/* PRESETS / SNAPSHOTS */}
        <button
          id="btn-global-save-config"
          onClick={onOpenSaveModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white font-semibold text-xs border border-white/[0.08] transition-all duration-150 active:scale-95"
          title="Save or restore layouts and feeds"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span>Snapshots</span>
        </button>
      </div>

      {/* Broadcast Audio Matrix Strip */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 bg-[#07080e] px-3 py-1.5 rounded-xl border border-white/[0.06] max-w-full overflow-x-auto">
        <span className="text-[10px] font-mono text-zinc-500 px-1 font-bold uppercase tracking-wider hidden sm:flex items-center gap-1">
          <Sliders className="w-3 h-3 text-zinc-400" /> Audio Matrix:
        </span>
        {players.map((p, idx) => {
          const theme = CHANNEL_THEMES[p.color] || CHANNEL_THEMES.blue;
          const channelNumber = p.channelNumber || (idx + 1);
          const isAudioActive = p.isPlaying && !p.isMuted && p.volume > 0;
          const formattedCh = `CH ${channelNumber.toString().padStart(2, '0')}`;

          return (
            <button
              key={p.id}
              id={`btn-mute-channel-${p.id}`}
              onClick={() => onToggleMuteChannel(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all duration-150 flex items-center gap-1.5 border ${
                p.isMuted
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                  : isAudioActive
                  ? 'bg-white/[0.1] text-white border-sky-400/40 shadow-xs'
                  : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-zinc-200'
              }`}
              title={`Toggle Audio Mute for ${formattedCh} (${p.source.title || 'Untitled'}) - Volume: ${p.volume}%`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
              {p.isMuted ? (
                <VolumeX className="w-3 h-3 text-amber-400 flex-shrink-0" />
              ) : isAudioActive ? (
                <div className="flex items-end gap-0.5 h-3 w-2.5 justify-center">
                  <span className={`w-0.5 h-full ${theme.barColor} rounded-full animate-[pulse_0.6s_ease-in-out_infinite]`}></span>
                  <span className={`w-0.5 h-2/3 ${theme.barColor} rounded-full animate-[pulse_0.4s_ease-in-out_infinite]`}></span>
                  <span className={`w-0.5 h-full ${theme.barColor} rounded-full animate-[pulse_0.8s_ease-in-out_infinite]`}></span>
                </div>
              ) : (
                <Volume2 className="w-3 h-3 flex-shrink-0 text-zinc-500" />
              )}
              <span>{formattedCh}</span>
            </button>
          );
        })}
      </div>

      {/* Layout Switcher & Status */}
      <div className="flex items-center gap-2">
        {/* Layout Mode Selector */}
        <div className="flex items-center bg-[#07080e] p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => onLayoutModeChange('grid')}
            className={`p-1.5 rounded-lg text-xs transition-all duration-150 ${
              layoutMode === 'grid'
                ? 'bg-white text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Auto Responsive Grid Layout"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onLayoutModeChange('split')}
            className={`p-1.5 rounded-lg text-xs transition-all duration-150 ${
              layoutMode === 'split'
                ? 'bg-white text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Equal 2-Column Split Layout"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audio Details Trigger */}
        <button
          id="btn-open-audio-info"
          onClick={onOpenAudioModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition"
          title="Audio guide & mixer architecture"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline font-medium">Guide</span>
        </button>

        {/* Live Status indicator */}
        <div className="flex items-center gap-1.5 text-xs font-mono pl-1">
          <span className={`w-2 h-2 rounded-full ${isAnyPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}></span>
          <span className="text-zinc-400 hidden lg:inline font-medium text-[11px]">
            {isAllPlaying ? 'All Online' : isAnyPlaying ? 'Active' : 'Standby'}
          </span>
        </div>
      </div>
    </div>
  );
}

