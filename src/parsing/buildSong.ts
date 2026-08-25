import { parseSong } from './parseSong';
import type { Song, SongSource } from '../types';

function makeId(): string {
  return `song_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export function buildSong(rawText: string, title: string | undefined, source: SongSource): Song | null {
  const { lines, sections } = parseSong(rawText);
  if (lines.length === 0) {
    return null;
  }
  return {
    id: makeId(),
    title: title?.trim() || lines[0],
    rawText,
    lines,
    sections,
    source,
    addedAt: Date.now(),
  };
}
