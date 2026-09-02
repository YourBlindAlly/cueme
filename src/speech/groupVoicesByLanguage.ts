import type { Voice } from 'expo-speech';

export type VoiceSection = { title: string; data: Voice[] };

/**
 * Human-readable language name for a BCP-47 code (e.g. "es-MX" -> "Spanish
 * (Mexico)"), falling back to the raw code if Intl.DisplayNames isn't
 * available in this JS engine or doesn't recognize the code — always safe
 * to call, never throws.
 */
export function languageDisplayName(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Groups voices by their language code into sections, sorted alphabetically
 * by display name, with voices inside each section sorted alphabetically by
 * name. iOS returns the device's installed voices in no particular order —
 * grouping by language makes a long list navigable by language instead of
 * hunting through names one at a time.
 */
export function groupVoicesByLanguage(voices: Voice[]): VoiceSection[] {
  const byLanguage = new Map<string, Voice[]>();
  for (const voice of voices) {
    const list = byLanguage.get(voice.language);
    if (list) {
      list.push(voice);
    } else {
      byLanguage.set(voice.language, [voice]);
    }
  }

  const sections: VoiceSection[] = Array.from(byLanguage.entries()).map(([language, list]) => ({
    title: `${languageDisplayName(language)} (${language})`,
    data: [...list].sort((a, b) => a.name.localeCompare(b.name)),
  }));

  sections.sort((a, b) => a.title.localeCompare(b.title));
  return sections;
}
