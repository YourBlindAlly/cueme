import { downloadDropboxFile, listDropboxFolder, uploadDropboxFile } from '../cloud/dropbox/dropboxApi';
import {
  parseSetlistCsv,
  sanitizeSetlistFilename,
  serializeSetlistCsv,
  type Setlist,
} from './setlistCsv';

const SETLISTS_FOLDER = '/setlists';

export type SetlistSummary = { name: string; path: string };

/** Lists saved setlists (by filename, .csv extension stripped for display). */
export async function listSetlists(): Promise<SetlistSummary[]> {
  const entries = await listDropboxFolder(SETLISTS_FOLDER, ['.csv']);
  return entries
    .filter((e) => !e.isFolder)
    .map((e) => ({ name: e.name.replace(/\.csv$/i, ''), path: e.path }));
}

export async function loadSetlist(summary: SetlistSummary): Promise<Setlist> {
  const csv = await downloadDropboxFile(summary.path);
  return { name: summary.name, entries: parseSetlistCsv(csv) };
}

/** Saves a setlist, overwriting any existing file of the same (sanitized) name. */
export async function saveSetlist(setlist: Setlist): Promise<void> {
  const filename = sanitizeSetlistFilename(setlist.name);
  const path = `${SETLISTS_FOLDER}/${filename}`.toLowerCase();
  await uploadDropboxFile(path, serializeSetlistCsv(setlist.entries));
}
