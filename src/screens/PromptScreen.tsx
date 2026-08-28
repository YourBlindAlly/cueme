import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useKeepAwake } from 'expo-keep-awake';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { useSpeech } from '../speech/useSpeech';
import { useAudioInterruptionResume } from '../speech/useAudioInterruptionResume';
import { loadReduceVoiceOverChatter } from '../speech/voiceOverPreference';
import {
  loadLineLengthPreset,
  wrapOptionsForPreset,
  type LineLengthPreset,
} from '../parsing/lineLengthPreference';
import { loadIncludeChords } from '../parsing/chordsPreference';
import { wrapChordedSongLines, type LineWrapResult } from '../parsing/wrapLines';
import { playAdvanceFeedback, playEndOfSongFeedback } from '../feedback/feedback';
import { usePedalInput } from '../pedal/usePedalInput';
import { ROW_LINK_HIT_SLOP } from '../ui/hitSlop';

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
  const { activeSong: song, activeSetlist, advanceSetlist } = useAppState();
  const { speakNow, stopImmediate, refreshVoicePreference } = useSpeech();
  // React Navigation is supposed to fully unmount a screen once it's popped
  // off the stack, but Rusty found a real, reproducible case where that
  // doesn't happen cleanly: loading N different songs in a row caused each
  // song's first line to be spoken N times, growing by one per song loaded —
  // exactly what you'd hear if N still-alive-but-backgrounded PromptScreen
  // instances all independently reacted to the same shared "active song
  // changed" context update. isFocusedRef gates every place this screen
  // produces speech or reacts to pedal input, so a backgrounded instance
  // (however it ended up alive) stays silent no matter what shared state
  // changes around it — only the one instance actually on screen acts.
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reduceChatter, setReduceChatter] = useState(false);
  // Both start null (rather than defaulting to a guessed value) so the very
  // first render never wraps with a wrong guess and then immediately
  // re-speaks line one once the real saved preferences load — see spokenLines.
  const [lineLengthPreset, setLineLengthPreset] = useState<LineLengthPreset | null>(null);
  const [includeChords, setIncludeChords] = useState<boolean | null>(null);

  useEffect(() => {
    loadReduceVoiceOverChatter().then(setReduceChatter);
    loadLineLengthPreset().then(setLineLengthPreset);
    loadIncludeChords().then(setIncludeChords);
  }, []);

  // React Navigation reuses this screen's instance on goBack() rather than
  // remounting it, so settings changed on VoiceSettings/PedalSettings/Lines
  // (voice, reduce-VO-chatter, line-length preset, include-chords) would
  // otherwise never reach an already-mounted PromptScreen until the app
  // fully restarted.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshVoicePreference();
      loadReduceVoiceOverChatter().then(setReduceChatter);
      loadLineLengthPreset().then(setLineLengthPreset);
      loadIncludeChords().then(setIncludeChords);
    });
    return unsubscribe;
  }, [navigation, refreshVoicePreference]);

  useEffect(() => {
    if (!song) {
      navigation.replace('Library');
    }
  }, [song, navigation]);

  // Re-wrapping is a system-wide preference (not per-song), applied here at
  // playback time rather than baked into Song.lines, so changing it in
  // Settings immediately affects every song, including ones already in the
  // library — not just newly imported ones. Chord position is always a
  // preferred break point inside wrapChordedSongLines regardless of
  // includeChords — that flag only controls whether the chord names survive
  // into the rendered text.
  const spokenLines = useMemo<LineWrapResult>(() => {
    if (!song || lineLengthPreset === null || includeChords === null) {
      return { lines: [], sections: [] };
    }
    const options = wrapOptionsForPreset(lineLengthPreset);
    return wrapChordedSongLines(
      { chordedLines: song.chordedLines, sections: song.sections },
      options,
      includeChords
    );
  }, [song, lineLengthPreset, includeChords]);

  // Speak the first line immediately whenever a song loads or the wrapped
  // lines change (e.g. the line-length preference was changed and we came
  // back to this screen) — no "ready, press next" step, since that state
  // relied on a swipe prompt VoiceOver users couldn't act on anyway.
  useEffect(() => {
    setCurrentIndex(0);
    if (isFocusedRef.current && spokenLines.lines.length > 0) {
      playAdvanceFeedback();
      speakNow(spokenLines.lines[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenLines]);

  useEffect(() => {
    return () => stopImmediate();
  }, [stopImmediate]);

  const goNext = useCallback(() => {
    if (spokenLines.lines.length === 0) return;
    if (currentIndex >= spokenLines.lines.length - 1) {
      stopImmediate();
      playEndOfSongFeedback();
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    playAdvanceFeedback();
    speakNow(spokenLines.lines[nextIndex]);
  }, [currentIndex, spokenLines, speakNow, stopImmediate]);

  const goPrevious = useCallback(() => {
    if (spokenLines.lines.length === 0) {
      return;
    }
    const prevIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIndex);
    playAdvanceFeedback();
    speakNow(spokenLines.lines[prevIndex]);
  }, [currentIndex, spokenLines, speakNow]);

  const { isPedalConnected } = usePedalInput({
    onAction: (action) => {
      if (!isFocusedRef.current) return;
      if (action === 'next') {
        goNext();
      } else {
        goPrevious();
      }
    },
    // A double press changes song within the active setlist — layered on
    // top of the single-press line-advance above, which already fired for
    // both presses; a no-op if no setlist is currently active.
    onDoubleAction: (action) => {
      if (!isFocusedRef.current) return;
      void advanceSetlist(action);
    },
    onDisconnectAlert: () => {
      if (!isFocusedRef.current) return;
      speakNow('Pedal disconnected. Using on-screen buttons.');
    },
    onConnectAlert: () => {
      if (!isFocusedRef.current) return;
      speakNow('Pedal connected.');
    },
  });

  const resumeCurrentLine = useCallback(() => {
    if (isFocusedRef.current && spokenLines.lines.length > 0) {
      speakNow(spokenLines.lines[currentIndex]);
    }
  }, [currentIndex, spokenLines, speakNow]);
  useAudioInterruptionResume(resumeCurrentLine);

  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => goNext());
  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => goPrevious());
  const screenSwipe = Gesture.Race(flingLeft, flingRight);

  if (!song) {
    return <SafeAreaView style={styles.container} edges={['top']} />;
  }

  const displayText = spokenLines.lines[currentIndex];
  const isEnded = currentIndex === spokenLines.lines.length - 1;

  return (
    // edges={['top']} keeps header content (and its small link buttons)
    // clear of the notch/status bar area — without it nothing in this app
    // accounts for the safe area at all, so a reaching finger hunting for a
    // small top-row button has very little room before crossing into actual
    // system chrome (Rusty's real report, 2026-08-28).
    <SafeAreaView style={styles.container} edges={['top']} accessibilityViewIsModal>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {song.title}
            {song.key ? ` — Key of ${song.key}` : ''}
          </Text>
          {activeSetlist ? (
            <Text style={styles.setlistText} numberOfLines={1}>
              {activeSetlist.setlist.name} — song {activeSetlist.currentIndex + 1} of{' '}
              {activeSetlist.setlist.entries.length}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerLinks}>
          <Pressable
            hitSlop={ROW_LINK_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={
              isPedalConnected ? 'Pedal connected. Open pedal settings' : 'Open pedal settings'
            }
            onPress={() => navigation.navigate('PedalSettings')}
          >
            <Text style={styles.exitLink}>{isPedalConnected ? 'Pedal ●' : 'Controls'}</Text>
          </Pressable>
          <Pressable
            hitSlop={ROW_LINK_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Open voice settings"
            onPress={() => navigation.navigate('VoiceSettings')}
          >
            <Text style={styles.exitLink}>Voice</Text>
          </Pressable>
          <Pressable
            hitSlop={ROW_LINK_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Open line length settings"
            onPress={() => navigation.navigate('LineLengthSettings')}
          >
            <Text style={styles.exitLink}>Lines</Text>
          </Pressable>
          <Pressable
            hitSlop={ROW_LINK_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Edit this song's lyrics"
            onPress={() => navigation.navigate('NewSong', { editSong: song })}
          >
            <Text style={styles.exitLink}>Edit</Text>
          </Pressable>
          <Pressable
            hitSlop={ROW_LINK_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Load a different song"
            // popTo (not navigate) — React Navigation 7 changed navigate()
            // to no longer pop back to an existing route by default (that's
            // now popTo's job specifically); plain navigate('Library') was
            // pushing a brand new Library screen on top every single time
            // instead of returning to the one persistent instance, which is
            // the actual root cause of the growing navigation stack below.
            onPress={() => navigation.popTo('Library')}
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
    </SafeAreaView>
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
  headerTextBlock: {
    flexShrink: 1,
  },
  songTitle: {
    color: '#999',
    fontSize: 16,
    flexShrink: 1,
  },
  setlistText: {
    color: '#4f8cff',
    fontSize: 13,
    marginTop: 2,
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
