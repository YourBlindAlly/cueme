import { getValidDropboxAccessToken } from './dropboxAuth';
import { CHORDPRO_EXTENSIONS } from '../../parsing/buildSong';

const SONG_EXTENSIONS = ['.txt', ...CHORDPRO_EXTENSIONS];

export type DropboxEntry = {
  name: string;
  path: string;
  isFolder: boolean;
};

async function authorizedFetch(url: string, init: RequestInit): Promise<Response> {
  const accessToken = await getValidDropboxAccessToken();
  if (!accessToken) {
    throw new Error('Not connected to Dropbox.');
  }
  const res = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dropbox request failed (${res.status}): ${body}`);
  }
  return res;
}

/** Lists folders and recognized song files (.txt, ChordPro) at `path` ('' for the root). */
export async function listDropboxFolder(path: string): Promise<DropboxEntry[]> {
  const res = await authorizedFetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  const data = (await res.json()) as {
    entries: { '.tag': string; name: string; path_lower: string }[];
  };
  return data.entries
    .filter(
      (e) =>
        e['.tag'] === 'folder' ||
        SONG_EXTENSIONS.some((ext) => e.name.toLowerCase().endsWith(ext))
    )
    .map((e) => ({ name: e.name, path: e.path_lower, isFolder: e['.tag'] === 'folder' }))
    .sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export async function downloadDropboxFile(path: string): Promise<string> {
  const res = await authorizedFetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: { 'Dropbox-API-Arg': JSON.stringify({ path }) },
  });
  return res.text();
}
