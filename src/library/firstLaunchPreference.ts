import AsyncStorage from '@react-native-async-storage/async-storage';

const HAS_LAUNCHED_KEY = 'cueme.hasLaunchedBefore';

export async function hasLaunchedBefore(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(HAS_LAUNCHED_KEY);
  return raw === 'true';
}

export async function markLaunched(): Promise<void> {
  await AsyncStorage.setItem(HAS_LAUNCHED_KEY, 'true');
}
