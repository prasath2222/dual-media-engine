import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudUpload, RefreshCw, Trash2, X, Database, CheckCircle2, 
  Download, Upload, ShieldCheck, Key, ExternalLink, Sparkles, Layers,
  Calendar, Clock, User
} from 'lucide-react';
import { AppProductionState, CloudSnapshot, GoogleUserProfile } from '../types';
import { GoogleAuthService } from '../lib/googleAuthService';
import { CloudSyncService } from '../lib/cloudSyncService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AppProductionState;
  onRestoreState: (state: AppProductionState) => void;
}

export function CloudSyncModal({
  isOpen,
  onClose,
  currentState,
  onRestoreState
}: CloudSyncModalProps) {
  const [user, setUser] = useState<GoogleUserProfile | null>(GoogleAuthService.getCurrentUser());
  const [snapshots, setSnapshots] = useState<CloudSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [clientIdInput, setClientIdInput] = useState(GoogleAuthService.getStoredClientId());
  const [activeTab, setActiveTab] = useState<'snapshots' | 'export' | 'oauth'>('snapshots');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen, user]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const list = await CloudSyncService.getSnapshots(user);
      setSnapshots(list);
    } catch (err) {
      console.warn('Could not load snapshots:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotName.trim()) return;

    setIsLoading(true);
    try {
      await CloudSyncService.createSnapshot(user, newSnapshotName.trim(), currentState);
      setNewSnapshotName('');
      setStatusMessage('Cloud snapshot created successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
      await loadSnapshots();
    } catch (err: any) {
      alert(err.message || 'Failed to create snapshot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cloud snapshot?')) return;
    setIsLoading(true);
    try {
      await CloudSyncService.deleteSnapshot(user, id);
      await loadSnapshots();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreSnapshot = (snapshot: CloudSnapshot) => {
    if (!confirm(`Restore layout "${snapshot.name}" (${snapshot.channelCount} channels)? Current unsaved changes will be replaced.`)) {
      return;
    }
    onRestoreState(snapshot.state);
    onClose();
  };

  const handleSaveClientId = () => {
    GoogleAuthService.setStoredClientId(clientIdInput);
    setStatusMessage('OAuth Client ID saved!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `multistream-production-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
          onRestoreState(parsed);
          setStatusMessage('Backup imported successfully!');
          setTimeout(() => {
            setStatusMessage(null);
            onClose();
          }, 1000);
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err: any) {
        alert('Failed to parse backup JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        id="modal-cloud-sync-manager"
        className="relative w-full max-w-3xl bg-[#0e0f17] border border-white/[0.1] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#11121a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Production Cloud Sync &amp; Backups</span>
                {user && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected: {user.email}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Save and restore your multi-feed matrix, audio mixes, and playlists across all devices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/[0.08] bg-[#0c0d14] text-xs">
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === 'snapshots'
                ? 'text-white border-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            Cloud Snapshots ({snapshots.length})
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === 'export'
                ? 'text-white border-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            JSON Import / Export
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === 'oauth'
                ? 'text-white border-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            OAuth Settings
          </button>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-zinc-300">
          {activeTab === 'snapshots' && (
            <div className="space-y-4">
              {/* Create Snapshot Input Form */}
              <form onSubmit={handleCreateSnapshot} className="p-4 rounded-xl bg-[#141520] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200 text-xs flex items-center gap-1.5">
                    <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                    Create Named Production Snapshot
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Captures {currentState.players.length} Feeds + {currentState.playlists.length} Playlists
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Quad News Matrix or Live Gaming Streams"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    className="flex-1 bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2]"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !newSnapshotName.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-40"
                  >
                    Save Snapshot
                  </button>
                </div>
              </form>

              {/* Snapshots List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span>Saved Cloud Snapshots</span>
                  <button 
                    onClick={loadSnapshots} 
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {isLoading && snapshots.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                    Loading cloud snapshots...
                  </div>
                ) : snapshots.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#141520] border border-white/[0.06] text-zinc-400 space-y-1">
                    <Database className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-300">No Named Snapshots Yet</p>
                    <p className="text-[11px] text-zinc-500">
                      Create your first snapshot above to save a permanent milestone of this layout.
                    </p>
                  </div>
                ) : (
                  snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3.5 rounded-xl bg-[#141520] border border-white/[0.06] hover:border-white/[0.12] transition flex flex-wrap items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200 text-xs">{snap.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {snap.channelCount} Channels ({snap.layoutMode})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {new Date(snap.createdAt).toLocaleString()}
                          </span>
                          <span>&bull;</span>
                          <span>{snap.state.playlists?.length || 0} Playlists</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestoreSnapshot(snap)}
                          className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded-xl shadow-xs transition active:scale-95"
                          title="Restore this entire snapshot state"
                        >
                          Restore State
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/[0.06] transition"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141520] border border-white/[0.08] space-y-3">
                <h3 className="font-bold text-zinc-100 text-xs">Full Production State Backup (JSON)</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Export all currently configured feeds, volume levels, mute states, custom playlists, and matrix templates into a portable file, or restore from a previous JSON export.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON Backup
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-semibold text-xs rounded-xl border border-white/[0.1] transition cursor-pointer active:scale-95">
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Upload &amp; Restore JSON Backup</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'oauth' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141520] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Custom Google OAuth Client ID</span>
                  </div>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                  >
                    Google Cloud Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Optional: If you want to use your own Google Cloud project credentials for YouTube &amp; Google Sign-In, paste your Web OAuth Client ID here.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="1234567890-xxx.apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="flex-1 bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-white/[0.2]"
                  />
                  <button
                    onClick={handleSaveClientId}
                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow transition active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#11121a] border-t border-white/[0.08] flex justify-between items-center text-xs">
          <span className="text-zinc-500 text-[11px]">
            Real-time state persisted to Server &amp; LocalStorage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
