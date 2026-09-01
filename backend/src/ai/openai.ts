import type { AiProvider } from './types';

const DEFAULT_MODEL = 'gpt-4o-mini';

export function createOpenAiProvider(apiKey: string, model = DEFAULT_MODEL): AiProvider {
  return {
    async complete(prompt: string): Promise<string> {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}
