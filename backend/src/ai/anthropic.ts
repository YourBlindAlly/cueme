import type { AiProvider } from './types';
import { KNOWN_GOOD_LYRICS_DOMAINS } from '../knownGoodSources';

// Haiku 4.5 - Anthropic's cheap tier, strong at language tasks, exactly
// what this extraction step needs (Rusty's explicit preference for a cheap
// model, 2026-09-02). Override without a code change via the AI_MODEL secret.
const DEFAULT_MODEL = 'claude-haiku-4-5';

// Guards against an unbounded pause_turn loop if a search runs long — see
// https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
// for why a long-running web_search turn can pause and need resuming.
const MAX_TURNS = 3;

type AnthropicMessage = { role: 'user' | 'assistant'; content: unknown };

export function createAnthropicProvider(apiKey: string, model = DEFAULT_MODEL): AiProvider {
  return {
    async complete(prompt: string): Promise<string> {
      let messages: AnthropicMessage[] = [{ role: 'user', content: prompt }];

      for (let turn = 0; turn < MAX_TURNS; turn++) {
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
            messages,
            // Basic (2025) variant, not the newer dynamic-filtering one —
            // works across the whole current model lineup including Haiku,
            // which the 2026-variant tool requires a larger model for.
            tools: [
              {
                type: 'web_search_20250305',
                name: 'web_search',
                max_uses: 3,
                allowed_domains: KNOWN_GOOD_LYRICS_DOMAINS,
              },
            ],
          }),
        });

        if (!res.ok) {
          throw new Error(`Anthropic request failed: ${res.status} ${await res.text()}`);
        }

        const data = (await res.json()) as {
          content?: { type: string; text?: string }[];
          stop_reason?: string;
        };
        const content = data.content ?? [];

        if (data.stop_reason === 'pause_turn') {
          messages = [...messages, { role: 'assistant', content }];
          continue;
        }

        return content
          .filter((block) => block.type === 'text')
          .map((block) => block.text ?? '')
          .join('');
      }

      throw new Error('Anthropic web search did not finish within the turn limit');
    },
  };
}
