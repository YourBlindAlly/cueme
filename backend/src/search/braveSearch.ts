export type SearchResult = {
  title: string;
  url: string;
  description: string;
};

// Brave bills per request, not per result returned (max 20 per request), so
// asking for more candidates here costs nothing extra — it just gives the
// extraction step more pages to find a real match among.
export async function braveSearch(apiKey: string, query: string, count = 10): Promise<SearchResult[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Brave search failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    web?: { results?: { title?: string; url?: string; description?: string }[] };
  };

  return (data.web?.results ?? []).map((r) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    description: r.description ?? '',
  }));
}
