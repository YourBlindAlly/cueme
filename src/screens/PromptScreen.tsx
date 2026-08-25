import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
// but these are real, native-supported trait strings (see
// accessibilityPropsConversions.h): "allowsDirectInteraction" maps to
// UIAccessibilityTraitAllowsDirectInteraction (pass raw touches straight
// through instead of VoiceOver intercepting them), and "startsMedia" maps to
// UIAccessibilityTraitStartsMediaSession (tells VoiceOver an audio session is
// active so it backs off its own ambient speech without disabling touch).
function accessibilityTraitsProp(traits: string[]) {
  return { accessibilityTraits: traits } as unknown as { accessibilityTraits: never };
}
const directInteractionProps = accessibilityTraitsProp(['allowsDirectInteraction']);

export function PromptScreen({ navigation }: Props) {
  // suppressDeactivateWarnings avoids a benign unhandled-rejection when the
  // screen unmounts before the (async, web-only) Wake Lock activation settles.
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { activeSong: song } = useAppState();
  const { speakNow, stopImmediate } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [reduceChatter, setReduceChatter] = useState(false);

  useEffect(() => {
    loadReduceVoiceOverChatter().then(setReduceChatter);
  }, []);

  useEffect(() => {
    if (!song) {
      navigation.replace('Library');
    }
  }, [song, navigation]);

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
    if (!song || currentIndex < 0) {
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
      speakNow('Pedal disconnected. Using swipe.');
    },
  });

  const resumeCurrentLine = useCallback(() => {
    if (song && currentIndex >= 0) {
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

  const stripFlingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => goNext());
  const stripFlingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => goPrevious());
  const stripSwipe = Gesture.Race(stripFlingLeft, stripFlingRight);

  if (!song) {
    return <View style={styles.container} />;
  }

  const displayText =
    currentIndex < 0 ? 'Ready — swipe forward to begin' : song.lines[currentIndex];
  const isEnded = currentIndex >= 0 && currentIndex === song.lines.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <View style={styles.headerLinks}>
          <Text
            style={styles.exitLink}
            accessibilityRole="button"
            accessibilityLabel={
              isPedalConnected ? 'Pedal connected. Open pedal settings' : 'Open pedal settings'
            }
            onPress={() => navigation.navigate('PedalSettings')}
          >
            {isPedalConnected ? 'Pedal ●' : 'Controls'}
          </Text>
          <Text
            style={styles.exitLink}
            accessibilityRole="button"
            accessibilityLabel="Open voice settings"
            onPress={() => navigation.navigate('VoiceSettings')}
          >
            Voice
          </Text>
          <Text
            style={styles.exitLink}
            accessibilityRole="button"
            accessibilityLabel="Edit this song's lyrics"
            onPress={() => navigation.navigate('NewSong', { editSong: song })}
          >
            Edit
          </Text>
          <Text
            style={styles.exitLink}
            accessibilityRole="button"
            accessibilityLabel="Load a different song"
            onPress={() => navigation.navigate('Library')}
          >
            Library
          </Text>
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

      <Text style={styles.stripCaption}>Swipe zone — forward / back</Text>
      <GestureDetector gesture={stripSwipe}>
        <View
          style={styles.touchStrip}
          accessible
          accessibilityLabel="Swipe zone, forward or back"
          {...directInteractionProps}
        />
      </GestureDetector>
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
  stripCaption: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  touchStrip: {
    height: 90,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
});
