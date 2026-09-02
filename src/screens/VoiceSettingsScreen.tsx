import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import type { Voice } from 'expo-speech';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { loadVoicePreference, saveVoicePreference } from '../speech/voicePreference';
import {
  loadReduceVoiceOverChatter,
  saveReduceVoiceOverChatter,
} from '../speech/voiceOverPreference';
import { groupVoicesByLanguage } from '../speech/groupVoicesByLanguage';
import { LINK_HIT_SLOP } from '../ui/hitSlop';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceSettings'>;

const PREVIEW_TEXT = 'This is what your lyrics will sound like.';

export function VoiceSettingsScreen({ navigation }: Props) {
  const onBack = () => navigation.goBack();
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reduceChatter, setReduceChatter] = useState(false);

  useEffect(() => {
    (async () => {
      const [available, saved, chatterSetting] = await Promise.all([
        Speech.getAvailableVoicesAsync(),
        loadVoicePreference(),
        loadReduceVoiceOverChatter(),
      ]);
      setVoices(available);
      setSelectedId(saved);
      setReduceChatter(chatterSetting);
    })();
    return () => {
      Speech.stop();
    };
  }, []);

  const handleToggleReduceChatter = (value: boolean) => {
    setReduceChatter(value);
    void saveReduceVoiceOverChatter(value);
  };

  const handleSelect = (voice: Voice) => {
    setSelectedId(voice.identifier);
    void saveVoicePreference(voice.identifier);
  };

  const handleUseDefault = () => {
    setSelectedId(null);
    void saveVoicePreference(null);
  };

  const handlePreview = (voice: Voice) => {
    Speech.stop();
    Speech.speak(PREVIEW_TEXT, { voice: voice.identifier });
  };

  const sections = useMemo(() => groupVoicesByLanguage(voices ?? []), [voices]);

  // Surfaced near the top so it's findable without scrolling a long,
  // language-grouped list — separate from the always-there "System
  // default" row below, which only needs this when a specific device
  // voice (not the default) is the current pick.
  const currentVoice = useMemo(
    () => voices?.find((v) => v.identifier === selectedId) ?? null,
    [voices, selectedId]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable hitSlop={LINK_HIT_SLOP} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          Voice
        </Text>
      </View>

      <View style={styles.chatterRow}>
        <View style={styles.chatterTextBlock}>
          <Text style={styles.actionLabel}>Reduce VoiceOver chatter while performing</Text>
          <Text style={styles.chatterHint}>
            Experimental. Tells VoiceOver an audio session is active on the lyrics screen, so it
            interrupts CueMe's speech less — touch and buttons still work normally.
          </Text>
        </View>
        <Switch
          value={reduceChatter}
          onValueChange={handleToggleReduceChatter}
          accessibilityLabel="Reduce VoiceOver chatter while performing"
        />
      </View>

      <Pressable
        style={[styles.voiceRow, selectedId === null && styles.voiceRowSelected]}
        onPress={handleUseDefault}
        accessibilityRole="button"
        accessibilityLabel="System default"
        accessibilityState={{ selected: selectedId === null }}
      >
        <Text style={styles.voiceName}>System default</Text>
        {selectedId === null ? <Text style={styles.selectedMark}>Selected</Text> : null}
      </Pressable>

      {currentVoice ? (
        <View style={styles.currentVoiceBlock}>
          <Text style={styles.currentVoiceLabel}>Current voice</Text>
          <View style={[styles.voiceRow, styles.voiceRowSelected]}>
            <View style={styles.voiceInfo}>
              <Text style={styles.voiceName}>{currentVoice.name}</Text>
              <Text style={styles.voiceLanguage}>{currentVoice.language}</Text>
            </View>
            <Pressable
              style={styles.previewButton}
              onPress={() => handlePreview(currentVoice)}
              accessibilityRole="button"
              accessibilityLabel="Preview"
            >
              <Text style={styles.previewButtonText}>Preview</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.identifier}
        ListEmptyComponent={
          voices === null ? (
            <Text style={styles.loadingText}>Loading voices…</Text>
          ) : (
            <Text style={styles.loadingText}>No voices found on this device.</Text>
          )
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader} accessibilityRole="header">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => {
          const isSelected = item.identifier === selectedId;
          return (
            <View style={[styles.voiceRow, isSelected && styles.voiceRowSelected]}>
              <Pressable
                style={styles.voiceInfo}
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${item.language}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.voiceName}>{item.name}</Text>
                <Text style={styles.voiceLanguage}>{item.language}</Text>
                {isSelected ? <Text style={styles.selectedMark}>Selected</Text> : null}
              </Pressable>
              <Pressable
                style={styles.previewButton}
                onPress={() => handlePreview(item)}
                accessibilityRole="button"
                accessibilityLabel="Preview"
              >
                <Text style={styles.previewButtonText}>Preview</Text>
              </Pressable>
            </View>
          );
        }}
      />
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
  loadingText: {
    color: '#999',
    fontSize: 15,
    marginTop: 12,
  },
  chatterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  chatterTextBlock: {
    flex: 1,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatterHint: {
    color: '#999',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  currentVoiceBlock: {
    marginBottom: 16,
  },
  currentVoiceLabel: {
    color: '#999',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionHeader: {
    color: '#999',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: '#000',
    paddingTop: 14,
    paddingBottom: 6,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  voiceRowSelected: {
    borderWidth: 1,
    borderColor: '#4f8cff',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceLanguage: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  selectedMark: {
    color: '#4f8cff',
    fontSize: 13,
    marginTop: 4,
  },
  previewButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 12,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
