import { ChannelColorName } from '../types';

export interface ChannelThemeStyle {
  border: string;
  cardGlow: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accent: string;
  buttonBg: string;
  buttonHover: string;
  activeRing: string;
  barColor: string;
  dotColor: string;
  gradientText: string;
}

export const CHANNEL_THEMES: Record<ChannelColorName, ChannelThemeStyle> = {
  blue: {
    border: 'border-white/[0.08] hover:border-sky-500/40',
    cardGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/30',
    badgeText: 'text-sky-400',
    accent: 'accent-sky-400 text-sky-400',
    buttonBg: 'bg-sky-500',
    buttonHover: 'hover:bg-sky-400 active:bg-sky-600',
    activeRing: 'ring-1 ring-sky-500/40',
    barColor: 'bg-sky-400',
    dotColor: 'bg-sky-400',
    gradientText: 'from-sky-400 to-blue-400'
  },
  emerald: {
    border: 'border-white/[0.08] hover:border-emerald-500/40',
    cardGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
    accent: 'accent-emerald-400 text-emerald-400',
    buttonBg: 'bg-emerald-500',
    buttonHover: 'hover:bg-emerald-400 active:bg-emerald-600',
    activeRing: 'ring-1 ring-emerald-500/40',
    barColor: 'bg-emerald-400',
    dotColor: 'bg-emerald-400',
    gradientText: 'from-emerald-400 to-teal-400'
  },
  purple: {
    border: 'border-white/[0.08] hover:border-violet-500/40',
    cardGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    badgeBg: 'bg-violet-500/10',
    badgeBorder: 'border-violet-500/30',
    badgeText: 'text-violet-400',
    accent: 'accent-violet-400 text-violet-400',
    buttonBg: 'bg-violet-500',
    buttonHover: 'hover:bg-violet-400 active:bg-violet-600',
    activeRing: 'ring-1 ring-violet-500/40',
    barColor: 'bg-violet-400',
    dotColor: 'bg-violet-400',
    gradientText: 'from-violet-400 to-purple-400'
  },
  amber: {
    border: 'border-white/[0.08] hover:border-amber-500/40',
    cardGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400',
    accent: 'accent-amber-400 text-amber-400',
    buttonBg: 'bg-amber-500',
    buttonHover: 'hover:bg-amber-400 active:bg-amber-600',
    activeRing: 'ring-1 ring-amber-500/40',
    barColor: 'bg-amber-400',
    dotColor: 'bg-amber-400',
    gradientText: 'from-amber-400 to-yellow-400'
  },
  rose: {
    border: 'border-white/[0.08] hover:border-rose-500/40',
    cardGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-400',
    accent: 'accent-rose-400 text-rose-400',
    buttonBg: 'bg-rose-500',
    buttonHover: 'hover:bg-rose-400 active:bg-rose-600',
    activeRing: 'ring-1 ring-rose-500/40',
    barColor: 'bg-rose-400',
    dotColor: 'bg-rose-400',
    gradientText: 'from-rose-400 to-pink-400'
  },
  cyan: {
    border: 'border-white/[0.08] hover:border-cyan-500/40',
    cardGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400',
    accent: 'accent-cyan-400 text-cyan-400',
    buttonBg: 'bg-cyan-500',
    buttonHover: 'hover:bg-cyan-400 active:bg-cyan-600',
    activeRing: 'ring-1 ring-cyan-500/40',
    barColor: 'bg-cyan-400',
    dotColor: 'bg-cyan-400',
    gradientText: 'from-cyan-400 to-sky-400'
  },
  indigo: {
    border: 'border-white/[0.08] hover:border-indigo-500/40',
    cardGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-400',
    accent: 'accent-indigo-400 text-indigo-400',
    buttonBg: 'bg-indigo-500',
    buttonHover: 'hover:bg-indigo-400 active:bg-indigo-600',
    activeRing: 'ring-1 ring-indigo-500/40',
    barColor: 'bg-indigo-400',
    dotColor: 'bg-indigo-400',
    gradientText: 'from-indigo-400 to-violet-400'
  },
  orange: {
    border: 'border-white/[0.08] hover:border-orange-500/40',
    cardGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-400',
    accent: 'accent-orange-400 text-orange-400',
    buttonBg: 'bg-orange-500',
    buttonHover: 'hover:bg-orange-400 active:bg-orange-600',
    activeRing: 'ring-1 ring-orange-500/40',
    barColor: 'bg-orange-400',
    dotColor: 'bg-orange-400',
    gradientText: 'from-orange-400 to-amber-400'
  }
};

export const COLOR_PALETTE: ChannelColorName[] = [
  'blue', 'emerald', 'purple', 'amber', 'rose', 'cyan', 'indigo', 'orange'
];

