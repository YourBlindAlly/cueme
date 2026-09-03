const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
};
const NAMED_ENTITY_RE =
  /&(amp|lt|gt|quot|#39|apos|nbsp|mdash|ndash|rsquo|lsquo|rdquo|ldquo);/g;
const NUMERIC_ENTITY_RE = /&#(\d+);/g;

/**
 * Turns raw HTML into plain text, preserving line structure (block-level
 * tags and <br> become newlines, so a page's actual line-by-line layout —
 * which matters for lyrics — survives). Plain regex rather than a real HTML
 * parser deliberately: this needs to run identically in the Cloudflare
 * Workers runtime and in Jest, and the pages being fetched are ordinary
 * lyrics/chord sites, not adversarial or wildly malformed HTML.
 */
export function stripHtml(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  text = text.replace(NAMED_ENTITY_RE, (match) => ENTITIES[match] ?? match);
  text = text.replace(NUMERIC_ENTITY_RE, (_match, code: string) => String.fromCharCode(Number(code)));

  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/** Fetches a URL and returns its cleaned, plain-text content, capped in length. */
export async function fetchPageText(url: string, maxChars = 20000): Promise<string> {
  // A self-identifying bot User-Agent got outright blocked (403) by at
  // least one steered-toward site (confirmed live, 2026-09-02) — several
  // lyrics/chord sites block automated-looking requests outright. An
  // ordinary browser User-Agent is the standard, legitimate way around an
  // over-aggressive blocklist for what's one real request per search, not
  // scraping at scale.
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch page (${res.status}): ${url}`);
  }

  const html = await res.text();
  const text = stripHtml(html);
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}
