import type { AiProvider } from './types';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export function createAnthropicProvider(apiKey: string, model = DEFAULT_MODEL): AiProvider {
  return {
    async complete(prompt: string): Promise<string> {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic request failed: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      return (data.content ?? []).map((c) => c.text ?? '').join('');
    },
  };
}
