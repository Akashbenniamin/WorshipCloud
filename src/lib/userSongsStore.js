import { getSupabaseClient } from './supabaseClient';
import { normalizeSongSearch } from './songParser';

const STORAGE_KEY = 'worship_cloud_user_songs';

export function getLocalUserSongs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse local user songs:', err);
    return [];
  }
}

export function saveLocalUserSongs(songs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs || []));
  } catch (err) {
    console.warn('Failed to save local user songs:', err);
  }
}

export function extractTamilTitleFromLyrics(lyrics = '') {
  if (!lyrics) return '';
  const lines = String(lyrics).replace(/\r/g, '').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Ignore section headers like [Pallavi], Chorus, 1., etc. if line is very short or just a marker
    if (trimmed && !/^\[.*?\]$/.test(trimmed) && !/^(பல்லவி|சரணம்|கோரஸ்|verse|chorus)\s*\d*[:.]?$/i.test(trimmed)) {
      return trimmed;
    }
  }
  // Fallback to first non-empty line
  return lines.find((l) => l.trim())?.trim() || '';
}

/**
 * Creates and persists a new custom song
 */
export async function addCustomSong({ lyrics, tanglishTitle = '', subtitle = '', user = null }) {
  const cleanLyrics = String(lyrics || '').trim();
  if (!cleanLyrics) {
    throw new Error('Song lyrics cannot be empty');
  }

  const tamilTitle = extractTamilTitleFromLyrics(cleanLyrics) || (tanglishTitle.trim() || 'பாடல்');
  const cleanTanglish = String(tanglishTitle || '').trim();
  const cleanSubtitle = String(subtitle || '').trim();

  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const searchCorpus = [tamilTitle, cleanTanglish, cleanSubtitle, cleanLyrics.slice(0, 300)].filter(Boolean).join(' ');
  const normalizedQuery = normalizeSongSearch(searchCorpus);

  const newSong = {
    id,
    title: tamilTitle,
    englishTitle: cleanTanglish,
    subtitle: cleanSubtitle,
    number: 'C',
    custom: true,
    lyrics: cleanLyrics,
    q: normalizedQuery,
    ro: cleanTanglish,
    userId: user?.id || null,
    createdAt: new Date().toISOString()
  };

  const currentLocal = getLocalUserSongs();
  const updatedList = [newSong, ...currentLocal];
  saveLocalUserSongs(updatedList);

  // If user is logged in, sync with Supabase cloud
  if (user) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.updateUser({
          data: {
            custom_songs: updatedList
          }
        });
      }
    } catch (err) {
      console.warn('Failed to sync new song to Supabase cloud:', err);
    }
  }

  return { song: newSong, songs: updatedList };
}

/**
 * Deletes a custom song by ID
 */
export async function removeCustomSong(songId, user = null) {
  const currentLocal = getLocalUserSongs();
  const updatedList = currentLocal.filter((s) => s.id !== songId);
  saveLocalUserSongs(updatedList);

  if (user) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.updateUser({
          data: {
            custom_songs: updatedList
          }
        });
      }
    } catch (err) {
      console.warn('Failed to sync deleted song to Supabase cloud:', err);
    }
  }

  return updatedList;
}

/**
 * Syncs local songs with Supabase cloud when user signs in
 */
export async function syncUserSongs(user) {
  if (!user) return getLocalUserSongs();

  const localSongs = getLocalUserSongs();
  try {
    const cloudSongs = user.raw?.user_metadata?.custom_songs || user.user_metadata?.custom_songs || [];
    if (!Array.isArray(cloudSongs)) return localSongs;

    // Merge by id
    const map = new Map();
    // Put cloud songs first
    cloudSongs.forEach((s) => { if (s?.id) map.set(s.id, s); });
    // Merge local songs (they take precedence if created locally)
    localSongs.forEach((s) => { if (s?.id) map.set(s.id, s); });

    const merged = Array.from(map.values());
    saveLocalUserSongs(merged);

    // If cloud had different count, update cloud in background
    if (merged.length !== cloudSongs.length) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.auth.updateUser({
          data: { custom_songs: merged }
        }).catch(() => {});
      }
    }

    return merged;
  } catch (err) {
    console.warn('Song cloud sync error:', err);
    return localSongs;
  }
}
