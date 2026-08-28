import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { InputScreen } from './src/screens/InputScreen';
import { PromptScreen } from './src/screens/PromptScreen';
import { PedalSettingsScreen } from './src/screens/PedalSettingsScreen';
import { VoiceSettingsScreen } from './src/screens/VoiceSettingsScreen';
import { LineLengthSettingsScreen } from './src/screens/LineLengthSettingsScreen';
import { DropboxBrowseScreen } from './src/screens/DropboxBrowseScreen';
import { SetlistsScreen } from './src/screens/SetlistsScreen';
import { SetlistCreatorScreen } from './src/screens/SetlistCreatorScreen';
import { AppStateProvider } from './src/state/AppStateContext';
import { CuemePedalCaptureView } from './modules/cueme-pedal-input/src/CuemePedalCaptureView';
import { configureAudioSession } from './src/feedback/feedback';
import { loadActiveSong } from './src/storage/activeSong';
import type { RootStackParamList } from './src/navigation/types';
import type { Song } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const darkTheme = {
  dark: true,
  colors: {
    primary: '#4f8cff',
    background: '#000000',
    card: '#000000',
    text: '#ffffff',
    border: '#222222',
    notification: '#ff6b6b',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

export default function App() {
  const [initialSong, setInitialSong] = useState<Song | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      await configureAudioSession();
      const stored = await loadActiveSong();
      setInitialSong(stored);
      setIsReady(true);
    })();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fff" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppStateProvider initialActiveSong={initialSong}>
        <NavigationContainer theme={darkTheme}>
          <Stack.Navigator
            // Always open on the library/song-picker, even if a song was
            // active last time — dropping straight into a song on load is
            // for right after picking or pasting one, not for a cold app
            // launch (Rusty's own distinction, clarified 2026-08-27).
            initialRouteName="Library"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Library" component={LibraryScreen} />
            <Stack.Screen name="NewSong" component={InputScreen} />
            <Stack.Screen name="Prompt" component={PromptScreen} />
            <Stack.Screen name="PedalSettings" component={PedalSettingsScreen} />
            <Stack.Screen name="VoiceSettings" component={VoiceSettingsScreen} />
            <Stack.Screen name="LineLengthSettings" component={LineLengthSettingsScreen} />
            <Stack.Screen name="DropboxBrowse" component={DropboxBrowseScreen} />
            <Stack.Screen name="Setlists" component={SetlistsScreen} />
            <Stack.Screen name="SetlistCreator" component={SetlistCreatorScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppStateProvider>
      <CuemePedalCaptureView />
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  loading: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
