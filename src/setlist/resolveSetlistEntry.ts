import type { Song } from '../types';
import type { SetlistEntry } from './setlistCsv';

/**
 * Finds the library Song a setlist entry refers to. Matches by Dropbox path
 * first (exact and stable), falling back to a case-insensitive title match
 * if the path isn't found — e.g. the song got removed and re-added, or moved
 * to a different Dropbox folder. Returns null if neither resolves, so a
 * setlist with one missing song can still be skipped over rather than
 * crashing the whole setlist.
 */
export function resolveSetlistEntry(entry: SetlistEntry, library: Song[]): Song | null {
  if (entry.path) {
    const byPath = library.find(
      (song) => song.source.type === 'dropbox' && song.source.path === entry.path
    );
    if (byPath) {
      return byPath;
    }
  }
  const normalizedTitle = entry.title.trim().toLowerCase();
  if (!normalizedTitle) {
    return null;
  }
  return library.find((song) => song.title.trim().toLowerCase() === normalizedTitle) ?? null;
}
