import AsyncStorage from '@react-native-async-storage/async-storage';

const INCLUDE_CHORDS_KEY = 'cueme.includeChords';

/** Off by default — chords stay silent (matching the app's prior behavior) until turned on. */
export async function loadIncludeChords(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(INCLUDE_CHORDS_KEY);
  return raw === 'true';
}

export async function saveIncludeChords(value: boolean): Promise<void> {
  await AsyncStorage.setItem(INCLUDE_CHORDS_KEY, String(value));
}
