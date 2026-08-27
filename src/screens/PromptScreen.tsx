import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useKeepAwake } from 'expo-keep-awake';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { useSpeech } from '../speech/useSpeech';
import { useAudioInterruptionResume } from '../speech/useAudioInterruptionResume';
import { loadReduceVoiceOverChatter } from '../speech/voiceOverPreference';
import { playAdvanceFeedback, playEndOfSongFeedback } from '../feedback/feedback';
import { usePedalInput } from '../pedal/usePedalInput';

type Props = NativeStackScreenProps<RootStackParamList, 'Prompt'>;

// accessibilityTraits isn't in React Native's public TypeScript ViewProps,
// but this is a real, native-supported trait string (see
// accessibilityPropsConversions.h): "startsMedia" maps to
// UIAccessibilityTraitStartsMediaSession (tells VoiceOver an audio session is
// active so it backs off its own ambient speech without disabling touch).
// (allowsDirectInteraction was tried for swipe gestures on the touch strip,
// but on-device testing showed VoiceOver still claims one-finger swipes for
// its own navigation regardless of that trait — the strip uses plain
// tap-to-activate buttons now instead, which is VoiceOver's standard,
// reliable interaction model.)
function accessibilityTraitsProp(traits: string[]) {
  return { accessibilityTraits: traits } as unknown as { accessibilityTraits: never };
}

export function PromptScreen({ navigation }: Props) {
  // suppressDeactivateWarnings avoids a benign unhandled-rejection when the
  // screen unmounts before the (async, web-only) Wake Lock activation settles.
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { activeSong: song } = useAppState();
  const { speakNow, stopImmediate, refreshVoicePreference } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reduceChatter, setReduceChatter] = useState(false);

  useEffect(() => {
    loadReduceVoiceOverChatter().then(setReduceChatter);
  }, []);

  // React Navigation reuses this screen's instance on goBack() rather than
  // remounting it, so settings changed on VoiceSettings/PedalSettings (voice,
  // reduce-VO-chatter) would otherwise never reach an already-mounted
  // PromptScreen until the app fully restarted.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshVoicePreference();
      loadReduceVoiceOverChatter().then(setReduceChatter);
    });
    return unsubscribe;
  }, [navigation, refreshVoicePreference]);

  useEffect(() => {
    if (!song) {
      navigation.replace('Library');
    }
  }, [song, navigation]);

  // Speak the first line immediately on load — no "ready, press next" step,
  // since that state relied on a swipe prompt VoiceOver users couldn't act on
  // anyway, and there's no real reason to make everyone wait through it.
  useEffect(() => {
    if (song && song.lines.length > 0) {
      playAdvanceFeedback();
      speakNow(song.lines[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => stopImmediate();
  }, [stopImmediate]);

  const goNext = useCallback(() => {
    if (!song) return;
    if (currentIndex >= song.lines.length - 1) {
      stopImmediate();
      playEndOfSongFeedback();
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    playAdvanceFeedback();
    speakNow(song.lines[nextIndex]);
  }, [currentIndex, song, speakNow, stopImmediate]);

  const goPrevious = useCallback(() => {
    if (!song) {
      return;
    }
    const prevIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIndex);
    playAdvanceFeedback();
    speakNow(song.lines[prevIndex]);
  }, [currentIndex, song, speakNow]);

  const { isPedalConnected } = usePedalInput({
    onAction: (action) => {
      if (action === 'next') {
        goNext();
      } else {
        goPrevious();
      }
    },
    onDisconnectAlert: () => {
      speakNow('Pedal disconnected. Using on-screen buttons.');
    },
    onConnectAlert: () => {
      speakNow('Pedal connected.');
    },
  });

  const resumeCurrentLine = useCallback(() => {
    if (song) {
      speakNow(song.lines[currentIndex]);
    }
  }, [currentIndex, song, speakNow]);
  useAudioInterruptionResume(resumeCurrentLine);

  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => goNext());
  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => goPrevious());
  const screenSwipe = Gesture.Race(flingLeft, flingRight);

  if (!song) {
    return <View style={styles.container} />;
  }

  const displayText = song.lines[currentIndex];
  const isEnded = currentIndex === song.lines.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song.title}
          {song.key ? ` — Key of ${song.key}` : ''}
        </Text>
        <View style={styles.headerLinks}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isPedalConnected ? 'Pedal connected. Open pedal settings' : 'Open pedal settings'
            }
            onPress={() => navigation.navigate('PedalSettings')}
          >
            <Text style={styles.exitLink}>{isPedalConnected ? 'Pedal ●' : 'Controls'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open voice settings"
            onPress={() => navigation.navigate('VoiceSettings')}
          >
            <Text style={styles.exitLink}>Voice</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit this song's lyrics"
            onPress={() => navigation.navigate('NewSong', { editSong: song })}
          >
            <Text style={styles.exitLink}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Load a different song"
            onPress={() => navigation.navigate('Library')}
          >
            <Text style={styles.exitLink}>Library</Text>
          </Pressable>
        </View>
      </View>

      <GestureDetector gesture={screenSwipe}>
        <View
          style={styles.lineArea}
          {...(reduceChatter ? accessibilityTraitsProp(['startsMedia']) : {})}
        >
          <Text style={styles.lineText}>{displayText}</Text>
          {isEnded ? <Text style={styles.endLabel}>End of song</Text> : null}
        </View>
      </GestureDetector>

      <View style={styles.touchStrip}>
        <Pressable
          style={styles.touchStripHalf}
          onPress={goPrevious}
          accessibilityRole="button"
          accessibilityLabel="Previous line"
        >
          <Text style={styles.touchStripLabel}>‹ Previous</Text>
        </Pressable>
        <View style={styles.touchStripDivider} />
        <Pressable
          style={styles.touchStripHalf}
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel="Next line"
        >
          <Text style={styles.touchStripLabel}>Next ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  songTitle: {
    color: '#999',
    fontSize: 16,
    flexShrink: 1,
  },
  headerLinks: {
    flexDirection: 'row',
    gap: 18,
  },
  exitLink: {
    color: '#4f8cff',
    fontSize: 16,
  },
  lineArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lineText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
  },
  endLabel: {
    color: '#888',
    fontSize: 18,
    marginTop: 24,
  },
  touchStrip: {
    flexDirection: 'row',
    height: 90,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  touchStripHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchStripDivider: {
    width: 1,
    backgroundColor: '#222',
  },
  touchStripLabel: {
    color: '#4f8cff',
    fontSize: 20,
    fontWeight: '700',
  },
});
