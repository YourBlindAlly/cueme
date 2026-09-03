import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOW_ALL_KEY = 'cueme.showAllVoiceLanguages';

/** Off by default — Voice Settings shows English plus the device's other configured language(s) only. */
export async function loadShowAllVoiceLanguages(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SHOW_ALL_KEY);
  return raw === 'true';
}

export async function saveShowAllVoiceLanguages(value: boolean): Promise<void> {
  await AsyncStorage.setItem(SHOW_ALL_KEY, String(value));
}
