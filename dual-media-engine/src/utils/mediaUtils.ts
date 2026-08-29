import { SourceItem, SourceType } from '../types';

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = cleanUrl.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

export function detectSourceType(url: string): SourceType {
  const clean = url.trim().toLowerCase();
  if (extractYouTubeId(clean)) {
    return 'youtube';
  }
  if (clean.includes('.m3u8') || clean.startsWith('hls:')) {
    return 'hls';
  }
  if (clean.includes('.mpd')) {
    return 'dash';
  }
  return 'direct';
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0 || !isFinite(seconds)) {
    return '00:00';
  }
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const PRESET_SOURCES: SourceItem[] = [
  {
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    youtubeId: 'jNQXAC9IVRw',
    title: 'YouTube: Me at the zoo (First YouTube Video)'
  },
  {
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'YouTube: Rick Astley - Never Gonna Give You Up'
  },
  {
    type: 'hls',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    title: 'HLS Live Stream (Mux Test Stream)'
  },
  {
    type: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Direct MP4: Big Buck Bunny (1080p)'
  },
  {
    type: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    title: 'Direct MP4: Elephants Dream (720p)'
  },
  {
    type: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Direct MP4: For Bigger Blazes'
  }
];
