import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SetlistEntry } from './setlistCsv';

/**
 * A setlist as actually persisted on-device — the source of truth for
 * everyday use (create, edit, play, delete never depend on connectivity).
 * `id` is stable for the setlist's lifetime, independent of its name, so
 * renaming (not built yet, but not precluded either) wouldn't orphan it the
 * way the old Dropbox-path-as-identity scheme would have.
 */
export type StoredSetlist = {
  id: string;
  name: string;
  entries: SetlistEntry[];
  updatedAt: number;
};

const SETLISTS_KEY = 'cueme.localSetlists';

export function makeSetlistId(): string {
  return `setlist_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export async function loadLocalSetlists(): Promise<StoredSetlist[]> {
  const raw = await AsyncStorage.getItem(SETLISTS_KEY);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as StoredSetlist[];
}

async function saveLocalSetlists(setlists: StoredSetlist[]): Promise<void> {
  await AsyncStorage.setItem(SETLISTS_KEY, JSON.stringify(setlists));
}

export async function upsertLocalSetlist(setlist: StoredSetlist): Promise<StoredSetlist[]> {
  const current = await loadLocalSetlists();
  const next = [setlist, ...current.filter((s) => s.id !== setlist.id)];
  await saveLocalSetlists(next);
  return next;
}

export async function removeLocalSetlist(id: string): Promise<StoredSetlist[]> {
  const current = await loadLocalSetlists();
  const next = current.filter((s) => s.id !== id);
  await saveLocalSetlists(next);
  return next;
}
