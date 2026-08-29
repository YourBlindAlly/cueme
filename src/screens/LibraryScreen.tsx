import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { pickAndImportLocalFile } from '../library/importLocalFile';
import type { Song } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Library'>;

const SOURCE_LABEL: Record<Song['source']['type'], string> = {
  manual: 'Pasted',
  file: 'Imported file',
  dropbox: 'Dropbox',
};

export function LibraryScreen({ navigation }: Props) {
  const { library, isLibraryLoaded, loadSong, removeFromLibrary } = useAppState();
  const [isImporting, setIsImporting] = useState(false);

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
      <Text style={styles.heading} accessibilityRole="header">
        Your Songs
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('NewSong')}
          accessibilityRole="button"
          accessibilityLabel="Paste a new song"
        >
          <Text style={styles.actionButtonText}>Paste New Song</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={handleImportFile}
          disabled={isImporting}
          accessibilityRole="button"
          accessibilityLabel="Import a text file"
        >
          <Text style={styles.actionButtonText}>
            {isImporting ? 'Importing…' : 'Import File'}
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('DropboxBrowse')}
          accessibilityRole="button"
          accessibilityLabel="Browse Dropbox"
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
      </View>

      {isLibraryLoaded && library.length === 0 ? (
        <Text style={styles.emptyText}>
          No songs yet. Paste one, import a file, or connect Dropbox to get started.
        </Text>
      ) : (
        <FlatList
          data={library}
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
  heading: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
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
