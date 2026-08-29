import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Youtube, Link as LinkIcon, Radio, Disc, 
  Sparkles, Check, FileVideo, Globe, ListMusic, Plus,
  Trash2, Edit3, Search, Play, Bookmark, BookmarkPlus, Tag,
  RotateCcw, Save, AlertCircle, Layers
} from 'lucide-react';
import { MediaSourceConfig, SourceType, ChannelColorName, SamplePreset } from '../types';
import { 
  getActivePresets, 
  saveOrUpdatePreset, 
  deletePreset, 
  resetPresetsToDefault
} from '../data/presets';
import { extractYouTubeId, detectSourceType } from '../lib/youtubeHelper';
import { YouTubeLibraryBrowser } from './YouTubeLibraryBrowser';
import { PlaylistManager } from './PlaylistManager';
import { CHANNEL_THEMES } from '../lib/channelThemes';

interface SourceSelectionModalProps {
  channelId: string;
  channelName?: string;
  channelColor: ChannelColorName;
  currentSource: MediaSourceConfig;
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (source: MediaSourceConfig) => void;
}

export function SourceSelectionModal({
  channelId,
  channelName,
  channelColor,
  currentSource,
  isOpen,
  onClose,
  onSelectSource
}: SourceSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<'playlists' | 'presets' | 'youtube_auth' | 'url' | 'file'>('playlists');
  
  // Preset list state
  const [presets, setPresets] = useState<SamplePreset[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // New Preset / Quick Add Form State
  const [newPresetUrl, setNewPresetUrl] = useState('');
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState('YouTube');

  // Editing Preset State
  const [editingPreset, setEditingPreset] = useState<SamplePreset | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Filters and Search for Presets
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab: Custom URL State
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [saveToPresetsFromUrlTab, setSaveToPresetsFromUrlTab] = useState(false);

  // Tab: Local File State
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load presets on modal open
  useEffect(() => {
    if (isOpen) {
      setPresets(getActivePresets());
      setFeedbackMsg(null);
      setEditingPreset(null);
    }
  }, [isOpen]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  if (!isOpen) return null;

  const theme = CHANNEL_THEMES[channelColor] || CHANNEL_THEMES.blue;
  const badgeColor = `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`;
  const buttonActive = `${theme.buttonBg} ${theme.buttonHover}`;
  const displayName = channelName || `Channel ${channelId}`;

  // Filter presets based on category and search query
  const filteredPresets = presets.filter(preset => {
    if (selectedCategoryFilter === 'youtube' && preset.type !== 'youtube' && !preset.category.includes('YouTube')) return false;
    if (selectedCategoryFilter === 'custom' && !preset.isCustom) return false;
    if (selectedCategoryFilter === 'other' && (preset.type === 'youtube' || preset.category.includes('YouTube'))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = preset.title.toLowerCase().includes(q);
      const matchUrl = preset.url.toLowerCase().includes(q);
      const matchYtId = preset.youtubeId?.toLowerCase().includes(q) || false;
      const matchDesc = (preset.description || '').toLowerCase().includes(q);
      const matchCat = (preset.category || '').toLowerCase().includes(q);
      return matchTitle || matchUrl || matchYtId || matchDesc || matchCat;
    }

    return true;
  });

  // Action: Save new preset
  const handleSaveNewPreset = (e?: React.FormEvent, andPlay: boolean = false) => {
    if (e) e.preventDefault();
    if (!newPresetUrl.trim()) return;

    const trimmed = newPresetUrl.trim();
    const ytId = extractYouTubeId(trimmed);
    const label = newPresetLabel.trim() || (ytId ? `YouTube Stream (${ytId})` : 'Custom Stream');

    const updated = saveOrUpdatePreset({
      title: label,
      url: trimmed,
      category: newPresetCategory || (ytId ? 'YouTube' : 'Custom'),
      description: `Preset stream • Added ${new Date().toLocaleDateString()}`
    });

    setPresets(updated);
    setNewPresetUrl('');
    setNewPresetLabel('');
    showToast(`Added "${label}" to presets!`);

    if (andPlay) {
      const createdItem = updated.find(p => p.url === trimmed) || updated[0];
      onSelectSource({
        type: createdItem.type,
        url: createdItem.url,
        youtubeId: createdItem.youtubeId,
        title: createdItem.title
      });
      onClose();
    }
  };

  // Start Editing Preset
  const handleStartEdit = (preset: SamplePreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setEditTitle(preset.title);
    setEditUrl(preset.url);
    setEditCategory(preset.category);
    setEditDescription(preset.description || '');
  };

  // Submit Edited Preset
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset || !editUrl.trim()) return;

    const updated = saveOrUpdatePreset({
      id: editingPreset.id,
      title: editTitle.trim() || editingPreset.title,
      url: editUrl.trim(),
      category: editCategory.trim() || editingPreset.category,
      description: editDescription.trim()
    });

    setPresets(updated);
    setEditingPreset(null);
    showToast(`Updated "${editTitle}" successfully!`);
  };

  // Action: Delete Preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deletePreset(id);
    setPresets(updated);
    showToast('Preset deleted.', 'info');
  };

  // Action: Reset to Defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset preset catalog back to the 12 default YouTube streams?')) {
      const restored = resetPresetsToDefault();
      setPresets(restored);
      showToast('Presets restored to default 12 streams.');
    }
  };

  // Action: Apply from Custom URL Tab
  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    const trimmed = inputUrl.trim();
    const ytId = extractYouTubeId(trimmed);
    const title = inputTitle.trim() || (ytId ? `YouTube Video (${ytId})` : 'Custom Stream');

    if (saveToPresetsFromUrlTab) {
      const updated = saveOrUpdatePreset({
        title,
        url: trimmed,
        category: ytId ? 'YouTube' : 'Custom'
      });
      setPresets(updated);
    }

    if (ytId) {
      onSelectSource({
        type: 'youtube',
        url: trimmed,
        youtubeId: ytId,
        title
      });
    } else {
      const type = detectSourceType(trimmed);
      onSelectSource({
        type,
        url: trimmed,
        title
      });
    }
    onClose();
  };

  // Handle File Pick
  const handleFileChange = (file: File) => {
    if (!file) return;
    onSelectSource({
      type: 'local',
      file,
      url: URL.createObjectURL(file),
      title: file.name
    });
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        id={`modal-source-selection-${channelId}`}
        className="relative w-full max-w-4xl bg-[#0e0f17] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/[0.08] bg-[#11121a]">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${badgeColor}`}>
              {displayName.toUpperCase()}
            </span>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">Media Source, Playlists &amp; Presets</h2>
              <p className="text-xs text-zinc-400">Select, create, edit, and organize YouTube playlists or stream links</p>
            </div>
          </div>

          <button
            id="btn-close-source-modal"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] bg-[#0c0d14] px-4 sm:px-6 overflow-x-auto gap-1">
          {/* TAB 1: PLAYLISTS (YouTube Style) */}
          <button
            id="tab-playlists-section"
            onClick={() => setActiveTab('playlists')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'playlists'
                ? `border-violet-400 text-violet-300 font-bold bg-violet-500/10`
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListMusic className="w-4 h-4 text-violet-400" />
            Playlists (YouTube Style)
          </button>

          {/* TAB 2: QUICK PRESETS */}
          <button
            id="tab-quick-presets"
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'presets'
                ? `border-sky-400 text-sky-300 font-bold bg-sky-500/10`
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Quick Presets ({presets.length})
          </button>

          {/* TAB 3: YOUTUBE AUTH / PLAYLISTS */}
          <button
            id="tab-youtube-library"
            onClick={() => setActiveTab('youtube_auth')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'youtube_auth'
                ? `border-red-400 text-red-300 font-bold bg-red-500/10`
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-400" />
            YouTube Account Sync
          </button>

          {/* TAB 4: PASTE URL */}
          <button
            id="tab-paste-url"
            onClick={() => setActiveTab('url')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'url'
                ? `border-white text-white font-bold bg-white/[0.08]`
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Paste Direct URL
          </button>

          {/* TAB 5: LOCAL FILE */}
          <button
            id="tab-local-file"
            onClick={() => setActiveTab('file')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'file'
                ? `border-white text-white font-bold bg-white/[0.08]`
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Local Video File
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: DEDICATED PLAYLIST MANAGER (YOUTUBE STYLE) */}
          {activeTab === 'playlists' && (
            <PlaylistManager
              channelId={channelId}
              channelName={displayName}
              channelColor={channelColor}
              onSelectVideo={(src) => {
                onSelectSource(src);
                onClose();
              }}
            />
          )}

          {/* TAB 2: QUICK PRESETS & CRUD PRESET MANAGER */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Top Card: Quick Insert & Save Custom Preset Form */}
              <div className="bg-[#141520] border border-white/[0.08] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookmarkPlus className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      Add / Insert Link with Label Name
                    </span>
                  </div>
                  {feedbackMsg && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border animate-in fade-in duration-150 flex items-center gap-1 ${
                      feedbackMsg.type === 'success' 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      <Check className="w-3 h-3" /> {feedbackMsg.text}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* URL Input */}
                  <div className="sm:col-span-6 relative">
                    <Globe className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                    <input
                      id="input-quick-preset-url"
                      type="text"
                      placeholder="Paste YouTube or video stream URL..."
                      value={newPresetUrl}
                      onChange={(e) => {
                        setNewPresetUrl(e.target.value);
                        if (!newPresetLabel && e.target.value.trim()) {
                          const ytId = extractYouTubeId(e.target.value.trim());
                          if (ytId) setNewPresetLabel(`YouTube Stream (${ytId})`);
                        }
                      }}
                      className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] font-mono transition"
                    />
                  </div>

                  {/* Label Name Input */}
                  <div className="sm:col-span-4 relative">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                    <input
                      id="input-quick-preset-label"
                      type="text"
                      placeholder="Label name (e.g. Breaking News)"
                      value={newPresetLabel}
                      onChange={(e) => setNewPresetLabel(e.target.value)}
                      className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="sm:col-span-2 flex gap-1.5">
                    <button
                      id="btn-quick-preset-play-save"
                      onClick={(e) => handleSaveNewPreset(e, true)}
                      disabled={!newPresetUrl.trim()}
                      className="flex-1 py-2 px-2 text-[11px] font-bold rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 shadow transition flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                      title="Save & immediately play in active channel"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>

                    <button
                      id="btn-quick-preset-save-only"
                      onClick={(e) => handleSaveNewPreset(e, false)}
                      disabled={!newPresetUrl.trim()}
                      className="py-2 px-2.5 text-[11px] font-bold rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/[0.08] transition shadow flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
                      title="Save to Presets Library"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Presets Filter, Search & Reset Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    id="filter-preset-all"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'bg-[#141520] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
                    }`}
                  >
                    All ({presets.length})
                  </button>

                  <button
                    id="filter-preset-youtube"
                    onClick={() => setSelectedCategoryFilter('youtube')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] flex items-center gap-1 ${
                      selectedCategoryFilter === 'youtube'
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'bg-[#141520] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
                    }`}
                  >
                    <Youtube className="w-3 h-3 text-red-400" />
                    YouTube ({presets.filter(p => p.type === 'youtube' || p.category.includes('YouTube')).length})
                  </button>

                  <button
                    id="filter-preset-custom"
                    onClick={() => setSelectedCategoryFilter('custom')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] flex items-center gap-1 ${
                      selectedCategoryFilter === 'custom'
                        ? 'bg-emerald-500 text-zinc-950 font-bold shadow-xs'
                        : 'bg-[#141520] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
                    }`}
                  >
                    <Bookmark className="w-3 h-3 text-emerald-400" />
                    Custom Added ({presets.filter(p => p.isCustom).length})
                  </button>

                  <button
                    id="btn-reset-presets-defaults"
                    onClick={handleResetDefaults}
                    className="px-2.5 py-1 rounded-lg font-medium text-[11px] text-zinc-400 hover:text-white bg-[#141520] hover:bg-white/[0.06] border border-white/[0.06] transition flex items-center gap-1"
                    title="Restore default 12 streams"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore 12 Defaults
                  </button>
                </div>

                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                  <input
                    id="input-search-presets"
                    type="text"
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-zinc-500 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Preset Cards Grid */}
              {filteredPresets.length === 0 ? (
                <div className="p-8 text-center bg-[#141520] rounded-2xl border border-dashed border-white/[0.08] space-y-2">
                  <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-300">No presets found</p>
                  <p className="text-xs text-zinc-500">Insert a link above or click "Restore 12 Defaults" to reload the standard streams.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredPresets.map((preset, idx) => {
                    const isCurrent = currentSource.url === preset.url || (preset.youtubeId && currentSource.youtubeId === preset.youtubeId);
                    const isYt = preset.type === 'youtube' || preset.category.includes('YouTube');

                    return (
                      <div
                        key={preset.id || `${preset.url}-${idx}`}
                        id={`preset-card-${channelId}-${idx}`}
                        onClick={() => {
                          onSelectSource({
                            type: preset.type,
                            url: preset.url,
                            youtubeId: preset.youtubeId,
                            title: preset.title
                          });
                          onClose();
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left group relative ${
                          isCurrent 
                            ? 'bg-white/[0.08] border-white/[0.25] shadow-md ring-1 ring-white/20' 
                            : 'bg-[#141520] hover:bg-white/[0.04] border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white line-clamp-1">
                              {preset.title}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                                isYt 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                  : 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                              }`}>
                                {preset.category}
                              </span>

                              <button
                                id={`btn-edit-preset-${preset.id || idx}`}
                                onClick={(e) => handleStartEdit(preset, e)}
                                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
                                title="Edit preset title, label, or URL"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                id={`btn-delete-preset-${preset.id || idx}`}
                                onClick={(e) => handleDeletePreset(preset.id || preset.url, e)}
                                className="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                title="Delete preset from catalog"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] text-zinc-500 line-clamp-1 font-mono mb-1">
                            {preset.url}
                          </p>
                          <p className="text-[11px] text-zinc-400 line-clamp-2">
                            {preset.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.06]">
                          {isCurrent ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active on this channel
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 flex items-center gap-1 transition-colors">
                              <Play className="w-2.5 h-2.5 fill-current" /> Click to play
                            </span>
                          )}

                          <span className="text-[10px] text-zinc-600 font-mono">
                            {preset.youtubeId ? `ID: ${preset.youtubeId}` : preset.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* EDIT PRESET MODAL OVERLAY */}
              {editingPreset && (
                <div 
                  className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-100"
                  onClick={(e) => { e.stopPropagation(); setEditingPreset(null); }}
                >
                  <div 
                    id="modal-edit-preset-dialog"
                    className="w-full max-w-md bg-[#11121a] border border-white/[0.1] rounded-2xl p-5 shadow-2xl space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-sky-400" />
                        <h3 className="text-sm font-bold text-zinc-100">Edit Preset</h3>
                      </div>
                      <button
                        onClick={() => setEditingPreset(null)}
                        className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">Preset Label / Title</label>
                        <input
                          type="text"
                          required
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white/[0.2]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">Stream URL</label>
                        <input
                          type="text"
                          required
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-white/[0.2]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
                        <input
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white/[0.2]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">Description</label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white/[0.2]"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setEditingPreset(null)}
                          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/[0.04] rounded-xl transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl shadow transition flex items-center gap-1.5"
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
          )}

          {/* TAB 3: YOUTUBE LOGIN & LIBRARY */}
          {activeTab === 'youtube_auth' && (
            <YouTubeLibraryBrowser
              channelId={channelId}
              channelName={displayName}
              channelColor={channelColor}
              onSelectVideo={(src) => {
                onSelectSource(src);
                onClose();
              }}
            />
          )}

          {/* TAB 4: CUSTOM URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Stream / Video URL</span>
                  <span className="text-[11px] text-zinc-500 font-mono">YouTube, MP4, WebM, HLS (.m3u8), DASH (.mpd)</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <input
                    id="input-source-url"
                    type="text"
                    required
                    placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value);
                      if (!inputTitle && e.target.value.trim()) {
                        const ytId = extractYouTubeId(e.target.value.trim());
                        if (ytId) setInputTitle(`YouTube Video (${ytId})`);
                      }
                    }}
                    className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] font-mono transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Custom Title / Label Name
                </label>
                <input
                  id="input-source-title"
                  type="text"
                  placeholder="e.g. My Favorite News Stream or Camera 1"
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition"
                />
              </div>

              <div className="p-3 bg-[#141520] rounded-xl border border-white/[0.06] flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={saveToPresetsFromUrlTab}
                    onChange={(e) => setSaveToPresetsFromUrlTab(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0c0d14] border-white/[0.1] text-sky-400 focus:ring-0 cursor-pointer accent-sky-400"
                  />
                  <span className="font-medium">Also save this link &amp; label into Quick Presets library for future 1-click access</span>
                </label>
              </div>

              {inputUrl.trim() && (
                <div className="p-3 bg-[#141520] rounded-xl border border-white/[0.06] text-xs flex items-center gap-2">
                  <span className="text-zinc-400">Detected Source Type:</span>
                  <span className="font-mono text-sky-400 font-bold uppercase">
                    {extractYouTubeId(inputUrl) ? 'YouTube Video / Stream' : detectSourceType(inputUrl)}
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-apply-url"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl shadow transition active:scale-95"
                >
                  Load Stream into {displayName}
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: LOCAL FILE */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                id="input-file-picker"
                type="file"
                accept="video/*,.mp4,.webm,.mkv,.mov,.m4v,.ts"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div
                id="drop-zone-local-file"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? 'border-sky-400 bg-sky-500/10'
                    : 'border-white/[0.1] hover:border-white/[0.2] bg-[#141520] hover:bg-[#181926]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-300">
                  <FileVideo className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    Click to browse or drag &amp; drop video here
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Supports MP4, WebM, MKV, MOV, TS (Local browser playback via Blob URL)
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl shadow transition"
                >
                  Choose Video File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
