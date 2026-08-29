import { AppProductionState, CloudSnapshot, CloudSyncStatus, GoogleUserProfile } from '../types';
import { PlaylistStorageService } from './playlistStorage';
import { ConfigStorageService } from './configStorage';

const LOCAL_BACKUP_KEY = 'multistream_cloud_backup_v1';
const AUTO_SAVE_KEY = 'multistream_autosave_enabled_v1';

type SyncStatusListener = (status: CloudSyncStatus, lastSavedAt: string | null) => void;

export class CloudSyncService {
  private static status: CloudSyncStatus = 'idle';
  private static lastSavedAt: string | null = null;
  private static statusListeners: Set<SyncStatusListener> = new Set();
  private static debounceTimer: any = null;

  public static subscribeStatus(listener: SyncStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.lastSavedAt);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private static setStatus(status: CloudSyncStatus) {
    this.status = status;
    this.statusListeners.forEach(fn => fn(this.status, this.lastSavedAt));
  }

  public static isAutoSaveEnabled(): boolean {
    const val = localStorage.getItem(AUTO_SAVE_KEY);
    return val === null ? true : val === 'true'; // Default true for seamless production experience
  }

  public static setAutoSaveEnabled(enabled: boolean): void {
    localStorage.setItem(AUTO_SAVE_KEY, enabled ? 'true' : 'false');
  }

  // Save the full bundle to Cloud & Local
  public static async saveAllState(
    user: GoogleUserProfile | null,
    stateData: Omit<AppProductionState, 'version' | 'lastSavedAt' | 'userEmail'>
  ): Promise<{ success: boolean; timestamp: string }> {
    this.setStatus('saving');

    const timestamp = new Date().toISOString();
    const fullState: AppProductionState = {
      version: 1,
      lastSavedAt: timestamp,
      userEmail: user?.email || 'guest',
      layoutMode: stateData.layoutMode,
      players: stateData.players,
      audioSettings: stateData.audioSettings || [],
      playlists: stateData.playlists.length > 0 ? stateData.playlists : PlaylistStorageService.getPlaylists(),
      savedLayouts: stateData.savedLayouts.length > 0 ? stateData.savedLayouts : ConfigStorageService.getSavedLayouts(),
      autoSaveEnabled: this.isAutoSaveEnabled()
    };

    // 1. Always save locally immediately
    try {
      localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(fullState));
      // Also update standalone storages
      if (fullState.playlists?.length) {
        PlaylistStorageService.savePlaylists(fullState.playlists);
      }
      if (fullState.savedLayouts?.length) {
        localStorage.setItem('multistream_saved_layouts_v1', JSON.stringify(fullState.savedLayouts));
      }
    } catch (err) {
      console.warn('Local storage save issue:', err);
    }

    // 2. Save to Server Cloud API
    const userId = user?.id || 'guest-session';
    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify({
          userId,
          userEmail: user?.email || '',
          state: fullState
        })
      });

      if (!res.ok) {
        console.warn('Server sync returned non-200, kept in local storage');
      }

      this.lastSavedAt = timestamp;
      this.setStatus('synced');
      return { success: true, timestamp };
    } catch (e) {
      console.warn('Cloud sync offline fallback active:', e);
      this.lastSavedAt = timestamp;
      this.setStatus('offline');
      return { success: true, timestamp };
    }
  }

  // Debounced auto-save for continuous frictionless saving
  public static triggerDebouncedAutoSave(
    user: GoogleUserProfile | null,
    stateData: Omit<AppProductionState, 'version' | 'lastSavedAt' | 'userEmail'>
  ): void {
    if (!this.isAutoSaveEnabled()) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveAllState(user, stateData).catch(err => {
        console.warn('Auto-save error:', err);
      });
    }, 1500);
  }

  // Load latest state from Cloud (or local backup if offline)
  public static async loadLatestState(user: GoogleUserProfile | null): Promise<AppProductionState | null> {
    const userId = user?.id || 'guest-session';
    try {
      const res = await fetch(`/api/user/sync?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(user?.email || '')}`, {
        headers: {
          'x-user-id': userId
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.state && Array.isArray(data.state.players) && data.state.players.length > 0) {
          this.lastSavedAt = data.state.lastSavedAt || new Date().toISOString();
          this.setStatus('synced');
          return data.state;
        }
      }
    } catch {
      // fallback to local
    }

    // Fallback: LocalStorage
    try {
      const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
          this.lastSavedAt = parsed.lastSavedAt || null;
          this.setStatus('offline');
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  // Cloud Snapshots management
  public static async getSnapshots(user: GoogleUserProfile | null): Promise<CloudSnapshot[]> {
    const userId = user?.id || 'guest-session';
    try {
      const res = await fetch(`/api/user/snapshots?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.snapshots)) {
          return data.snapshots;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch cloud snapshots:', e);
    }

    // Local fallback
    try {
      const raw = localStorage.getItem(`multistream_snapshots_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }

    return [];
  }

  public static async createSnapshot(
    user: GoogleUserProfile | null,
    name: string,
    state: AppProductionState
  ): Promise<CloudSnapshot> {
    const userId = user?.id || 'guest-session';
    const snapshot: CloudSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: name.trim() || `Production Snapshot (${new Date().toLocaleDateString()})`,
      createdAt: new Date().toISOString(),
      channelCount: state.players.length,
      layoutMode: state.layoutMode,
      state
    };

    // Save to server
    try {
      await fetch('/api/user/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, snapshot })
      });
    } catch (e) {
      console.warn('Server snapshot save offline:', e);
    }

    // Local storage
    try {
      const existing = await this.getSnapshots(user);
      const updated = [snapshot, ...existing.filter(s => s.id !== snapshot.id)];
      localStorage.setItem(`multistream_snapshots_${userId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return snapshot;
  }

  public static async deleteSnapshot(user: GoogleUserProfile | null, snapshotId: string): Promise<void> {
    const userId = user?.id || 'guest-session';
    try {
      await fetch(`/api/user/snapshots/${snapshotId}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
    } catch {
      // ignore
    }

    try {
      const existing = await this.getSnapshots(user);
      const filtered = existing.filter(s => s.id !== snapshotId);
      localStorage.setItem(`multistream_snapshots_${userId}`, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }
}
