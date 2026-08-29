import React, { useState, useEffect } from 'react';
import { 
  LogIn, LogOut, User, ListMusic, Play, RefreshCw, 
  ExternalLink, ChevronRight, ArrowLeft, Video, ShieldCheck, Key
} from 'lucide-react';
import { YouTubeAuthService } from '../lib/youtubeAuth';
import { YouTubeUser, YouTubePlaylistItem, YouTubeVideoItem } from '../types/youtube';
import { MediaSourceConfig, ChannelColorName } from '../types';
import { CHANNEL_THEMES } from '../lib/channelThemes';

interface YouTubeLibraryBrowserProps {
  channelId: string;
  channelName?: string;
  channelColor: ChannelColorName;
  onSelectVideo: (source: MediaSourceConfig) => void;
}

export function YouTubeLibraryBrowser({
  channelId,
  channelName,
  channelColor,
  onSelectVideo
}: YouTubeLibraryBrowserProps) {
  const [user, setUser] = useState<YouTubeUser | null>(YouTubeAuthService.getSavedUser());
  const [token, setToken] = useState<string | null>(YouTubeAuthService.getAccessToken());
  const [customClientId, setCustomClientId] = useState<string>(() => {
    return localStorage.getItem('custom_google_client_id') || '';
  });
  const [isConfiguringClient, setIsConfiguringClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Playlists and Videos state
  const [playlists, setPlaylists] = useState<YouTubePlaylistItem[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<YouTubePlaylistItem | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<YouTubeVideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    if (token) {
      loadPlaylists(token);
    }
  }, []);

  const loadPlaylists = async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await YouTubeAuthService.getMyPlaylists(accessToken);
      setPlaylists(list);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch YouTube playlists');
      if (err.message?.includes('expired') || err.message?.includes('401')) {
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    // If user provided a custom client ID or environment has one
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
    const clientId = customClientId.trim() || envClientId;

    if (!clientId) {
      setIsConfiguringClient(true);
      setError('Please provide your Google OAuth 2.0 Client ID to sign into YouTube on this device.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Saves custom client ID locally on this device for future logins
      localStorage.setItem('custom_google_client_id', clientId);
      const res = await YouTubeAuthService.loginWithGoogle(clientId);
      setUser(res.user);
      setToken(res.token);
      setIsConfiguringClient(false);
      await loadPlaylists(res.token);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed or popup was closed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    YouTubeAuthService.logout();
    setUser(null);
    setToken(null);
    setPlaylists([]);
    setSelectedPlaylist(null);
    setPlaylistVideos([]);
  };

  const handleOpenPlaylist = async (pl: YouTubePlaylistItem) => {
    if (!token) return;
    setSelectedPlaylist(pl);
    setLoadingVideos(true);
    setError(null);
    try {
      const vids = await YouTubeAuthService.getPlaylistVideos(pl.id, token);
      setPlaylistVideos(vids);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch videos from playlist');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handlePickVideo = (vid: YouTubeVideoItem) => {
    onSelectVideo({
      type: 'youtube',
      youtubeId: vid.id,
      url: `https://www.youtube.com/watch?v=${vid.id}`,
      title: vid.title
    });
  };

  const theme = CHANNEL_THEMES[channelColor] || CHANNEL_THEMES.blue;
  const buttonActive = `${theme.buttonBg} ${theme.buttonHover}`;
  const displayName = channelName || `Channel ${channelId}`;


  return (
    <div className="space-y-4">
      {/* Account Header / Auth Bar */}
      <div className="p-4 rounded-xl bg-[#141520] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-10 h-10 rounded-full border border-red-500/40"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-100">{user.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  YouTube Connected
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">{user.email || 'Google Account'}</p>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              YouTube Account Login
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Sign in with any YouTube account to access your saved playlists, uploads, and private streams.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => token && loadPlaylists(token)}
                disabled={isLoading}
                title="Refresh Playlists"
                className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogin}
                className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition"
                title="Switch to a different Google account on this device"
              >
                Switch Account
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConfiguringClient(!isConfiguringClient)}
                className="p-2 text-zinc-400 hover:text-zinc-200 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-xs"
                title="Configure Google OAuth Client ID"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow transition active:scale-95 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {isLoading ? 'Connecting...' : 'Sign in with YouTube'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Client ID Configuration Prompt */}
      {(!user || isConfiguringClient) && isConfiguringClient && (
        <div className="p-4 rounded-xl bg-[#141520] border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>How to get your free Google OAuth Client ID (3 Steps)</span>
            </div>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
            >
              Open Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 rounded-lg bg-[#0c0d14] border border-white/[0.06] text-[11px] text-zinc-300 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-zinc-200">Quick 2-Minute Setup:</p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>Go to <strong className="text-zinc-300">Google Cloud Console &rarr; APIs &amp; Services &rarr; Credentials</strong>.</li>
              <li>Click <strong className="text-zinc-300">+ Create Credentials &rarr; OAuth client ID</strong> (Application type: <em>Web application</em>).</li>
              <li>Under <strong className="text-zinc-300">Authorized JavaScript origins</strong>, add this exact current domain:
                <div className="mt-1 flex items-center gap-2 bg-[#11121a] px-2 py-1 rounded font-mono text-[10px] text-emerald-400 border border-white/[0.06] select-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'Current domain'}
                </div>
              </li>
              <li>Also enable the <strong className="text-zinc-300">YouTube Data API v3</strong> in your project Library.</li>
              <li>Copy the generated <strong className="text-zinc-300">Client ID</strong> and paste below.</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 1234567890-abcdef.apps.googleusercontent.com"
              value={customClientId}
              onChange={(e) => setCustomClientId(e.target.value)}
              className="flex-1 bg-[#0c0d14] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-white/[0.2]"
            />
            <button
              onClick={handleLogin}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition whitespace-nowrap"
            >
              Save &amp; Sign In
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* When logged in: Content view */}
      {user && (
        <div className="space-y-3">
          {/* Breadcrumb / Nav */}
          {selectedPlaylist ? (
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to All Playlists
              </button>
              <span className="text-xs font-bold text-zinc-100 truncate max-w-xs">
                {selectedPlaylist.title} ({playlistVideos.length} items)
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Your YouTube Playlists ({playlists.length})</span>
              <span>Click a playlist to browse videos</span>
            </div>
          )}

          {/* Videos inside selected playlist */}
          {selectedPlaylist ? (
            loadingVideos ? (
              <div className="p-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-red-400" />
                Loading playlist items...
              </div>
            ) : playlistVideos.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No videos found in this playlist.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {playlistVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => handlePickVideo(vid)}
                    className="p-2.5 rounded-xl bg-[#141520] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer flex gap-3 group text-left items-center"
                  >
                    {vid.thumbnailUrl ? (
                      <img 
                        src={vid.thumbnailUrl} 
                        alt="" 
                        className="w-20 h-12 object-cover rounded-lg flex-shrink-0 bg-black"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-500 flex-shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-zinc-200 line-clamp-1 group-hover:text-white">
                        {vid.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                        {vid.channelTitle}
                      </p>
                    </div>
                    <button
                      className="p-1.5 rounded-lg text-zinc-950 bg-white opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                      title={`Load into ${displayName}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Playlists Grid */
            isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-red-400" />
                Loading your playlists from YouTube...
              </div>
            ) : playlists.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#141520] border border-white/[0.06] text-xs text-zinc-400 space-y-1">
                <ListMusic className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                <p className="font-semibold text-zinc-300">No Playlists Found</p>
                <p className="text-[11px] text-zinc-500">
                  Create playlists in your YouTube account or switch to a different account.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => handleOpenPlaylist(pl)}
                    className="p-3 rounded-xl bg-[#141520] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer flex gap-3 group text-left items-center"
                  >
                    {pl.thumbnailUrl ? (
                      <img 
                        src={pl.thumbnailUrl} 
                        alt="" 
                        className="w-16 h-12 object-cover rounded-lg flex-shrink-0 bg-black border border-white/[0.06]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-500 flex-shrink-0">
                        <ListMusic className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white line-clamp-1">
                        {pl.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {pl.itemCount} videos &bull; {pl.privacyStatus}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition flex-shrink-0" />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
