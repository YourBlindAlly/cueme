import { NativeModule, requireNativeModule } from 'expo';
import type { CuemePedalInputEvents } from './CuemePedalInput.types';

declare class CuemePedalInputModule extends NativeModule<CuemePedalInputEvents> {
  isPedalConnected(): boolean;
  /** Re-claims first-responder status for the native key-capture view — see its doc comment in CuemePedalInputModule.swift for why this exists. */
  reclaimPedalFocus(): void;
}

export default requireNativeModule<CuemePedalInputModule>('CuemePedalInput');
