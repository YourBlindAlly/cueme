import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateSong } from '../storage/migrateSong';
import type { Song } from '../types';

const LIBRARY_KEY = 'cueme.library';

export async function loadLibrary(): Promise<Song[]> {
  const raw = await AsyncStorage.getItem(LIBRARY_KEY);
  if (!raw) {
    return [];
  }
  const songs = (JSON.parse(raw) as Song[]).map(migrateSong);
  return songs.sort((a, b) => b.addedAt - a.addedAt);
}

async function saveLibrary(songs: Song[]): Promise<void> {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(songs));
}

/**
 * Adds a song, or replaces an existing entry that's really the same song —
 * either the same internal id, or (for a Dropbox-sourced song) the same
 * Dropbox path. Every import gets a fresh random id (see buildSong.ts), so
 * matching on id alone would let re-importing the same Dropbox file (e.g.
 * after a parsing fix changed how it comes out) add a second, stale-content
 * entry alongside the original instead of replacing it.
 */
export async function upsertLibrarySong(song: Song): Promise<Song[]> {
  const current = await loadLibrary();
  const isSameSong = (existing: Song) =>
    existing.id === song.id ||
    (song.source.type === 'dropbox' &&
      existing.source.type === 'dropbox' &&
      existing.source.path === song.source.path);
  const next = [song, ...current.filter((s) => !isSameSong(s))];
  await saveLibrary(next);
  return next.sort((a, b) => b.addedAt - a.addedAt);
}

export async function removeLibrarySong(id: string): Promise<Song[]> {
  const current = await loadLibrary();
  const next = current.filter((s) => s.id !== id);
  await saveLibrary(next);
  return next;
}
