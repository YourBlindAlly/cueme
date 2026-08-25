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
  /** Original pasted/imported text, kept so re-parsing or re-editing is lossless. */
  rawText: string;
  /** Spoken lines, with section-marker lines already stripped out. */
  lines: string[];
  /** Reserved for the future section-jump feature; populated now, not yet wired to any gesture. */
  sections: SectionMarker[];
  source: SongSource;
  addedAt: number;
};
