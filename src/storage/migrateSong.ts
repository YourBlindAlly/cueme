import { tokenizePlainLine } from '../parsing/chordedWord';
import type { Song } from '../types';

/**
 * Fills in fields that didn't exist yet when a Song was persisted to
 * AsyncStorage, so old data doesn't crash the app the first time it's loaded
 * after an update. `chordedLines` was added after `lines` already existed in
 * storage — any song saved before that update comes back from
 * JSON.parse with `chordedLines: undefined`, and code that assumes it's
 * always present (e.g. the line-length wrapper) throws on it. Since a
 * production build shows no error overlay for an uncaught exception, this
 * previously surfaced as the app silently quitting on load with nothing in
 * the logs, rather than a visible crash — exactly what happened to Rusty's
 * oldest song (dictated in before this field existed).
 */
export function migrateSong(song: Song): Song {
  if (Array.isArray(song.chordedLines)) {
    return song;
  }
  return {
    ...song,
    chordedLines: song.lines.map((line) => tokenizePlainLine(line)),
  };
}
