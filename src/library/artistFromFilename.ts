// Every file placed in Rusty's Dropbox folder is deliberately named
// "Title - Artist.ext" at copy time (a standing curation rule — see
// "chordpro songs/project notes.txt"), specifically so this heuristic has
// something reliable to parse. Only Dropbox-sourced songs carry a path at
// all; a pasted or locally-imported song has no filename to extract from.

// Strips a trailing annotation that sometimes follows the artist in an
// otherwise-clean filename — a stray year ("- 1972"), or an arrangement
// suffix like "- Alt"/"- Easier" that a raw collection file might still
// carry even after being renamed.
const TRAILING_ANNOTATION_RE =
  /\s*[-–]\s*(alt|var|variant|simplified|simple|easier|harder|ukulele|uke|version\s*\d*|\d{4})\.?\s*$/i;

/** Best-effort artist extraction from a "Title - Artist.ext" style Dropbox filename. */
export function extractArtistFromPath(path: string): string | null {
  const base = path.split('/').pop() ?? path;
  const withoutExt = base.replace(/\.[^./]+$/, '');
  const separatorIndex = withoutExt.indexOf(' - ');
  if (separatorIndex === -1) {
    return null;
  }

  let artist = withoutExt.slice(separatorIndex + 3).trim();
  let previous: string;
  do {
    previous = artist;
    artist = artist.replace(TRAILING_ANNOTATION_RE, '').trim();
  } while (artist !== previous && artist.length > 0);

  return artist.length > 0 ? artist : null;
}
