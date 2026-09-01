import { deleteDropboxFile, uploadDropboxFile } from '../cloud/dropbox/dropboxApi';
import { sanitizeSetlistFilename, serializeSetlistCsv, type Setlist } from './setlistCsv';
import {
  loadLocalSetlists,
  makeSetlistId,
  removeLocalSetlist,
  upsertLocalSetlist,
  type StoredSetlist,
} from './localSetlistStorage';

const SETLISTS_FOLDER = '/setlists';

export type SetlistSummary = { id: string; name: string };

function dropboxPathFor(name: string): string {
  return `${SETLISTS_FOLDER}/${sanitizeSetlistFilename(name)}`.toLowerCase();
}

/**
 * Best-effort only — saving or deleting a setlist must never depend on
 * Dropbox being reachable. Local storage (below) is the real, source-of-
 * truth copy; this just keeps a backup in sync when there's a connection,
 * silently skipping when there isn't (not connected, no signal, etc.).
 */
async function backupToDropbox(stored: StoredSetlist): Promise<void> {
  try {
    await uploadDropboxFile(dropboxPathFor(stored.name), serializeSetlistCsv(stored.entries));
  } catch {
    // Intentionally silent — see doc comment above.
  }
}

async function removeDropboxBackup(name: string): Promise<void> {
  try {
    await deleteDropboxFile(dropboxPathFor(name));
  } catch {
    // Intentionally silent — see backupToDropbox's doc comment.
  }
}

export async function listSetlists(): Promise<SetlistSummary[]> {
  const stored = await loadLocalSetlists();
  return stored.map((s) => ({ id: s.id, name: s.name }));
}

export async function loadSetlist(summary: SetlistSummary): Promise<Setlist> {
  const stored = await loadLocalSetlists();
  const found = stored.find((s) => s.id === summary.id);
  if (!found) {
    throw new Error(`"${summary.name}" no longer exists.`);
  }
  return { name: found.name, entries: found.entries };
}

/**
 * Saves a setlist locally (always succeeds, works offline, overwrites any
 * existing local setlist of the same name) and backs it up to Dropbox on a
 * best-effort basis.
 */
export async function saveSetlist(setlist: Setlist): Promise<void> {
  const current = await loadLocalSetlists();
  const existing = current.find((s) => s.name === setlist.name);
  const stored: StoredSetlist = {
    id: existing?.id ?? makeSetlistId(),
    name: setlist.name,
    entries: setlist.entries,
    updatedAt: Date.now(),
  };
  await upsertLocalSetlist(stored);
  void backupToDropbox(stored);
}

export async function deleteSetlist(summary: SetlistSummary): Promise<void> {
  await removeLocalSetlist(summary.id);
  void removeDropboxBackup(summary.name);
}
