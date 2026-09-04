import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { searchSongWithAi } from '../aiSearch/aiSearchApi';
import { isAiSearchConfigured } from '../aiSearch/config';
import { LINK_HIT_SLOP } from '../ui/hitSlop';

type Props = NativeStackScreenProps<RootStackParamList, 'FindSong'>;

export function FindSongScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [includeChords, setIncludeChords] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const configured = isAiSearchConfigured();
  const canSearch = configured && !isSearching && title.trim().length > 0;

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await searchSongWithAi(title.trim(), artist.trim(), includeChords);
      // Land on the same paste/review screen as every other import path —
      // nothing gets saved to the library until Rusty reviews it and taps
      // Save, since an AI result could be wrong or garbled.
      navigation.navigate('NewSong', {
        prefill: { title: result.title, rawText: result.lyricsText },
        aiSearchMeta: {
          title: title.trim(),
          artist: artist.trim(),
          includeChords,
          sourceUrl: result.sourceUrl,
        },
      });
    } catch (err) {
      Alert.alert('Search failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          Search for a Song
        </Text>
      </View>

      {!configured ? (
        <Text style={styles.notConfiguredText}>
          Song search isn't set up yet. It needs a backend server, which hasn't been connected to
          this build of the app.
        </Text>
      ) : (
        <>
          <Text style={styles.experimentalNotice}>
            Experimental: this searches the web for lyrics but may not always find a complete
            result. If the result pasted in the next screen is incomplete or has a problem, tap
            cancel. You can paste the correct lyrics in yourself instead.
          </Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Song title"
            accessibilityLabel="Title"
            returnKeyType="next"
            editable={!isSearching}
          />

          <Text style={styles.label}>Artist (optional, but helps)</Text>
          <TextInput
            style={styles.input}
            value={artist}
            onChangeText={setArtist}
            placeholder="Artist"
            accessibilityLabel="Artist"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            editable={!isSearching}
          />

          <View style={styles.chordsRow}>
            <Text style={styles.chordsLabel}>Include chords</Text>
            <Switch
              value={includeChords}
              onValueChange={setIncludeChords}
              accessibilityLabel="Include chords"
              disabled={isSearching}
            />
          </View>

          <Pressable
            style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!canSearch}
            accessibilityRole="button"
            accessibilityLabel={isSearching ? 'Searching…' : 'Search'}
            accessibilityState={{ disabled: !canSearch }}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </Pressable>

          <Text style={styles.hintText}>
            You'll get a chance to review the result before it's saved to your library.
          </Text>
        </>
      )}
    </KeyboardAvoidingView>
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
    gap: 14,
    marginBottom: 20,
  },
  backLink: {
    color: '#4f8cff',
    fontSize: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1c1c1c',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  chordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  chordsLabel: {
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  searchButtonDisabled: {
    backgroundColor: '#2a3a5c',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  hintText: {
    color: '#999',
    fontSize: 13,
    marginTop: 12,
  },
  notConfiguredText: {
    color: '#999',
    fontSize: 15,
  },
  experimentalNotice: {
    color: '#e0a640',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});
