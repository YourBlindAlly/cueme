jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockUploadDropboxFile = jest.fn();
const mockDeleteDropboxFile = jest.fn();
jest.mock('../cloud/dropbox/dropboxApi', () => ({
  uploadDropboxFile: (...args: unknown[]) => mockUploadDropboxFile(...args),
  deleteDropboxFile: (...args: unknown[]) => mockDeleteDropboxFile(...args),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteSetlist, listSetlists, loadSetlist, saveSetlist } from './setlistStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
  mockUploadDropboxFile.mockReset();
  mockDeleteDropboxFile.mockReset();
  mockUploadDropboxFile.mockResolvedValue(undefined);
  mockDeleteDropboxFile.mockResolvedValue(undefined);
});

describe('saveSetlist', () => {
  it('saves locally and can be read back, even if Dropbox is unreachable', async () => {
    mockUploadDropboxFile.mockRejectedValue(new Error('Not connected to Dropbox.'));
    await saveSetlist({ name: 'Gig Set', entries: [{ title: 'Song A', path: '/a.pro' }] });

    const summaries = await listSetlists();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].name).toBe('Gig Set');

    const loaded = await loadSetlist(summaries[0]);
    expect(loaded).toEqual({ name: 'Gig Set', entries: [{ title: 'Song A', path: '/a.pro' }] });
  });

  it('never throws even when the Dropbox backup fails', async () => {
    mockUploadDropboxFile.mockRejectedValue(new Error('network down'));
    await expect(saveSetlist({ name: 'Gig Set', entries: [] })).resolves.toBeUndefined();
  });

  it('attempts a best-effort Dropbox backup when reachable', async () => {
    await saveSetlist({ name: 'Gig Set', entries: [{ title: 'Song A', path: '/a.pro' }] });
    expect(mockUploadDropboxFile).toHaveBeenCalledTimes(1);
    const [path, csv] = mockUploadDropboxFile.mock.calls[0];
    expect(path).toBe('/setlists/gig set.csv');
    expect(csv).toContain('Song A');
  });

  it('overwrites (same id) rather than duplicating when saved again under the same name', async () => {
    await saveSetlist({ name: 'Gig Set', entries: [{ title: 'Song A', path: '/a.pro' }] });
    await saveSetlist({ name: 'Gig Set', entries: [{ title: 'Song B', path: '/b.pro' }] });

    const summaries = await listSetlists();
    expect(summaries).toHaveLength(1);
    const loaded = await loadSetlist(summaries[0]);
    expect(loaded.entries).toEqual([{ title: 'Song B', path: '/b.pro' }]);
  });

  it('keeps two different-named setlists separate', async () => {
    await saveSetlist({ name: 'Set A', entries: [] });
    await saveSetlist({ name: 'Set B', entries: [] });
    const summaries = await listSetlists();
    expect(summaries.map((s) => s.name).sort()).toEqual(['Set A', 'Set B']);
  });
});

describe('loadSetlist', () => {
  it('throws a clear error for a setlist that no longer exists', async () => {
    await expect(loadSetlist({ id: 'missing', name: 'Ghost' })).rejects.toThrow('Ghost');
  });
});

describe('deleteSetlist', () => {
  it('removes it locally even if the Dropbox-side delete fails', async () => {
    mockDeleteDropboxFile.mockRejectedValue(new Error('network down'));
    await saveSetlist({ name: 'Gig Set', entries: [] });
    const [summary] = await listSetlists();

    await deleteSetlist(summary);

    expect(await listSetlists()).toEqual([]);
  });
});
