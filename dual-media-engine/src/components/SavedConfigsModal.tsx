import React, { useState, useEffect } from 'react';
import { 
  X, Save, FolderOpen, Trash2, Check, Download, Upload, 
  FileJson, Play, LayoutGrid, Clock, Copy, AlertCircle, Sparkles
} from 'lucide-react';
import { SavedLayoutConfig, SavedPlayerConfig } from '../types';
import { ConfigStorageService } from '../lib/configStorage';
import { CHANNEL_THEMES } from '../lib/channelThemes';

interface SavedConfigsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayoutMode: 'grid' | 'split' | 'single';
  currentPlayers: SavedPlayerConfig[];
  onLoadLayout: (config: SavedLayoutConfig) => void;
}

export function SavedConfigsModal({
  isOpen,
  onClose,
  currentLayoutMode,
  currentPlayers,
  onLoadLayout
}: SavedConfigsModalProps) {
  const [activeTab, setActiveTab] = useState<'load' | 'save' | 'json'>('load');
  const [savedLayouts, setSavedLayouts] = useState<SavedLayoutConfig[]>([]);
  const [layoutNameInput, setLayoutNameInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Load saved layouts on open
  useEffect(() => {
    if (isOpen) {
      refreshLayouts();
      // Suggest default name based on current players
      const streamTypes = Array.from(new Set(currentPlayers.map(p => p.source.type.toUpperCase()))).join('/');
      setLayoutNameInput(`${currentPlayers.length}-Player ${streamTypes} Session`);
      setSaveSuccessMsg(null);
      setJsonError(null);
    }
  }, [isOpen, currentPlayers]);

  const refreshLayouts = () => {
    const list = ConfigStorageService.getSavedLayouts();
    setSavedLayouts(list);
  };

  if (!isOpen) return null;

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = ConfigStorageService.saveLayout(
      layoutNameInput || `My ${currentPlayers.length}-Player Layout`,
      currentLayoutMode,
      currentPlayers
    );
    refreshLayouts();
    setSaveSuccessMsg(`Layout "${saved.name}" successfully saved to local storage!`);
    setTimeout(() => {
      setActiveTab('load');
      setSaveSuccessMsg(null);
    }, 1200);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete saved layout "${name}"?`)) {
      const updated = ConfigStorageService.deleteLayout(id);
      setSavedLayouts(updated);
    }
  };

  const handleLoad = (config: SavedLayoutConfig) => {
    onLoadLayout(config);
    onClose();
  };

  const handleCopyJson = () => {
    const jsonStr = ConfigStorageService.exportAsJson();
    navigator.clipboard.writeText(jsonStr);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = ConfigStorageService.exportAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multistream_layouts_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    setJsonError(null);
    if (!jsonInput.trim()) {
      setJsonError('Please paste valid JSON layout data.');
      return;
    }
    try {
      const updated = ConfigStorageService.importFromJson(jsonInput);
      setSavedLayouts(updated);
      setJsonInput('');
      setActiveTab('load');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        id="saved-layouts-modal"
        className="bg-[#0e0f17] border border-white/[0.08] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/[0.08] bg-[#11121a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Layout Configurations</h2>
              <p className="text-[11px] text-zinc-400">Save, restore, and organize your multi-stream video setups in Local Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] bg-[#0c0d14] px-6 gap-2">
          <button
            id="tab-load-configs"
            onClick={() => setActiveTab('load')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'load'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Saved Layouts ({savedLayouts.length})</span>
          </button>

          <button
            id="tab-save-current-config"
            onClick={() => setActiveTab('save')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'save'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Layout</span>
          </button>

          <button
            id="tab-json-export-import"
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'json'
                ? 'border-violet-400 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON Backup / Share</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: LOAD SAVED LAYOUTS */}
          {activeTab === 'load' && (
            <div className="space-y-3">
              {savedLayouts.length === 0 ? (
                <div className="text-center py-12 rounded-xl bg-[#141520] border border-white/[0.06] space-y-2">
                  <FolderOpen className="w-7 h-7 text-zinc-600 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-300">No Saved Layouts Yet</p>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Click "Save Current Layout" to store your active video stream configurations into local storage.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {savedLayouts.map((layout) => (
                    <div
                      key={layout.id}
                      className="p-3.5 rounded-xl bg-[#141520] border border-white/[0.06] hover:border-white/[0.15] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs font-bold text-zinc-100 truncate group-hover:text-sky-300">
                            {layout.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                            {layout.players.length} Channels
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.08]">
                            {layout.layoutMode.toUpperCase()}
                          </span>
                        </div>

                        {/* Preview chips for each player in this saved layout */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {layout.players.map((p, idx) => {
                            const theme = CHANNEL_THEMES[p.color] || CHANNEL_THEMES.blue;
                            return (
                              <div
                                key={idx}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1.5 max-w-[200px] truncate ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}
                                title={`CH ${p.channelNumber}: ${p.source.title || p.source.url}`}
                              >
                                <span className="font-bold">CH {p.channelNumber}:</span>
                                <span className="truncate text-zinc-300">
                                  {p.source.title || p.source.type.toUpperCase()}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>Saved on {new Date(layout.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          id={`btn-load-layout-${layout.id}`}
                          onClick={() => handleLoad(layout)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl shadow transition active:scale-95 whitespace-nowrap"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Load Layout</span>
                        </button>
                        <button
                          onClick={() => handleDelete(layout.id, layout.name)}
                          title="Delete saved configuration"
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVE CURRENT LAYOUT */}
          {activeTab === 'save' && (
            <form onSubmit={handleSaveCurrent} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141520] border border-white/[0.06] space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Snapshot of Current Active Session</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#0c0d14] border border-white/[0.06]">
                    <span className="text-zinc-500 text-[10px] block">Active Feeds:</span>
                    <span className="text-zinc-100 font-bold text-sm">{currentPlayers.length} Channels</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0c0d14] border border-white/[0.06]">
                    <span className="text-zinc-500 text-[10px] block">Layout Mode:</span>
                    <span className="text-zinc-100 font-bold text-sm uppercase">{currentLayoutMode}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0c0d14] border border-white/[0.06] col-span-2 sm:col-span-1">
                    <span className="text-zinc-500 text-[10px] block">Storage Target:</span>
                    <span className="text-emerald-400 font-bold text-sm">Local Storage</span>
                  </div>
                </div>

                {/* List of current sources that will be serialized */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-400">Streams included:</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {currentPlayers.map((p) => {
                      const theme = CHANNEL_THEMES[p.color] || CHANNEL_THEMES.blue;
                      return (
                        <div 
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#0c0d14] border border-white/[0.06] text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}>
                              CH {p.channelNumber}
                            </span>
                            <span className="text-zinc-200 truncate font-medium">
                              {p.source.title || p.source.url || 'Empty Feed'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase px-1.5 py-0.5 rounded bg-white/[0.04]">
                            {p.source.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Layout Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Layout Name / Description</label>
                <input
                  type="text"
                  required
                  value={layoutNameInput}
                  onChange={(e) => setLayoutNameInput(e.target.value)}
                  placeholder="e.g. YouTube Live Esports + Lofi Duo"
                  className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Success Message */}
              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('load')}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-save-layout"
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration to Storage</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: JSON BACKUP / IMPORT */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141520] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-400">Export All Layouts to JSON</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 rounded-lg transition"
                    >
                      {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSuccess ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .json</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3 bg-[#0c0d14] rounded-lg text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-36 border border-white/[0.06]">
                  {ConfigStorageService.exportAsJson()}
                </pre>
              </div>

              {/* Import Section */}
              <div className="p-4 rounded-xl bg-[#141520] border border-white/[0.06] space-y-2.5">
                <span className="text-xs font-semibold text-zinc-200">Import Layouts from JSON</span>
                <textarea
                  rows={4}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='Paste valid layout JSON array here (e.g. [{"name": "My Layout", "layoutMode": "grid", "players": [...]}])...'
                  className="w-full bg-[#0c0d14] border border-white/[0.08] rounded-xl p-3 text-[11px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                />

                {jsonError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{jsonError}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleImportJson}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import &amp; Merge Layouts</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
