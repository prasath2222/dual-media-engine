import React, { useState, useEffect } from 'react';
import { 
  ListMusic, Plus, Play, Trash2, Edit3, Save, X, Search, 
  Video, Globe, ChevronRight, ArrowLeft, MoreVertical,
  Check, Film, ExternalLink, MoveUp, MoveDown, RotateCcw,
  Sparkles, Layers
} from 'lucide-react';
import { CustomPlaylist, PlaylistVideoItem, MediaSourceConfig, ChannelColorName } from '../types';
import { PlaylistStorageService } from '../lib/playlistStorage';
import { extractYouTubeId, detectSourceType } from '../lib/youtubeHelper';
import { CHANNEL_THEMES } from '../lib/channelThemes';

interface PlaylistManagerProps {
  channelId?: string;
  channelName?: string;
  channelColor?: ChannelColorName;
  onSelectVideo: (source: MediaSourceConfig) => void;
  onLoadPlaylistToPlayers?: (videos: PlaylistVideoItem[]) => void;
  onClose?: () => void;
}

export function PlaylistManager({
  channelId = 'ch-1',
  channelName,
  channelColor = 'blue',
  onSelectVideo,
  onLoadPlaylistToPlayers,
  onClose
}: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Create Playlist Modal / Drawer
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // Edit Playlist Info State
  const [editingPlaylist, setEditingPlaylist] = useState<CustomPlaylist | null>(null);
  const [editPlTitle, setEditPlTitle] = useState('');
  const [editPlDesc, setEditPlDesc] = useState('');

  // Add Video to Playlist Form State
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [videoChannelInput, setVideoChannelInput] = useState('');

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    const loaded = PlaylistStorageService.getPlaylists();
    setPlaylists(loaded);
    if (loaded.length > 0 && !selectedPlaylistId) {
      setSelectedPlaylistId(loaded[0].id);
    }
  }, []);

  const selectedPlaylist = playlists.find(pl => pl.id === selectedPlaylistId) || (playlists.length > 0 ? playlists[0] : null);

  const theme = CHANNEL_THEMES[channelColor] || CHANNEL_THEMES.blue;
  const buttonActive = `${theme.buttonBg} ${theme.buttonHover}`;
  const displayName = channelName || `Channel ${channelId}`;

  // Handle Create Playlist
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    const updated = PlaylistStorageService.createPlaylist(newPlaylistTitle, newPlaylistDesc);
    setPlaylists(updated);
    setSelectedPlaylistId(updated[0].id);
    setNewPlaylistTitle('');
    setNewPlaylistDesc('');
    setIsCreatingPlaylist(false);
    showToast(`Created playlist "${newPlaylistTitle}"`);
  };

  // Handle Edit Playlist
  const handleStartEditPlaylist = (pl: CustomPlaylist, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPlaylist(pl);
    setEditPlTitle(pl.title);
    setEditPlDesc(pl.description || '');
  };

  const handleSaveEditPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist || !editPlTitle.trim()) return;

    const updated = PlaylistStorageService.updatePlaylist(editingPlaylist.id, {
      title: editPlTitle,
      description: editPlDesc
    });
    setPlaylists(updated);
    setEditingPlaylist(null);
    showToast(`Updated playlist "${editPlTitle}"`);
  };

  // Handle Delete Playlist
  const handleDeletePlaylist = (id: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the playlist "${title}"?`)) {
      const updated = PlaylistStorageService.deletePlaylist(id);
      setPlaylists(updated);
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(updated.length > 0 ? updated[0].id : null);
      }
      showToast(`Deleted playlist "${title}"`, 'info');
    }
  };

  // Handle Add Video to Active Playlist
  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaylist || !videoUrlInput.trim()) return;

    const trimmedUrl = videoUrlInput.trim();
    const ytId = extractYouTubeId(trimmedUrl);
    const title = videoTitleInput.trim() || (ytId ? `YouTube Video (${ytId})` : 'Custom Media Stream');

    const result = PlaylistStorageService.addVideoToPlaylist(selectedPlaylist.id, {
      title,
      url: trimmedUrl,
      channelTitle: videoChannelInput.trim() || (ytId ? 'YouTube' : 'Web Stream')
    });

    setPlaylists(result.playlists);
    setVideoUrlInput('');
    setVideoTitleInput('');
    setVideoChannelInput('');
    setIsAddingVideo(false);
    showToast(`Added "${title}" to playlist!`);
  };

  // Handle Delete Video from Playlist
  const handleDeleteVideo = (videoId: string, videoTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPlaylist) return;
    const updated = PlaylistStorageService.removeVideoFromPlaylist(selectedPlaylist.id, videoId);
    setPlaylists(updated);
    showToast(`Removed "${videoTitle}" from playlist`, 'info');
  };

  // Handle Reorder Video in Playlist
  const handleMoveVideo = (fromIndex: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPlaylist) return;
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= selectedPlaylist.videos.length) return;

    const updated = PlaylistStorageService.reorderVideos(selectedPlaylist.id, fromIndex, toIndex);
    setPlaylists(updated);
  };

  // Handle Play Video
  const handlePlayVideo = (vid: PlaylistVideoItem) => {
    onSelectVideo({
      type: vid.type,
      url: vid.url,
      youtubeId: vid.youtubeId,
      title: vid.title
    });
    if (onClose) onClose();
  };

  // Filter playlists
  const filteredPlaylists = playlists.filter(pl => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchPlTitle = pl.title.toLowerCase().includes(q);
    const matchVid = pl.videos.some(v => v.title.toLowerCase().includes(q) || v.url.toLowerCase().includes(q));
    return matchPlTitle || matchVid;
  });

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-70 animate-in fade-in duration-200">
          <div className={`px-4 py-2 rounded-xl border text-xs font-semibold shadow-xl flex items-center gap-2 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-950/90 text-amber-300 border-amber-500/30'
          }`}>
            <Check className="w-3.5 h-3.5" />
            {toastMsg.text}
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Column: Playlist List & Navigation */}
        <div className="md:col-span-5 bg-[#0f1017] border border-white/[0.08] rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                My Playlists ({playlists.length})
              </span>
            </div>
            <button
              id="btn-create-new-playlist"
              onClick={() => setIsCreatingPlaylist(true)}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 shadow transition flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              New Playlist
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090a10] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition"
            />
          </div>

          {/* Playlists Vertical List */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredPlaylists.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs">
                No playlists found. Click "+ New Playlist" to create one!
              </div>
            ) : (
              filteredPlaylists.map((pl) => {
                const isSelected = selectedPlaylist?.id === pl.id;
                const firstVideoThumb = pl.videos[0]?.thumbnailUrl;

                return (
                  <div
                    key={pl.id}
                    id={`playlist-item-${pl.id}`}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 group ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/[0.2] shadow-sm text-white'
                        : 'bg-[#141520] hover:bg-white/[0.04] border-white/[0.06] text-zinc-300'
                    }`}
                  >
                    {/* Thumbnail preview */}
                    <div className="relative w-12 h-9 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-white/[0.08] flex items-center justify-center">
                      {firstVideoThumb ? (
                        <img 
                          src={firstVideoThumb} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ListMusic className="w-4 h-4 text-zinc-600" />
                      )}
                      <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-[9px] px-1 rounded font-mono text-zinc-300">
                        {pl.videos.length}
                      </span>
                    </div>

                    {/* Title & info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate group-hover:text-white">
                        {pl.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {pl.videos.length} {pl.videos.length === 1 ? 'video' : 'videos'}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleStartEditPlaylist(pl, e)}
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
                        title="Edit Playlist Name"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeletePlaylist(pl.id, pl.title, e)}
                        className="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete Playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
                if (window.confirm('Reset all playlists to the default sets?')) {
                  const restored = PlaylistStorageService.resetToDefaults();
                  setPlaylists(restored);
                  setSelectedPlaylistId(restored[0].id);
                  showToast('Reset playlists to default.');
                }
              }}
              className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" /> Restore defaults
            </button>
            <span className="text-zinc-500 font-mono">Total {playlists.reduce((acc, p) => acc + p.videos.length, 0)} videos</span>
          </div>
        </div>

        {/* Right Column: Selected Playlist Content & Video List */}
        <div className="md:col-span-7 bg-[#0f1017] border border-white/[0.08] rounded-2xl p-4 space-y-4">
          {selectedPlaylist ? (
            <>
              {/* Playlist Header Banner */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-100 tracking-tight">
                      {selectedPlaylist.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {selectedPlaylist.videos.length} Videos
                    </span>
                  </div>
                  {selectedPlaylist.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {selectedPlaylist.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    id="btn-add-video-to-pl"
                    onClick={() => setIsAddingVideo(!isAddingVideo)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/[0.08] transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    Add Video
                  </button>

                  {selectedPlaylist.videos.length > 0 && (
                    <button
                      id="btn-play-first-video"
                      onClick={() => handlePlayVideo(selectedPlaylist.videos[0])}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 shadow transition flex items-center gap-1.5 active:scale-95"
                      title={`Play first video into ${displayName}`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Play Top Video
                    </button>
                  )}
                </div>
              </div>

              {/* Add Video Drawer / Form */}
              {isAddingVideo && (
                <form 
                  onSubmit={handleAddVideo} 
                  className="p-3.5 bg-[#141520] rounded-xl border border-white/[0.1] space-y-2.5 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                    <span className="flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-violet-400" /> Add Video to "{selectedPlaylist.title}"
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingVideo(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      id="input-pl-video-url"
                      type="text"
                      required
                      placeholder="Paste YouTube or video stream URL (e.g. https://youtu.be/...)"
                      value={videoUrlInput}
                      onChange={(e) => {
                        setVideoUrlInput(e.target.value);
                        if (!videoTitleInput && e.target.value.trim()) {
                          const ytId = extractYouTubeId(e.target.value.trim());
                          if (ytId) setVideoTitleInput(`YouTube Video (${ytId})`);
                        }
                      }}
                      className="w-full bg-[#090a10] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-white/[0.2]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Video Title / Label"
                        value={videoTitleInput}
                        onChange={(e) => setVideoTitleInput(e.target.value)}
                        className="bg-[#090a10] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2]"
                      />
                      <input
                        type="text"
                        placeholder="Channel / Author Name (Optional)"
                        value={videoChannelInput}
                        onChange={(e) => setVideoChannelInput(e.target.value)}
                        className="bg-[#090a10] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingVideo(false)}
                      className="px-3 py-1 text-xs text-zinc-400 hover:text-white bg-white/[0.04] rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg shadow"
                    >
                      Save to Playlist
                    </button>
                  </div>
                </form>
              )}

              {/* Videos in Selected Playlist */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {selectedPlaylist.videos.length === 0 ? (
                  <div className="p-8 text-center bg-[#141520] rounded-xl border border-dashed border-white/[0.08] space-y-2">
                    <Film className="w-7 h-7 text-zinc-600 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-300">This playlist is empty</p>
                    <p className="text-[11px] text-zinc-500">Click "+ Add Video" above to paste and add any stream or YouTube link.</p>
                  </div>
                ) : (
                  selectedPlaylist.videos.map((vid, idx) => {
                    const isYt = vid.type === 'youtube';

                    return (
                      <div
                        key={vid.id}
                        id={`playlist-video-${vid.id}`}
                        onClick={() => handlePlayVideo(vid)}
                        className="p-2 rounded-xl bg-[#141520] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer flex items-center gap-3 group relative text-left"
                      >
                        {/* Index Number */}
                        <span className="text-xs font-mono font-bold text-zinc-500 w-5 text-center flex-shrink-0 group-hover:text-zinc-300">
                          {idx + 1}
                        </span>

                        {/* Video Thumbnail */}
                        <div className="w-16 h-10 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-white/[0.08] relative flex items-center justify-center">
                          {vid.thumbnailUrl ? (
                            <img 
                              src={vid.thumbnailUrl} 
                              alt="" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Video className="w-4 h-4 text-zinc-500" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                        </div>

                        {/* Title & details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white line-clamp-1">
                            {vid.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 font-mono">
                            {vid.channelTitle || (isYt ? 'YouTube' : vid.type.toUpperCase())} &bull; {vid.url}
                          </p>
                        </div>

                        {/* Actions: Reorder & Delete */}
                        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {idx > 0 && (
                            <button
                              onClick={(e) => handleMoveVideo(idx, 'up', e)}
                              className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] rounded transition"
                              title="Move Up"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < selectedPlaylist.videos.length - 1 && (
                            <button
                              onClick={(e) => handleMoveVideo(idx, 'down', e)}
                              className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] rounded transition"
                              title="Move Down"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            id={`btn-delete-pl-video-${vid.id}`}
                            onClick={(e) => handleDeleteVideo(vid.id, vid.title, e)}
                            className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                            title="Remove from playlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select or create a playlist from the left to view and manage videos.
            </div>
          )}
        </div>
      </div>

      {/* CREATE PLAYLIST MODAL */}
      {isCreatingPlaylist && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-100"
          onClick={() => setIsCreatingPlaylist(false)}
        >
          <div 
            id="modal-create-playlist"
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Create New Playlist</h3>
              </div>
              <button
                onClick={() => setIsCreatingPlaylist(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Playlist Title</label>
                <input
                  id="input-new-playlist-title"
                  type="text"
                  required
                  placeholder="e.g. My Live Camera Matrix or Lo-Fi Beats"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Notes or description for this collection..."
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-create-playlist"
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAYLIST MODAL */}
      {editingPlaylist && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-100"
          onClick={() => setEditingPlaylist(null)}
        >
          <div 
            id="modal-edit-playlist"
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Edit Playlist Info</h3>
              </div>
              <button
                onClick={() => setEditingPlaylist(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPlaylist} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Playlist Title</label>
                <input
                  type="text"
                  required
                  value={editPlTitle}
                  onChange={(e) => setEditPlTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  value={editPlDesc}
                  onChange={(e) => setEditPlDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlaylist(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
