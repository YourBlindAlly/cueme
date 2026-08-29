import type { DropboxEntry } from './dropboxApi';
import { extractArtistFromPath } from '../../library/artistFromFilename';
import type { LibrarySortMode } from '../../library/librarySortPreference';

/**
 * Sorts a copy of a Dropbox folder listing for display. Folders always sort
 * by name regardless of mode and stay ahead of files (there's no useful
 * "artist" or "modified" reading for a folder here, and there's normally
 * only ever one or two of them — Setlists). The chosen mode only actually
 * changes the ordering of files.
 */
export function sortDropboxEntriesForDisplay(
  entries: DropboxEntry[],
  mode: LibrarySortMode
): DropboxEntry[] {
  const folders = entries.filter((e) => e.isFolder).sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter((e) => !e.isFolder);

  let sortedFiles: DropboxEntry[];
  if (mode === 'newest') {
    sortedFiles = [...files].sort((a, b) => (b.modifiedAt ?? '').localeCompare(a.modifiedAt ?? ''));
  } else if (mode === 'titleAZ') {
    sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const withArtist: { entry: DropboxEntry; artist: string }[] = [];
    const withoutArtist: DropboxEntry[] = [];
    for (const entry of files) {
      const artist = extractArtistFromPath(entry.path);
      if (artist) {
        withArtist.push({ entry, artist });
      } else {
        withoutArtist.push(entry);
      }
    }
    withArtist.sort(
      (a, b) => a.artist.localeCompare(b.artist) || a.entry.name.localeCompare(b.entry.name)
    );
    withoutArtist.sort((a, b) => a.name.localeCompare(b.name));
    sortedFiles = [...withArtist.map((e) => e.entry), ...withoutArtist];
  }

  return [...folders, ...sortedFiles];
}
