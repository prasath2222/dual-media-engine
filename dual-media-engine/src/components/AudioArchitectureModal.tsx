import React from 'react';
import { X, AlertTriangle, Cpu, CheckCircle2 } from 'lucide-react';

interface AudioArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioArchitectureModal({ isOpen, onClose }: AudioArchitectureModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        id="modal-audio-architecture"
        className="relative w-full max-w-3xl bg-[#0e0f17] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#11121a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                Browser Simultaneous Audio: Capabilities &amp; Limitations
              </h2>
              <p className="text-xs text-zinc-400">
                Technical explanation of HTML5 Video, YouTube IFrame API, and Web Audio API
              </p>
            </div>
          </div>

          <button
            id="btn-close-audio-modal"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-zinc-300 leading-relaxed">
          {/* Section 1: What Works */}
          <div className="p-4 rounded-xl bg-[#141520] border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>What A Web App CAN Do (Simultaneous Audio in Single Page)</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>
                <strong>Multiple Concurrent Audio Streams:</strong> Modern web browsers (Chrome, Firefox, Safari, Edge) support playing multiple <code className="text-emerald-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">&lt;video&gt;</code> elements and YouTube <code className="text-emerald-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">&lt;iframe&gt;</code> players simultaneously within the <em>same active webpage</em>.
              </li>
              <li>
                <strong>Independent Volume &amp; Mute Controls:</strong> Each HTML5 video player provides its own <code className="text-emerald-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">video.volume</code> and <code className="text-emerald-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">video.muted</code>. Similarly, each YouTube player provides <code className="text-emerald-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">player.setVolume()</code>, <code className="text-emerald-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">player.mute()</code>, and <code className="text-emerald-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">player.unMute()</code>.
              </li>
              <li>
                <strong>Hardware Audio Mixing:</strong> The browser routes all playing media streams to the operating system's audio output subsystem (WASAPI on Windows, CoreAudio on macOS, AudioFlinger/PulseAudio on Linux/Android), which performs real-time audio summation.
              </li>
              <li>
                <strong>HLS and DASH Adaptive Bitrate:</strong> HLS (<code className="text-emerald-300">.m3u8</code>) and DASH (<code className="text-emerald-300">.mpd</code>) audio/video demuxing via Media Source Extensions (MSE) in <code className="text-emerald-300">hls.js</code> and <code className="text-emerald-300">dashjs</code>.
              </li>
            </ul>
          </div>

          {/* Section 2: What It CANNOT Do */}
          <div className="p-4 rounded-xl bg-[#141520] border border-amber-500/20 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>What A Web App CANNOT Do (Browser Security &amp; Sandbox Limits)</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>
                <strong>No Direct Web Audio API Capture on YouTube IFrames:</strong> The browser's <em>Same-Origin Policy (SOP)</em> strictly forbids JavaScript in the host page from accessing the DOM, audio nodes, or raw PCM samples inside a cross-origin YouTube iframe (<code className="text-amber-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">youtube.com</code>). You cannot pipe a YouTube iframe through <code className="text-amber-300 bg-[#0c0d14] px-1 py-0.5 rounded border border-white/[0.06]">AudioContext.createMediaElementSource()</code>.
              </li>
              <li>
                <strong>Cross-Origin (CORS) Video Restrictions:</strong> An HTML5 <code className="text-amber-300">&lt;video&gt;</code> element hosted on a remote server that does not return <code className="text-amber-300">Access-Control-Allow-Origin: *</code> can be played and heard normally, but cannot be processed by Web Audio API DSP nodes without throwing a CORS security exception.
              </li>
              <li>
                <strong>Mobile Browser Background Auto-Pause:</strong> On iOS Safari and Android Chrome, switching away from the tab or minimizing the browser will pause media playback due to mobile OS background execution constraints.
              </li>
              <li>
                <strong>Autoplay Policies:</strong> Browsers require a user interaction (like clicking "Play Both" or tapping the screen) before unmuted audio playback is permitted.
              </li>
            </ul>
          </div>

          {/* Section 3: Architecture Diagram */}
          <div className="p-4 rounded-xl bg-[#0c0d14] border border-white/[0.08] space-y-2 font-mono text-[11px]">
            <div className="text-zinc-200 font-bold mb-2">Multi-Stream Simultaneous Browser Playback Architecture</div>
            <pre className="text-zinc-400 leading-relaxed overflow-x-auto">
{`[ Channel 1: YouTube Live / Stream ] ──> [ Browser Audio Session 1 ] ──┐
[ Channel 2: YouTube / MP4 File   ] ──> [ Browser Audio Session 2 ] ──┼──> [ OS Hardware Audio Mixer ] ──> Speaker / Headphones
[ Channel 3: HLS (.m3u8) Stream   ] ──> [ Browser Audio Session 3 ] ──┤
[ Channel N: DASH / Local File    ] ──> [ Browser Audio Session N ] ──┘`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#11121a] border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-semibold transition shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
