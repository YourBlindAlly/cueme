import type { ChordedWord } from './parsing/chordedWord';

export type SectionMarker = {
  /** Index into Song.lines that this section starts at. */
  lineIndex: number;
  label: string;
};

export type SongSource =
  | { type: 'manual' }
  | { type: 'file' }
  | { type: 'dropbox'; path: string };

export type Song = {
  id: string;
  title: string;
  /** Musical key, when known (e.g. from a ChordPro file's {key: C} directive). */
  key?: string;
  /** Original pasted/imported text, kept so re-parsing or re-editing is lossless. */
  rawText: string;
  /** Spoken lines, with section-marker lines already stripped out. */
  lines: string[];
  /** Same lines as `lines`, one array per entry, but with chord data preserved for chord-aware line wrapping. */
  chordedLines: ChordedWord[][];
  /** Reserved for the future section-jump feature; populated now, not yet wired to any gesture. */
  sections: SectionMarker[];
  source: SongSource;
  addedAt: number;
};
