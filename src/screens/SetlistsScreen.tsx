import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { listSetlists, loadSetlist, type SetlistSummary } from '../setlist/setlistStorage';
import { isDropboxConfigured } from '../cloud/dropbox/dropboxAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'Setlists'>;

export function SetlistsScreen({ navigation }: Props) {
  const { activeSetlist, startSetlist, clearSetlist } = useAppState();
  const [setlists, setSetlists] = useState<SetlistSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOne, setIsLoadingOne] = useState(false);

  const refresh = useCallback(() => {
    setSetlists(null);
    setError(null);
    listSetlists()
      .then(setSetlists)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  // React Navigation's 'focus' event doesn't fire for the initial mount, only
  // on RETURN visits — so load once up front too (e.g. after saving a new
  // setlist on the creator screen and coming back here).
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refresh);
    return unsubscribe;
  }, [navigation, refresh]);

  const handleOpen = async (summary: SetlistSummary) => {
    setIsLoadingOne(true);
    try {
      const setlist = await loadSetlist(summary);
      const result = await startSetlist(setlist);
      if (!result.started) {
        Alert.alert(
          'Nothing to play',
          `None of the songs in "${summary.name}" were found in your library. Import them first, then try this setlist again.`
        );
        return;
      }
      navigation.navigate('Prompt');
    } catch (err) {
      Alert.alert('Couldn’t load setlist', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingOne(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          Setlists
        </Text>
      </View>

      {!isDropboxConfigured ? (
        <Text style={styles.infoText}>
          Setlists are saved to Dropbox, so connect Dropbox first (from the Library screen) before
          building one.
        </Text>
      ) : (
        <>
          <Pressable
            style={styles.newButton}
            onPress={() => navigation.navigate('SetlistCreator')}
            accessibilityRole="button"
            accessibilityLabel="Create a new setlist"
          >
            <Text style={styles.newButtonText}>New Setlist</Text>
          </Pressable>

          {activeSetlist ? (
            <View style={styles.activeRow}>
              <Text style={styles.activeText} numberOfLines={1}>
                Currently playing: {activeSetlist.setlist.name} — song {activeSetlist.currentIndex + 1}{' '}
                of {activeSetlist.setlist.entries.length}
              </Text>
              <Pressable
                onPress={() => clearSetlist()}
                accessibilityRole="button"
                accessibilityLabel="Stop following this setlist"
              >
                <Text style={styles.stopLink}>Stop</Text>
              </Pressable>
            </View>
          ) : null}

          {isLoadingOne && <ActivityIndicator color="#fff" style={styles.spinner} />}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {setlists === null && !error ? (
            <ActivityIndicator color="#fff" style={styles.spinner} />
          ) : (
            <FlatList
              data={setlists ?? []}
              keyExtractor={(item) => item.path}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No setlists yet. Tap "New Setlist" to build your first one.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.setlistRow}
                  onPress={() => handleOpen(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Play setlist ${item.name}`}
                >
                  <Text style={styles.setlistName}>{item.name}</Text>
                </Pressable>
              )}
            />
          )}
        </>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  backLink: {
    color: '#4f8cff',
    fontSize: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  infoText: {
    color: '#bbb',
    fontSize: 15,
    lineHeight: 21,
  },
  newButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  activeText: {
    color: '#9ad39a',
    fontSize: 14,
    flex: 1,
  },
  stopLink: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  spinner: {
    marginTop: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
  },
  setlistRow: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  setlistName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
