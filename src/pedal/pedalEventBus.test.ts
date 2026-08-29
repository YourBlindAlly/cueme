jest.mock('../../modules/cueme-pedal-input/src/CuemePedalInputModule', () => {
  const handlers: Record<string, ((payload: unknown) => void)[]> = {};
  return {
    __esModule: true,
    default: {
      addListener: (eventName: string, handler: (payload: unknown) => void) => {
        (handlers[eventName] ??= []).push(handler);
        return { remove: jest.fn() };
      },
      __emit: (eventName: string, payload: unknown) => {
        (handlers[eventName] ?? []).forEach((h) => h(payload));
      },
      __handlerCount: (eventName: string) => (handlers[eventName] ?? []).length,
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockNativeModule = require('../../modules/cueme-pedal-input/src/CuemePedalInputModule').default;

import { pedalEventBus } from './pedalEventBus';
import type { KeyEventPayload } from '../../modules/cueme-pedal-input/src/CuemePedalInput.types';

describe('pedalEventBus', () => {
  it('registers exactly one native listener per event no matter how many subscribers join', () => {
    const unsubA = pedalEventBus.onKeyEvent(() => {});
    const unsubB = pedalEventBus.onKeyEvent(() => {});
    const unsubC = pedalEventBus.onConnected(() => {});
    expect(mockNativeModule.__handlerCount('onKeyEvent')).toBe(1);
    expect(mockNativeModule.__handlerCount('onPedalConnected')).toBe(1);
    unsubA();
    unsubB();
    unsubC();
  });

  it('fans out one native event to every currently-registered JS listener exactly once each', () => {
    const calls: string[] = [];
    const unsubA = pedalEventBus.onKeyEvent(() => calls.push('a'));
    const unsubB = pedalEventBus.onKeyEvent(() => calls.push('b'));

    mockNativeModule.__emit('onKeyEvent', { keyCode: 1, keyName: 'x', isKeyDown: true });

    expect(calls).toEqual(['a', 'b']);
    unsubA();
    unsubB();
  });

  it('stops calling a listener after it unsubscribes, without affecting other listeners', () => {
    const calls: string[] = [];
    const unsubA = pedalEventBus.onConnected(() => calls.push('a'));
    const unsubB = pedalEventBus.onConnected(() => calls.push('b'));

    unsubA();
    mockNativeModule.__emit('onPedalConnected', undefined);

    expect(calls).toEqual(['b']);
    unsubB();
  });

  it('never calls a listener twice for one native event, even if the same callback is passed to two subscriptions', () => {
    const calls: string[] = [];
    const shared = () => calls.push('shared');
    const unsubA = pedalEventBus.onDisconnected(shared);
    const unsubB = pedalEventBus.onDisconnected(shared);

    mockNativeModule.__emit('onPedalDisconnected', undefined);

    // A Set de-dupes the identical function reference — this documents that
    // behavior rather than asserting it's necessarily desired; in practice
    // every real caller passes a fresh closure per subscription.
    expect(calls).toEqual(['shared']);
    unsubA();
    unsubB();
  });

  describe('duplicate key-down suppression', () => {
    // A second native "key down" for the same key arriving within
    // milliseconds of the first is either the pedal's own HID auto-repeat or
    // the module's two parallel native delivery paths (GCKeyboard +
    // pressesBegan) both firing for one physical press — not a second real
    // press. This was the diagnosed cause of repeated/overlapping spoken
    // lines during setlist playback reported 2026-08-29.
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    // Each case uses its own keyCode(s), never reused elsewhere in this file
    // — pedalEventBus is a module-level singleton, so its dedupe timestamps
    // persist across test cases within this file and would otherwise leak
    // between them.

    it('swallows a second key-down for the same key arriving almost immediately', () => {
      const calls: KeyEventPayload[] = [];
      const unsub = pedalEventBus.onKeyEvent((e) => calls.push(e));

      mockNativeModule.__emit('onKeyEvent', { keyCode: 101, keyName: 'x', isKeyDown: true });
      jest.setSystemTime(20);
      mockNativeModule.__emit('onKeyEvent', { keyCode: 101, keyName: 'x', isKeyDown: true });

      expect(calls).toHaveLength(1);
      unsub();
    });

    it('still delivers a genuine second press of the same key once enough time has passed', () => {
      const calls: KeyEventPayload[] = [];
      const unsub = pedalEventBus.onKeyEvent((e) => calls.push(e));

      mockNativeModule.__emit('onKeyEvent', { keyCode: 102, keyName: 'x', isKeyDown: true });
      jest.setSystemTime(300);
      mockNativeModule.__emit('onKeyEvent', { keyCode: 102, keyName: 'x', isKeyDown: true });

      // 300ms apart is well past the duplicate-suppression window but still
      // inside the deliberate 400ms double-press window — both presses must
      // reach listeners so double-press-to-jump-song keeps working.
      expect(calls).toHaveLength(2);
      unsub();
    });

    it('does not suppress key-down events for a different key', () => {
      const calls: KeyEventPayload[] = [];
      const unsub = pedalEventBus.onKeyEvent((e) => calls.push(e));

      mockNativeModule.__emit('onKeyEvent', { keyCode: 103, keyName: 'x', isKeyDown: true });
      jest.setSystemTime(20);
      mockNativeModule.__emit('onKeyEvent', { keyCode: 104, keyName: 'y', isKeyDown: true });

      expect(calls).toHaveLength(2);
      unsub();
    });

    it('never suppresses key-up events', () => {
      const calls: KeyEventPayload[] = [];
      const unsub = pedalEventBus.onKeyEvent((e) => calls.push(e));

      mockNativeModule.__emit('onKeyEvent', { keyCode: 105, keyName: 'x', isKeyDown: false });
      jest.setSystemTime(1);
      mockNativeModule.__emit('onKeyEvent', { keyCode: 105, keyName: 'x', isKeyDown: false });

      expect(calls).toHaveLength(2);
      unsub();
    });
  });
});
