import type { AiProvider } from './types';

// gemini-2.5-flash-lite was retired for new requests as of 2026-09-02,
// sooner than the October retirement date on record for the non-lite
// version — confirmed live via a direct 404 from the API pointing at this
// replacement. Check current retirement status before assuming this is
// still right; override without a code change via the AI_MODEL secret.
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export function createGeminiProvider(apiKey: string, model = DEFAULT_MODEL): AiProvider {
  return {
    async complete(prompt: string): Promise<string> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // Grounding with Google Search — lets the model actually search
          // and read real pages instead of answering from memory alone.
          tools: [{ google_search: {} }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      return parts.map((p) => p.text ?? '').join('');
    },
  };
}
