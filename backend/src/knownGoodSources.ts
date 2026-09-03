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
// azlyrics.com and e-chords.com were dropped 2026-09-02 — both confirmed
// live to block plain automated fetches (AZLyrics shows a CAPTCHA/bot-check
// wall, e-chords.com returns a flat 403), regardless of User-Agent. Down to
// the one domain this project has actual prior confirmed success fetching.
export const KNOWN_GOOD_LYRICS_DOMAINS = ['ultimate-guitar.com'];
