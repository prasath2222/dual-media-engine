/**
 * Helper to parse YouTube video IDs from various URL patterns
 */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex patterns
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback search param
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes('youtube.com') && url.searchParams.get('v')) {
      const v = url.searchParams.get('v');
      if (v && v.length === 11) return v;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Detect media source type from URL or file
 */
export function detectSourceType(url: string): 'youtube' | 'hls' | 'dash' | 'direct' {
  const trimmed = url.trim().toLowerCase();

  if (extractYouTubeId(url)) {
    return 'youtube';
  }
  if (trimmed.includes('.m3u8') || trimmed.includes('application/x-mpegurl')) {
    return 'hls';
  }
  if (trimmed.includes('.mpd') || trimmed.includes('application/dash+xml')) {
    return 'dash';
  }
  return 'direct';
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytPromise: Promise<void> | null = null;

/**
 * Ensures the official YouTube IFrame API is loaded and ready
 */
export function loadYouTubeIFrameApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (ytPromise) {
    return ytPromise;
  }

  ytPromise = new Promise<void>((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve();
    };

    // If script not in document, inject it
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }

    // Safety fallback check in case callback fired earlier or already ready
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 150);
  });

  return ytPromise;
}
