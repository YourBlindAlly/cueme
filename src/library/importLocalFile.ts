import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { buildSong } from '../parsing/buildSong';
import type { Song } from '../types';

/** Opens the system file picker and returns a parsed Song, or null if cancelled/empty. */
export async function pickAndImportLocalFile(): Promise<Song | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'text/plain' });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  const asset = result.assets[0];
  const file = new File(asset.uri);
  const text = await file.text();
  const title = asset.name.replace(/\.txt$/i, '');
  return buildSong(text, title, { type: 'file' });
}
