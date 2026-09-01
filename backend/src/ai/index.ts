import type { AiProvider } from './types';
import { createGeminiProvider } from './gemini';
import { createAnthropicProvider } from './anthropic';
import { createOpenAiProvider } from './openai';

export type AiEnv = {
  AI_PROVIDER?: string;
  AI_MODEL?: string;
  GEMINI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
};

/**
 * Picks the AI provider from config rather than hardcoding one, so which
 * service actually does the lyric/chord extraction step can be swapped by
 * changing the AI_PROVIDER secret and adding that provider's own API key —
 * no code change or redeploy logic needed, just new secrets.
 */
export function getAiProvider(env: AiEnv): AiProvider {
  const providerName = (env.AI_PROVIDER || 'gemini').toLowerCase();

  switch (providerName) {
    case 'gemini':
      if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
      return createGeminiProvider(env.GEMINI_API_KEY, env.AI_MODEL);
    case 'anthropic':
      if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
      return createAnthropicProvider(env.ANTHROPIC_API_KEY, env.AI_MODEL);
    case 'openai':
      if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
      return createOpenAiProvider(env.OPENAI_API_KEY, env.AI_MODEL);
    default:
      throw new Error(`Unknown AI_PROVIDER: "${providerName}" (expected gemini, anthropic, or openai)`);
  }
}
