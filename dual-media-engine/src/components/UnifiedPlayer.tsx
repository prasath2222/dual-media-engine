import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Hls from 'hls.js';
import * as dashjs from 'dashjs';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  RotateCcw, RotateCw, AlertCircle, Loader2, Radio,
  Settings2, Gauge, Minus, Plus, X
} from 'lucide-react';
import { MediaSourceConfig, PlayerChannelState, ChannelColorName } from '../types';
import { loadYouTubeIFrameApi } from '../lib/youtubeHelper';
import { CHANNEL_THEMES } from '../lib/channelThemes';

export interface PlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setMute: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface UnifiedPlayerProps {
  id: string;
  channelNumber?: number;
  channelName?: string;
  source: MediaSourceConfig;
  channelColor: ChannelColorName;
  onStateChange?: (state: Partial<PlayerChannelState>) => void;
  onRequestChangeSource?: () => void;
  onRemovePlayer?: () => void;
  canRemove?: boolean;
}

export const UnifiedPlayer = forwardRef<PlayerHandle, UnifiedPlayerProps>(({
  id,
  channelNumber,
  channelName,
  source,
  channelColor,
  onStateChange,
  onRequestChangeSource,
  onRemovePlayer,
  canRemove = false
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashPlayerRef = useRef<dashjs.MediaPlayerClass | null>(null);
  const timePollIntervalRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSpeedChange = (newRate: number) => {
    const clamped = Math.max(0.25, Math.min(3.0, Math.round(newRate * 100) / 100));
    setPlaybackRateState(clamped);
    if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      try {
        ytPlayerRef.current.setPlaybackRate(clamped);
      } catch (err) {
        console.warn('Error setting YouTube playback rate:', err);
      }
    }
    if (videoRef.current) {
      videoRef.current.playbackRate = clamped;
    }
    notifyParent({ playbackRate: clamped });
  };

  const isYouTube = source.type === 'youtube' && !!source.youtubeId;
  const isDirectOrStream = ['direct', 'local', 'hls', 'dash'].includes(source.type);

  // Sync state upward
  const notifyParent = (updates: Partial<PlayerChannelState>) => {
    onStateChange?.({
      id,
      source,
      isPlaying,
      isMuted,
      volume,
      currentTime,
      duration,
      isLive,
      playbackRate,
      isLoading,
      buffering,
      error,
      ...updates
    });
  };

  // Expose Player Handle to parent
  useImperativeHandle(ref, () => ({
    play: async () => {
      setError(null);
      if (isYouTube && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          notifyParent({ isPlaying: true });
        } catch (e: any) {
          setError(e?.message || 'Failed to play YouTube');
        }
      } else if (videoRef.current) {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          notifyParent({ isPlaying: true });
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            setError(e?.message || 'Playback blocked. Tap anywhere to allow browser audio.');
          }
        }
      }
    },
    pause: () => {
      if (isYouTube && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
          notifyParent({ isPlaying: false });
        } catch {
          // ignore
        }
      } else if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        notifyParent({ isPlaying: false });
      }
    },
    seek: (seconds: number) => {
      const clamped = Math.max(0, duration ? Math.min(seconds, duration) : seconds);
      setCurrentTime(clamped);
      if (isYouTube && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.seekTo(clamped, true);
        } catch {
          // ignore
        }
      } else if (videoRef.current) {
        videoRef.current.currentTime = clamped;
      }
      notifyParent({ currentTime: clamped });
    },
    setVolume: (newVol: number) => {
      const clamped = Math.max(0, Math.min(100, newVol));
      setVolumeState(clamped);
      if (isYouTube && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.setVolume(clamped);
        } catch {
          // ignore
        }
      }
      if (videoRef.current) {
        videoRef.current.volume = clamped / 100;
      }
      notifyParent({ volume: clamped });
    },
    toggleMute: () => {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (isYouTube && ytPlayerRef.current) {
        try {
          if (newMuted) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
        } catch {
          // ignore
        }
      }
      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
      notifyParent({ isMuted: newMuted });
    },
    setMute: (muted: boolean) => {
      setIsMuted(muted);
      if (isYouTube && ytPlayerRef.current) {
        try {
          if (muted) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
        } catch {
          // ignore
        }
      }
      if (videoRef.current) {
        videoRef.current.muted = muted;
      }
      notifyParent({ isMuted: muted });
    },
    setPlaybackRate: (rate: number) => {
      handleSpeedChange(rate);
    },
    getCurrentTime: () => currentTime,
    getDuration: () => duration
  }));

  // Clean up streaming instances
  const destroyStreamInstances = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (dashPlayerRef.current) {
      dashPlayerRef.current.reset();
      dashPlayerRef.current = null;
    }
    if (timePollIntervalRef.current) {
      clearInterval(timePollIntervalRef.current);
      timePollIntervalRef.current = null;
    }
  };

  // 1. YouTube Player Initializer
  useEffect(() => {
    if (!isYouTube || !source.youtubeId) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    loadYouTubeIFrameApi().then(() => {
      if (!isMounted) return;

      const containerId = `yt-player-container-${id}`;
      const containerEl = document.getElementById(containerId);
      if (containerEl) {
        containerEl.innerHTML = `<div id="yt-embed-${id}"></div>`;
      }

      try {
        ytPlayerRef.current = new window.YT.Player(`yt-embed-${id}`, {
          videoId: source.youtubeId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsLoading(false);
              event.target.setVolume(volume);
              if (isMuted) event.target.mute();
              const dur = event.target.getDuration() || 0;
              setDuration(dur);
              setIsLive(dur === 0);
              notifyParent({ isLoading: false, duration: dur, isLive: dur === 0 });
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              const state = event.data;
              if (state === 1) { // Playing
                setIsPlaying(true);
                setBuffering(false);
                notifyParent({ isPlaying: true, buffering: false });
              } else if (state === 2 || state === 0) { // Paused or Ended
                setIsPlaying(false);
                setBuffering(false);
                notifyParent({ isPlaying: false, buffering: false });
              } else if (state === 3) { // Buffering
                setBuffering(true);
                notifyParent({ buffering: true });
              }
            },
            onError: (event: any) => {
              if (!isMounted) return;
              setIsLoading(false);
              let msg = 'YouTube error occurred';
              if (event.data === 2) msg = 'Invalid YouTube video ID parameter';
              else if (event.data === 5) msg = 'HTML5 player error on YouTube';
              else if (event.data === 100) msg = 'Video not found or removed';
              else if (event.data === 101 || event.data === 150) msg = 'Owner does not allow embedded playback';
              setError(msg);
              notifyParent({ error: msg, isLoading: false });
            }
          }
        });
      } catch (err: any) {
        setIsLoading(false);
        setError(err?.message || 'Failed to initialize YouTube player');
      }
    });

    // Polling YouTube time
    timePollIntervalRef.current = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const t = ytPlayerRef.current.getCurrentTime() || 0;
          const d = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(t);
          if (d > 0 && d !== duration) {
            setDuration(d);
            setIsLive(false);
          }
        } catch {
          // ignore
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      destroyStreamInstances();
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [source.youtubeId, isYouTube]);

  // 2. HTML5 Video (Direct, Local File, HLS, DASH) Initializer
  useEffect(() => {
    if (!isDirectOrStream || !videoRef.current) {
      destroyStreamInstances();
      return;
    }

    const video = videoRef.current;
    destroyStreamInstances();
    setError(null);
    setIsLoading(true);

    video.volume = volume / 100;
    video.muted = isMuted;

    if (source.type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsRef.current = hls;
        hls.loadSource(source.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('HLS network error, stream may be offline or blocked by CORS');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('HLS media decoding error, recovering...');
                hls.recoverMediaError();
                break;
              default:
                setError('Unrecoverable HLS stream error');
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source.url;
      } else {
        setError('HLS is not supported in this browser');
      }
    } else if (source.type === 'dash') {
      try {
        const dashPlayer = dashjs.MediaPlayer().create();
        dashPlayerRef.current = dashPlayer;
        dashPlayer.initialize(video, source.url, false);
        dashPlayer.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
          setError(`DASH error: ${e.error || 'Check stream URL and CORS'}`);
        });
      } catch (err: any) {
        setError(`Failed to load DASH player: ${err.message}`);
      }
    } else if (source.type === 'local' && source.file) {
      const objectUrl = URL.createObjectURL(source.file);
      video.src = objectUrl;
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else if (source.url) {
      video.src = source.url;
    }

    return () => {
      destroyStreamInstances();
    };
  }, [source.type, source.url, source.file]);

  const togglePlay = async () => {
    if (isPlaying) {
      if (isYouTube && ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
      else videoRef.current?.pause();
      setIsPlaying(false);
      notifyParent({ isPlaying: false });
    } else {
      setError(null);
      if (isYouTube && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          notifyParent({ isPlaying: true });
        } catch (e: any) {
          setError(e?.message || 'Error playing YouTube');
        }
      } else if (videoRef.current) {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          notifyParent({ isPlaying: true });
        } catch (e: any) {
          setError(e?.message || 'Playback blocked by browser audio policy. Click to interact.');
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (isYouTube && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    notifyParent({ currentTime: time });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolumeState(val);
    if (isMuted) setIsMuted(false);

    if (isYouTube && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(val);
      if (isMuted) ytPlayerRef.current.unMute();
    }
    if (videoRef.current) {
      videoRef.current.volume = val / 100;
      videoRef.current.muted = false;
    }
    notifyParent({ volume: val, isMuted: false });
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYouTube && ytPlayerRef.current) {
      if (nextMuted) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    }
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    notifyParent({ isMuted: nextMuted });
  };

  const handleSkip = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(currentTime + seconds, duration || currentTime + seconds));
    setCurrentTime(nextTime);
    if (isYouTube && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(nextTime, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
    notifyParent({ currentTime: nextTime });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const theme = CHANNEL_THEMES[channelColor] || CHANNEL_THEMES.blue;
  const displayName = channelName || (channelNumber ? `CH ${channelNumber.toString().padStart(2, '0')}` : `CH ${id}`);
  const isAudioActive = isPlaying && !isMuted && volume > 0;

  return (
    <div
      ref={containerRef}
      id={`player-card-${id}`}
      className="relative flex flex-col bg-[#11121d] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.65)] transition-all duration-200 group"
    >
      {/* Studio Channel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141624] border-b border-white/[0.06] gap-3 z-10 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Channel Monospace Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono font-bold text-zinc-200 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${theme.dotColor} ${isAudioActive ? 'animate-pulse' : ''}`} />
            <span>{displayName}</span>
          </div>

          <div className="min-w-0 flex items-center gap-2">
            <h3 className="text-xs font-semibold text-zinc-100 truncate tracking-tight" title={source.title || 'Untitled Source'}>
              {source.title || 'Untitled Source'}
            </h3>
            
            {/* Format / Stream Tag */}
            <span className="uppercase text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06] flex-shrink-0 hidden sm:inline-block">
              {source.type}
            </span>

            {isLive && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-bold text-[9px] flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Studio Action Strip */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            id={`btn-change-source-${id}`}
            onClick={onRequestChangeSource}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white rounded-lg border border-white/[0.08] transition-all duration-150 active:scale-95 shadow-2xs"
            title="Change media source or select playlist"
          >
            <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px]">Source</span>
          </button>

          <button
            id={`btn-fullscreen-${id}`}
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-150"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {canRemove && onRemovePlayer && (
            <button
              id={`btn-remove-player-${id}`}
              onClick={onRemovePlayer}
              title={`Close feed ${displayName}`}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport Stage */}
      <div className="relative aspect-video w-full bg-[#07080e] flex items-center justify-center overflow-hidden">
        {/* YouTube Mount Point */}
        <div
          id={`yt-player-container-${id}`}
          className={`w-full h-full absolute inset-0 ${isYouTube ? 'block' : 'hidden'}`}
        />

        {/* HTML5 Video Mount Point */}
        {isDirectOrStream && (
          <video
            ref={videoRef}
            id={`video-element-${id}`}
            playsInline
            className="w-full h-full object-contain"
            onTimeUpdate={() => {
              if (videoRef.current) {
                const t = videoRef.current.currentTime;
                const d = videoRef.current.duration || 0;
                setCurrentTime(t);
                if (d > 0 && d !== duration) {
                  setDuration(d);
                  setIsLive(d === Infinity);
                }
                notifyParent({ currentTime: t, duration: d });
              }
            }}
            onLoadedMetadata={() => {
              setIsLoading(false);
              if (videoRef.current) {
                const d = videoRef.current.duration;
                setDuration(d);
                setIsLive(d === Infinity);
                notifyParent({ duration: d, isLoading: false });
              }
            }}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => {
              setBuffering(false);
              setIsPlaying(true);
              notifyParent({ isPlaying: true, buffering: false });
            }}
            onPause={() => {
              setIsPlaying(false);
              notifyParent({ isPlaying: false });
            }}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load video file/stream. Check CORS or URL availability.');
              notifyParent({ error: 'Video load error', isLoading: false });
            }}
          />
        )}

        {/* Empty State / Prompt */}
        {source.type === 'empty' && (
          <div className="text-center p-6 text-zinc-400 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 text-zinc-500 shadow-inner">
              <Radio className="w-5 h-5 text-zinc-400 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-zinc-200">No Stream Connected</p>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
              Select a preset channel, custom playlist, or paste a video stream URL
            </p>
            <button
              onClick={onRequestChangeSource}
              className="mt-3.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 shadow-md transition-all duration-150 active:scale-95"
            >
              Select Stream Source
            </button>
          </div>
        )}

        {/* Loading / Buffering Overlay */}
        {(isLoading || buffering) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none z-20">
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
            <span className="text-[11px] font-mono text-zinc-300">
              {isLoading ? 'Connecting stream...' : 'Buffering...'}
            </span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-950/85 backdrop-blur-xs p-5 flex flex-col items-center justify-center text-center gap-2 z-30">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-xs text-red-200 font-mono max-w-md">{error}</p>
            <button
              onClick={onRequestChangeSource}
              className="mt-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Choose Alternative Source
            </button>
          </div>
        )}

        {/* Speed Adjustment Overlay Modal */}
        {showSpeedModal && (
          <div 
            id={`speed-overlay-modal-${id}`}
            className="absolute inset-0 bg-black/75 backdrop-blur-xs z-30 flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSpeedModal(false);
            }}
          >
            <div className="bg-[#161726] border border-white/[0.12] text-zinc-100 rounded-2xl p-5 shadow-2xl w-full max-w-[290px] flex flex-col items-center gap-3 relative animate-in zoom-in-95 duration-150">
              <button 
                onClick={() => setShowSpeedModal(false)}
                className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-[11px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Playback Rate</div>

              {/* Large Speed Value Readout */}
              <div className="text-3xl font-extrabold font-mono tracking-tight text-white select-none">
                {playbackRate.toFixed(2)}x
              </div>

              {/* Stepper & Slider Row */}
              <div className="flex items-center gap-2.5 w-full px-1">
                <button
                  id={`btn-speed-minus-${id}`}
                  onClick={() => handleSpeedChange(Math.max(0.25, playbackRate - 0.05))}
                  className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] text-white font-bold flex items-center justify-center transition border border-white/[0.08] flex-shrink-0"
                  title="Decrease speed (-0.05x)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <input
                  id={`speed-modal-slider-${id}`}
                  type="range"
                  min={0.25}
                  max={2.0}
                  step={0.05}
                  value={playbackRate}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                />

                <button
                  id={`btn-speed-plus-${id}`}
                  onClick={() => handleSpeedChange(Math.min(2.0, playbackRate + 0.05))}
                  className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] text-white font-bold flex items-center justify-center transition border border-white/[0.08] flex-shrink-0"
                  title="Increase speed (+0.05x)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-4 gap-1.5 w-full pt-1">
                {[0.75, 1.0, 1.25, 1.5].map((preset) => (
                  <button
                    key={preset}
                    id={`btn-speed-preset-${id}-${preset}`}
                    onClick={() => handleSpeedChange(preset)}
                    className={`py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                      Math.abs(playbackRate - preset) < 0.01
                        ? 'bg-white text-zinc-950 font-bold shadow-xs'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300'
                    }`}
                  >
                    {preset === 1 ? '1.0x' : `${preset}x`}
                  </button>
                ))}
              </div>

              {/* Done button */}
              <button
                onClick={() => setShowSpeedModal(false)}
                className="w-full py-1.5 bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold rounded-lg transition border border-white/[0.08]"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Center Play button when paused on HTML5 */}
        {isDirectOrStream && !isPlaying && !isLoading && !error && source.type !== 'empty' && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-10">
            <button
              id={`btn-overlay-play-${id}`}
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl transition-all duration-150 hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Modern Studio Control Deck */}
      <div className="px-3.5 py-2.5 bg-[#141624] border-t border-white/[0.06] flex flex-col gap-2 select-none">
        {/* Timeline / Progress Bar */}
        {!isLive ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="font-semibold text-zinc-200">{formatTime(currentTime)}</span>
              <span className="text-zinc-500">{formatTime(duration)}</span>
            </div>
            <div className="relative flex items-center">
              <input
                id={`seek-bar-${id}`}
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white hover:h-1.5 transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-mono text-red-400">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              LIVE FEED
            </span>
            <span className="text-zinc-400 text-[10px]">Real-time broadcast</span>
          </div>
        )}

        {/* Transport & Audio Controls */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Play/Pause & Quick Skip */}
          <div className="flex items-center gap-1">
            <button
              id={`btn-play-pause-${id}`}
              onClick={togglePlay}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-150 active:scale-95 ${
                isPlaying 
                  ? 'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]' 
                  : 'bg-white hover:bg-zinc-200 text-zinc-950 font-bold shadow-xs'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            {!isLive && (
              <>
                <button
                  onClick={() => handleSkip(-10)}
                  title="Rewind 10 seconds"
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded-lg transition-all duration-150"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSkip(10)}
                  title="Forward 10 seconds"
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded-lg transition-all duration-150"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Equalizer Waveform indicator when playing sound */}
            {isAudioActive && (
              <div className="flex items-end gap-0.5 h-3.5 px-1 ml-1" title="Audio active on this feed">
                <span className={`w-0.5 h-full ${theme.barColor} rounded-full animate-[pulse_0.6s_ease-in-out_infinite]`}></span>
                <span className={`w-0.5 h-2/3 ${theme.barColor} rounded-full animate-[pulse_0.4s_ease-in-out_infinite]`}></span>
                <span className={`w-0.5 h-full ${theme.barColor} rounded-full animate-[pulse_0.8s_ease-in-out_infinite]`}></span>
              </div>
            )}
          </div>

          {/* Right Controls: Speed Pill + Volume Control */}
          <div className="flex items-center gap-1.5">
            {/* Playback Rate Trigger */}
            <button
              id={`btn-speed-readout-${id}`}
              onClick={() => setShowSpeedModal(true)}
              title="Click to adjust playback speed"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] text-[11px] font-mono font-medium transition"
            >
              <Gauge className="w-3 h-3 text-zinc-400" />
              <span>{playbackRate.toFixed(2)}x</span>
            </button>

            {/* Volume Control */}
            <div 
              id={`volume-control-box-${id}`}
              className="flex items-center gap-1.5 bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.06]"
            >
              <button
                id={`btn-mute-${id}`}
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="text-zinc-400 hover:text-white transition flex-shrink-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
                )}
              </button>

              <input
                id={`volume-slider-${id}`}
                type="range"
                min={0}
                max={100}
                step={1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                title={`Volume: ${isMuted ? 0 : volume}%`}
              />

              <span className="text-[10px] font-mono text-zinc-400 w-6 text-right font-medium">
                {isMuted ? '0%' : `${volume}%`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
