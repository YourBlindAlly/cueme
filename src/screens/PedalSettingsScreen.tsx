import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePedalInput } from '../pedal/usePedalInput';
import type { PedalAction } from '../pedal/keyBindings';
import { LINK_HIT_SLOP } from '../ui/hitSlop';

type Props = NativeStackScreenProps<RootStackParamList, 'PedalSettings'>;

const ACTION_LABELS: Record<PedalAction, string> = {
  next: 'Next line',
  previous: 'Previous line',
};

export function PedalSettingsScreen({ navigation }: Props) {
  const onBack = () => navigation.goBack();

  const {
    isPedalConnected,
    bindings,
    assignBinding,
    isCapturing,
    captureNextKey,
    cancelCapture,
    alertOnDisconnect,
    setAlertOnDisconnect,
  } = usePedalInput();

  const [capturingAction, setCapturingAction] = React.useState<PedalAction | null>(null);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={LINK_HIT_SLOP} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.backLink}>Back</Text>
          </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          Pedal &amp; Controls
        </Text>
      </View>

      <Text style={styles.statusText}>
        {isPedalConnected ? 'Pedal or keyboard connected' : 'No pedal connected'}
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
              <Pressable
                hitSlop={LINK_HIT_SLOP}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
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
