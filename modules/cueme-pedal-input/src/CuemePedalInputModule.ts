import { NativeModule, requireNativeModule } from 'expo';
import type { CuemePedalInputEvents } from './CuemePedalInput.types';

declare class CuemePedalInputModule extends NativeModule<CuemePedalInputEvents> {
  isPedalConnected(): boolean;
}

export default requireNativeModule<CuemePedalInputModule>('CuemePedalInput');
