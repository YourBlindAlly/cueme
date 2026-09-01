import type { AiProvider } from './types';

// Check this against the retirement schedule in Rusty's model-research notes
// before assuming it's still current — Google retires Gemini model versions
// on a rolling basis. Override without a code change via the AI_MODEL secret.
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

export function createGeminiProvider(apiKey: string, model = DEFAULT_MODEL): AiProvider {
  return {
    async complete(prompt: string): Promise<string> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
