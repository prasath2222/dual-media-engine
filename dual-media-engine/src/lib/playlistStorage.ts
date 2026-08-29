import { CustomPlaylist, PlaylistVideoItem, SourceType } from '../types';
import { extractYouTubeId, detectSourceType } from './youtubeHelper';

const PLAYLISTS_STORAGE_KEY = 'multistream_user_playlists_v1';

// Default starter playlists
export const DEFAULT_INITIAL_PLAYLISTS: CustomPlaylist[] = [
  {
    id: 'pl-default-1',
    title: 'Featured YouTube Streams',
    description: 'Quick access multi-stream collection',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
    videos: [
      {
        id: 'vid-gCNeDWCI0vo',
        title: 'YouTube Stream 1 (gCNeDWCI0vo)',
        url: 'https://www.youtube.com/live/gCNeDWCI0vo',
        youtubeId: 'gCNeDWCI0vo',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/gCNeDWCI0vo/hqdefault.jpg',
        channelTitle: 'Live Feed',
        addedAt: new Date('2026-01-01').toISOString()
      },
      {
        id: 'vid-enJPczyZrWs',
        title: 'YouTube Stream 2 (enJPczyZrWs)',
        url: 'https://youtu.be/enJPczyZrWs',
        youtubeId: 'enJPczyZrWs',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/enJPczyZrWs/hqdefault.jpg',
        channelTitle: 'Broadcast',
        addedAt: new Date('2026-01-01').toISOString()
      },
      {
        id: 'vid-eNpqwF66c9g',
        title: 'YouTube Stream 3 (eNpqwF66c9g)',
        url: 'https://youtu.be/eNpqwF66c9g',
        youtubeId: 'eNpqwF66c9g',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/eNpqwF66c9g/hqdefault.jpg',
        channelTitle: 'Live HD',
        addedAt: new Date('2026-01-01').toISOString()
      },
      {
        id: 'vid-spaElsXxb9k',
        title: 'YouTube Stream 4 (spaElsXxb9k)',
        url: 'https://youtu.be/spaElsXxb9k',
        youtubeId: 'spaElsXxb9k',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/spaElsXxb9k/hqdefault.jpg',
        channelTitle: 'Broadcast Feed',
        addedAt: new Date('2026-01-01').toISOString()
      },
      {
        id: 'vid-iufOnP-lVtk',
        title: 'YouTube Stream 5 (iufOnP-lVtk)',
        url: 'https://youtu.be/iufOnP-lVtk',
        youtubeId: 'iufOnP-lVtk',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/iufOnP-lVtk/hqdefault.jpg',
        channelTitle: 'Live Stream',
        addedAt: new Date('2026-01-01').toISOString()
      },
      {
        id: 'vid-1lyu1KKwC74',
        title: 'YouTube Stream 6 (1lyu1KKwC74)',
        url: 'https://youtu.be/1lyu1KKwC74',
        youtubeId: '1lyu1KKwC74',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/1lyu1KKwC74/hqdefault.jpg',
        channelTitle: 'Media Feed',
        addedAt: new Date('2026-01-01').toISOString()
      }
    ]
  },
  {
    id: 'pl-default-2',
    title: 'Broadcast & News Matrix',
    description: 'Sequential live camera channels for matrix monitoring',
    createdAt: new Date('2026-01-02').toISOString(),
    updatedAt: new Date('2026-01-02').toISOString(),
    videos: [
      {
        id: 'vid-f2ra_2woJIE',
        title: 'Stream 7 (f2ra_2woJIE)',
        url: 'https://youtu.be/f2ra_2woJIE',
        youtubeId: 'f2ra_2woJIE',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/f2ra_2woJIE/hqdefault.jpg',
        channelTitle: 'Camera 7',
        addedAt: new Date('2026-01-02').toISOString()
      },
      {
        id: 'vid-j7IP4L2Ct-0',
        title: 'Stream 8 (j7IP4L2Ct-0)',
        url: 'https://youtu.be/j7IP4L2Ct-0',
        youtubeId: 'j7IP4L2Ct-0',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/j7IP4L2Ct-0/hqdefault.jpg',
        channelTitle: 'Camera 8',
        addedAt: new Date('2026-01-02').toISOString()
      },
      {
        id: 'vid-41ZY18JqI2A',
        title: 'Stream 9 (41ZY18JqI2A)',
        url: 'https://youtu.be/41ZY18JqI2A',
        youtubeId: '41ZY18JqI2A',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/41ZY18JqI2A/hqdefault.jpg',
        channelTitle: 'Camera 9',
        addedAt: new Date('2026-01-02').toISOString()
      },
      {
        id: 'vid-MwtKJG_87fw',
        title: 'Stream 10 (MwtKJG_87fw)',
        url: 'https://youtu.be/MwtKJG_87fw',
        youtubeId: 'MwtKJG_87fw',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/MwtKJG_87fw/hqdefault.jpg',
        channelTitle: 'Camera 10',
        addedAt: new Date('2026-01-02').toISOString()
      }
    ]
  }
];

