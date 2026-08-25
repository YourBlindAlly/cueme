import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_KEY_BINDINGS, type KeyBinding } from './keyBindings';

const BINDINGS_KEY = 'cueme.pedalKeyBindings';
const ALERT_ON_DISCONNECT_KEY = 'cueme.pedalAlertOnDisconnect';

export async function loadKeyBindings(): Promise<KeyBinding[]> {
  const raw = await AsyncStorage.getItem(BINDINGS_KEY);
  if (!raw) {
    return DEFAULT_KEY_BINDINGS;
  }
  return JSON.parse(raw) as KeyBinding[];
}

export async function saveKeyBindings(bindings: KeyBinding[]): Promise<void> {
  await AsyncStorage.setItem(BINDINGS_KEY, JSON.stringify(bindings));
}

export async function resetKeyBindings(): Promise<KeyBinding[]> {
  await AsyncStorage.removeItem(BINDINGS_KEY);
  return DEFAULT_KEY_BINDINGS;
}

/** Alert-and-fall-back-to-swipe on pedal disconnect is on by default, per spec. */
export async function loadAlertOnDisconnect(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(ALERT_ON_DISCONNECT_KEY);
  return raw === null ? true : raw === 'true';
}

export async function saveAlertOnDisconnect(value: boolean): Promise<void> {
  await AsyncStorage.setItem(ALERT_ON_DISCONNECT_KEY, String(value));
}
