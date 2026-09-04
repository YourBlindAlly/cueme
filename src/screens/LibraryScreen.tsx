import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { pickAndImportLocalFile } from '../library/importLocalFile';
import {
  DEFAULT_SORT_MODE,
  loadLibrarySortMode,
  nextSortMode,
  saveLibrarySortMode,
  SORT_MODE_LABEL,
} from '../library/librarySortPreference';
import { sortLibraryForDisplay } from '../library/sortLibrary';
import { LINK_HIT_SLOP } from '../ui/hitSlop';
import type { Song } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Library'>;

const SOURCE_LABEL: Record<Song['source']['type'], string> = {
  manual: 'Pasted',
  file: 'Imported file',
  dropbox: 'Dropbox',
  demo: 'Demo song',
};

export function LibraryScreen({ navigation }: Props) {
  const { library, isLibraryLoaded, loadSong, removeFromLibrary } = useAppState();
  const [isImporting, setIsImporting] = useState(false);
  const [sortMode, setSortMode] = useState(DEFAULT_SORT_MODE);

  useEffect(() => {
    loadLibrarySortMode().then(setSortMode);
  }, []);

  const handleCycleSort = () => {
    setSortMode((current) => {
      const next = nextSortMode(current);
      void saveLibrarySortMode(next);
      return next;
    });
  };

  // 'newest' relies on `library` already arriving newest-first from
  // upsertLibrarySong/loadLibrary — sortLibraryForDisplay leaves that order
  // untouched and only actually re-sorts for the other two modes.
  const sortedLibrary = useMemo(
    () => sortLibraryForDisplay(library, sortMode),
    [library, sortMode]
  );

  // Plain navigate (not popTo) is correct here specifically because Library
  // is always the root screen when this fires — every "return to Library"
  // link elsewhere uses popTo, which fully collapses the stack back down to
  // just this screen, so Prompt never exists yet at this point and a normal
  // push is exactly right.
  const handleOpenSong = async (song: Song) => {
    await loadSong(song);
    navigation.navigate('Prompt');
  };

  const handleImportFile = async () => {
    setIsImporting(true);
    try {
      // The system file picker has been observed to hang indefinitely when
      // browsing into some third-party cloud providers (Google Drive's Files
      // extension in particular) instead of resolving or rejecting — without
      // this timeout, that leaves the button stuck disabled until the app is
      // force-quit. Dropbox's own dedicated screen doesn't have this problem.
      const song = await Promise.race([
        pickAndImportLocalFile(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 30000)
        ),
      ]);
      if (song) {
        await loadSong(song);
        navigation.navigate('Prompt');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'TIMEOUT') {
        Alert.alert(
          'File picker unresponsive',
          "The file picker didn't respond in time — this can happen when browsing into Google Drive. Try again and use local files or iCloud, or use the Dropbox button for cloud files."
        );
      } else {
        Alert.alert('Import failed', err instanceof Error ? err.message : String(err));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemove = (song: Song) => {
    Alert.alert('Remove song', `Remove "${song.title}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromLibrary(song.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.heading} accessibilityRole="header">
          Your Songs
        </Text>
        <Pressable
          hitSlop={LINK_HIT_SLOP}
          onPress={() => navigation.navigate('About')}
          accessibilityRole="button"
          accessibilityLabel="About CueMe"
        >
          <Text style={styles.aboutLink}>About</Text>
        </Pressable>
      </View>

      {/* Ordered by how often each is actually used — Dropbox and Setlists
          first, Import File last, since it's both the least-used path now
          that Dropbox works well and the one with a known reliability issue
          (the system file picker can hang browsing into Google Drive). */}
      <View style={styles.actionsRow}>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('DropboxBrowse')}
          accessibilityRole="button"
          accessibilityLabel="Dropbox"
        >
          <Text style={styles.actionButtonText}>Dropbox</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('Setlists')}
          accessibilityRole="button"
          accessibilityLabel="Setlists"
        >
          <Text style={styles.actionButtonText}>Setlists</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('NewSong')}
          accessibilityRole="button"
          accessibilityLabel="Add a Song"
        >
          <Text style={styles.actionButtonText}>Add a Song</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('FindSong')}
          accessibilityRole="button"
          accessibilityLabel="Search for a Song: Experimental"
        >
          <Text style={styles.actionButtonText}>Search for a Song: Experimental</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={handleImportFile}
          disabled={isImporting}
          accessibilityRole="button"
          accessibilityLabel={isImporting ? 'Importing…' : 'Import File'}
        >
          <Text style={styles.actionButtonText}>
            {isImporting ? 'Importing…' : 'Import File'}
          </Text>
        </Pressable>
      </View>

      {isLibraryLoaded && library.length > 0 ? (
        <Pressable
          style={styles.sortButton}
          onPress={handleCycleSort}
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${SORT_MODE_LABEL[sortMode]}`}
          accessibilityHint="Tap to change."
        >
          <Text style={styles.sortButtonText}>Sort: {SORT_MODE_LABEL[sortMode]}</Text>
        </Pressable>
      ) : null}

      {isLibraryLoaded && library.length === 0 ? (
        <Text style={styles.emptyText}>
          No songs yet. Paste one, import a file, or connect Dropbox to get started.
        </Text>
      ) : (
        <FlatList
          data={sortedLibrary}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.songRow}
              onPress={() => handleOpenSong(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${SOURCE_LABEL[item.source.type]}`}
              accessibilityHint="Double tap to open. Swipe up or down for more actions."
              // VoiceOver custom actions — swipe up/down while this row has
              // focus to cycle through Edit/Delete, double-tap to perform
              // whichever is selected — instead of separate Edit/Remove
              // buttons that used to cost two extra swipe-stops per song
              // just to move from one song to the next.
              accessibilityActions={[
                { name: 'edit', label: 'Edit' },
                { name: 'delete', label: 'Delete' },
              ]}
              onAccessibilityAction={(event) => {
                switch (event.nativeEvent.actionName) {
                  case 'edit':
                    navigation.navigate('NewSong', { editSong: item });
                    break;
                  case 'delete':
                    handleRemove(item);
                    break;
                }
              }}
            >
              <Text style={styles.songTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.songSource}>{SOURCE_LABEL[item.source.type]}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  aboutLink: {
    color: '#4f8cff',
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    marginTop: 12,
  },
  sortButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sortButtonText: {
    color: '#4f8cff',
    fontSize: 14,
    fontWeight: '600',
  },
  songRow: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  songTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  songSource: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
});
