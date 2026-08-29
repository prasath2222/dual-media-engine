import { SamplePreset, SourceType } from '../types';
import { extractYouTubeId, detectSourceType } from '../lib/youtubeHelper';

export const BUILTIN_PRESETS: SamplePreset[] = [
  {
    id: 'yt-stream-1',
    title: 'YouTube Stream 1 (gCNeDWCI0vo)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'gCNeDWCI0vo',
    url: 'https://www.youtube.com/live/gCNeDWCI0vo',
    description: 'Default Stream 1: Real-time broadcast / live feed (gCNeDWCI0vo)'
  },
  {
    id: 'yt-stream-2',
    title: 'YouTube Stream 2 (enJPczyZrWs)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'enJPczyZrWs',
    url: 'https://youtu.be/enJPczyZrWs',
    description: 'Default Stream 2: Video stream / broadcast (enJPczyZrWs)'
  },
  {
    id: 'yt-stream-3',
    title: 'YouTube Stream 3 (eNpqwF66c9g)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'eNpqwF66c9g',
    url: 'https://youtu.be/eNpqwF66c9g',
    description: 'Default Stream 3: High-def video stream (eNpqwF66c9g)'
  },
  {
    id: 'yt-stream-4',
    title: 'YouTube Stream 4 (spaElsXxb9k)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'spaElsXxb9k',
    url: 'https://youtu.be/spaElsXxb9k',
    description: 'Stream 4: Video feed / broadcast (spaElsXxb9k)'
  },
  {
    id: 'yt-stream-5',
    title: 'YouTube Stream 5 (iufOnP-lVtk)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'iufOnP-lVtk',
    url: 'https://youtu.be/iufOnP-lVtk',
    description: 'Stream 5: Video feed / broadcast (iufOnP-lVtk)'
  },
  {
    id: 'yt-stream-6',
    title: 'YouTube Stream 6 (1lyu1KKwC74)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: '1lyu1KKwC74',
    url: 'https://youtu.be/1lyu1KKwC74',
    description: 'Stream 6: Video feed / broadcast (1lyu1KKwC74)'
  },
  {
    id: 'yt-stream-7',
    title: 'YouTube Stream 7 (f2ra_2woJIE)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'f2ra_2woJIE',
    url: 'https://youtu.be/f2ra_2woJIE',
    description: 'Stream 7: Video feed / broadcast (f2ra_2woJIE)'
  },
  {
    id: 'yt-stream-8',
    title: 'YouTube Stream 8 (j7IP4L2Ct-0)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'j7IP4L2Ct-0',
    url: 'https://youtu.be/j7IP4L2Ct-0',
    description: 'Stream 8: Video feed / broadcast (j7IP4L2Ct-0)'
  },
  {
    id: 'yt-stream-9',
    title: 'YouTube Stream 9 (41ZY18JqI2A)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: '41ZY18JqI2A',
    url: 'https://youtu.be/41ZY18JqI2A',
    description: 'Stream 9: Video feed / broadcast (41ZY18JqI2A)'
  },
  {
    id: 'yt-stream-10',
    title: 'YouTube Stream 10 (MwtKJG_87fw)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'MwtKJG_87fw',
    url: 'https://youtu.be/MwtKJG_87fw',
    description: 'Stream 10: Video feed / broadcast (MwtKJG_87fw)'
  },
  {
    id: 'yt-stream-11',
    title: 'YouTube Stream 11 (BcQnHzrc24Y)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'BcQnHzrc24Y',
    url: 'https://youtu.be/BcQnHzrc24Y',
    description: 'Stream 11: Video feed / broadcast (BcQnHzrc24Y)'
  },
  {
    id: 'yt-stream-12',
    title: 'YouTube Stream 12 (uZsY4S4ckMU)',
    category: 'YouTube',
    type: 'youtube',
    youtubeId: 'uZsY4S4ckMU',
    url: 'https://youtu.be/uZsY4S4ckMU',
    description: 'Stream 12: Video feed / broadcast (uZsY4S4ckMU)'
  }
];

export const SAMPLE_PRESETS: SamplePreset[] = BUILTIN_PRESETS;

