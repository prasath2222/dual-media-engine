import React, { useState, useEffect, useRef } from 'react';
import { 
  LogIn, LogOut, Cloud, CloudCheck, CloudUpload, RefreshCw, 
  Settings, CheckCircle2, User, ChevronDown, Sparkles, Database, ShieldCheck
} from 'lucide-react';
import { GoogleUserProfile, CloudSyncStatus } from '../types';
import { GoogleAuthService } from '../lib/googleAuthService';
import { CloudSyncService } from '../lib/cloudSyncService';

interface GoogleAuthButtonProps {
  onSaveAll: () => Promise<void>;
  onLoadLatest: () => Promise<void>;
  onOpenSnapshots: () => void;
  onOpenClientIdConfig: () => void;
}

export function GoogleAuthButton({
  onSaveAll,
  onLoadLatest,
  onOpenSnapshots,
  onOpenClientIdConfig
}: GoogleAuthButtonProps) {
  const [user, setUser] = useState<GoogleUserProfile | null>(GoogleAuthService.getCurrentUser());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [autoSave, setAutoSave] = useState(CloudSyncService.isAutoSaveEnabled());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = GoogleAuthService.subscribe((u) => setUser(u));
    const unsubSync = CloudSyncService.subscribeStatus((st, savedAt) => {
      setSyncStatus(st);
      if (savedAt) setLastSavedAt(savedAt);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubAuth();
      unsubSync();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await GoogleAuthService.signInWithGoogle();
      setDropdownOpen(false);
    } catch (err: any) {
      if (err.message !== 'Sign-in cancelled') {
        alert(err.message || 'Failed to sign in with Google');
      }
    }
  };

  const handleSignOut = () => {
    GoogleAuthService.signOut();
    setDropdownOpen(false);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await onSaveAll();
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualLoad = async () => {
    setIsLoadingCloud(true);
    try {
      await onLoadLatest();
      setDropdownOpen(false);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleToggleAutoSave = () => {
    const next = !autoSave;
    setAutoSave(next);
    CloudSyncService.setAutoSaveEnabled(next);
  };

  const formatLastSavedTime = (isoString: string | null) => {
    if (!isoString) return 'Not saved yet';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {user ? (
        // Logged In Pill
        <div className="flex items-center gap-1.5">
          <button
            id="btn-google-user-profile"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs transition-all duration-150 active:scale-95 group"
            title={`Signed in as ${user.email}. Click for Cloud Sync options.`}
          >
            {user.picture ? (
              <img 
                src={user.picture} 
                alt="" 
                className="w-5 h-5 rounded-full object-cover border border-white/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-bold flex items-center justify-center text-[10px]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-100 group-hover:text-white leading-tight truncate max-w-[90px] sm:max-w-[120px]">
                {user.name.split(' ')[0]}
              </span>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'saving' ? 'bg-amber-400 animate-ping' :
                  syncStatus === 'synced' ? 'bg-emerald-400' :
                  syncStatus === 'offline' ? 'bg-sky-400' : 'bg-zinc-500'
                }`}></span>
                <span className="text-[9px] font-mono text-zinc-400">
                  {syncStatus === 'saving' ? 'Saving...' :
                   syncStatus === 'synced' ? 'Cloud Synced' :
                   syncStatus === 'offline' ? 'Saved (Local)' : 'Cloud Ready'}
                </span>
              </div>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Direct 1-Click Quick Save Icon */}
          <button
            id="btn-quick-cloud-save"
            onClick={handleManualSave}
            disabled={isSaving}
            title="Save All Channels, Audio & Playlists to Cloud"
            className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition active:scale-95 disabled:opacity-50"
          >
            <CloudUpload className={`w-4 h-4 ${isSaving ? 'animate-bounce' : ''}`} />
          </button>
        </div>
      ) : (
        // Logged Out: Official Google Sign-In Button
        <button
          id="btn-google-sign-in"
          onClick={handleSignIn}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-xs transition-all duration-150 shadow-md active:scale-95 border border-white/80"
          title="Sign in with Google to sync feeds and playlists across devices"
        >
          {/* Official Google G Logo SVG */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="tracking-tight">Sign in with Google</span>
        </button>
      )}

      {/* Cloud & Account Dropdown Popover */}
      {dropdownOpen && user && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0e0f17] border border-white/[0.12] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          {/* User Header */}
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/[0.08]">
            {user.picture ? (
              <img 
                src={user.picture} 
                alt="" 
                className="w-9 h-9 rounded-full object-cover border border-white/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-zinc-100 truncate">{user.name}</p>
              <p className="text-[11px] text-zinc-400 font-mono truncate">{user.email || 'Google Account'}</p>
            </div>
          </div>

          {/* Sync Status Info Box */}
          <div className="p-2.5 rounded-xl bg-[#141520] border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                syncStatus === 'saving' ? 'bg-amber-400 animate-ping' :
                syncStatus === 'synced' ? 'bg-emerald-400' :
                syncStatus === 'offline' ? 'bg-sky-400' : 'bg-zinc-400'
              }`}></span>
              <span className="text-[11px] text-zinc-300 font-medium">
                {syncStatus === 'saving' ? 'Saving state...' :
                 syncStatus === 'synced' ? 'Cloud Synced' :
                 syncStatus === 'offline' ? 'Saved (Offline Store)' : 'Ready to Sync'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {formatLastSavedTime(lastSavedAt)}
            </span>
          </div>

          {/* Primary Cloud Actions */}
          <div className="space-y-1.5">
            {/* 1-Click Save All */}
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <CloudUpload className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>Save All State to Cloud</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">1-Click</span>
            </button>

            {/* Restore from Cloud */}
            <button
              onClick={handleManualLoad}
              disabled={isLoadingCloud}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isLoadingCloud ? 'animate-spin' : ''}`} />
                <span>Sync / Load from Cloud</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">Pull</span>
            </button>

            {/* Cloud Snapshots Modal */}
            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenSnapshots();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-xs font-medium border border-white/[0.06] transition"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Cloud Snapshots &amp; Backups</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">&rarr;</span>
            </button>
          </div>

          {/* Auto-Save Toggle */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between px-1">
            <span className="text-[11px] text-zinc-400 font-medium">Auto-save on change</span>
            <button
              onClick={handleToggleAutoSave}
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                autoSave ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                autoSave ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2 text-xs">
            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenClientIdConfig();
              }}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
              title="Configure Google OAuth Client ID"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>OAuth Settings</span>
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
