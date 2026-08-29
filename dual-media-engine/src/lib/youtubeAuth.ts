import { YouTubeUser, YouTubePlaylistItem, YouTubeVideoItem } from '../types/youtube';

const GOOGLE_GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

// Client-side helper for Google Identity OAuth & YouTube Data API
export class YouTubeAuthService {
  private static tokenClient: any = null;
  private static accessToken: string | null = null;
  private static currentUser: YouTubeUser | null = null;

  // Load Google Identity Services script dynamically if not present
  public static async loadGsiScript(): Promise<void> {
    if (window.google?.accounts?.oauth2) return;

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_GSI_SCRIPT_URL}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_GSI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
      document.head.appendChild(script);
    });
  }

  // Get current stored token
  public static getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = sessionStorage.getItem('yt_access_token');
    }
    return this.accessToken;
  }

  // Clear session token
  public static logout(): void {
    if (this.accessToken && window.google?.accounts?.oauth2?.revoke) {
      try {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {});
      } catch {
        // ignore revoke error
      }
    }
    this.accessToken = null;
    this.currentUser = null;
    sessionStorage.removeItem('yt_access_token');
    sessionStorage.removeItem('yt_user_profile');
  }

  public static getSavedUser(): YouTubeUser | null {
    if (this.currentUser) return this.currentUser;
    const stored = sessionStorage.getItem('yt_user_profile');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Launch OAuth Popup allowing user to choose ANY account (select_account)
  public static async loginWithGoogle(clientId: string): Promise<{ token: string; user: YouTubeUser }> {
    await this.loadGsiScript();

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services not initialized'));
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        prompt: 'select_account', // CRITICAL: forces account chooser on any device
        callback: async (response: { access_token?: string; error?: string }) => {
          if (response.error || !response.access_token) {
            return reject(new Error(response.error || 'Authentication cancelled'));
          }

          const token = response.access_token;
          this.accessToken = token;
          sessionStorage.setItem('yt_access_token', token);

          try {
            // Fetch User Profile
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const profile = await profileRes.json();
            const user: YouTubeUser = {
              name: profile.name || 'YouTube User',
              email: profile.email || '',
              picture: profile.picture || ''
            };
            this.currentUser = user;
            sessionStorage.setItem('yt_user_profile', JSON.stringify(user));

            resolve({ token, user });
          } catch (e: any) {
            // Fallback if profile fails
            const user: YouTubeUser = {
              name: 'YouTube User',
              email: '',
              picture: ''
            };
            resolve({ token, user });
          }
        }
      });

      this.tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  // Fetch Playlists belonging to the logged-in YouTube account
  public static async getMyPlaylists(token: string): Promise<YouTubePlaylistItem[]> {
    const url = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails,status&mine=true&maxResults=50';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.logout();
        throw new Error('Session expired. Please sign in again.');
      }
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch playlists');
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet?.title || 'Untitled Playlist',
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      itemCount: item.contentDetails?.itemCount || 0,
      privacyStatus: item.status?.privacyStatus || 'public'
    }));
  }

  // Fetch videos in a specific playlist
  public static async getPlaylistVideos(playlistId: string, token: string): Promise<YouTubeVideoItem[]> {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch playlist videos');
    }

    const data = await res.json();
    return (data.items || [])
      .map((item: any) => {
        const vidId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId;
        if (!vidId) return null;
        return {
          id: vidId,
          title: item.snippet?.title || 'Untitled Video',
          description: item.snippet?.description || '',
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          channelTitle: item.snippet?.channelTitle || '',
          publishedAt: item.snippet?.publishedAt || ''
        };
      })
      .filter(Boolean) as YouTubeVideoItem[];
  }

  // Fetch Subscriptions / Channel Uploads
  public static async getMySubscriptions(token: string): Promise<{ channelId: string; title: string; thumbnailUrl: string }[]> {
    const url = 'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch subscriptions');
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      channelId: item.snippet?.resourceId?.channelId,
      title: item.snippet?.title || 'Channel',
      thumbnailUrl: item.snippet?.thumbnails?.default?.url || ''
    }));
  }

  // Search YouTube publicly or with token
  public static async searchYouTube(query: string, token?: string, apiKey?: string): Promise<YouTubeVideoItem[]> {
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20`;
    if (apiKey) url += `&key=${apiKey}`;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Search failed');
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id?.videoId,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      channelTitle: item.snippet?.channelTitle || '',
      publishedAt: item.snippet?.publishedAt || '',
      isLive: item.snippet?.liveBroadcastContent === 'live'
    }));
  }
}
