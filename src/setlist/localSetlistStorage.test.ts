jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadLocalSetlists,
  removeLocalSetlist,
  upsertLocalSetlist,
  type StoredSetlist,
} from './localSetlistStorage';

function makeStored(overrides: Partial<StoredSetlist>): StoredSetlist {
  return {
    id: 'id',
    name: 'My Setlist',
    entries: [],
    updatedAt: 0,
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('loadLocalSetlists', () => {
  it('returns an empty array when nothing has been saved', async () => {
    expect(await loadLocalSetlists()).toEqual([]);
  });
});

describe('upsertLocalSetlist', () => {
  it('adds a new setlist', async () => {
    const setlist = makeStored({ id: 'a' });
    const result = await upsertLocalSetlist(setlist);
    expect(result).toEqual([setlist]);
  });

  it('replaces an existing entry with the same id rather than duplicating it', async () => {
    await upsertLocalSetlist(makeStored({ id: 'a', name: 'Old name', updatedAt: 1 }));
    const updated = makeStored({ id: 'a', name: 'New name', updatedAt: 2 });
    const result = await upsertLocalSetlist(updated);
    expect(result).toEqual([updated]);
  });

  it('keeps two different setlists separate', async () => {
    await upsertLocalSetlist(makeStored({ id: 'a', name: 'Setlist A' }));
    const result = await upsertLocalSetlist(makeStored({ id: 'b', name: 'Setlist B' }));
    expect(result.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });
});

describe('removeLocalSetlist', () => {
  it('removes only the matching id', async () => {
    await upsertLocalSetlist(makeStored({ id: 'a' }));
    await upsertLocalSetlist(makeStored({ id: 'b' }));
    const result = await removeLocalSetlist('a');
    expect(result.map((s) => s.id)).toEqual(['b']);
  });
});
