// Turns a written chord symbol into how you'd actually say it out loud.
// Without this, a TTS engine tends to spell symbols out literally — "Gsus4"
// as "G S U S 4", "F#" mangling the sharp sign — rather than saying "G sus
// four" or "F sharp". Covers the chord vocabulary that shows up in practice
// (triads, 6/7/9 chords, sus, dim/aug, slash chords); anything outside that
// falls back to reading the root note plus the raw suffix as-is, which is
// still better than reading the whole unspaced symbol as one word.

const NOTE_RE = /^([A-G])([#b]?)/;

const QUALITY_WORDS: [RegExp, string][] = [
  [/^maj7$/i, 'major seven'],
  [/^maj9$/i, 'major nine'],
  [/^maj$/i, 'major'],
  [/^m7b5$/i, 'minor seven flat five'],
  [/^m7$/i, 'minor seven'],
  [/^m6$/i, 'minor six'],
  [/^m9$/i, 'minor nine'],
  [/^madd9$/i, 'minor add nine'],
  [/^m$/i, 'minor'],
  [/^dim7$/i, 'diminished seven'],
  [/^dim$/i, 'diminished'],
  [/^aug$/i, 'augmented'],
  [/^sus2$/i, 'sus two'],
  [/^sus4$/i, 'sus four'],
  [/^sus$/i, 'sus'],
  [/^add9$/i, 'add nine'],
  [/^6$/i, 'six'],
  [/^7$/i, 'seven'],
  [/^9$/i, 'nine'],
  [/^11$/i, 'eleven'],
  [/^13$/i, 'thirteen'],
  [/^5$/i, 'five'],
];

function noteToSpeech(letter: string, accidental: string): string {
  if (accidental === '#') return `${letter} sharp`;
  if (accidental === 'b') return `${letter} flat`;
  return letter;
}

function speakOnePart(part: string): string {
  const trimmed = part.trim();
  const match = trimmed.match(NOTE_RE);
  if (!match) {
    return trimmed;
  }
  const [whole, letter, accidental] = match;
  const note = noteToSpeech(letter, accidental);
  const suffix = trimmed.slice(whole.length);
  if (!suffix) {
    return note;
  }
  const known = QUALITY_WORDS.find(([re]) => re.test(suffix));
  return known ? `${note} ${known[1]}` : `${note} ${suffix}`;
}

/** Converts a chord symbol (e.g. "Gsus4", "F#", "Bbmaj7", "G/B") into a speakable phrase. */
export function chordToSpeech(rawChord: string): string {
  const chord = rawChord.trim();
  if (!chord) {
    return '';
  }
  if (/^n\.?c\.?$/i.test(chord)) {
    return 'no chord';
  }

  const [rootPart, bassPart] = chord.split('/');
  const rootSpoken = speakOnePart(rootPart);
  if (bassPart) {
    return `${rootSpoken} over ${speakOnePart(bassPart)}`;
  }
  return rootSpoken;
}
