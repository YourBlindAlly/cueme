import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  DEFAULT_LINE_LENGTH_PRESET,
  LINE_LENGTH_OPTIONS,
  loadLineLengthPreset,
  saveLineLengthPreset,
  type LineLengthPreset,
} from '../parsing/lineLengthPreference';
import { LINK_HIT_SLOP } from '../ui/hitSlop';

type Props = NativeStackScreenProps<RootStackParamList, 'LineLengthSettings'>;

const CHOICES: { preset: LineLengthPreset; label: string; hint: string }[] = [
  { preset: 'short', label: 'Short', hint: `About ${LINE_LENGTH_OPTIONS.short.maxWords} words a line` },
  {
    preset: 'medium',
    label: 'Medium (recommended)',
    hint: `About ${LINE_LENGTH_OPTIONS.medium.maxWords} words a line`,
  },
  { preset: 'long', label: 'Long', hint: `About ${LINE_LENGTH_OPTIONS.long.maxWords} words a line` },
  { preset: 'off', label: 'Off', hint: 'Speak each line exactly as it appears in the song file' },
];

export function LineLengthSettingsScreen({ navigation }: Props) {
  const onBack = () => navigation.goBack();
  const [selected, setSelected] = useState<LineLengthPreset>(DEFAULT_LINE_LENGTH_PRESET);

  useEffect(() => {
    loadLineLengthPreset().then(setSelected);
  }, []);

  const handleSelect = (preset: LineLengthPreset) => {
    setSelected(preset);
    void saveLineLengthPreset(preset);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable hitSlop={LINK_HIT_SLOP} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          Line length
        </Text>
      </View>

      <Text style={styles.description}>
        Long lyric lines get automatically split into shorter phrases before they're spoken, so
        each one is easier to hold onto. This applies to every song in your library, not just new
        ones. Splits happen at a natural pause when there is one — a comma, a new chord, before
        "and" or "but" — rather than mid-phrase.
      </Text>

      {CHOICES.map(({ preset, label, hint }) => {
        const isSelected = preset === selected;
        return (
          <Pressable
            key={preset}
            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            onPress={() => handleSelect(preset)}
            accessibilityRole="button"
            accessibilityLabel={`${label}. ${hint}`}
            accessibilityState={{ selected: isSelected }}
          >
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionLabel}>{label}</Text>
              <Text style={styles.optionHint}>{hint}</Text>
            </View>
            {isSelected ? <Text style={styles.selectedMark}>Selected</Text> : null}
          </Pressable>
        );
      })}
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
  description: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  optionRowSelected: {
    borderWidth: 1,
    borderColor: '#4f8cff',
  },
  optionTextBlock: {
    flex: 1,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionHint: {
    color: '#999',
    fontSize: 13,
    marginTop: 4,
  },
  selectedMark: {
    color: '#4f8cff',
    fontSize: 13,
    marginLeft: 12,
  },
});
