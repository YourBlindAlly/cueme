import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePedalInput } from '../pedal/usePedalInput';
import type { PedalAction } from '../pedal/keyBindings';

type Props = NativeStackScreenProps<RootStackParamList, 'PedalSettings'>;

const ACTION_LABELS: Record<PedalAction, string> = {
  next: 'Next line',
  previous: 'Previous line',
};

export function PedalSettingsScreen({ navigation }: Props) {
  const onBack = () => navigation.goBack();
  const [rawKeyLog, setRawKeyLog] = useState<string | null>(null);
  const rawKeyCount = useRef(0);

  const {
    isPedalConnected,
    bindings,
    assignBinding,
    isCapturing,
    captureNextKey,
    cancelCapture,
    alertOnDisconnect,
    setAlertOnDisconnect,
  } = usePedalInput({
    onRawKey: (event) => {
      rawKeyCount.current += 1;
      const label = `${event.keyName} (press ${rawKeyCount.current})`;
      setRawKeyLog(label);
      Speech.speak(`Received ${event.keyName}`);
    },
  });

  const [capturingAction, setCapturingAction] = React.useState<PedalAction | null>(null);
  const captureInputRef = useRef<TextInput>(null);

  // Gives a real iOS text-editing focus context to the capture flow. Confirmed
  // on the web version of this same pedal (Pedal Timing Tester) that VoiceOver
  // treats a focused text field differently from a plain button for letting
  // hardware key events through — worth trying here too even though the
  // native GCKeyboard bridge is supposed to bypass VoiceOver's interception
  // entirely, since that assumption is exactly what's unconfirmed.
  useEffect(() => {
    if (isCapturing) {
      captureInputRef.current?.focus();
    }
  }, [isCapturing]);

  const handleAssign = async (action: PedalAction) => {
    setCapturingAction(action);
    const event = await captureNextKey();
    assignBinding(action, event);
    setCapturingAction(null);
  };

  const handleCancelCapture = () => {
    cancelCapture();
    setCapturingAction(null);
  };

  const bindingsForAction = (action: PedalAction) =>
    bindings.filter((b) => b.action === action);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          Pedal &amp; Controls
        </Text>
      </View>

      <Text style={styles.statusText}>
        {isPedalConnected ? 'Pedal or keyboard connected' : 'No pedal connected'}
      </Text>

      <Text style={styles.rawKeyText} accessibilityLiveRegion="polite">
        {rawKeyLog
          ? `Last key received: ${rawKeyLog}`
          : 'No key presses received yet. Press any pedal button to test.'}
      </Text>

      {(['next', 'previous'] as PedalAction[]).map((action) => (
        <View key={action} style={styles.actionRow}>
          <Text style={styles.actionLabel}>{ACTION_LABELS[action]}</Text>
          <Text style={styles.currentKeys}>
            {bindingsForAction(action).map((b) => b.keyName).join(', ') || 'Not set'}
          </Text>
          {isCapturing && capturingAction === action ? (
            <View style={styles.captureRow}>
              <Text style={styles.capturingText}>Waiting for a press…</Text>
              <TextInput
                ref={captureInputRef}
                style={styles.captureInput}
                accessibilityLabel="Press the pedal now"
                value=""
                onChangeText={() => {}}
              />
              <Pressable
                onPress={handleCancelCapture}
                accessibilityRole="button"
                accessibilityLabel={`Cancel assigning ${ACTION_LABELS[action]}`}
              >
                <Text style={styles.cancelLink}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.assignButton}
              onPress={() => handleAssign(action)}
              disabled={isCapturing}
              accessibilityRole="button"
              accessibilityLabel={`Press a button to assign ${ACTION_LABELS[action]}`}
            >
              <Text style={styles.assignButtonText}>Press a button to assign</Text>
            </Pressable>
          )}
        </View>
      ))}

      <View style={styles.toggleRow}>
        <Text style={styles.actionLabel}>Alert when pedal disconnects</Text>
        <Switch value={alertOnDisconnect} onValueChange={setAlertOnDisconnect} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
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
  statusText: {
    color: '#9ad39a',
    fontSize: 15,
    marginBottom: 8,
  },
  rawKeyText: {
    color: '#ffcc66',
    fontSize: 14,
    marginBottom: 24,
  },
  actionRow: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  currentKeys: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  assignButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capturingText: {
    color: '#ffcc66',
    fontSize: 15,
  },
  cancelLink: {
    color: '#ff6b6b',
    fontSize: 15,
  },
  captureInput: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#4f8cff',
    borderRadius: 6,
    color: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 90,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 16,
    marginTop: 10,
  },
});
