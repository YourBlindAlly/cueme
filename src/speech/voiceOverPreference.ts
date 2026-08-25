import AsyncStorage from '@react-native-async-storage/async-storage';

const REDUCE_CHATTER_KEY = 'cueme.reduceVoiceOverChatter';

/** Experimental — off by default until validated on a real device with VoiceOver. */
export async function loadReduceVoiceOverChatter(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(REDUCE_CHATTER_KEY);
  return raw === 'true';
}

export async function saveReduceVoiceOverChatter(value: boolean): Promise<void> {
  await AsyncStorage.setItem(REDUCE_CHATTER_KEY, String(value));
}
