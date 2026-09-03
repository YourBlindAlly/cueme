import type { AiProvider } from './types';

// Cheap tier that's good at language tasks. Verify this name is still
// current before assuming so — OpenAI's naming shifts — and override
// without a code change via the AI_MODEL secret if it's drifted.
const DEFAULT_MODEL = 'gpt-5-mini';

export function createOpenAiProvider(apiKey: string, model = DEFAULT_MODEL): AiProvider {
  return {
    async complete(prompt: string): Promise<string> {
      // The Responses API, not Chat Completions — the web_search tool
      // (real search + real page reads, not answering from memory) is a
      // Responses API feature.
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: prompt,
          tools: [{ type: 'web_search' }],
          // Without an explicit cap, a full song's lyrics were getting cut
          // off mid-line (confirmed live, 2026-09-02) — this model spends
          // real tokens on internal reasoning before the visible output,
          // so the ceiling needs real headroom, not just enough for the
          // lyrics text alone.
          max_output_tokens: 8192,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as {
        output?: { type: string; content?: { type: string; text?: string }[] }[];
      };
      const messageItems = (data.output ?? []).filter((item) => item.type === 'message');
      return messageItems
        .flatMap((item) => item.content ?? [])
        .filter((c) => c.type === 'output_text')
        .map((c) => c.text ?? '')
        .join('');
    },
  };
}
