export type DeviceLocale = { languageCode: string | null };

/**
 * Distinct language codes to show voices for by default: English always
 * (the app's own baseline), plus whatever other language(s) the device
 * itself is configured for (iOS Settings > General > Language & Region) —
 * so a device set up for a second language surfaces those voices too,
 * without showing every installed voice in every language up front.
 */
export function preferredLanguageCodes(locales: DeviceLocale[]): string[] {
  const codes = new Set<string>(['en']);
  for (const locale of locales) {
    const code = locale.languageCode?.trim().toLowerCase();
    if (code) {
      codes.add(code);
    }
  }
  return Array.from(codes);
}

/** A voice's base language code from its BCP-47 tag (e.g. "en-US" -> "en"). */
function baseLanguageCode(voiceLanguage: string): string {
  return voiceLanguage.split('-')[0]?.trim().toLowerCase() ?? '';
}

/** Filters a voice list down to just the given preferred language codes. */
export function filterVoicesByLanguages<T extends { language: string }>(
  voices: T[],
  preferredCodes: string[]
): T[] {
  return voices.filter((voice) => preferredCodes.includes(baseLanguageCode(voice.language)));
}

/**
 * Filters a voice list down to Enhanced-quality voices only, unless
 * `includeLowQuality` is true — most iOS devices have both a "Default"
 * (compact, always present) and an "Enhanced" (higher fidelity, separately
 * downloaded) voice per language; showing only Enhanced by default keeps
 * the list from being dominated by lower-quality entries most people won't
 * want, per Rusty's request 2026-09-05.
 */
export function filterVoicesByQuality<T extends { quality: string }>(
  voices: T[],
  includeLowQuality: boolean
): T[] {
  if (includeLowQuality) {
    return voices;
  }
  return voices.filter((voice) => voice.quality === 'Enhanced');
}
