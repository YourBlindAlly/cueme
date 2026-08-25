import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { buildSong } from '../parsing/buildSong';

type Props = NativeStackScreenProps<RootStackParamList, 'NewSong'>;

export function InputScreen({ navigation, route }: Props) {
  const editSong = route.params?.editSong;
  const { loadSong } = useAppState();
  const [title, setTitle] = useState(editSong?.title ?? '');
  const [rawText, setRawText] = useState(editSong?.rawText ?? '');

  const canLoad = rawText.trim().length > 0;

  const handleLoad = async () => {
    const song = buildSong(rawText, title, editSong?.source ?? { type: 'manual' });
    if (!song) {
      return;
    }
    // Editing an existing song updates it in place rather than adding a
    // duplicate library entry.
    if (editSong) {
      song.id = editSong.id;
      song.addedAt = editSong.addedAt;
    }
    await loadSong(song);
    navigation.navigate('Prompt');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.heading} accessibilityRole="header">
        {editSong ? 'Edit Song' : 'New Song'}
      </Text>

      <Text style={styles.label}>Title (optional)</Text>
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Song title"
        accessibilityLabel="Song title"
        returnKeyType="next"
      />

      <Text style={styles.label}>Lyrics — one line per prompt</Text>
      <TextInput
        style={styles.bodyInput}
        value={rawText}
        onChangeText={setRawText}
        placeholder={
          'Paste your lyrics here.\nOne line at a time.\n\nMark sections with -- or [Chorus] if you like.'
        }
        placeholderTextColor="#8a8a8a"
        multiline
        textAlignVertical="top"
        accessibilityLabel="Lyrics text, one line per prompt"
      />

      <Pressable
        style={[styles.loadButton, !canLoad && styles.loadButtonDisabled]}
        onPress={handleLoad}
        disabled={!canLoad}
        accessibilityRole="button"
        accessibilityLabel={editSong ? 'Save changes' : 'Load song'}
        accessibilityState={{ disabled: !canLoad }}
      >
        <Text style={styles.loadButtonText}>{editSong ? 'Save Changes' : 'Load Song'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
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
  label: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },
  titleInput: {
    backgroundColor: '#1c1c1c',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bodyInput: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  loadButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadButtonDisabled: {
    backgroundColor: '#2a3a5c',
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