const PRESETS_STORAGE_KEY = 'multistream_all_active_presets_v2';

// Load active presets from localStorage (or fallback to BUILTIN_PRESETS)
export function getActivePresets(): SamplePreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) {
      // First time: initialize storage with BUILTIN_PRESETS
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(BUILTIN_PRESETS));
      return BUILTIN_PRESETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out any old legacy unwanted test presets (e.g. Big Buck Bunny, NASA, Elephants Dream, etc)
      const sanitized = parsed.filter(p => {
        const u = (p.url || '').toLowerCase();
        const t = (p.title || '').toLowerCase();
        if (t.includes('nasa iss') || u.includes('21x5lgldofg')) return false;
        if (t.includes('big buck bunny') || u.includes('aqz-ke-bpkq') || u.includes('bigbuckbunny')) return false;
        if (t.includes('elephants dream') || u.includes('elephantsdream')) return false;
        if (t.includes('apple hls') || u.includes('x36xhzz')) return false;
        if (t.includes('akamai live hls') || u.includes('2000341/test/master')) return false;
        if (t.includes('envivio') || u.includes('enviviodash3')) return false;
        return true;
      });

      if (sanitized.length !== parsed.length) {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(sanitized.length > 0 ? sanitized : BUILTIN_PRESETS));
        return sanitized.length > 0 ? sanitized : BUILTIN_PRESETS;
      }
      return parsed;
    }
    return BUILTIN_PRESETS;
  } catch (err) {
    console.error('Failed to load presets from storage', err);
    return BUILTIN_PRESETS;
  }
}

// Add a new preset or update existing preset by ID
export function saveOrUpdatePreset(preset: Partial<SamplePreset> & { title: string; url: string }): SamplePreset[] {
  const current = getActivePresets();
  const trimmedUrl = preset.url.trim();
  const ytId = extractYouTubeId(trimmedUrl);
  const detectedType: SourceType = ytId ? 'youtube' : (preset.type || detectSourceType(trimmedUrl));
  
  let finalCategory = preset.category?.trim();
  if (!finalCategory) {
    if (ytId) finalCategory = 'YouTube';
    else if (detectedType === 'hls') finalCategory = 'HLS (.m3u8)';
    else if (detectedType === 'dash') finalCategory = 'DASH (.mpd)';
    else if (detectedType === 'direct') finalCategory = 'Direct MP4';
    else finalCategory = 'Custom';
  }

  const existingIdx = current.findIndex(p => p.id === preset.id || (p.url === trimmedUrl && !preset.id));

  const targetId = preset.id || (existingIdx >= 0 ? current[existingIdx].id : `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);

  const updatedItem: SamplePreset = {
    id: targetId,
    title: preset.title.trim() || (ytId ? `YouTube (${ytId})` : `${finalCategory} Stream`),
    category: finalCategory,
    type: detectedType,
    url: trimmedUrl,
    youtubeId: ytId || undefined,
    description: preset.description?.trim() || (ytId ? `YouTube feed (${ytId})` : `${finalCategory} media stream`),
    isCustom: existingIdx >= 0 ? current[existingIdx].isCustom : true,
    createdAt: existingIdx >= 0 ? current[existingIdx].createdAt : new Date().toISOString()
  };

  let updatedList: SamplePreset[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = updatedItem;
  } else {
    updatedList = [updatedItem, ...current];
  }

  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList;
}

// Delete any preset by ID or URL
export function deletePreset(id: string): SamplePreset[] {
  const current = getActivePresets();
  const updated = current.filter(p => p.id !== id && p.url !== id);
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Reset all presets to default 12 streams
export function resetPresetsToDefault(): SamplePreset[] {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(BUILTIN_PRESETS));
  return BUILTIN_PRESETS;
}

// Legacy helper compatibility
export function getCustomPresets(): SamplePreset[] {
  return getActivePresets();
}

export function saveCustomPreset(title: string, url: string, category?: string, description?: string): SamplePreset {
  const list = saveOrUpdatePreset({ title, url, category, description });
  return list[0];
}

export function deleteCustomPreset(id: string): SamplePreset[] {
  return deletePreset(id);
}
