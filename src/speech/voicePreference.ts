import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_ID_KEY = 'cueme.voiceIdentifier';

export async function loadVoicePreference(): Promise<string | null> {
  return AsyncStorage.getItem(VOICE_ID_KEY);
}

export async function saveVoicePreference(identifier: string | null): Promise<void> {
  if (identifier === null) {
    await AsyncStorage.removeItem(VOICE_ID_KEY);
  } else {
    await AsyncStorage.setItem(VOICE_ID_KEY, identifier);
  }
}
