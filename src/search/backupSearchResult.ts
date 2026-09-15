import { uploadDropboxFile } from '../cloud/dropbox/dropboxApi';
import type { SearchResult } from './searchApi';

// Strip characters not safe in a filename, matching the same convention
// this whole project already uses everywhere a song filename gets built
// (see safe_filename() in upload_to_community_dropbox.py and the other
// curation scripts in "chordpro songs/").
function safeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '').trim();
}

function extensionFromPath(path: string): string {
  const match = path.match(/\.[^./]+$/);
  return match ? match[0] : '.txt';
}

/**
 * Best-effort backup of a song loaded via Search into the user's OWN
 * Dropbox — same "silent, never blocks, never alarms" pattern as
 * setlistStorage.ts's backupToDropbox. Worth doing specifically for
 * Search results (unlike a pasted or locally-imported song) because a
 * search result is the one import path with no other existing copy
 * anywhere the user could re-import from if the device were lost or
 * reset — it only ever lived in the community library, not in anything
 * of the user's own, until this copies it over. Uses the same "Title -
 * Artist.ext" convention and root-level placement as every other file the
 * user's own Dropbox browsing already expects, and deliberately does NOT
 * carry over the "[Key]" suffix the community copy has — the user's own
 * Dropbox never uses that convention (see the 2026-09-12 cleanup that
 * removed it there), kept consistent on purpose.
 */
export function backupSearchResultToDropbox(result: SearchResult, content: string): void {
  const base = result.artist ? `${result.title} - ${result.artist}` : result.title;
  const fileName = safeFilename(base) + extensionFromPath(result.path);
  uploadDropboxFile(`/${fileName}`, content).catch(() => {
    // Intentionally silent — see doc comment above. Not connected, no
    // signal, or any other failure just means no backup happened this
    // time; the song is still safely in the local library either way.
  });
}
