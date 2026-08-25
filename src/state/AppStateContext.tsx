import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { saveActiveSong } from '../storage/activeSong';
import { loadLibrary, removeLibrarySong, upsertLibrarySong } from '../library/libraryStorage';
import type { Song } from '../types';

type AppStateValue = {
  activeSong: Song | null;
  library: Song[];
  isLibraryLoaded: boolean;
  /** Sets a song as active (persists it) and adds/updates it in the library. */
  loadSong: (song: Song) => Promise<void>;
  removeFromLibrary: (id: string) => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({
  children,
  initialActiveSong,
}: {
  children: React.ReactNode;
  initialActiveSong: Song | null;
}) {
  const [activeSong, setActiveSong] = useState<Song | null>(initialActiveSong);
  const [library, setLibrary] = useState<Song[]>([]);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  useEffect(() => {
    loadLibrary().then((songs) => {
      setLibrary(songs);
      setIsLibraryLoaded(true);
    });
  }, []);

  const loadSong = useCallback(async (song: Song) => {
    setActiveSong(song);
    await saveActiveSong(song);
    const updated = await upsertLibrarySong(song);
    setLibrary(updated);
  }, []);

  const removeFromLibrary = useCallback(async (id: string) => {
    const updated = await removeLibrarySong(id);
    setLibrary(updated);
  }, []);

  return (
    <AppStateContext.Provider
      value={{ activeSong, library, isLibraryLoaded, loadSong, removeFromLibrary }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}
