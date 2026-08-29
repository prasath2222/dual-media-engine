export interface YouTubeUser {
  name: string;
  email: string;
  picture: string;
}

export interface YouTubePlaylistItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  itemCount: number;
  privacyStatus?: string;
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  isLive?: boolean;
}

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            prompt?: string;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke: (token: string, callback?: () => void) => void;
        };
      };
    };
  }
}
