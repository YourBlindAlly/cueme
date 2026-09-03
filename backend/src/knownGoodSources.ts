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
// Abandoned 2026-09-02 — restricting to a hand-picked domain list ran into
// two dead ends in a row: azlyrics.com/e-chords.com actively block
// automated fetches (CAPTCHA wall / flat 403), and narrowing to just
// ultimate-guitar.com made many real searches come back with no page found
// at all. Guessing at sites one at a time doesn't scale. Replaced by a real
// quality gate instead (see promptBuilder.ts's completeness check) — search
// stays unrestricted, but an incomplete result is caught and rejected
// rather than ever silently handed to the user, and every rejection is
// logged so the real success rate is measurable instead of guessed at.
export const KNOWN_GOOD_LYRICS_DOMAINS: string[] = [];
