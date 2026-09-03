/**
 * Domains steered toward for the URL-search step, chosen specifically for
 * serving complete lyrics/chords in the initial static HTML response — no
 * client-side JavaScript rendering required. This project's own past
 * curation work already confirmed Ultimate Guitar's raw page embeds full
 * song text (a `js-store` div's `data-content` JSON attribute), and
 * AZLyrics is long-established as plain, static HTML. Confirmed live
 * 2026-09-02 that at least one popular lyrics site (lyricstranslate.com)
 * does NOT reliably serve full lyrics in a plain fetch — likely JS-
 * rendered — hence steering toward known-good sources rather than letting
 * search go anywhere.
 */
export const KNOWN_GOOD_LYRICS_DOMAINS = ['azlyrics.com', 'ultimate-guitar.com', 'e-chords.com'];
