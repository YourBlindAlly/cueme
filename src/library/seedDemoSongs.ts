import { buildChordProSong } from '../parsing/buildSong';
import { upsertLibrarySong } from './libraryStorage';
import { DEMO_SONGS } from './demoSongs';

/**
 * Adds the bundled public-domain starter songs to the library. Only ever
 * meant to run once, gated by firstLaunchPreference.ts at the call site —
 * this function itself doesn't check or set that flag, so it stays simple
 * and testable.
 */
export async function seedDemoSongs(): Promise<void> {
  for (const { fileName, rawText } of DEMO_SONGS) {
    const fallbackTitle = fileName.replace(/\.[^./]+$/, '');
    const song = buildChordProSong(rawText, fallbackTitle, { type: 'demo' });
    if (song) {
      await upsertLibrarySong(song);
    }
  }
}
