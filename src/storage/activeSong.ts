import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateSong } from './migrateSong';
import type { Song } from '../types';

const ACTIVE_SONG_KEY = 'cueme.activeSong';

export async function saveActiveSong(song: Song): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_SONG_KEY, JSON.stringify(song));
}

export async function loadActiveSong(): Promise<Song | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_SONG_KEY);
  if (!raw) {
    return null;
  }
  return migrateSong(JSON.parse(raw) as Song);
}

export async function clearActiveSong(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_SONG_KEY);
}
