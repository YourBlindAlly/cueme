import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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

  const handleOpenSong = async (song: Song) => {
    await loadSong(song);
    navigation.navigate('Prompt');
  };

  const handleImportFile = async () => {
    setIsImporting(true);
    try {
      const song = await pickAndImportLocalFile();
      if (song) {
        await loadSong(song);
        navigation.navigate('Prompt');
      }
    } catch (err) {
      Alert.alert('Import failed', err instanceof Error ? err.message : String(err));
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
    <View style={styles.container}>
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
            <View style={styles.songRow}>
              <Pressable
                style={styles.songInfo}
                onPress={() => handleOpenSong(item)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title}, ${SOURCE_LABEL[item.source.type]}`}
              >
                <Text style={styles.songTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.songSource}>{SOURCE_LABEL[item.source.type]}</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('NewSong', { editSong: item })}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.title}`}
              >
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => handleRemove(item)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.title}`}
              >
                <Text style={styles.removeLink}>Remove</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  songInfo: {
    flex: 1,
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
  editLink: {
    color: '#4f8cff',
    fontSize: 14,
    marginLeft: 12,
  },
  removeLink: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 12,
  },
});
