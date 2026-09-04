import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { LINK_HIT_SLOP } from '../ui/hitSlop';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

const CONTACT_EMAIL = 'cueme@gmail.com';

export function AboutScreen({ navigation }: Props) {
  // On a genuine first launch, About is the root screen — there's nothing to
  // go back to, so "Back" instead takes a new user on into the (freshly
  // seeded) Library rather than doing nothing.
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Library');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          hitSlop={LINK_HIT_SLOP}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          About CueMe
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.paragraph}>
          CueMe reads your lyrics out loud, one line at a time, while you perform live. I built
          it for myself. I'm a blind singer-songwriter, and reading a lyric sheet on stage was
          never an option for me. CueMe works fine for sighted performers too.
        </Text>

        <Text style={styles.paragraph}>
          Advance to the next line with a foot pedal or a swipe down in the lyrics area. CueMe
          has its own voice, separate from VoiceOver, so it sounds and works the same whether
          VoiceOver is on or off.
        </Text>

        <Text style={styles.paragraph}>
          Getting started: the fastest way in is to try one of the built-in demo songs first,
          just to get a feel for it. Or if there's a song you already know by heart, use your
          phone's dictation to speak it straight into the New Song screen, saying "new line"
          between lines so each one lands on its own line.
        </Text>

        <Text style={styles.paragraph}>
          Something not working, or have an idea for a feature? Email {CONTACT_EMAIL}.
        </Text>

        <Text style={styles.versionText}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 30,
  },
  paragraph: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 18,
  },
  versionText: {
    color: '#999',
    fontSize: 13,
    marginTop: 10,
  },
});
