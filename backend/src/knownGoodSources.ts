// Restricting to a hand-picked allowlist was abandoned 2026-09-02 — it hit
// two dead ends in a row: azlyrics.com/e-chords.com actively block
// automated fetches (CAPTCHA wall / flat 403), and narrowing to just
// ultimate-guitar.com made many real searches come back with no page found
// at all. Guessing at "known good" sites one at a time doesn't scale.
// Search stays unrestricted; the real safety net is the completeness
// quality gate in promptBuilder.ts (looksComplete), which rejects a
// truncated result regardless of which site it came from.
export const KNOWN_GOOD_LYRICS_DOMAINS: string[] = [];

// Unlike the allowlist above, blocking specific sites IS a scalable,
// evidence-based approach — each entry here is a site confirmed live to
// reliably fail (blocks automated fetches, or serves partial/JS-rendered
// content the completeness gate keeps catching), so there's no point
// letting search keep landing on it. Add to this list as more sites are
// confirmed bad; there's no equivalent risk of over-narrowing results the
// way the allowlist had, since everything else stays available.
export const BLOCKED_LYRICS_DOMAINS: string[] = [
  // Confirmed 2026-09-02: repeatedly chosen by search, repeatedly either
  // 403'd our fetch or served incomplete content that the completeness
  // gate had to reject.
  'lyricstranslate.com',
];
