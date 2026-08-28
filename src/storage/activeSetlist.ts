import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Setlist } from '../setlist/setlistCsv';

const ACTIVE_SETLIST_KEY = 'cueme.activeSetlist';

export type ActiveSetlistState = {
  setlist: Setlist;
  currentIndex: number;
};

export async function saveActiveSetlist(state: ActiveSetlistState): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_SETLIST_KEY, JSON.stringify(state));
}

export async function loadActiveSetlist(): Promise<ActiveSetlistState | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_SETLIST_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as ActiveSetlistState;
}

export async function clearActiveSetlist(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_SETLIST_KEY);
}
