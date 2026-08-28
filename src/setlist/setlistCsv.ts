// Setlists are plain CSV files the app writes and reads from Dropbox — never
// hand-edited by Rusty. Each row identifies a song primarily by its Dropbox
// path (stable and exact), with title kept alongside purely as a human-
// readable fallback for matching if a song ever moves, and so the raw CSV
// makes sense to a person glancing at it.

export type SetlistEntry = {
  title: string;
  /** The song's Dropbox path (lowercased, as returned by the API) — the primary lookup key. */
  path: string;
};

export type Setlist = {
  name: string;
  entries: SetlistEntry[];
};

const HEADER = 'Title,Path';

function csvEscape(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** Splits one CSV line into fields, handling quoted fields with embedded commas/quotes. */
function csvSplitLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function serializeSetlistCsv(entries: SetlistEntry[]): string {
  const lines = [HEADER];
  for (const entry of entries) {
    lines.push([entry.title, entry.path].map(csvEscape).join(','));
  }
  return lines.join('\r\n');
}

export function parseSetlistCsv(csv: string): SetlistEntry[] {
  const lines = csv.split(/\r\n|\r|\n/).filter((line) => line.length > 0);
  if (lines.length <= 1) {
    return [];
  }
  return lines.slice(1).map((line) => {
    const [title = '', path = ''] = csvSplitLine(line);
    return { title, path };
  });
}

/** Turns a user-typed setlist name into a safe Dropbox filename. */
export function sanitizeSetlistFilename(name: string): string {
  const cleaned = name.trim().replace(/[/\\:*?"<>|]/g, '').trim();
  return `${cleaned || 'Untitled Setlist'}.csv`;
}
