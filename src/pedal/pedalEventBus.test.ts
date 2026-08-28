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
});
