import { SavedLayoutConfig, SavedPlayerConfig } from '../types';

const STORAGE_KEY = 'multistream_saved_layouts_v1';

export class ConfigStorageService {
  // Retrieve all saved layouts from local storage
  public static getSavedLayouts(): SavedLayoutConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Return default built-in layouts if user has not created any yet
        return this.getDefaultLayouts();
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return this.getDefaultLayouts();
    } catch (e) {
      console.error('Failed to parse saved layouts from localStorage:', e);
      return this.getDefaultLayouts();
    }
  }

  // Save a new layout configuration into local storage
  public static saveLayout(
    name: string,
    layoutMode: 'grid' | 'split' | 'single',
    players: SavedPlayerConfig[]
  ): SavedLayoutConfig {
    const existing = this.getSavedLayouts();
    
    // Clean up player sources to strip any non-serializable fields (like live File objects)
    const sanitizedPlayers: SavedPlayerConfig[] = players.map(p => ({
      id: p.id,
      channelNumber: p.channelNumber,
      channelName: p.channelName,
      color: p.color,
      source: {
        type: p.source.type,
        url: p.source.url || '',
        title: p.source.title || `Channel ${p.channelNumber}`,
        youtubeId: p.source.youtubeId,
        fileName: p.source.fileName,
        isLive: p.source.isLive
      }
    }));

    const newConfig: SavedLayoutConfig = {
      id: `layout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || `Layout (${players.length} Channels - ${new Date().toLocaleDateString()})`,
      createdAt: new Date().toISOString(),
      layoutMode,
      players: sanitizedPlayers
    };

    const updated = [newConfig, ...existing.filter(item => item.id !== newConfig.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newConfig;
  }

  // Delete a saved layout by ID
  public static deleteLayout(id: string): SavedLayoutConfig[] {
    const existing = this.getSavedLayouts();
    const filtered = existing.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  }

  // Export all layouts as a formatted JSON string
  public static exportAsJson(): string {
    const layouts = this.getSavedLayouts();
    return JSON.stringify(layouts, null, 2);
  }

  // Import layouts from a JSON string with schema validation
  public static importFromJson(jsonString: string): SavedLayoutConfig[] {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new Error('Imported data must be an array of layout configurations.');
      }
      
      const validConfigs: SavedLayoutConfig[] = parsed.filter(item => (
        item &&
        typeof item.name === 'string' &&
        Array.isArray(item.players) &&
        item.players.length > 0
      ));

      if (validConfigs.length === 0) {
        throw new Error('No valid layout configurations found in imported file.');
      }

      const existing = this.getSavedLayouts();
      const existingIds = new Set(existing.map(e => e.id));
      
      const merged = [
        ...validConfigs.map(c => ({
          ...c,
          id: existingIds.has(c.id) ? `layout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` : (c.id || `layout-${Date.now()}`)
        })),
        ...existing
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (e: any) {
      throw new Error(e.message || 'Failed to parse JSON layout data');
    }
  }

  // Initial starter templates
  private static getDefaultLayouts(): SavedLayoutConfig[] {
    return [
      {
        id: 'default-duo-stream',
        name: 'Dual YouTube Live Streamer',
        createdAt: new Date().toISOString(),
        layoutMode: 'grid',
        players: [
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
        ]
      },
      {
        id: 'default-quad-matrix',
        name: 'Quad Studio Matrix (4-Player)',
        createdAt: new Date().toISOString(),
        layoutMode: 'grid',
        players: [
          {
            id: 'ch-1',
            channelNumber: 1,
            channelName: 'Channel 1',
            color: 'blue',
            source: {
              type: 'youtube',
              youtubeId: 'gCNeDWCI0vo',
              url: 'https://www.youtube.com/live/gCNeDWCI0vo',
              title: 'YouTube Stream 1'
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
              title: 'YouTube Stream 2'
            }
          },
          {
            id: 'ch-3',
            channelNumber: 3,
            channelName: 'Channel 3',
            color: 'purple',
            source: {
              type: 'youtube',
              youtubeId: 'eNpqwF66c9g',
              url: 'https://youtu.be/eNpqwF66c9g',
              title: 'YouTube Stream 3 (eNpqwF66c9g)'
            }
          },
          {
            id: 'ch-4',
            channelNumber: 4,
            channelName: 'Channel 4',
            color: 'amber',
            source: {
              type: 'youtube',
              youtubeId: 'spaElsXxb9k',
              url: 'https://youtu.be/spaElsXxb9k',
              title: 'YouTube Stream 4 (spaElsXxb9k)'
            }
          }
        ]
      },
      {
        id: 'default-hexa-matrix',
        name: 'Hexa Studio Matrix (6-Player)',
        createdAt: new Date().toISOString(),
        layoutMode: 'grid',
        players: [
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
          },
          {
            id: 'ch-3',
            channelNumber: 3,
            channelName: 'Channel 3',
            color: 'purple',
            source: {
              type: 'youtube',
              youtubeId: 'eNpqwF66c9g',
              url: 'https://youtu.be/eNpqwF66c9g',
              title: 'YouTube Stream 3 (eNpqwF66c9g)'
            }
          },
          {
            id: 'ch-4',
            channelNumber: 4,
            channelName: 'Channel 4',
            color: 'amber',
            source: {
              type: 'youtube',
              youtubeId: 'spaElsXxb9k',
              url: 'https://youtu.be/spaElsXxb9k',
              title: 'YouTube Stream 4 (spaElsXxb9k)'
            }
          },
          {
            id: 'ch-5',
            channelNumber: 5,
            channelName: 'Channel 5',
            color: 'rose',
            source: {
              type: 'youtube',
              youtubeId: 'iufOnP-lVtk',
              url: 'https://youtu.be/iufOnP-lVtk',
              title: 'YouTube Stream 5 (iufOnP-lVtk)'
            }
          },
          {
            id: 'ch-6',
            channelNumber: 6,
            channelName: 'Channel 6',
            color: 'cyan',
            source: {
              type: 'youtube',
              youtubeId: '1lyu1KKwC74',
              url: 'https://youtu.be/1lyu1KKwC74',
              title: 'YouTube Stream 6 (1lyu1KKwC74)'
            }
          }
        ]
      }
    ];
  }
}
