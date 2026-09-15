const mockUploadDropboxFile = jest.fn();
jest.mock('../cloud/dropbox/dropboxApi', () => ({
  uploadDropboxFile: (...args: unknown[]) => mockUploadDropboxFile(...args),
}));

import { backupSearchResultToDropbox } from './backupSearchResult';

beforeEach(() => {
  mockUploadDropboxFile.mockReset();
  mockUploadDropboxFile.mockResolvedValue(undefined);
});

describe('backupSearchResultToDropbox', () => {
  it('uploads to a "/Title - Artist.ext" path at the Dropbox root, stripping the key', () => {
    backupSearchResultToDropbox(
      { title: 'Hotel California', artist: 'Eagles', key: 'Bm', path: '/hotel california - eagles [bm].pro' },
      'song content'
    );
    expect(mockUploadDropboxFile).toHaveBeenCalledWith('/Hotel California - Eagles.pro', 'song content');
  });

  it('omits the artist segment when there is none', () => {
    backupSearchResultToDropbox({ title: 'Amazing Grace', artist: null, key: null, path: '/amazing grace.chopro' }, 'x');
    expect(mockUploadDropboxFile).toHaveBeenCalledWith('/Amazing Grace.chopro', 'x');
  });

  it('never throws when the upload fails (not connected, etc.)', async () => {
    mockUploadDropboxFile.mockRejectedValue(new Error('Not connected to Dropbox.'));
    expect(() =>
      backupSearchResultToDropbox({ title: 'X', artist: null, key: null, path: '/x.pro' }, 'x')
    ).not.toThrow();
  });

  it('strips characters unsafe in a filename', () => {
    backupSearchResultToDropbox(
      { title: 'Rock: Paper?', artist: 'A/B', key: null, path: '/rock paper - a b.txt' },
      'x'
    );
    expect(mockUploadDropboxFile).toHaveBeenCalledWith('/Rock Paper - AB.txt', 'x');
  });
});
