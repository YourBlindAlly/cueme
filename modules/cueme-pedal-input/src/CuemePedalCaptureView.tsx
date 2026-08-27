import { requireNativeViewManager } from 'expo-modules-core';
import type { ViewProps } from 'react-native';

// Invisible native view that becomes first responder to receive raw hardware
// key presses via UIKit's pressesBegan/pressesEnded — see
// ios/PedalKeyCaptureView.swift for why this exists alongside GCKeyboard.
// Render exactly one of these, always mounted, near the root of the app.
const NativeView = requireNativeViewManager<ViewProps>('CuemePedalInput');

export function CuemePedalCaptureView() {
  return <NativeView style={{ width: 0, height: 0 }} />;
}
