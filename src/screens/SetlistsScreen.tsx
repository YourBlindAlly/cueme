import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { listSetlists, loadSetlist, type SetlistSummary } from '../setlist/setlistStorage';
import { isDropboxConfigured } from '../cloud/dropbox/dropboxAuth';
import { LINK_HIT_SLOP } from '../ui/hitSlop';

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
      // popTo, not navigate — see PromptScreen's "Library" link for why.
      navigation.popTo('Prompt');
    } catch (err) {
      Alert.alert('Couldn’t load setlist', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingOne(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          hitSlop={LINK_HIT_SLOP}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
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
              renderItem={({ item }) => {
                // The active setlist's own row does double duty instead of
                // needing a separate always-visible "currently playing"
                // banner plus a Stop button plus this same row again below
                // it (Rusty's own complaint, 2026-08-30, about the old
                // three-part layout): tapping it resumes exactly where
                // playback left off rather than restarting from song 1, and
                // "Stop following this setlist" is a VoiceOver custom action
                // on the row (swipe up/down), the same one-row-many-actions
                // pattern already used on Library/Setlist Creator rows.
                const isActive = activeSetlist?.setlist.name === item.name;
                return (
                  <Pressable
                    style={styles.setlistRow}
                    onPress={() => (isActive ? navigation.popTo('Prompt') : handleOpen(item))}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isActive
                        ? `${item.name}, currently playing, song ${activeSetlist!.currentIndex + 1} of ${activeSetlist!.setlist.entries.length}. Double tap to resume.`
                        : `Play setlist ${item.name}`
                    }
                    accessibilityHint={isActive ? 'Swipe up or down to stop following this setlist.' : undefined}
                    accessibilityActions={isActive ? [{ name: 'stop', label: 'Stop Following' }] : undefined}
                    onAccessibilityAction={
                      isActive
                        ? (event) => {
                            if (event.nativeEvent.actionName === 'stop') {
                              clearSetlist();
                            }
                          }
                        : undefined
                    }
                  >
                    <Text style={styles.setlistName}>{item.name}</Text>
                    {isActive ? (
                      <Text style={styles.activeText} numberOfLines={1}>
                        Playing — song {activeSetlist!.currentIndex + 1} of{' '}
                        {activeSetlist!.setlist.entries.length}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}
        </>
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
  activeText: {
    color: '#9ad39a',
    fontSize: 14,
    marginTop: 4,
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
