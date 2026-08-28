import type { Song } from '../types';

export type RootStackParamList = {
  Library: undefined;
  NewSong: { editSong?: Song } | undefined;
  Prompt: undefined;
  PedalSettings: undefined;
  VoiceSettings: undefined;
  LineLengthSettings: undefined;
  DropboxBrowse: { path: string } | undefined;
};
