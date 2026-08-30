import type { Song } from '../types';

export type RootStackParamList = {
  Library: undefined;
  NewSong: { editSong?: Song } | undefined;
  Prompt: undefined;
  PedalSettings: undefined;
  VoiceSettings: undefined;
  DropboxBrowse: { path: string } | undefined;
  Setlists: undefined;
  SetlistCreator: undefined;
};
