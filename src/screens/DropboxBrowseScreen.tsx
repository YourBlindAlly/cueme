import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { isDropboxConfigured, useDropboxAuth } from '../cloud/dropbox/dropboxAuth';
import {
  downloadDropboxFile,
  getDropboxAccountEmail,
  listDropboxFolder,
  type DropboxEntry,
} from '../cloud/dropbox/dropboxApi';
import { buildSongFromFile } from '../parsing/buildSong';

type Props = NativeStackScreenProps<RootStackParamList, 'DropboxBrowse'>;

export function DropboxBrowseScreen({ navigation, route }: Props) {
  const path = route.params?.path ?? '';
  const { loadSong } = useAppState();
  const { isConnected, isChecking, connect, disconnect } = useDropboxAuth();
  const [entries, setEntries] = useState<DropboxEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'cueme', path: 'redirect' });

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    setEntries(null);
    setError(null);
    listDropboxFolder(path)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [isConnected, path]);

  useEffect(() => {
    if (!isConnected) {
      setAccountEmail(null);
      return;
    }
    // Shown in the header so it's obvious which Dropbox account is
    // connected — easy to mix up if more than one account has ever been
    // used on this device, and otherwise invisible from inside the app.
    getDropboxAccountEmail()
      .then(setAccountEmail)
      .catch(() => setAccountEmail(null));
  }, [isConnected]);

  const handleConnect = async () => {
    const result = await connect();
    if (!result.success && result.error) {
      Alert.alert('Couldn’t connect to Dropbox', result.error);
    }
  };

  const handleEntryPress = async (entry: DropboxEntry) => {
    if (entry.isFolder) {
      navigation.push('DropboxBrowse', { path: entry.path });
      return;
    }
    setIsDownloading(true);
    try {
      const text = await downloadDropboxFile(entry.path);
      const song = buildSongFromFile(text, entry.name, { type: 'dropbox', path: entry.path });
      if (!song) {
        Alert.alert('Empty file', `"${entry.name}" doesn't have any lyric lines in it.`);
        return;
      }
      await loadSong(song);
      navigation.navigate('Prompt');
    } catch (err) {
      Alert.alert('Download failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isDropboxConfigured) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading} accessibilityRole="header">
          Dropbox
        </Text>
        <Text style={styles.infoText}>
          Dropbox isn't set up yet. To enable it, create an app at
          dropbox.com/developers/apps, add the files.metadata.read and
          files.content.read permissions, add this redirect URI under OAuth 2:
        </Text>
        <Text selectable style={styles.codeText}>
          {redirectUri}
        </Text>
        <Text style={styles.infoText}>
          Then give me the app key and I'll wire it in.
        </Text>
      </View>
    );
  }

  if (isChecking) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading} accessibilityRole="header">
          Dropbox
        </Text>
        <Pressable
          style={styles.connectButton}
          onPress={handleConnect}
          accessibilityRole="button"
          accessibilityLabel="Connect Dropbox"
        >
          <Text style={styles.connectButtonText}>Connect Dropbox</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading} accessibilityRole="header">
          {path ? path.split('/').pop() : 'Dropbox'}
        </Text>
        <Pressable
          onPress={disconnect}
          accessibilityRole="button"
          accessibilityLabel="Disconnect Dropbox"
        >
          <Text style={styles.disconnectLink}>Disconnect</Text>
        </Pressable>
      </View>

      {accountEmail && <Text style={styles.accountText}>Connected as {accountEmail}</Text>}

      {isDownloading && <ActivityIndicator color="#fff" style={styles.spinner} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {entries === null && !error ? (
        <ActivityIndicator color="#fff" style={styles.spinner} />
      ) : (
        <FlatList
          data={entries ?? []}
          keyExtractor={(item) => item.path}
          ListEmptyComponent={<Text style={styles.emptyText}>Nothing here.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.entryRow}
              onPress={() => handleEntryPress(item)}
              accessibilityRole="button"
              accessibilityLabel={item.isFolder ? `Folder ${item.name}` : `Song file ${item.name}`}
            >
              <Text style={styles.entryText}>
                {item.isFolder ? '📁 ' : '🎵 '}
                {item.name}
              </Text>
            </Pressable>
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
  centeredContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  accountText: {
    color: '#9ad39a',
    fontSize: 14,
    marginBottom: 16,
  },
  infoText: {
    color: '#bbb',
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 21,
  },
  codeText: {
    color: '#9ad39a',
    fontSize: 14,
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disconnectLink: {
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
  entryRow: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  entryText: {
    color: '#fff',
    fontSize: 16,
  },
});
