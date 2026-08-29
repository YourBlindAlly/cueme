/**
 * Builds the spoken title/key announcement that's now the first thing a
 * pedal press reveals for any song — Rusty relies on hearing the key every
 * time, even for songs he already knows by heart, and this needed to be
 * something the app's own voice always says reliably rather than left to
 * chance whether VoiceOver happens to read the on-screen header.
 */
export function buildSongAnnouncement(title: string, key?: string): string {
  const trimmedTitle = title.trim();
  const trimmedKey = key?.trim();
  if (trimmedKey) {
    return `${trimmedTitle}, Key of ${trimmedKey}`;
  }
  return trimmedTitle;
}