export const PlaylistStorageService = {
  getPlaylists(): CustomPlaylist[] {
    try {
      const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_PLAYLISTS));
        return DEFAULT_INITIAL_PLAYLISTS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return DEFAULT_INITIAL_PLAYLISTS;
    } catch (err) {
      console.error('Failed to parse playlists storage:', err);
      return DEFAULT_INITIAL_PLAYLISTS;
    }
  },

  savePlaylists(playlists: CustomPlaylist[]): void {
    try {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    } catch (err) {
      console.error('Failed to save playlists to localStorage', err);
    }
  },

  createPlaylist(title: string, description?: string): CustomPlaylist[] {
    const playlists = this.getPlaylists();
    const newPlaylist: CustomPlaylist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim() || 'Untitled Playlist',
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
      videos: []
    };

    const updated = [newPlaylist, ...playlists];
    this.savePlaylists(updated);
    return updated;
  },

  updatePlaylist(id: string, updates: { title?: string; description?: string }): CustomPlaylist[] {
    const playlists = this.getPlaylists();
    const updated = playlists.map(pl => {
      if (pl.id === id) {
        return {
          ...pl,
          title: updates.title !== undefined ? updates.title.trim() : pl.title,
          description: updates.description !== undefined ? updates.description.trim() : pl.description,
          updatedAt: new Date().toISOString()
        };
      }
      return pl;
    });

    this.savePlaylists(updated);
    return updated;
  },

  deletePlaylist(id: string): CustomPlaylist[] {
    const playlists = this.getPlaylists();
    const updated = playlists.filter(pl => pl.id !== id);
    this.savePlaylists(updated);
    return updated;
  },

  addVideoToPlaylist(
    playlistId: string, 
    videoData: { title?: string; url: string; channelTitle?: string }
  ): { playlists: CustomPlaylist[]; addedVideo: PlaylistVideoItem | null } {
    const playlists = this.getPlaylists();
    const targetIdx = playlists.findIndex(pl => pl.id === playlistId);
    if (targetIdx === -1) return { playlists, addedVideo: null };

    const trimmedUrl = videoData.url.trim();
    const ytId = extractYouTubeId(trimmedUrl);
    const detectedType: SourceType = ytId ? 'youtube' : detectSourceType(trimmedUrl);

    const videoTitle = videoData.title?.trim() || (ytId ? `YouTube Video (${ytId})` : `${detectedType.toUpperCase()} Stream`);
    const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined;

    const newVideo: PlaylistVideoItem = {
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: videoTitle,
      url: trimmedUrl,
      youtubeId: ytId || undefined,
      type: detectedType,
      thumbnailUrl: thumbUrl,
      channelTitle: videoData.channelTitle?.trim() || (ytId ? 'YouTube' : 'Media Stream'),
      addedAt: new Date().toISOString()
    };

    const targetPl = playlists[targetIdx];
    const updatedPl: CustomPlaylist = {
      ...targetPl,
      updatedAt: new Date().toISOString(),
      videos: [...targetPl.videos, newVideo]
    };

    const updatedPlaylists = [...playlists];
    updatedPlaylists[targetIdx] = updatedPl;

    this.savePlaylists(updatedPlaylists);
    return { playlists: updatedPlaylists, addedVideo: newVideo };
  },

  removeVideoFromPlaylist(playlistId: string, videoId: string): CustomPlaylist[] {
    const playlists = this.getPlaylists();
    const targetIdx = playlists.findIndex(pl => pl.id === playlistId);
    if (targetIdx === -1) return playlists;

    const targetPl = playlists[targetIdx];
    const updatedPl: CustomPlaylist = {
      ...targetPl,
      updatedAt: new Date().toISOString(),
      videos: targetPl.videos.filter(v => v.id !== videoId)
    };

    const updatedPlaylists = [...playlists];
    updatedPlaylists[targetIdx] = updatedPl;

    this.savePlaylists(updatedPlaylists);
    return updatedPlaylists;
  },

  reorderVideos(playlistId: string, sourceIndex: number, destIndex: number): CustomPlaylist[] {
    const playlists = this.getPlaylists();
    const targetIdx = playlists.findIndex(pl => pl.id === playlistId);
    if (targetIdx === -1) return playlists;

    const targetPl = playlists[targetIdx];
    const newVideos = Array.from(targetPl.videos);
    const [moved] = newVideos.splice(sourceIndex, 1);
    newVideos.splice(destIndex, 0, moved);

    const updatedPl: CustomPlaylist = {
      ...targetPl,
      updatedAt: new Date().toISOString(),
      videos: newVideos
    };

    const updatedPlaylists = [...playlists];
    updatedPlaylists[targetIdx] = updatedPl;

    this.savePlaylists(updatedPlaylists);
    return updatedPlaylists;
  },

  resetToDefaults(): CustomPlaylist[] {
    this.savePlaylists(DEFAULT_INITIAL_PLAYLISTS);
    return DEFAULT_INITIAL_PLAYLISTS;
  }
};
