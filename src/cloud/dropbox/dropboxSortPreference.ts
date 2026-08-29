import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LibrarySortMode } from '../../library/librarySortPreference';

// A separate preference from the Library screen's own sort mode — they're
// different lists (this one includes folders, and files here haven't been
// imported yet) so switching one shouldn't silently change the other.
const SORT_MODE_KEY = 'cueme.dropboxSortMode';
const VALID_MODES: LibrarySortMode[] = ['newest', 'titleAZ', 'artistAZ'];

export const DEFAULT_DROPBOX_SORT_MODE: LibrarySortMode = 'titleAZ';

export async function loadDropboxSortMode(): Promise<LibrarySortMode> {
  const stored = await AsyncStorage.getItem(SORT_MODE_KEY);
  if (stored && (VALID_MODES as string[]).includes(stored)) {
    return stored as LibrarySortMode;
  }
  return DEFAULT_DROPBOX_SORT_MODE;
}

export async function saveDropboxSortMode(mode: LibrarySortMode): Promise<void> {
  await AsyncStorage.setItem(SORT_MODE_KEY, mode);
}
