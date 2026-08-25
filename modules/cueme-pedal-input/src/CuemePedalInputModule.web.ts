import { registerWebModule, NativeModule } from 'expo';
import type { CuemePedalInputEvents } from './CuemePedalInput.types';

// No web equivalent of GCKeyboard — this is a harmless no-op stub so the rest
// of the app (UI, speech, storage) can still run in a browser for quick
// iteration without a device. Pedal-specific behavior is iOS-only.
class CuemePedalInputModule extends NativeModule<CuemePedalInputEvents> {
  isPedalConnected(): boolean {
    return false;
  }
}

export default registerWebModule(CuemePedalInputModule, 'CuemePedalInputModule');
