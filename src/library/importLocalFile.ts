import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { buildSongFromFile } from '../parsing/buildSong';
import type { Song } from '../types';

/** Opens the system file picker and returns a parsed Song, or null if cancelled/empty. */
export async function pickAndImportLocalFile(): Promise<Song | null> {
  // '*/*' rather than a specific MIME type — ChordPro's extensions (.cho,
  // .crd, .chopro, .chord, .pro) generally have no OS-registered type on
  // iOS, so filtering by MIME type would silently hide them from the picker.
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  const asset = result.assets[0];
  const file = new File(asset.uri);
  const text = await file.text();
  return buildSongFromFile(text, asset.name, { type: 'file' });
}
