import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Song } from '../types';

const LIBRARY_KEY = 'cueme.library';

export async function loadLibrary(): Promise<Song[]> {
  const raw = await AsyncStorage.getItem(LIBRARY_KEY);
  if (!raw) {
    return [];
  }
  const songs = JSON.parse(raw) as Song[];
  return songs.sort((a, b) => b.addedAt - a.addedAt);
}

async function saveLibrary(songs: Song[]): Promise<void> {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(songs));
}

/** Adds a song, or replaces an existing entry with the same id. */
export async function upsertLibrarySong(song: Song): Promise<Song[]> {
  const current = await loadLibrary();
  const next = [song, ...current.filter((s) => s.id !== song.id)];
  await saveLibrary(next);
  return next.sort((a, b) => b.addedAt - a.addedAt);
}

export async function removeLibrarySong(id: string): Promise<Song[]> {
  const current = await loadLibrary();
  const next = current.filter((s) => s.id !== id);
  await saveLibrary(next);
  return next;
}
